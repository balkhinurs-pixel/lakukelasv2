
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function syncNationalHolidaysManual() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    try {
        const years = [2025, 2026];
        let allHolidays: any[] = [];

        for (const year of years) {
            try {
                const res = await fetch(`https://libur.deno.dev/api?year=${year}`, {
                    cache: 'no-store',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                if (res.ok) {
                    const rawData = await res.json();
                    const list = Array.isArray(rawData) ? rawData : (rawData.data || []);
                    
                    if (Array.isArray(list) && list.length > 0) {
                        const mapped = list.map((h: any) => ({
                            date: h.date,
                            description: h.name || h.keterangan || h.holiday_name || "Hari Libur Nasional",
                            type: 'national'
                        }));
                        allHolidays = [...allHolidays, ...mapped];
                    }
                }
            } catch (err: any) {
                console.error(`[SYNC-ERR] Failed to fetch year ${year}:`, err.message);
            }
        }

        if (allHolidays.length === 0) {
            return { 
                success: false, 
                error: "Gagal mengambil data dari API. Silakan coba lagi nanti." 
            };
        }

        const { error } = await supabase
            .from('holidays')
            .upsert(allHolidays, { onConflict: 'date' });

        if (error) throw error;

        revalidatePath('/admin/settings/holidays');
        revalidatePath('/dashboard/agenda');
        
        return { 
            success: true, 
            message: `Berhasil mensinkronkan ${allHolidays.length} hari libur nasional.` 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearNationalHolidays() {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('holidays')
            .delete()
            .eq('type', 'national');

        if (error) throw error;

        revalidatePath('/admin/settings/holidays');
        return { success: true, message: "Data libur nasional berhasil dihapus." };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function inviteTeacher(fullName: string, email: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
            full_name: fullName,
            role: 'teacher'
        }
    });

    if (error) {
        if (error.message.includes('User already registered')) {
            return { success: false, error: 'Email ini sudah terdaftar.' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true, data };
}


export async function deleteUser(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) return { success: false, error: "Gagal menghapus pengguna." };
    
    revalidatePath('/admin/users');
    return { success: true, data };
}

export async function updateUserRole(userId: string, newRole: 'teacher' | 'headmaster' | 'admin') {
    const supabase = createClient();
    
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) return { success: false, error: "Gagal memperbarui peran." };
    
    revalidatePath('/admin/users');
    return { success: true };
}

export async function updateStaffProfile(userId: string, data: { fullName: string, nip: string, phoneNumber: string }) {
    const supabase = createClient();
    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: data.fullName,
            nip: data.nip,
            phone_number: data.phoneNumber
        })
        .eq('id', userId);

    if (error) return { success: false, error: "Gagal memperbarui data." };
    
    revalidatePath('/admin/users');
    return { success: true };
}

export async function saveSchedule(formData: FormData) {
    const supabase = createClient();
    const scheduleData = {
        id: formData.get('id') as string || undefined,
        day: formData.get('day') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        teacher_id: formData.get('teacher_id') as string,
    };

    if (scheduleData.id) {
        const { error } = await supabase.from('schedule').update(scheduleData).eq('id', scheduleData.id);
        if (error) return { success: false, error: 'Gagal memperbarui jadwal.' };
    } else {
        const { error } = await supabase.from('schedule').insert(scheduleData);
        if (error) return { success: false, error: 'Gagal membuat jadwal baru.' };
    }

    revalidatePath('/admin/settings/schedule');
    revalidatePath('/admin');
    return { success: true };
}

export async function deleteSchedule(scheduleId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('schedule').delete().eq('id', scheduleId);
    if (error) return { success: false, error: 'Gagal menghapus jadwal.' };
    revalidatePath('/admin/settings/schedule');
    return { success: true };
}

