
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Student } from './types';

// Universal function to handle Supabase errors
async function handleSupabaseAction(action: Promise<any>, successMessage: string, revalidationPath?: string | string[]) {
  try {
    const { error } = await action;
    if (error) throw new Error(error.message);
    
    if (revalidationPath) {
        if (Array.isArray(revalidationPath)) {
            revalidationPath.forEach(path => revalidatePath(path));
        } else {
            revalidatePath(revalidationPath);
        }
    }

    return { success: true, message: successMessage };
  } catch (error: any) {
    if (error.message.includes('unique constraint')) {
        return { success: false, error: 'Gagal: Terdapat data duplikat. Pastikan data yang Anda masukkan unik.' };
    }
    return { success: false, error: error.message };
  }
}

// --- Activation Actions ---
export async function activateAccount(code: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Pengguna tidak terautentikasi.' };
  }

  // Use a transaction to ensure both updates succeed or both fail
  const { error } = await supabase.rpc('activate_account_with_code', {
    activation_code_to_use: code,
    user_id_to_activate: user.id,
    user_email_to_set: user.email
  });

  if (error) {
      if (error.message.includes('Code not found')) {
          return { success: false, error: 'Kode aktivasi tidak valid.' };
      }
      if (error.message.includes('Code already used')) {
          return { success: false, error: 'Kode aktivasi sudah pernah digunakan.' };
      }
      console.error('RPC Error:', error);
      return { success: false, error: 'Terjadi kesalahan pada server saat aktivasi.' };
  }
  
  // Revalidate all relevant paths to reflect Pro status immediately
  revalidatePath('/dashboard/activation');
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/admin/users');
  revalidatePath('/admin/codes');
  
  return { success: true };
}


// --- Journal Actions ---
export async function saveJournal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const {data: profile} = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();

  const entryId = formData.get('id') as string;
  const rawData = {
    class_id: formData.get('class_id') as string,
    subject_id: formData.get('subject_id') as string,
    school_year_id: profile?.active_school_year_id,
    meeting_number: Number(formData.get('meeting_number')) || null,
    learning_activities: formData.get('learning_activities') as string,
    learning_objectives: formData.get('learning_objectives') as string,
    assessment: formData.get('assessment') as string,
    reflection: formData.get('reflection') as string,
    teacher_id: user.id,
    date: new Date().toISOString(),
  };

  const action = entryId
    ? supabase.from('journals').update(rawData).eq('id', entryId)
    : supabase.from('journals').insert([rawData]);

  return handleSupabaseAction(action, 'Jurnal berhasil disimpan.', ['/dashboard/journal', '/dashboard']);
}

export async function deleteJournal(journalId: string) {
  const supabase = createClient();
  return handleSupabaseAction(
    supabase.from('journals').delete().eq('id', journalId),
    'Jurnal berhasil dihapus.',
    ['/dashboard/journal', '/dashboard']
  );
}

// --- Agenda Actions ---
export async function saveAgenda(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const agendaId = formData.get('id') as string;
    const rawData = {
        date: formData.get('date') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string | undefined,
        tag: formData.get('tag') as string | undefined,
        color: formData.get('color') as string | undefined || '#6b7280',
        start_time: formData.get('start_time') || null,
        end_time: formData.get('end_time') || null,
        teacher_id: user.id,
    };

    const action = agendaId
        ? supabase.from('agendas').update(rawData).eq('id', agendaId)
        : supabase.from('agendas').insert([rawData]);

    return handleSupabaseAction(action, 'Agenda berhasil disimpan.', '/dashboard/agenda');
}

export async function deleteAgenda(agendaId: string) {
    const supabase = createClient();
    return handleSupabaseAction(
        supabase.from('agendas').delete().eq('id', agendaId),
        'Agenda berhasil dihapus.',
        '/dashboard/agenda'
    );
}


// --- Roster Actions ---
export async function saveClass(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const className = formData.get('name') as string;
  const action = supabase.from('classes').insert([{ name: className, teacher_id: user.id }]);
  return handleSupabaseAction(action, 'Kelas berhasil dibuat.', '/dashboard/roster/classes');
}

