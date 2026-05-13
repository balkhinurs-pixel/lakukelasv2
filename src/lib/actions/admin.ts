'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
    let bucket = 'avatars';
    let fileName = `${user.id}/avatar_${Date.now()}`;

    if (type === 'logo') {
         const {data: adminUser} = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
         if(!adminUser) return { success: false, error: "Admin tidak ditemukan." };
         targetUserId = adminUser.id;
         fileName = `school_logo_${Date.now()}`;
    }

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: "Tidak ada file." };
    
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
    if (uploadError) return { success: false, error: "Gagal mengunggah." };

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const columnToUpdate = type === 'avatar' ? 'avatar_url' : 'school_logo_url';

    await supabase.from('profiles').update({ [columnToUpdate]: publicUrl }).eq('id', targetUserId);
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/admin/settings/school');
    return { success: true, url: publicUrl };
}

export async function saveHoliday(holiday: { date: string, description: string }) {
    const supabase = createClient();
    const { error } = await supabase.from('holidays').insert(holiday);
    if (error) return { success: false, error: 'Gagal menyimpan hari libur.' };
    revalidatePath('/admin/settings/holidays');
    revalidatePath('/admin');
    return { success: true };
}

export async function deleteHoliday(holidayId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('holidays').delete().eq('id', holidayId);
    if (error) return { success: false, error: 'Gagal menghapus hari libur.' };
    revalidatePath('/admin/settings/holidays');
    revalidatePath('/admin');
    return { success: true };
}

export async function saveWhatsAppSettings(token: string, enabled: boolean, time: string) {
    const supabase = createClient();
    
    const settingsToSave = [
        { key: 'fonnte_api_token', value: token },
        { key: 'wa_reminder_enabled', value: String(enabled) },
        { key: 'wa_reminder_time', value: time },
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
    } catch (error) {
        console.error('Error saving WA settings:', error);
        return { success: false, error: 'Gagal menyimpan pengaturan WhatsApp.' };
    }
}

export async function testFonnteConnection(token: string) {
    if (!token) return { success: false, error: 'Token tidak boleh kosong.' };

    try {
        const response = await fetch('https://api.fonnte.com/get-devices', {
            method: 'POST',
            headers: {
                'Authorization': token
            }
        });

        const result = await response.json();

        if (result.status === true) {
            return { 
                success: true, 
                message: `Berhasil terhubung ke Fonnte. Ditemukan ${result.data?.length || 0} perangkat.` 
            };
        } else {
            return { 
                success: false, 
                error: result.reason || 'Token tidak valid atau tidak memiliki akses.' 
            };
        }
    } catch (error) {
        console.error('Error testing Fonnte connection:', error);
        return { success: false, error: 'Terjadi kesalahan saat menghubungi API Fonnte.' };
    }
}
