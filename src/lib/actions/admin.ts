
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
                // Tambahkan headers dan cache: no-store untuk keandalan maksimal
                const res = await fetch(`https://libur.deno.dev/api?year=${year}`, {
                    cache: 'no-store',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                if (res.ok) {
                    const rawData = await res.json();
                    
                    // Deteksi struktur data (array langsung atau dibungkus objek)
                    const list = Array.isArray(rawData) ? rawData : (rawData.data || []);
                    
                    if (Array.isArray(list) && list.length > 0) {
                        const mapped = list.map((h: any) => ({
                            date: h.date,
                            description: h.name || h.keterangan || h.holiday_name || "Hari Libur Nasional",
                            type: 'national'
                        }));
                        allHolidays = [...allHolidays, ...mapped];
                    }
                } else {
                    console.error(`[SYNC-ERR] API for year ${year} returned status ${res.status}`);
                }
            } catch (err: any) {
                console.error(`[SYNC-ERR] Failed to fetch year ${year}:`, err.message);
            }
        }

        if (allHolidays.length === 0) {
            return { 
                success: false, 
                error: "Gagal mengambil data dari API libur.deno.dev. Pastikan server memiliki akses internet dan API sedang aktif." 
            };
        }

        // Gunakan upsert pada kolom 'date' yang unik untuk mencegah duplikasi
        const { error } = await supabase
            .from('holidays')
            .upsert(allHolidays, { onConflict: 'date' });

        if (error) throw error;

        revalidatePath('/admin/settings/holidays');
        revalidatePath('/dashboard/agenda');
        
        return { 
            success: true, 
            message: `Berhasil mensinkronkan ${allHolidays.length} hari libur nasional untuk periode 2025-2026.` 
        };
    } catch (error: any) {
        console.error('[SYNC-FATAL-ERR]', error.message);
        return { success: false, error: "Terjadi kesalahan saat menyimpan ke database: " + error.message };
    }
}

export async function clearNationalHolidays() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    try {
        const { error } = await supabase
            .from('holidays')
            .delete()
            .eq('type', 'national');

        if (error) throw error;

        revalidatePath('/admin/settings/holidays');
        revalidatePath('/dashboard/agenda');
        return { success: true, message: "Seluruh data libur nasional berhasil dihapus." };
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
            return { success: false, error: 'Seorang pengguna dengan email ini sudah terdaftar.' };
        }
        console.error("Error inviting teacher:", error.message);
        return { success: false, error: 'Gagal mengirim undangan. Silakan coba lagi.' };
    }

    revalidatePath('/admin/users');
    return { success: true, data };
}


export async function deleteUser(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
        console.error("Error deleting user:", error.message);
        return { success: false, error: "Gagal menghapus pengguna." };
    }
    
    revalidatePath('/admin/users');
    return { success: true, data };
}

export async function updateUserRole(userId: string, newRole: 'teacher' | 'headmaster') {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        console.error("Error updating user role:", error.message);
        return { success: false, error: "Gagal memperbarui peran pengguna." };
    }
    
    revalidatePath('/admin/users');
    return { success: true, data };
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

    if (error) {
        console.error("Error updating staff profile:", error.message);
        return { success: false, error: "Gagal memperbarui data staf." };
    }
    
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
        const { error } = await supabase
            .from('schedule')
            .update(scheduleData)
            .eq('id', scheduleData.id);

        if (error) {
            console.error('Error updating schedule:', error);
            return { success: false, error: 'Gagal memperbarui jadwal.' };
        }
    } else {
        const { error } = await supabase.from('schedule').insert(scheduleData);
        if (error) {
            console.error('Error creating schedule:', error);
            return { success: false, error: 'Gagal membuat jadwal baru.' };
        }
    }

    revalidatePath('/admin/settings/schedule');
    revalidatePath('/admin');
    return { success: true };
}


export async function deleteSchedule(scheduleId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('schedule').delete().eq('id', scheduleId);

    if (error) {
        console.error('Error deleting schedule:', error);
        return { success: false, error: 'Gagal menghapus jadwal.' };
    }

    revalidatePath('/admin/settings/schedule');
    revalidatePath('/admin');
    return { success: true };
}