export async function saveSubject(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const subjectId = formData.get('id') as string;
    const rawData = {
        name: formData.get('name') as string,
        kkm: Number(formData.get('kkm')),
        teacher_id: user.id,
    };

    const action = subjectId
        ? supabase.from('subjects').update(rawData).eq('id', subjectId)
        : supabase.from('subjects').insert([rawData]);

    return handleSupabaseAction(action, 'Mata pelajaran berhasil disimpan.', '/dashboard/roster/subjects');
}

export async function saveStudent(formData: FormData) {
    const supabase = createClient();
     const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const classId = formData.get('class_id') as string;

    const rawData = {
        name: formData.get('name') as string,
        nis: formData.get('nis') as string,
        gender: formData.get('gender') as 'Laki-laki' | 'Perempuan',
        class_id: classId,
    };
    
    const action = supabase.from('students').insert([rawData]);
    return handleSupabaseAction(action, 'Siswa berhasil ditambahkan.', `/dashboard/roster/students`);
}

export async function updateStudent(formData: FormData) {
    const supabase = createClient();
    const studentId = formData.get('id') as string;

    if (!studentId) {
        return { success: false, error: 'ID Siswa tidak ditemukan.' };
    }

    const rawData = {
        name: formData.get('name') as string,
        nis: formData.get('nis') as string,
        gender: formData.get('gender') as 'Laki-laki' | 'Perempuan',
    };

    const action = supabase.from('students').update(rawData).eq('id', studentId);
    return handleSupabaseAction(action, 'Data siswa berhasil diperbarui.', '/dashboard/roster/students');
}

export async function moveStudent(studentId: string, newClassId: string) {
    const supabase = createClient();
    if (!studentId || !newClassId) {
        return { success: false, error: 'ID Siswa atau ID Kelas baru tidak valid.' };
    }

    const action = supabase.from('students').update({ class_id: newClassId }).eq('id', studentId);
    return handleSupabaseAction(action, 'Siswa berhasil dipindahkan.', '/dashboard/roster/students');
}

type ImportResult = {
    total: number;
    successCount: number;
    failureCount: number;
    successes: { name: string; nis: string }[];
    failures: { name: string; nis: string; reason: string }[];
};

export async function importStudents(classId: string, students: { name: string; nis: string; gender: Student['gender'] }[]): Promise<{ success: boolean; results?: ImportResult; error?: string }> {
    const supabase = createClient();
    
    const results: ImportResult = {
        total: students.length,
        successCount: 0,
        failureCount: 0,
        successes: [],
        failures: [],
    };

    for (const student of students) {
        if (!student.name || !student.nis || !student.gender) {
            results.failureCount++;
            results.failures.push({ ...student, reason: 'Data tidak lengkap (nama, nis, atau gender kosong).' });
            continue;
        }

        const { error } = await supabase.rpc('add_student_with_teacher_check', {
            p_class_id: classId,
            p_nis: student.nis,
            p_name: student.name,
            p_gender: student.gender,
        });

        if (error) {
            results.failureCount++;
            let reason = error.message;
            if (error.message.includes('duplicate key value violates unique constraint')) {
                reason = 'NIS sudah ada di kelas lain milik Anda.';
            } else if (error.message.includes('NIS already exists for this teacher')) {
                reason = 'NIS sudah terdaftar untuk guru ini.';
            }
            results.failures.push({ ...student, reason });
        } else {
            results.successCount++;
            results.successes.push(student);
        }
    }

    if (results.successCount > 0) {
        revalidatePath('/dashboard/roster/students');
    }

    return { success: true, results };
}


export async function saveSchoolYear(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const yearName = formData.get('name') as string;
    const action = supabase.from('school_years').insert([{ name: yearName, teacher_id: user.id }]);
    return handleSupabaseAction(action, 'Tahun ajaran berhasil dibuat.', '/dashboard/roster/school-year');
}

export async function setActiveSchoolYear(schoolYearId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const action = supabase.from('profiles').update({ active_school_year_id: schoolYearId }).eq('id', user.id);
    return handleSupabaseAction(action, 'Tahun ajaran aktif berhasil diperbarui.', '/dashboard/roster/school-year');
}

