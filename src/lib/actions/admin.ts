

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function inviteTeacher(fullName: string, email: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
            full_name: fullName,
            role: 'teacher' // Default role for invited user
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };
    
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const classData = {
        id: formData.get('id') as string || undefined,
        name: formData.get('name') as string,
        teacher_id: formData.get('teacher_id') as string || null, // Homeroom teacher can be optional
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
