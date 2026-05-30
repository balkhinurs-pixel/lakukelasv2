
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getIndonesianDayName, getIndonesianTime } from '@/lib/timezone';
import { format } from 'date-fns';

/**
 * API Route untuk mengirimkan pengingat jadwal harian (06:00 WIB).
 * V91.0: Hybrid Key Logic (Mendukung Service Role atau Anon Key dengan RLS Publik).
 * V89.0: Strict Device Token (Token dikirim di body, bukan header).
 */
export async function GET(request: Request) {
  console.log('[CRON-WA] Starting daily schedule reminder...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Gunakan Service Role jika ada di Vercel, jika tidak ada fallback ke Anon Key (Fleksibel)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ 
        success: false, 
        message: 'Konfigurasi database (URL/Key) tidak ditemukan di Environment Variables.' 
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Ambil pengaturan WhatsApp dari database
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['fonnte_api_token', 'wa_reminder_enabled', 'app_url']);

    if (settingsError || !settingsData || settingsData.length === 0) {
        return NextResponse.json({ 
            success: false, 
            message: 'WhatsApp Reminder dianggap nonaktif atau tidak terbaca. Jika tidak menggunakan Service Role Key, pastikan RLS pada tabel settings mengizinkan akses publik (Anon).' 
        }, { status: 200 });
    }

    const settings = {
        token: settingsData?.find(s => s.key === 'fonnte_api_token')?.value?.trim(),
        enabled: settingsData?.find(s => s.key === 'wa_reminder_enabled')?.value === 'true',
        appUrl: settingsData?.find(s => s.key === 'app_url')?.value || 'https://app.lakukelas.my.id'
    };

    if (!settings.enabled) {
        return NextResponse.json({ success: true, message: 'Fitur pengingat sedang dinonaktifkan melalui menu Admin.' });
    }

    if (!settings.token) {
        return NextResponse.json({ success: false, message: 'Token Fonnte belum diatur di tabel settings.' });
    }

    const nowIndo = getIndonesianTime();
    const dayName = getIndonesianDayName();
    const todayStr = format(nowIndo, 'dd MMMM yyyy');

    // 2. Ambil jadwal hari ini
    const { data: schedules, error: scheduleError } = await supabase
        .from('schedule')
        .select(`
            teacher_id,
            start_time,
            end_time,
            profiles:teacher_id(full_name, phone_number),
            classes:class_id(name),
            subjects:subject_id(name)
        `)
        .eq('day', dayName);

    if (scheduleError) {
        return NextResponse.json({ success: false, message: 'Gagal membaca tabel jadwal. Cek izin RLS untuk publik.', error: scheduleError.message });
    }
    
    if (!schedules || schedules.length === 0) {
        return NextResponse.json({ success: true, message: `Tidak ada jadwal mengajar yang ditemukan untuk hari ${dayName}.` });
    }

    // 3. Kelompokkan jadwal per guru agar hanya mengirim 1 pesan per orang
    const teacherMessages = schedules.reduce((acc, item: any) => {
        const teacherId = item.teacher_id;
        const phone = item.profiles?.phone_number;
        if (!phone) return acc;

        if (!acc[teacherId]) {
            acc[teacherId] = { phone: phone, name: item.profiles?.full_name, schedules: [] };
        }
        acc[teacherId].schedules.push({
            subject: item.subjects?.name,
            class: item.classes?.name,
            time: `${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}`
        });
        return acc;
    }, {} as Record<string, any>);

    const results = [];
    const teacherIds = Object.keys(teacherMessages);

    if (teacherIds.length === 0) {
        return NextResponse.json({ success: true, message: 'Ada jadwal, namun tidak ada guru dengan nomor WA terdaftar.' });
    }

    // 4. Proses pengiriman via Fonnte (API Device Mode)
    for (const teacherId in teacherMessages) {
        const teacher = teacherMessages[teacherId];
        let scheduleText = teacher.schedules.map((s: any) => `🔹 *${s.subject}* (${s.class}) jam ${s.time}`).join('\n');

        const message = `🌟 *LAKUKELAS: JADWAL MENGAJAR HARI INI* 🌟

Halo Bapak/Ibu *${teacher.name}*, selamat pagi! 👋
Semangat menyambut hari baru yang luar biasa.

Berikut adalah jadwal mengajar Anda untuk hari ini, *${dayName}, ${todayStr}*:

---
${scheduleText}
---

💡 *Info Penting:*
Mohon pastikan Bapak/Ibu telah melakukan absensi di aplikasi sebelum memulai kelas.

🔗 *Akses Aplikasi:*
${settings.appUrl}/dashboard

Selamat beraktivitas dan semoga harinya menyenangkan!
_Sistem Notifikasi LakuKelas_`;

        try {
            // Mengirim token dalam body (Strict Device Mode)
            const response = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                body: new URLSearchParams({
                    'token': settings.token,
                    'target': teacher.phone,
                    'message': message
                })
            });
            const resData = await response.json();
            results.push({ teacher: teacher.name, success: resData.status });
        } catch (err: any) {
            results.push({ teacher: teacher.name, success: false, error: err.message });
        }
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: results.length, 
        details: results 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
