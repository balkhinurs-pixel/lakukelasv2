
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getIndonesianDayName, getIndonesianTime } from '@/lib/timezone';
import { format } from 'date-fns';

/**
 * API Route untuk mengirimkan pengingat WhatsApp otomatis (Cron Job).
 * Menghubungi guru yang memiliki jadwal mengajar hari ini.
 */
export async function GET(request: Request) {
  console.log('[CRON-WA] Starting reminder process...');
  
  try {
    const supabase = createClient();
    
    // 1. Ambil Pengaturan WhatsApp
    const { data: settingsData } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['fonnte_api_token', 'wa_reminder_enabled', 'wa_reminder_time']);

    const settings = {
        token: settingsData?.find(s => s.key === 'fonnte_api_token')?.value?.trim(),
        enabled: settingsData?.find(s => s.key === 'wa_reminder_enabled')?.value === 'true',
        time: settingsData?.find(s => s.key === 'wa_reminder_time')?.value
    };

    if (!settings.enabled || !settings.token) {
        console.warn('[CRON-WA] Reminder is disabled or token missing.');
        return NextResponse.json({ message: 'WhatsApp Reminder is disabled or token missing.' });
    }

    // 2. Tentukan hari ini di Indonesia
    const dayName = getIndonesianDayName();
    const nowIndo = getIndonesianTime();
    const todayStr = format(nowIndo, 'dd MMMM yyyy');
    console.log(`[CRON-WA] Day: ${dayName}, Date: ${todayStr}`);

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
        console.log(`[CRON-WA] No schedules found for ${dayName}. Exiting.`);
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

    // 5. Kirim pesan via Fonnte
    const results = [];
    for (const teacherId in teacherMessages) {
        const teacher = teacherMessages[teacherId];
        
        let scheduleText = teacher.schedules.map((s: any, i: number) => 
            `${i + 1}. *${s.subject}* (${s.class}) jam ${s.time}`
        ).join('\n');

        const message = `Halo Bapak/Ibu *${teacher.name}*,

Jangan lupa untuk melakukan absensi hari ini, *${dayName}, ${todayStr}*.

Berikut adalah jadwal mengajar Anda hari ini:
${scheduleText}

Klik link berikut untuk melakukan absensi:
https://app.lakukelas.my.id/dashboard/teacher-attendance

Semangat mengajar!
_LakuKelas Notifier_`;

        console.log(`[CRON-WA] Sending message to ${teacher.name} (${teacher.phone})...`);

        try {
            const response = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: { 
                    'Authorization': settings.token 
                },
                body: new URLSearchParams({
                    'target': teacher.phone,
                    'message': message
                })
            });
            const resData = await response.json();
            console.log(`[CRON-WA] Fonnte API Result for ${teacher.name}:`, JSON.stringify(resData));
            results.push({ teacher: teacher.name, success: resData.status });
        } catch (err: any) {
            console.error(`[CRON-WA] Error sending to ${teacher.name}:`, err.message);
            results.push({ teacher: teacher.name, success: false, error: err.message });
        }
    }

    return NextResponse.json({ 
      success: true, 
      processed_teachers: teacherCount,
      results: results
    });

  } catch (error: any) {
    console.error('[CRON-WA] Fatal Process Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
