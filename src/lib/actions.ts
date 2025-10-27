
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from './supabase/server';
import type { StudentNote, GradeRecord, AttendanceRecord } from './types';
import { z } from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getIndonesianTime, createIndonesianTimestamp } from './timezone';

// Helper function to get active school year from global settings
export async function getActiveSchoolYearId(): Promise<string | null> {
    const supabase = createClient();
    const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'active_school_year_id')
        .single();
    return data?.value || null;
}

export async function saveJournal(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) {
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
        school_year_id: activeSchoolYearId,
        date: createIndonesianTimestamp(),
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
    
    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) {
        return { success: false, error: "Tahun ajaran aktif belum diatur. Mohon atur di pengaturan." };
    }

    const commonData = {
        date: formData.get('date') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        meeting_number: Number(formData.get('meeting_number')),
    };

    if (!commonData.date || !commonData.class_id || !commonData.subject_id || !commonData.meeting_number) {
        return { success: false, error: "Data tidak lengkap." };
    }
    
    const records: { student_id: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[] = JSON.parse(formData.get('records') as string);
    const recordsToInsert: Omit<AttendanceRecord, 'id'>[] = records.map(record => ({
        ...commonData,
        student_id: record.student_id,
        status: record.status,
        teacher_id: user.id,
        school_year_id: activeSchoolYearId
    }));
    
    // For editing, we delete existing records and insert new ones
    // This is simpler than upserting for this structure
    if (formData.get('id')) {
        const { error: deleteError } = await supabase.from('attendance_records')
            .delete()
            .eq('date', commonData.date)
            .eq('class_id', commonData.class_id)
            .eq('subject_id', commonData.subject_id)
            .eq('meeting_number', commonData.meeting_number);
            
        if (deleteError) {
             console.error("Error deleting old attendance records for update:", deleteError);
             return { success: false, error: "Gagal memperbarui presensi (langkah 1)." };
        }
    }

    const { error: insertError } = await supabase.from('attendance_records').insert(recordsToInsert);

    if (insertError) {
        console.error("Error saving attendance:", insertError);
        return { success: false, error: "Gagal menyimpan presensi." };
    }
    
    revalidatePath('/dashboard/attendance');
    return { success: true };
}


