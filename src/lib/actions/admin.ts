

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
    return { success: true };
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
        
        if (error) {
            console.error("Error updating class:", error);
            return { success: false, error: 'Gagal memperbarui kelas.' };
        }
    } else {
        const { error } = await supabase.from('classes').insert({ name: classData.name, teacher_id: classData.teacher_id });
        if (error) {
            console.error("Error creating class:", error);
            return { success: false, error: 'Gagal membuat kelas.' };
        }
    }
    
    revalidatePath('/admin/roster/classes');
    return { success: true };
}

export async function deleteClass(classId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    
    if (error) {
        console.error("Error deleting class:", error);
        return { success: false, error: 'Gagal menghapus kelas. Pastikan tidak ada siswa atau jadwal yang terkait.' };
    }
    
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
        if (error) {
            console.error("Error updating subject:", error);
            return { success: false, error: "Gagal memperbarui mapel." };
        }
    } else {
         const { error } = await supabase.from('subjects').insert({ name: subjectData.name, kkm: subjectData.kkm });
        if (error) {
            console.error("Error creating subject:", error);
            return { success: false, error: "Gagal membuat mapel." };
        }
    }

    revalidatePath('/admin/roster/subjects');
    return { success: true };
}

export async function saveAttendanceSettings(formData: FormData) {
    const supabase = createClient();
    
    const settingsData = {
        latitude: formData.get('latitude') as string,
        longitude: formData.get('longitude') as string,
        radius: Number(formData.get('radius')),
        check_in_start: formData.get('check_in_start') as string,
        check_in_deadline: formData.get('check_in_deadline') as string,
    };

    // Validate required fields
    if (!settingsData.latitude || !settingsData.longitude || !settingsData.radius || !settingsData.check_in_start || !settingsData.check_in_deadline) {
        return { success: false, error: 'Semua field wajib diisi.' };
    }

    // Validate latitude and longitude format
    const lat = parseFloat(settingsData.latitude);
    const lng = parseFloat(settingsData.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return { success: false, error: 'Format koordinat tidak valid.' };
    }

    // Validate radius
    if (settingsData.radius <= 0 || settingsData.radius > 1000) {
        return { success: false, error: 'Radius harus antara 1-1000 meter.' };
    }

    try {
        // Save all settings to the settings table
        const settingsToSave = [
            { key: 'attendance_latitude', value: settingsData.latitude },
            { key: 'attendance_longitude', value: settingsData.longitude },
            { key: 'attendance_radius', value: settingsData.radius.toString() },
            { key: 'attendance_check_in_start', value: settingsData.check_in_start },
            { key: 'attendance_check_in_deadline', value: settingsData.check_in_deadline },
        ];

        for (const setting of settingsToSave) {
            const { error } = await supabase
                .from('settings')
                .upsert(setting, { onConflict: 'key' });
            
            if (error) {
                console.error('Error saving setting:', setting.key, error);
                return { success: false, error: `Gagal menyimpan pengaturan: ${setting.key}` };
            }
        }

        revalidatePath('/admin/settings/location');
        return { success: true };
    } catch (error) {
        console.error('Error saving attendance settings:', error);
        return { success: false, error: 'Gagal menyimpan pengaturan absensi.' };
    }
}
