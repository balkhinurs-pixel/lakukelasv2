
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getIndonesianDayName, getIndonesianTime } from '@/lib/timezone';
import { format } from 'date-fns';

/**
 * API Route untuk mengirimkan pengingat jadwal harian (06:00 WIB).
 * V89.0: Menggunakan Service Role untuk bypass RLS dan Strict Device Token.
 */
export async function GET(request: Request) {
  console.log('[CRON-WA] Starting daily schedule reminder...');
  
  // Menggunakan Service Role Key untuk bypass RLS (Sistem otomatis tidak memiliki sesi login)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const { data: settingsData } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['fonnte_api_token', 'wa_reminder_enabled', 'app_url']);

    const settings = {
        token: settingsData?.find(s => s.key === 'fonnte_api_token')?.value?.trim(),
        enabled: settingsData?.find(s => s.key === 'wa_reminder_enabled')?.value === 'true',
        appUrl: settingsData?.find(s => s.key === 'app_url')?.value || 'https://app.lakukelas.my.id'
    };

    if (!settings.enabled || !settings.token) {
        return NextResponse.json({ message: 'WhatsApp Reminder is disabled or token missing in database settings.' });
    }

    const nowIndo = getIndonesianTime();
    const dayName = getIndonesianDayName();
    const todayStr = format(nowIndo, 'dd MMMM yyyy');

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

    if (scheduleError) throw scheduleError;
    if (!schedules || schedules.length === 0) return NextResponse.json({ message: `No schedules for ${dayName}.` });

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
            // Strict Device Token: Tanpa Auth Header
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

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
