
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Universal function to handle Supabase errors
async function handleSupabaseAction(action: Promise<any>, successMessage: string, revalidationPath?: string) {
  try {
    const { error } = await action;
    if (error) throw new Error(error.message);
    if (revalidationPath) revalidatePath(revalidationPath);
    return { success: true, message: successMessage };
  } catch (error: any) {
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

  // Check if code is valid and not used
  const { data: activationCode, error: codeError } = await supabase
    .from('activation_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (codeError || !activationCode) {
    return { success: false, error: 'Kode aktivasi tidak valid.' };
  }

  if (activationCode.is_used) {
    return { success: false, error: 'Kode aktivasi sudah pernah digunakan.' };
  }

  // Update profile to 'Pro'
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ account_status: 'Pro' })
    .eq('id', user.id);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // Mark code as used
  const { error: updateCodeError } = await supabase
    .from('activation_codes')
    .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() })
    .eq('id', activationCode.id);

  if (updateCodeError) {
    // Optionally, handle rollback logic here if marking the code fails
    return { success: false, error: updateCodeError.message };
  }
  
  revalidatePath('/dashboard/activation');
  revalidatePath('/dashboard');
  revalidatePath('/admin/users');
  revalidatePath('/admin/codes');
  
  return { success: true };
}


// --- Journal Actions ---
export async function saveJournal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const entryId = formData.get('id') as string;
  const rawData = {
    class_id: formData.get('class_id') as string,
    subject_id: formData.get('subject_id') as string,
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

  return handleSupabaseAction(action, 'Jurnal berhasil disimpan.', '/dashboard/journal');
}

export async function deleteJournal(journalId: string) {
  const supabase = createClient();
  return handleSupabaseAction(
    supabase.from('journals').delete().eq('id', journalId),
    'Jurnal berhasil dihapus.',
    '/dashboard/journal'
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
    const classId = formData.get('class_id') as string;

    const rawData = {
        name: formData.get('name') as string,
        nis: formData.get('nis') as string,
        nisn: formData.get('nisn') as string,
        gender: formData.get('gender') as 'Laki-laki' | 'Perempuan',
        class_id: classId,
    };
    
    const action = supabase.from('students').insert([rawData]);
    return handleSupabaseAction(action, 'Siswa berhasil ditambahkan.', `/dashboard/roster/students?classId=${classId}`);
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

    return handleSupabaseAction(action, 'Jadwal berhasil disimpan.', '/dashboard/schedule');
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = createClient();
  return handleSupabaseAction(
    supabase.from('schedule').delete().eq('id', scheduleId),
    'Jadwal berhasil dihapus.',
    '/dashboard/schedule'
  );
}

// --- Attendance Actions ---
export async function saveAttendance(formData: FormData) {
    const supabase = createClient();
    const attendanceId = formData.get('id') as string;

    const records = JSON.parse(formData.get('records') as string);
    const rawData = {
        date: formData.get('date') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        meeting_number: Number(formData.get('meeting_number')),
        records: records,
    };

    const action = attendanceId
        ? supabase.from('attendance_history').update(rawData).eq('id', attendanceId)
        : supabase.from('attendance_history').insert([rawData]);

    return handleSupabaseAction(action, 'Presensi berhasil disimpan.', '/dashboard/attendance');
}

// --- Grade Actions ---
export async function saveGrades(formData: FormData) {
    const supabase = createClient();
    const gradeId = formData.get('id') as string;
    
    const records = JSON.parse(formData.get('records') as string);
    const rawData = {
        date: formData.get('date') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        assessment_type: formData.get('assessment_type') as string,
        records: records,
    };

    const action = gradeId
        ? supabase.from('grade_history').update(rawData).eq('id', gradeId)
        : supabase.from('grade_history').insert([rawData]);

    return handleSupabaseAction(action, 'Nilai berhasil disimpan.', '/dashboard/grades');
}
