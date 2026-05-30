
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getIndonesianDayName, getIndonesianTime } from '@/lib/timezone';
import { format } from 'date-fns';

/**
 * API Route untuk mengirimkan pengingat jadwal harian (06:00 WIB).
 * V90.0: Proteksi terhadap missing Service Role Key.
 */
export async function GET(request: Request) {
  console.log('[CRON-WA] Starting daily schedule reminder...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[CRON-WA] Error: Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
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
      .in('key', ['fonnte_api_token', 'wa_reminder_enabled', 'app_url']);

    const settings = {
        token: settingsData?.find(s => s.key === 'fonnte_api_token')?.value?.trim(),
        enabled: settingsData?.find(s => s.key === 'wa_reminder_enabled')?.value === 'true',
        appUrl: settingsData?.find(s => s.key === 'app_url')?.value || 'https://app.lakukelas.my.id'
    };

    if (!settings.enabled) {
        return NextResponse.json({ 
            success: false, 
            message: 'WhatsApp Reminder is currently DISABLED in admin settings.' 
        });
    }

    if (!settings.token) {
        return NextResponse.json({ 
            success: false, 
            message: 'Fonnte API Token is MISSING in database. Please set it in Admin > WhatsApp Settings.' 
        });
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
    
    if (!schedules || schedules.length === 0) {
        return NextResponse.json({ 
            success: true, 
            message: `No teaching schedules found for today (${dayName}). System idle.` 
        });
    }

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
        return NextResponse.json({ 
            success: true, 
            message: 'Schedules found, but no teachers have valid phone numbers registered.' 
        });
    }

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
            const response = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                body: new URLSearchParams({
                    'token': settings.token,
                    'target': teacher.phone,
                    'message': message
                })
            });
            const resData = await response.json();
            results.push({ teacher: teacher.name, success: resData.status, reason: resData.reason || 'OK' });
        } catch (err: any) {
            results.push({ teacher: teacher.name, success: false, error: err.message });
        }
    }

    return NextResponse.json({ 
        success: true, 
        day: dayName,
        processed_count: results.length, 
        details: results 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
