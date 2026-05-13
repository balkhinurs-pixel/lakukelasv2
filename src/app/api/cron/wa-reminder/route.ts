
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getIndonesianDayName, getIndonesianTime } from '@/lib/timezone';
import { format } from 'date-fns';

/**
 * API Route untuk mengirimkan pengingat WhatsApp otomatis (Cron Job).
 * Menghubungi guru yang memiliki jadwal mengajar hari ini dengan format profesional.
 */
export async function GET(request: Request) {
  console.log('[CRON-WA] Starting reminder process...');
  
  try {
    const supabase = createClient();
    
    // 1. Ambil Pengaturan WhatsApp & URL Aplikasi
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
        console.warn('[CRON-WA] Reminder is disabled or token missing.');
        return NextResponse.json({ message: 'WhatsApp Reminder is disabled or token missing.' });
    }

    // 2. Tentukan hari ini di Indonesia
    const dayName = getIndonesianDayName();
    const nowIndo = getIndonesianTime();
    const todayStr = format(nowIndo, 'dd MMMM yyyy');
    console.log(`[CRON-WA] Execution Day: ${dayName}, Date: ${todayStr}`);

    // 3. Ambil Guru yang memiliki jadwal hari ini
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
        console.error('[CRON-WA] DB Error fetching schedules:', scheduleError.message);
        throw scheduleError;
    }

    if (!schedules || schedules.length === 0) {
        console.log(`[CRON-WA] No schedules found for ${dayName}. No messages sent.`);
        return NextResponse.json({ message: `No schedules found for ${dayName}.` });
    }

    // 4. Kelompokkan jadwal per guru
    const teacherMessages = schedules.reduce((acc, item: any) => {
        const teacherId = item.teacher_id;
        const teacherName = item.profiles?.full_name;
        const phone = item.profiles?.phone_number;

        if (!phone) {
            console.log(`[CRON-WA] Skipped ${teacherName}: No phone number provided.`);
            return acc;
        }

        if (!acc[teacherId]) {
            acc[teacherId] = {
                phone: phone,
                name: teacherName,
                schedules: []
            };
        }

        acc[teacherId].schedules.push({
            subject: item.subjects?.name,
            class: item.classes?.name,
            time: `${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}`
        });

        return acc;
    }, {} as Record<string, any>);

    const teacherCount = Object.keys(teacherMessages).length;
    console.log(`[CRON-WA] Preparing messages for ${teacherCount} teachers.`);

    // 5. Kirim pesan via Fonnte menggunakan format Modern & Profesional
    const results = [];
    for (const teacherId in teacherMessages) {
        const teacher = teacherMessages[teacherId];
        
        let scheduleText = teacher.schedules.map((s: any, i: number) => 
            `🔹 *${s.subject}* (${s.class}) jam ${s.time}`
        ).join('\n');

        const message = `🌟 *LAKUKELAS: JADWAL MENGAJAR HARI INI* 🌟

Halo Bapak/Ibu *${teacher.name}*, selamat pagi! 👋
Semangat menyambut hari baru yang luar biasa.

Berikut adalah jadwal mengajar Anda untuk hari ini, *${dayName}, ${todayStr}*:

---
${scheduleText}
---

💡 *Info Penting:*
Mohon pastikan Bapak/Ibu telah melakukan absensi di aplikasi sebelum memulai kelas dan mengisi jurnal setelah selesai.

🔗 *Akses Aplikasi:*
${settings.appUrl}/dashboard

Selamat beraktivitas dan semoga harinya menyenangkan!
_Sistem Notifikasi LakuKelas_`;

        try {
            const response = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: { 
                    'Authorization': settings.token as string 
                },
                body: new URLSearchParams({
                    'token': settings.token as string,
                    'target': teacher.phone,
                    'message': message
                })
            });
            const resData = await response.json();
            results.push({ teacher: teacher.name, success: resData.status });
        } catch (err: any) {
            console.error(`[CRON-WA] Error sending to ${teacher.name}:`, err.message);
            results.push({ teacher: teacher.name, success: false, error: err.message });
        }
    }

    return NextResponse.json({ 
      success: true, 
      day: dayName,
      processed_teachers: teacherCount,
      results: results
    });

  } catch (error: any) {
    console.error('[CRON-WA] Fatal Process Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
