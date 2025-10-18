

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
    // In a real-world scenario, you might want to check if the user is the last admin
    // before allowing deletion. For now, we will proceed.
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


export async function syncHomeroomTeacherStatus() {
    const supabase = createClient();
    
    try {
        // Get all teachers who are assigned as homeroom teachers
        const { data: homeroomAssignments } = await supabase
            .from('classes')
            .select('teacher_id')
            .not('teacher_id', 'is', null);
        
        if (!homeroomAssignments) return { success: false, error: 'Gagal mengambil data kelas.' };
        
        // Get unique teacher IDs
        const homeroomTeacherIds = [...new Set(homeroomAssignments.map(c => c.teacher_id))];
        
        // Set is_homeroom_teacher to true for all homeroom teachers
        if (homeroomTeacherIds.length > 0) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ is_homeroom_teacher: true })
                .in('id', homeroomTeacherIds);
            
            if (updateError) {
                console.error('Error updating homeroom teacher status:', updateError);
                return { success: false, error: 'Gagal memperbarui status wali kelas.' };
            }
        }
        
        // Set is_homeroom_teacher to false for teachers who are not homeroom teachers
        if (homeroomTeacherIds.length > 0) {
            const { error: resetError } = await supabase
                .from('profiles')
                .update({ is_homeroom_teacher: false })
                .not('id', 'in', `(${homeroomTeacherIds.join(',')})`);
            
            if (resetError) {
                console.error('Error resetting homeroom teacher status:', resetError);
                return { success: false, error: 'Gagal mereset status wali kelas.' };
            }
        } else {
            // If no homeroom teachers, set all to false
            const { error: resetError } = await supabase
                .from('profiles')
                .update({ is_homeroom_teacher: false });
            
            if (resetError) {
                console.error('Error resetting all homeroom teacher status:', resetError);
                return { success: false, error: 'Gagal mereset semua status wali kelas.' };
            }
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
    
    let previousTeacherId: string | null = null;
    
    // If updating an existing class, get the previous teacher_id
    if (classData.id) {
        const { data: existingClass } = await supabase
            .from('classes')
            .select('teacher_id')
            .eq('id', classData.id)
            .single();
        
        if (existingClass) {
            previousTeacherId = existingClass.teacher_id;
        }
    }
    
    // Update or create the class
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
    
    // Update homeroom teacher status in profiles table
    try {
        // If the previous teacher was different and not null, remove their homeroom status
        if (previousTeacherId && previousTeacherId !== classData.teacher_id) {
            // Check if this teacher is still homeroom teacher for other classes
            const { data: otherClasses } = await supabase
                .from('classes')
                .select('id')
                .eq('teacher_id', previousTeacherId)
                .neq('id', classData.id || '');
            
            // If they're not homeroom teacher for any other class, remove the status
            if (!otherClasses || otherClasses.length === 0) {
                await supabase
                    .from('profiles')
                    .update({ is_homeroom_teacher: false })
                    .eq('id', previousTeacherId);
            }
        }
        
        // If a new teacher is assigned, set their homeroom status to true
        if (classData.teacher_id) {
            await supabase
                .from('profiles')
                .update({ is_homeroom_teacher: true })
                .eq('id', classData.teacher_id);
        }
    } catch (error) {
        console.error("Error updating homeroom teacher status:", error);
        // Don't fail the whole operation if profile update fails
    }
    
    revalidatePath('/admin/roster/classes');
    return { success: true };
}

export async function deleteClass(classId: string) {
    const supabase = createClient();
    
    // Get the teacher_id before deleting the class
    const { data: classToDelete } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classId)
        .single();
    
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    
    if (error) {
        console.error("Error deleting class:", error);
        return { success: false, error: 'Gagal menghapus kelas. Pastikan tidak ada siswa atau jadwal yang terkait.' };
    }
    
    // If the deleted class had a homeroom teacher, check if they should lose homeroom status
    if (classToDelete?.teacher_id) {
        try {
            // Check if this teacher is still homeroom teacher for other classes
            const { data: otherClasses } = await supabase
                .from('classes')
                .select('id')
                .eq('teacher_id', classToDelete.teacher_id);
            
            // If they're not homeroom teacher for any other class, remove the status
            if (!otherClasses || otherClasses.length === 0) {
                await supabase
                    .from('profiles')
                    .update({ is_homeroom_teacher: false })
                    .eq('id', classToDelete.teacher_id);
            }
        } catch (error) {
            console.error("Error updating homeroom teacher status after class deletion:", error);
            // Don't fail the whole operation if profile update fails
        }
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

export async function updateSchoolData(schoolData: { schoolName: string, schoolAddress: string, headmasterName: string, headmasterNip: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    // The admin updates their own profile, which acts as the source of truth
    const { error } = await supabase.from('profiles').update({
        school_name: schoolData.schoolName,
        school_address: schoolData.schoolAddress,
        headmaster_name: schoolData.headmasterName,
        headmaster_nip: schoolData.headmasterNip,
    }).eq('id', user.id); // Only update the admin's profile

    if (error) {
        console.error("Error updating school data for admin:", error);
        return { success: false, error: "Gagal memperbarui data sekolah." };
    }

    revalidatePath('/admin/settings/school');
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/reports'); // For report headers
    return { success: true };
}

export async function uploadProfileImage(formData: FormData, type: 'avatar' | 'logo') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: "Tidak ada file yang diunggah." };
    
    const bucket = 'avatars';
    // For the logo, we use a predictable name. For avatar, unique per user.
    const fileName = type === 'logo' 
        ? `school_logo_${Date.now()}` // Add timestamp to break cache
        : `${user.id}/avatar_${Date.now()}`;
    
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, 
    });
    
    if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, error: "Gagal mengunggah gambar." };
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

    let query;
    if (type === 'avatar') {
        // Update only the current user's avatar
        query = supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    } else {
        // Update the school logo only on the admin's profile
        query = supabase.from('profiles').update({ school_logo_url: publicUrl }).eq('id', user.id);
    }

    const { error: dbError } = await query;

    if (dbError) {
        console.error("DB update error:", dbError);
        return { success: false, error: "Gagal memperbarui URL gambar di profil." };
    }
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/admin/settings/school');
    revalidatePath('/dashboard/reports');
    return { success: true, url: publicUrl };
}
