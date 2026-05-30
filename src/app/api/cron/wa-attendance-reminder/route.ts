
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getIndonesianDayName, getIndonesianTime } from '@/lib/timezone';
import { format } from 'date-fns';

/**
 * Cron Job untuk mengingatkan guru yang belum absen (jam 08:00 WIB).
 * V90.0: Proteksi terhadap missing Service Role Key.
 */
export async function GET(request: Request) {
  console.log('[CRON-ATTENDANCE] Checking for missing attendance...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[CRON-ATTENDANCE] Error: Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
    return NextResponse.json({ 
        success: false, 
        message: 'Konfigurasi server belum lengkap. Harap tambahkan SUPABASE_SERVICE_ROLE_KEY di Environment Variables Vercel Anda.' 
    }, { status: 500 });
  }

  // Menggunakan Service Role Key untuk bypass RLS (Sistem otomatis tidak memiliki sesi login)
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
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

    if (!settings.enabled) {
        return NextResponse.json({ 
            success: false, 
            message: 'Attendance Reminder is currently DISABLED in admin settings.' 
        });
    }

    if (!settings.token) {
        return NextResponse.json({ 
            success: false, 
            message: 'Fonnte API Token is MISSING. Please configure it in Admin Panel.' 
        });
    }

    const nowIndo = getIndonesianTime();
    const dayName = getIndonesianDayName();
    const todayStr = format(nowIndo, 'yyyy-MM-dd');

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
        return NextResponse.json({ 
            success: true, 
            message: `No teachers are scheduled or expected to work today (${dayName}).` 
        });
    }

    const { data: currentAttendance } = await supabase
        .from('teacher_attendance')
        .select('teacher_id, status')
        .eq('date', todayStr);

    const attendedTeacherIds = new Set(currentAttendance?.map(a => a.teacher_id) || []);
    const missingTeacherIds = expectedTeacherIds.filter(id => !attendedTeacherIds.has(id));

    if (missingTeacherIds.length === 0) {
        console.log('[CRON-ATTENDANCE] All expected teachers have attended.');
        return NextResponse.json({ 
            success: true, 
            message: 'Perfect! All expected teachers have already checked in for today.' 
        });
    }

    const { data: missingProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .in('id', missingTeacherIds);

    if (!missingProfiles || missingProfiles.length === 0) {
        return NextResponse.json({ 
            success: true, 
            message: 'Teachers are missing check-in, but none of them have phone numbers registered.' 
        });
    }

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
                body: new URLSearchParams({
                    'token': settings.token,
                    'target': teacher.phone_number,
                    'message': message
                })
            });
            const resData = await response.json();
            results.push({ teacher: teacher.full_name, success: resData.status, reason: resData.reason || 'Sent' });
        } catch (err: any) {
            results.push({ teacher: teacher.full_name, success: false, error: err.message });
        }
    }

    return NextResponse.json({ 
      success: true, 
      day: dayName,
      missing_count: missingProfiles.length,
      results 
    });

  } catch (error: any) {
    console.error('[CRON-ATTENDANCE] Fatal Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
