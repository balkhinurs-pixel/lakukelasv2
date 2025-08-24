

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './supabase/server';
import type { StudentNote } from './types';
import { z } from 'zod';

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
        const { error: updateError } = await supabase.from('attendance').update({ 
            records: attendanceData.records, 
            meeting_number: attendanceData.meeting_number,
            date: attendanceData.date,
        }).eq('id', attendanceData.id);
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
        const { error: updateError } = await supabase.from('grades').update({
            records: gradeData.records,
            assessment_type: gradeData.assessment_type,
            date: gradeData.date,
        }).eq('id', gradeData.id);
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    
    revalidatePath('/dashboard/attendance');
    revalidatePath('/dashboard/homeroom/student-ledger');
    return { success: true };
}

const StudentSchema = z.object({
  name: z.string(),
  nis: z.string(),
  gender: z.enum(['Laki-laki', 'Perempuan']),
});
type StudentImport = z.infer<typeof StudentSchema>;


export async function importStudents(classId: string, students: StudentImport[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const report = {
        total: students.length,
        successCount: 0,
        failureCount: 0,
        successes: [] as { name: string, nis: string }[],
        failures: [] as { name: string, nis: string, reason: string }[],
    };

    // Fetch existing NIS for this teacher to prevent duplicates
    const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('nis');
        
    if (fetchError) {
        return { success: false, error: "Gagal memverifikasi data siswa yang ada." };
    }
    const existingNis = new Set(existingStudents.map(s => s.nis));

    const studentsToInsert = [];

    for (const student of students) {
        const validation = StudentSchema.safeParse(student);
        if (!validation.success) {
            report.failureCount++;
            report.failures.push({ name: student.name || 'N/A', nis: student.nis || 'N/A', reason: 'Data tidak valid' });
            continue;
        }

        if (existingNis.has(student.nis)) {
            report.failureCount++;
            report.failures.push({ name: student.name, nis: student.nis, reason: 'NIS sudah ada di database.' });
            continue;
        }

        studentsToInsert.push({ ...student, class_id: classId, status: 'active' });
        existingNis.add(student.nis); // Add to set to catch duplicates within the same file
    }

    if (studentsToInsert.length > 0) {
        const { error } = await supabase.from('students').insert(studentsToInsert);

        if (error) {
            console.error('Batch insert error:', error);
            // Since it's a batch, if it fails, all fail.
            report.failureCount += studentsToInsert.length;
            report.failures.push(...studentsToInsert.map(s => ({ name: s.name, nis: s.nis, reason: "Gagal menyimpan ke database." })));
        } else {
            report.successCount += studentsToInsert.length;
            report.successes.push(...studentsToInsert.map(s => ({ name: s.name, nis: s.nis })));
        }
    }
    
    revalidatePath('/admin/roster/students');
    return { success: true, results: report };
}

export async function moveStudents(studentIds: string[], newClassId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('students')
        .update({ class_id: newClassId })
        .in('id', studentIds);
    
    if (error) {
        console.error("Error moving students:", error);
        return { success: false, error: "Gagal memindahkan siswa." };
    }

    revalidatePath('/admin/roster/promotion');
    revalidatePath('/admin/roster/students');
    return { success: true };
}

export async function graduateStudents(studentIds: string[]) {
    const supabase = createClient();
    const { error } = await supabase
        .from('students')
        .update({ status: 'graduated' })
        .in('id', studentIds);

    if (error) {
        console.error("Error graduating students:", error);
        return { success: false, error: "Gagal meluluskan siswa." };
    }
    
    revalidatePath('/admin/roster/promotion');
    revalidatePath('/admin/roster/alumni');
    return { success: true };
}

export async function createSchoolYear(startYear: number) {
    const supabase = createClient();
    const ganjilName = `${startYear}/${startYear + 1} - Ganjil`;
    const genapName = `${startYear}/${startYear + 1} - Genap`;

    const { error } = await supabase.from('school_years').insert([
        { name: ganjilName },
        { name: genapName }
    ]);
    
    if (error) {
        console.error("Error creating school year:", error);
        return { success: false, error: "Gagal membuat tahun ajaran. Mungkin sudah ada." };
    }
    
    revalidatePath('/admin/roster/school-year');
    return { success: true };
}

export async function setActiveSchoolYear(schoolYearId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('settings')
        .upsert({ key: 'active_school_year_id', value: schoolYearId });

    if (error) {
        console.error("Error setting active school year:", error);
        return { success: false, error: "Gagal mengatur tahun ajaran aktif." };
    }

    revalidatePath('/admin/roster/school-year');
    revalidatePath('/dashboard');
    return { success: true };
}