export async function syncHomeroomTeacherStatus() {
    const supabase = createClient();
    
    try {
        const { data: homeroomAssignments } = await supabase
            .from('classes')
            .select('teacher_id')
            .not('teacher_id', 'is', null);
        
        if (!homeroomAssignments) return { success: false, error: 'Gagal mengambil data kelas.' };
        
        const homeroomTeacherIds = [...new Set(homeroomAssignments.map(c => c.teacher_id))];
        
        if (homeroomTeacherIds.length > 0) {
            await supabase
                .from('profiles')
                .update({ is_homeroom_teacher: true })
                .in('id', homeroomTeacherIds);
        }
        
        if (homeroomTeacherIds.length > 0) {
            await supabase
                .from('profiles')
                .update({ is_homeroom_teacher: false })
                .not('id', 'in', `(${homeroomTeacherIds.join(',')})`);
        } else {
            await supabase
                .from('profiles')
                .update({ is_homeroom_teacher: false });
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error syncing homeroom teacher status:', error);
        return { success: false, error: 'Gagal menyinkronisasi status wali kelas.' };
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
        const { error } = await supabase
            .from('classes')
            .update({ name: classData.name, teacher_id: classData.teacher_id })
            .eq('id', classData.id);
        
        if (error) return { success: false, error: 'Gagal memperbarui kelas.' };
    } else {
        const { error = null } = await supabase.from('classes').insert({ name: classData.name, teacher_id: classData.teacher_id });
        if (error) return { success: false, error: 'Gagal membuat kelas.' };
    }
    
    await syncHomeroomTeacherStatus();
    
    revalidatePath('/admin/roster/classes');
    return { success: true };
}

export async function deleteClass(classId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) return { success: false, error: 'Gagal menghapus kelas.' };
    
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
         const { error } = await supabase
            .from('subjects')
            .update({ name: subjectData.name, kkm: subjectData.kkm })
            .eq('id', subjectData.id);
        if (error) return { success: false, error: "Gagal memperbarui mapel." };
    } else {
         const { error = null } = await supabase.from('subjects').insert({ name: subjectData.name, kkm: subjectData.kkm });
        if (error) return { success: false, error: "Gagal membuat mapel." };
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
            const { error } = await supabase
                .from('settings')
                .upsert(setting, { onConflict: 'key' });
            
            if (error) throw error;
        }

        revalidatePath('/admin/settings/location');
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Error saving attendance settings:', error);
        return { success: false, error: 'Gagal menyimpan pengaturan absensi.' };
    }
}

export async function updateSchoolData(schoolData: { schoolName: string, schoolAddress: string, headmasterName: string, headmasterNip: string }) {
    const supabase = createClient();
    const { data: adminUser } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
    
    if (!adminUser) return { success: false, error: "Admin tidak ditemukan." };

    const { error } = await supabase.from('profiles').update({
        school_name: schoolData.schoolName,
        school_address: schoolData.schoolAddress,
        headmaster_name: schoolData.headmasterName,
        headmaster_nip: schoolData.headmasterNip,
    }).eq('id', adminUser.id);

    if (error) return { success: false, error: "Gagal memperbarui data sekolah." };

    revalidatePath('/admin/settings/school');
    revalidatePath('/dashboard/reports');
    return { success: true };
}

export async function uploadProfileImage(formData: FormData, type: 'avatar' | 'logo') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };
    
    let targetUserId = user.id;
    const bucket = 'avatars';

    if (type === 'logo') {
         const {data: adminUser} = await supabase.from('profiles').select('id, school_logo_url').eq('role', 'admin').limit(1).single();
         if(!adminUser) return { success: false, error: "Admin tidak ditemukan." };
         targetUserId = adminUser.id;

         if (adminUser.school_logo_url) {
            const urlParts = adminUser.school_logo_url.split('/avatars/');
            if (urlParts.length > 1) {
                const oldFilePath = urlParts[1];
                await supabase.storage.from(bucket).remove([oldFilePath]);
            }
         }
    } else {
        const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (profile?.avatar_url) {
            const urlParts = profile.avatar_url.split('/avatars/');
            if (urlParts.length > 1) {
                const oldFilePath = urlParts[1];
                await supabase.storage.from(bucket).remove([oldFilePath]);
            }
        }
    }

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: "Tidak ada file yang diunggah." };
    
    const fileExt = file.name.split('.').pop();
    const fileName = type === 'logo' 
        ? `school_logo_${Date.now()}.${fileExt}`
        : `${user.id}/avatar_${Date.now()}.${fileExt}`;

    try {
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, { 
            upsert: true,
            contentType: file.type 
        });
        
        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return { success: false, error: `Gagal mengunggah ke storage: ${uploadError.message}` };
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        const columnToUpdate = type === 'avatar' ? 'avatar_url' : 'school_logo_url';

        const { error: dbError } = await supabase.from('profiles').update({ [columnToUpdate]: publicUrl }).eq('id', targetUserId);
        
        if (dbError) {
            console.error("Database update error:", dbError);
            return { success: false, error: "Gagal memperbarui profil di database." };
        }

        revalidatePath('/dashboard/settings');
        revalidatePath('/admin/settings/school');
        return { success: true, url: publicUrl };
    } catch (err: any) {
        console.error("Unexpected error in uploadProfileImage:", err);
        return { success: false, error: "Terjadi kesalahan sistem saat proses unggah." };
    }
}

