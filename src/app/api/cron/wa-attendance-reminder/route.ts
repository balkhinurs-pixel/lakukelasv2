
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getIndonesianDayName, getIndonesianTime } from '@/lib/timezone';
import { format } from 'date-fns';

/**
 * Cron Job untuk mengingatkan guru yang belum absen (jam 08:00 WIB).
 * V91.0: Hybrid Key Logic (Bypass RLS via Service Role atau Anon Key dengan RLS Terbuka).
 */
export async function GET(request: Request) {
  console.log('[CRON-ATTENDANCE] Checking for missing attendance...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Gunakan Service Role jika ada, jika tidak fallback ke Anon Key (Fleksibel)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ 
        success: false, 
        message: 'Konfigurasi database (URL/Key) tidak ditemukan di Environment Variables.' 
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Ambil pengaturan sistem
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['fonnte_api_token', 'wa_reminder_enabled', 'attendance_policy', 'app_url']);

    if (settingsError || !settingsData) {
        return NextResponse.json({ 
            success: false, 
            message: 'Gagal membaca tabel settings. Pastikan RLS diizinkan untuk akses publik (Anon SELECT) atau isi SERVICE_ROLE_KEY di Vercel.' 
        }, { status: 200 });
    }

    const settings = {
        token: settingsData?.find(s => s.key === 'fonnte_api_token')?.value?.trim(),
        enabled: settingsData?.find(s => s.key === 'wa_reminder_enabled')?.value === 'true',
        policy: settingsData?.find(s => s.key === 'attendance_policy')?.value || 'schedule_based',
        appUrl: settingsData?.find(s => s.key === 'app_url')?.value || 'https://app.lakukelas.my.id'
    };

    if (!settings.enabled) {
        return NextResponse.json({ success: true, message: 'Fitur pengingat sedang dinonaktifkan di menu Admin.' });
    }

    if (!settings.token) {
        return NextResponse.json({ success: false, message: 'Token Fonnte belum diatur di database.' });
    }

    const nowIndo = getIndonesianTime();
    const dayName = getIndonesianDayName();
    const todayStr = format(nowIndo, 'yyyy-MM-dd');

    // 2. Tentukan siapa saja yang SEHARUSNYA hadir hari ini
    let expectedTeacherIds: string[] = [];

    if (settings.policy === 'daily_based') {
        const { data: allStaff } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['teacher', 'headmaster'])
            .eq('is_activated', true);
        expectedTeacherIds = allStaff?.map(s => s.id) || [];
    } else {
        const { data: schedules } = await supabase
            .from('schedule')
            .select('teacher_id')
            .eq('day', dayName);
        expectedTeacherIds = Array.from(new Set(schedules?.map(s => s.teacher_id) || []));
    }

    if (expectedTeacherIds.length === 0) {
        return NextResponse.json({ success: true, message: `Tidak ada kewajiban hadir (jadwal kosong) untuk hari ${dayName}.` });
    }

    // 3. Cek siapa yang SUDAH absen hari ini
    const { data: currentAttendance } = await supabase
        .from('teacher_attendance')
        .select('teacher_id')
        .eq('date', todayStr);

    const attendedTeacherIds = new Set(currentAttendance?.map(a => a.teacher_id) || []);
    
    // 4. Cari yang BELUM absen
    const missingTeacherIds = expectedTeacherIds.filter(id => !attendedTeacherIds.has(id));

    if (missingTeacherIds.length === 0) {
        return NextResponse.json({ success: true, message: 'Luar biasa! Semua guru yang mengajar hari ini sudah melakukan absensi.' });
    }

    // 5. Ambil data profil (Nama & Nomor WA) guru yang belum absen
    const { data: missingProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .in('id', missingTeacherIds);

    if (!missingProfiles || missingProfiles.length === 0) {
        return NextResponse.json({ success: true, message: 'Ada guru belum absen, tapi tidak ada nomor WhatsApp yang terdaftar di profil mereka.' });
    }

    // 6. Kirim peringatan ke masing-masing guru (Strict Device Token)
    const results = [];
    for (const teacher of missingProfiles) {
        if (!teacher.phone_number) continue;

        const message = `📢 *PENGINGAT ABSENSI LAKUKELAS* 📢

Halo Bapak/Ibu *${teacher.full_name}* 👋
Mohon maaf mengganggu waktunya sebentar.

Sistem mencatat Bapak/Ibu belum melakukan *Absensi Masuk* untuk hari ini, ${dayName}, ${format(nowIndo, 'dd MMMM yyyy')}.

Demi tertib administrasi sekolah, mohon segera melakukan absensi melalui aplikasi LakuKelas segera setelah tiba di lokasi.

🔗 *Klik Link Untuk Absen:*
${settings.appUrl}/dashboard/teacher-attendance

Terima kasih atas kerja samanya. Selamat beraktivitas! ✨
_Sistem Monitoring LakuKelas_`;

        try {
            const response = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                body: new URLSearchParams({
                    'token': settings.token,
                    'target': teacher.phone_number,
                    'message': message
                })
            });
            const resData = await response.json();
            results.push({ teacher: teacher.full_name, success: resData.status });
        } catch (err: any) {
            results.push({ teacher: teacher.full_name, success: false, error: err.message });
        }
    }

    return NextResponse.json({ 
      success: true, 
      missing_count: missingProfiles.length,
      details: results 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
