
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getIndonesianDayName, getIndonesianTime } from '@/lib/timezone';
import { format } from 'date-fns';

/**
 * Cron Job untuk mengingatkan guru yang belum absen (jam 08:00 WIB).
 */
export async function GET(request: Request) {
  console.log('[CRON-ATTENDANCE] Checking for missing attendance...');
  
  try {
    const supabase = await createClient();
    
    // 1. Ambil Pengaturan
    const { data: settingsData } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['fonnte_api_token', 'wa_reminder_enabled', 'attendance_policy', 'app_url']);

    const settings = {
        token: settingsData?.find(s => s.key === 'fonnte_api_token')?.value?.trim(),
        enabled: settingsData?.find(s => s.key === 'wa_reminder_enabled')?.value === 'true',
        policy: settingsData?.find(s => s.key === 'attendance_policy')?.value || 'schedule_based',
        appUrl: settingsData?.find(s => s.key === 'app_url')?.value || 'https://app.lakukelas.my.id'
    };

    if (!settings.enabled || !settings.token) {
        return NextResponse.json({ message: 'WhatsApp Reminder is disabled or token missing.' });
    }

    const nowIndo = getIndonesianTime();
    const dayName = getIndonesianDayName();
    const todayStr = format(nowIndo, 'yyyy-MM-dd');

    // 2. Tentukan Guru yang Wajib Hadir Hari Ini
    let expectedTeacherIds: string[] = [];

    if (settings.policy === 'daily_based') {
        const { data: allStaff } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['teacher', 'headmaster']);
        expectedTeacherIds = allStaff?.map(s => s.id) || [];
    } else {
        const { data: schedules } = await supabase
            .from('schedule')
            .select('teacher_id')
            .eq('day', dayName);
        expectedTeacherIds = Array.from(new Set(schedules?.map(s => s.teacher_id) || []));
    }

    if (expectedTeacherIds.length === 0) {
        return NextResponse.json({ message: 'No teachers expected today.' });
    }

    // 3. Cek Siapa yang Sudah Absen
    const { data: currentAttendance } = await supabase
        .from('teacher_attendance')
        .select('teacher_id, status')
        .eq('date', todayStr);

    const attendedTeacherIds = new Set(currentAttendance?.map(a => a.teacher_id) || []);
    
    // Saring guru yang BELUM absen
    const missingTeacherIds = expectedTeacherIds.filter(id => !attendedTeacherIds.has(id));

    if (missingTeacherIds.length === 0) {
        console.log('[CRON-ATTENDANCE] All expected teachers have attended.');
        return NextResponse.json({ message: 'All teachers attended.' });
    }

    // 4. Ambil data profil guru yang belum absen
    const { data: missingProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .in('id', missingTeacherIds);

    if (!missingProfiles || missingProfiles.length === 0) {
        return NextResponse.json({ message: 'No profiles found for missing teachers.' });
    }

    // 5. Kirim Pesan Teguran Sopan
    const results = [];
    for (const teacher of missingProfiles) {
        if (!teacher.phone_number) continue;

        const message = `📢 *PENGINGAT ABSENSI LAKUKELAS* 📢

Halo Bapak/Ibu *${teacher.full_name}* 👋
Mohon maaf mengganggu waktunya.

Sistem mencatat Bapak/Ibu belum melakukan *Absensi Masuk* untuk hari ini, ${dayName}, ${format(nowIndo, 'dd MMMM yyyy')}.

Demi tertib administrasi, mohon segera melakukan absensi melalui aplikasi LakuKelas di lokasi sekolah.

🔗 *Klik Link Untuk Absen:*
${settings.appUrl}/dashboard/teacher-attendance

Terima kasih atas kerja samanya. Selamat beraktivitas! ✨
_Sistem Monitoring LakuKelas_`;

        try {
            const response = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: { 'Authorization': settings.token },
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
      processed_count: missingProfiles.length,
      results 
    });

  } catch (error: any) {
    console.error('[CRON-ATTENDANCE] Fatal Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