export async function saveHoliday(holiday: { date: string, description: string, type: 'national' | 'school' }) {
    const supabase = createClient();
    const { error } = await supabase.from('holidays').upsert(holiday, { onConflict: 'date' });
    
    if (error) {
        console.error("Supabase error adding holiday:", error.message);
        return { success: false, error: 'Gagal menyimpan hari libur.' };
    }

    revalidatePath('/admin/settings/holidays');
    revalidatePath('/admin');
    revalidatePath('/dashboard/agenda');
    return { success: true };
}

export async function deleteHoliday(holidayId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('holidays').delete().eq('id', holidayId);
    
    if (error) {
        return { success: false, error: 'Gagal menghapus hari libur.' };
    }

    revalidatePath('/admin/settings/holidays');
    revalidatePath('/admin');
    revalidatePath('/dashboard/agenda');
    return { success: true };
}

export async function saveWhatsAppSettings(token: string, enabled: boolean, time: string, appUrl: string) {
    const supabase = createClient();
    
    const cleanToken = token.trim();
    const cleanAppUrl = appUrl.trim().replace(/\/$/, '');

    const settingsToSave = [
        { key: 'fonnte_api_token', value: cleanToken },
        { key: 'wa_reminder_enabled', value: String(enabled) },
        { key: 'wa_reminder_time', value: time },
        { key: 'app_url', value: cleanAppUrl },
    ];

    try {
        for (const setting of settingsToSave) {
            const { error } = await supabase
                .from('settings')
                .upsert(setting, { onConflict: 'key' });
            
            if (error) throw error;
        }

        revalidatePath('/admin/settings/whatsapp');
        return { success: true };
    } catch (error: any) {
        console.error('[WA-SETTINGS] Error saving settings:', error.message);
        return { success: false, error: 'Gagal menyimpan pengaturan WhatsApp.' };
    }
}

export async function sendTestWhatsApp(token: string, target: string) {
    if (!token || !target) return { success: false, error: 'Token dan nomor tujuan wajib diisi.' };
    
    const cleanToken = token.trim();
    const cleanTarget = target.trim().replace(/[^0-9]/g, '');
    const message = "🌟 *LAKUKELAS TEST NOTIFICATION* 🌟\n\nHalo! Ini adalah pesan uji coba dari sistem LakuKelas. Jika Anda menerima ini, berarti konfigurasi WhatsApp Gateway Anda sudah berfungsi 100% dan siap digunakan untuk pengiriman jadwal otomatis harian.\n\nSelamat mengajar! 👋";

    console.log(`[WA-TEST-SEND] Sending test message to: ${cleanTarget}`);

    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': cleanToken
            },
            body: new URLSearchParams({
                'token': cleanToken,
                'target': cleanTarget,
                'message': message
            })
        });

        const result = await response.json();
        console.log('[WA-TEST-SEND] Fonnte API Result:', JSON.stringify(result));

        if (result.status === true) {
            return { success: true, message: 'Pesan tes berhasil dikirim. Silakan cek WhatsApp tujuan.' };
        } else {
            const errorDetail = result.reason || 'Token tidak valid untuk pengiriman.';
            return { success: false, error: `Fonnte Error: ${errorDetail}.` };
        }
    } catch (error: any) {
        console.error('[WA-TEST-SEND] Connection error:', error.message);
        return { success: false, error: 'Gagal menghubungi server Fonnte.' };
    }
}
