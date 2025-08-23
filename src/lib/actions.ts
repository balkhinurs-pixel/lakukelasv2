

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './supabase/server';
import type { StudentNote } from './types';

// This function is obsolete now that all accounts are Pro by default.
// It can be removed or kept for reference.
export async function activateAccount(code: string) {
    console.log("Attempted to activate account with code:", code);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real scenario, this would call a database function to validate the code
    // and update the user's profile.
    if (code.toLowerCase() === 'gagal') {
       return { success: false, error: 'Kode aktivasi tidak valid atau sudah digunakan.' };
    }
    return { success: true, message: 'Akun berhasil diaktivasi (mode dummy).' };
}


export async function saveJournal(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
    if (!profile?.active_school_year_id) {
        return { success: false, error: "Tahun ajaran aktif belum diatur. Mohon atur di pengaturan." };
    }

    const journalData = {
        id: formData.get('id') as string || undefined,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        meeting_number: Number(formData.get('meeting_number')) || null,
        learning_objectives: formData.get('learning_objectives') as string,
        learning_activities: formData.get('learning_activities') as string,
        assessment: formData.get('assessment') as string || null,
        reflection: formData.get('reflection') as string || null,
        teacher_id: user.id,
        school_year_id: profile.active_school_year_id,
        date: new Date().toISOString(),
    };

    let error;
    if (journalData.id) {
        const { error: updateError } = await supabase.from('journal_entries').update(journalData).eq('id', journalData.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('journal_entries').insert(journalData);
        error = insertError;
    }
    
    if (error) {
        console.error("Error saving journal:", error);
        return { success: false, error: "Gagal menyimpan jurnal ke database." };
    }

    revalidatePath('/dashboard/journal');
    return { success: true };
}

export async function deleteJournal(journalId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { error } = await supabase.from('journal_entries').delete().match({ id: journalId, teacher_id: user.id });

    if (error) {
        console.error("Error deleting journal:", error);
        return { success: false, error: "Gagal menghapus jurnal." };
    }
    revalidatePath('/dashboard/journal');
    return { success: true };
}

export async function saveAgenda(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const agendaData = {
        id: formData.get('id') as string || undefined,
        date: formData.get('date') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        tag: formData.get('tag') as string || null,
        color: formData.get('color') as string || null,
        start_time: formData.get('start_time') as string || null,
        end_time: formData.get('end_time') as string || null,
        teacher_id: user.id,
    };

    let error;
    if (agendaData.id) {
        const { error: updateError } = await supabase.from('agendas').update(agendaData).eq('id', agendaData.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('agendas').insert(agendaData);
        error = insertError;
    }
    
    if (error) {
        console.error("Error saving agenda:", error);
        return { success: false, error: "Gagal menyimpan agenda." };
    }

    revalidatePath('/dashboard/agenda');
    return { success: true };
}

export async function deleteAgenda(agendaId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { error } = await supabase.from('agendas').delete().match({ id: agendaId, teacher_id: user.id });

    if (error) {
        console.error("Error deleting agenda:", error);
        return { success: false, error: "Gagal menghapus agenda." };
    }
    revalidatePath('/dashboard/agenda');
    return { success: true };
}

// These functions remain for admin use, but they are now in lib/actions/admin.ts
// The stubs are removed from here to avoid confusion.
export async function saveClass(formData: FormData) {
    return { success: false, error: 'This action is admin-only.' };
}
export async function saveSubject(formData: FormData) {
     return { success: false, error: 'This action is admin-only.' };
}
export async function saveStudent(formData: FormData) {
     return { success: false, error: 'This action is admin-only.' };
}
export async function updateStudent(formData: FormData) {
    return { success: false, error: 'This action is admin-only.' };
}
export async function moveStudents(studentIds: string[], newClassId: string) {
    return { success: false, error: 'This action is admin-only.' };
}
export async function graduateStudents(studentIds: string[]) {
    return { success: false, error: 'This action is admin-only.' };
}
export async function importStudents(classId: string, students: any[]) {
    return { success: false, error: 'This action is admin-only.' };
}
export async function createSchoolYear(startYear: number) {
    return { success: false, error: 'This action is admin-only.' };
}
export async function setActiveSchoolYear(schoolYearId: string) {
    return { success: false, error: 'This action is admin-only.' };
}


export async function saveAttendance(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };
    
    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
    if (!profile?.active_school_year_id) {
        return { success: false, error: "Tahun ajaran aktif belum diatur. Mohon atur di pengaturan." };
    }

    const attendanceData = {
        id: formData.get('id') as string || undefined,
        date: formData.get('date') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        meeting_number: Number(formData.get('meeting_number')),
        records: JSON.parse(formData.get('records') as string),
        teacher_id: user.id,
        school_year_id: profile.active_school_year_id
    };

    if (!attendanceData.date || !attendanceData.class_id || !attendanceData.subject_id || !attendanceData.meeting_number) {
        return { success: false, error: "Data tidak lengkap." };
    }

    let error;
    if (attendanceData.id) {
        const { error: updateError } = await supabase.from('attendance').update(attendanceData).eq('id', attendanceData.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('attendance').insert(attendanceData);
        error = insertError;
    }

    if (error) {
        console.error("Error saving attendance:", error);
        return { success: false, error: "Gagal menyimpan presensi." };
    }
    
    revalidatePath('/dashboard/attendance');
    return { success: true };
}


export async function saveGrades(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { data: profile } = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
    if (!profile?.active_school_year_id) {
        return { success: false, error: "Tahun ajaran aktif belum diatur. Mohon atur di pengaturan." };
    }

    const gradeData = {
        id: formData.get('id') as string || undefined,
        date: formData.get('date') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        assessment_type: formData.get('assessment_type') as string,
        records: JSON.parse(formData.get('records') as string),
        teacher_id: user.id,
        school_year_id: profile.active_school_year_id,
    };
    
    if (!gradeData.date || !gradeData.class_id || !gradeData.subject_id || !gradeData.assessment_type) {
        return { success: false, error: "Data tidak lengkap." };
    }

    let error;
    if (gradeData.id) {
        const { error: updateError } = await supabase.from('grades').update(gradeData).eq('id', gradeData.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('grades').insert(gradeData);
        error = insertError;
    }

    if (error) {
        console.error("Error saving grades:", error);
        return { success: false, error: "Gagal menyimpan nilai." };
    }

    revalidatePath('/dashboard/grades');
    return { success: true };
}


export async function updateProfile(profileData: { fullName: string, nip: string, pangkat: string, jabatan: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { error } = await supabase.from('profiles').update({
        full_name: profileData.fullName,
        nip: profileData.nip,
        pangkat: profileData.pangkat,
        jabatan: profileData.jabatan
    }).eq('id', user.id);

    if (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Gagal memperbarui profil." };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function updateSchoolData(schoolData: { schoolName: string, schoolAddress: string, headmasterName: string, headmasterNip: string }) {
     const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { error } = await supabase.from('profiles').update({
        school_name: schoolData.schoolName,
        school_address: schoolData.schoolAddress,
        headmaster_name: schoolData.headmasterName,
        headmaster_nip: schoolData.headmasterNip,
    }).eq('id', user.id);

    if (error) {
        console.error("Error updating school data:", error);
        return { success: false, error: "Gagal memperbarui data sekolah." };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

export async function uploadProfileImage(formData: FormData, type: 'avatar' | 'logo') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: "Tidak ada file yang diunggah." };
    
    const bucket = 'avatars'; // Use one bucket for both
    const fileName = `${user.id}/${type === 'avatar' ? 'avatar' : 'logo'}_${Date.now()}`;
    
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
    });
    
    if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, error: "Gagal mengunggah gambar." };
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);

    const columnToUpdate = type === 'avatar' ? 'avatar_url' : 'school_logo_url';

    const { error: dbError } = await supabase.from('profiles').update({
        [columnToUpdate]: publicUrl
    }).eq('id', user.id);

    if (dbError) {
        console.error("DB update error:", dbError);
        return { success: false, error: "Gagal memperbarui URL gambar di profil." };
    }
    
    revalidatePath('/dashboard/settings');
    return { success: true, url: publicUrl };
}

export async function addStudentNote(data: { studentId: string; note: string; type: StudentNote['type'] }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { studentId, note, type } = data;
    
    const { error } = await supabase.from('student_notes').insert({
        student_id: studentId,
        teacher_id: user.id,
        note,
        type,
        date: new Date().toISOString()
    });

    if (error) {
        console.error("Error adding student note:", error);
        return { success: false, error: "Gagal menyimpan catatan siswa." };
    }
    
    revalidatePath('/dashboard/homeroom/student-ledger');
    return { success: true };
}