export async function saveGrades(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const activeSchoolYearId = await getActiveSchoolYearId();
    if (!activeSchoolYearId) {
        return { success: false, error: "Tahun ajaran aktif belum diatur. Mohon atur di pengaturan." };
    }

    const commonData = {
        date: formData.get('date') as string,
        class_id: formData.get('class_id') as string,
        subject_id: formData.get('subject_id') as string,
        assessment_type: formData.get('assessment_type') as string,
    };
    
    if (!commonData.date || !commonData.class_id || !commonData.subject_id || !commonData.assessment_type) {
        return { success: false, error: "Data tidak lengkap." };
    }

    const records: { student_id: string, score: number }[] = JSON.parse(formData.get('records') as string);
    const recordsToInsert: Omit<GradeRecord, 'id'>[] = records.map(record => ({
        ...commonData,
        student_id: record.student_id,
        score: record.score,
        teacher_id: user.id,
        school_year_id: activeSchoolYearId,
    }));

    if (formData.get('id')) {
        const { error: deleteError } = await supabase.from('grade_records')
            .delete()
            .eq('date', commonData.date)
            .eq('class_id', commonData.class_id)
            .eq('subject_id', commonData.subject_id)
            .eq('assessment_type', commonData.assessment_type);
        
        if (deleteError) {
             console.error("Error deleting old grade records for update:", deleteError);
             return { success: false, error: "Gagal memperbarui nilai (langkah 1)." };
        }
    }

    const { error: insertError } = await supabase.from('grade_records').insert(recordsToInsert);

    if (insertError) {
        console.error("Error saving grades:", insertError);
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

export async function recordTeacherAttendance(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const attendanceType = formData.get('type') as 'in' | 'out' | 'leave';
    
    // Get current time in Indonesian timezone (GMT+7)
    const indonesianTime = getIndonesianTime();
    const currentTime = format(indonesianTime, 'HH:mm:ss');
    const today = format(indonesianTime, 'yyyy-MM-dd');

    const { data: existingAttendance } = await supabase
        .from('teacher_attendance')
        .select('id, check_in')
        .eq('teacher_id', user.id)
        .eq('date', today)
        .single();
    
    if (attendanceType === 'leave') {
        const leaveType = formData.get('leave_type') as 'Sakit' | 'Izin';
        const reason = formData.get('reason') as string;
        
        if (existingAttendance) {
             const { error: updateError } = await supabase
                .from('teacher_attendance')
                .update({
                    status: leaveType,
                    reason: reason,
                    check_in: null,
                    check_out: null,
                })
                .eq('id', existingAttendance.id);
            
            if (updateError) {
                console.error('Error updating leave status:', updateError);
                return { success: false, error: "Gagal memperbarui status izin." };
            }
        } else {
             const { error: insertError } = await supabase
                .from('teacher_attendance')
                .insert({
                    teacher_id: user.id,
                    date: today,
                    status: leaveType,
                    reason: reason
                });

            if (insertError) {
                console.error('Error recording leave:', insertError);
                return { success: false, error: "Gagal menyimpan pengajuan izin." };
            }
        }
        revalidatePath('/dashboard/teacher-attendance');
        return { success: true };
    }
    
    const userLatitude = parseFloat(formData.get('latitude') as string);
    const userLongitude = parseFloat(formData.get('longitude') as string);

    // Get attendance settings from database
    const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
            'attendance_latitude', 
            'attendance_longitude', 
            'attendance_radius', 
            'attendance_check_in_start', 
            'attendance_check_in_deadline'
        ]);

    if (settingsError || !settings || settings.length === 0) {
        return { success: false, error: "Pengaturan absensi belum dikonfigurasi oleh admin." };
    }

    const attendanceSettings = settings.reduce((acc, item) => {
        const key = item.key.replace('attendance_', '');
        acc[key] = item.value;
        return acc;
    }, {} as Record<string, string>);

    if (!attendanceSettings.latitude || !attendanceSettings.longitude || !attendanceSettings.radius) {
        return { success: false, error: "Koordinat atau radius belum dikonfigurasi oleh admin." };
    }

    const schoolLat = parseFloat(attendanceSettings.latitude);
    const schoolLng = parseFloat(attendanceSettings.longitude);
    const maxRadius = parseInt(attendanceSettings.radius);

    const distance = calculateDistance(userLatitude, userLongitude, schoolLat, schoolLng);
    
    if (distance > maxRadius) {
        return { 
            success: false, 
            error: `Anda berada ${Math.round(distance)}m dari sekolah. Maksimal jarak ${maxRadius}m.` 
        };
    }

    let status = 'Tepat Waktu';
    if (attendanceType === 'in') {
        const checkInStart = attendanceSettings.check_in_start || '06:30';
        const checkInDeadline = attendanceSettings.check_in_deadline || '07:15';
        
        const currentTimeOnly = format(indonesianTime, 'HH:mm');
        
        if (currentTimeOnly < checkInStart) {
            return { success: false, error: `Absen masuk belum dibuka. Mulai jam ${checkInStart}.` };
        }
        
        if (currentTimeOnly > checkInDeadline) {
            status = 'Terlambat';
        }
    }

    try {
        if (attendanceType === 'in') {
            if (existingAttendance) {
                return { success: false, error: "Anda sudah melakukan absen masuk hari ini." };
            }

            const { error: insertError } = await supabase
                .from('teacher_attendance')
                .insert({
                    teacher_id: user.id,
                    date: today,
                    check_in: currentTime,
                    status: status
                });

            if (insertError) {
                console.error('Error recording check-in:', insertError);
                return { success: false, error: "Gagal menyimpan absen masuk." };
            }
        } else {
            if (!existingAttendance) {
                return { success: false, error: "Anda belum melakukan absen masuk hari ini." };
            }

            if (existingAttendance.check_in && currentTime <= existingAttendance.check_in) {
                return { success: false, error: "Waktu absen pulang tidak boleh lebih awal dari absen masuk." };
            }

            const { error: updateError } = await supabase
                .from('teacher_attendance')
                .update({ check_out: currentTime })
                .eq('id', existingAttendance.id);

            if (updateError) {
                console.error('Error recording check-out:', updateError);
                return { success: false, error: "Gagal menyimpan absen pulang." };
            }
        }

        revalidatePath('/dashboard/teacher-attendance');
        revalidatePath('/admin');
        revalidatePath('/admin/teacher-attendance');
        
        const result = { 
            success: true, 
            message: `Absen ${attendanceType === 'in' ? 'masuk' : 'pulang'} berhasil dicatat.`,
            status: status,
            distance: Math.round(distance)
        };
        
        console.log('✅ Final success result:', result);
        console.log('=== ATTENDANCE DEBUG END ===');
        
        return result;
    } catch (error) {
        console.error('❌ Unexpected error in attendance recording:', error);
        console.log('=== ATTENDANCE DEBUG END (ERROR) ===');
        return { success: false, error: "Terjadi kesalahan saat menyimpan absensi." };
    }
}

function calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}