// --- Schedule Actions ---
export async function saveSchedule(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const scheduleId = formData.get('id') as string;
    const rawData = {
        day: formData.get('day') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        teacher_id: user.id,
    };
    
    const action = scheduleId
        ? supabase.from('schedule').update(rawData).eq('id', scheduleId)
        : supabase.from('schedule').insert([rawData]);

    return handleSupabaseAction(action, 'Jadwal berhasil disimpan.', ['/dashboard/schedule', '/dashboard']);
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = createClient();
  return handleSupabaseAction(
    supabase.from('schedule').delete().eq('id', scheduleId),
    'Jadwal berhasil dihapus.',
    ['/dashboard/schedule', '/dashboard']
  );
}

// --- Attendance Actions ---
export async function saveAttendance(formData: FormData) {
    const supabase = createClient();
     const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };
    
    const {data: profile} = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();
    
    const attendanceId = formData.get('id') as string;

    const records = JSON.parse(formData.get('records') as string);
    const rawData = {
        date: formData.get('date') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        school_year_id: profile?.active_school_year_id,
        meeting_number: Number(formData.get('meeting_number')),
        records: records,
        teacher_id: user.id
    };

    const action = attendanceId
        ? supabase.from('attendance_history').update(rawData).eq('id', attendanceId)
        : supabase.from('attendance_history').insert([rawData]);

    return handleSupabaseAction(action, 'Presensi berhasil disimpan.', '/dashboard/attendance');
}

// --- Grade Actions ---
export async function saveGrades(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };
    
    const {data: profile} = await supabase.from('profiles').select('active_school_year_id').eq('id', user.id).single();

    const gradeId = formData.get('id') as string;
    
    const records = JSON.parse(formData.get('records') as string);
    const rawData = {
        date: formData.get('date') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        school_year_id: profile?.active_school_year_id,
        assessment_type: formData.get('assessment_type') as string,
        records: records,
        teacher_id: user.id
    };

    const action = gradeId
        ? supabase.from('grade_history').update(rawData).eq('id', gradeId)
        : supabase.from('grade_history').insert([rawData]);

    return handleSupabaseAction(action, 'Nilai berhasil disimpan.', '/dashboard/grades');
}

// --- Settings Actions ---
export async function updateProfile(profileData: { fullName: string; nip: string; pangkat: string; jabatan: string; }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };
    
    const updatedProfile = {
        full_name: profileData.fullName,
        nip: profileData.nip,
        pangkat: profileData.pangkat,
        jabatan: profileData.jabatan,
    };

    const action = supabase.from('profiles').update(updatedProfile).eq('id', user.id);
    return handleSupabaseAction(action, 'Profil berhasil diperbarui.', '/dashboard/settings');
}

export async function updateSchoolData(schoolData: { schoolName: string; schoolAddress: string; headmasterName: string; headmasterNip: string; }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };
    
    const updatedData = {
        school_name: schoolData.schoolName,
        school_address: schoolData.schoolAddress,
        headmaster_name: schoolData.headmasterName,
        headmaster_nip: schoolData.headmasterNip,
    };

    const action = supabase.from('profiles').update(updatedData).eq('id', user.id);
    return handleSupabaseAction(action, 'Data sekolah berhasil diperbarui.', '/dashboard/settings');
}

export async function uploadProfileImage(formData: FormData, type: 'avatar' | 'logo') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    const bucket = 'profile-images';
    const filePath = `${user.id}/${type}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            upsert: true, // This will overwrite the file if it already exists, useful for updates
        });

    if (uploadError) {
        return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    let columnToUpdate: 'avatar_url' | 'school_logo_url';

    if (type === 'avatar') {
        columnToUpdate = 'avatar_url';
    } else if (type === 'logo') {
        columnToUpdate = 'school_logo_url';
    } else {
        return { success: false, error: 'Invalid upload type specified.' };
    }

    const { error: dbError } = await supabase
        .from('profiles')
        .update({ [columnToUpdate]: publicUrl })
        .eq('id', user.id);

    if (dbError) {
        return { success: false, error: `Database update failed: ${dbError.message}` };
    }
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard', 'layout'); // Revalidate layout to update sidebar avatar

    return { success: true, message: 'Image uploaded successfully', url: publicUrl };
}