export async function syncHomeroomTeacherStatus() {
    const supabase = createClient();
    try {
        const { data: homeroomAssignments } = await supabase.from('classes').select('teacher_id').not('teacher_id', 'is', null);
        if (!homeroomAssignments) return { success: false, error: 'Gagal mengambil data.' };
        const homeroomTeacherIds = [...new Set(homeroomAssignments.map(c => c.teacher_id))];
        
        await supabase.from('profiles').update({ is_homeroom_teacher: false });
        if (homeroomTeacherIds.length > 0) {
            await supabase.from('profiles').update({ is_homeroom_teacher: true }).in('id', homeroomTeacherIds);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Gagal sinkronisasi.' };
    }
}

export async function saveClass(formData: FormData) {
    const supabase = createClient();
    const classData = {
        id: formData.get('id') as string || undefined,
        name: formData.get('name') as string,
        teacher_id: formData.get('teacher_id') as string || null,
    };

    if (classData.id) {
        await supabase.from('classes').update({ name: classData.name, teacher_id: classData.teacher_id }).eq('id', classData.id);
    } else {
        await supabase.from('classes').insert({ name: classData.name, teacher_id: classData.teacher_id });
    }
    
    await syncHomeroomTeacherStatus();
    revalidatePath('/admin/roster/classes');
    return { success: true };
}

export async function deleteClass(classId: string) {
    const supabase = createClient();
    await supabase.from('classes').delete().eq('id', classId);
    await syncHomeroomTeacherStatus();
    revalidatePath('/admin/roster/classes');
    return { success: true };
}

export async function saveSubject(formData: FormData) {
    const supabase = createClient();
    const subjectData = {
        id: formData.get('id') as string || undefined,
        name: formData.get('name') as string,
        kkm: Number(formData.get('kkm')),
    };

    if (subjectData.id) {
        await supabase.from('subjects').update({ name: subjectData.name, kkm: subjectData.kkm }).eq('id', subjectData.id);
    } else {
        await supabase.from('subjects').insert({ name: subjectData.name, kkm: subjectData.kkm });
    }

    revalidatePath('/admin/roster/subjects');
    return { success: true };
}

export async function saveAttendanceSettings(formData: FormData) {
    const supabase = createClient();
    const settingsToSave = [
        { key: 'attendance_latitude', value: formData.get('latitude') as string },
        { key: 'attendance_longitude', value: formData.get('longitude') as string },
        { key: 'attendance_radius', value: formData.get('radius') as string },
        { key: 'attendance_check_in_start', value: formData.get('check_in_start') as string },
        { key: 'attendance_check_in_deadline', value: formData.get('check_in_deadline') as string },
        { key: 'attendance_policy', value: formData.get('attendance_policy') as string },
    ];

    try {
        for (const setting of settingsToSave) {
            await supabase.from('settings').upsert(setting, { onConflict: 'key' });
        }
        revalidatePath('/admin/settings/location');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Gagal menyimpan.' };
    }
}

export async function updateSchoolData(schoolData: { schoolName: string, schoolAddress: string, headmasterName: string, headmasterNip: string }) {
    const supabase = createClient();
    const { data: adminUser } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
    if (!adminUser) return { success: false, error: "Admin tidak ditemukan." };

    await supabase.from('profiles').update({
        school_name: schoolData.schoolName,
        school_address: schoolData.schoolAddress,
        headmaster_name: schoolData.headmasterName,
        headmaster_nip: schoolData.headmasterNip,
    }).eq('id', adminUser.id);

    revalidatePath('/admin/settings/school');
    return { success: true };
}

export async function uploadProfileImage(formData: FormData, type: 'avatar' | 'logo') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };
    
    let targetUserId = user.id;
    if (type === 'logo') {
         const {data: adminUser} = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
         if(!adminUser) return { success: false, error: "Admin tidak ditemukan." };
         targetUserId = adminUser.id;
    }

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: "File kosong." };
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${targetUserId}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (uploadError) return { success: false, error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const column = type === 'avatar' ? 'avatar_url' : 'school_logo_url';

    await supabase.from('profiles').update({ [column]: publicUrl }).eq('id', targetUserId);
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/admin/settings/school');
    return { success: true, url: publicUrl };
}

export async function saveHoliday(holiday: { date: string, description: string, type: 'national' | 'school' }) {
    const supabase = createClient();
    await supabase.from('holidays').upsert(holiday, { onConflict: 'date' });
    revalidatePath('/admin/settings/holidays');
    return { success: true };
}

export async function deleteHoliday(holidayId: string) {
    const supabase = createClient();
    await supabase.from('holidays').delete().eq('id', holidayId);
    revalidatePath('/admin/settings/holidays');
    return { success: true };
}

export async function saveWhatsAppSettings(token: string, enabled: boolean, time: string, appUrl: string) {
    const supabase = createClient();
    const settings = [
        { key: 'fonnte_api_token', value: token.trim() },
        { key: 'wa_reminder_enabled', value: String(enabled) },
        { key: 'wa_reminder_time', value: time },
        { key: 'app_url', value: appUrl.trim() },
    ];

    for (const s of settings) {
        await supabase.from('settings').upsert(s, { onConflict: 'key' });
    }

    revalidatePath('/admin/settings/whatsapp');
    return { success: true };
}

export async function sendTestWhatsApp(token: string, target: string) {
    const message = "🌟 *LAKUKELAS TEST NOTIFICATION* 🌟\n\nKoneksi WhatsApp Gateway Anda berfungsi dengan baik!";
    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: { 'Authorization': token.trim() },
            body: new URLSearchParams({ 'token': token.trim(), 'target': target.trim(), 'message': message })
        });
        const result = await response.json();
        return result.status ? { success: true, message: 'Pesan terkirim.' } : { success: false, error: result.reason };
    } catch (error: any) {
        return { success: false, error: 'Gagal menghubungi Fonnte.' };
    }
}
