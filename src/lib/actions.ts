

'use server';

// THIS FILE IS DISABLED FOR DESIGN MODE.
// All actions are mocked to prevent database writes.

export async function saveJournal(formData: FormData) {
    console.log("Attempted to save journal:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Jurnal berhasil disimpan (mode dummy).' };
}

export async function deleteJournal(journalId: string) {
    console.log("Attempted to delete journal:", journalId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Jurnal berhasil dihapus (mode dummy).' };
}

export async function saveAgenda(formData: FormData) {
    console.log("Attempted to save agenda:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Agenda berhasil disimpan (mode dummy).' };
}

export async function deleteAgenda(agendaId: string) {
    console.log("Attempted to delete agenda:", agendaId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Agenda berhasil dihapus (mode dummy).' };
}

export async function saveClass(formData: FormData) {
    console.log("Attempted to save class:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Kelas berhasil dibuat (mode dummy).' };
}

export async function saveSubject(formData: FormData) {
     console.log("Attempted to save subject:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Mata pelajaran berhasil disimpan (mode dummy).' };
}

export async function saveStudent(formData: FormData) {
    console.log("Attempted to save student:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Siswa berhasil ditambahkan (mode dummy).' };
}

export async function updateStudent(formData: FormData) {
     console.log("Attempted to update student:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Data siswa berhasil diperbarui (mode dummy).' };
}

export async function moveStudents(studentIds: string[], newClassId: string) {
    console.log("Attempted to move students:", studentIds, "to class:", newClassId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Siswa berhasil dipindahkan (mode dummy).' };
}

export async function graduateStudents(studentIds: string[]) {
    console.log("Attempted to graduate students:", studentIds);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Siswa berhasil diluluskan (mode dummy).' };
}

export async function importStudents(classId: string, students: any[]) {
    console.log("Attempted to import students:", students, "into class:", classId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const report = {
        total: students.length,
        successCount: students.length -1,
        failureCount: 1,
        successes: students.slice(1).map(s => ({name: s.name, nis: s.nis})),
        failures: [{name: students[0].name, nis: students[0].nis, reason: "NIS sudah ada (mode dummy)."}]
    }
    return { success: true, results: report };
}

export async function createSchoolYear(startYear: number) {
    console.log("Attempted to create school year for:", startYear);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: "Tahun ajaran berhasil ditambahkan (mode dummy)." };
}

export async function setActiveSchoolYear(schoolYearId: string) {
    console.log("Attempted to set active school year:", schoolYearId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: "Tahun ajaran aktif berhasil diperbarui (mode dummy)." };
}

export async function saveAttendance(formData: FormData) {
    console.log("Attempted to save attendance:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Presensi berhasil disimpan (mode dummy).' };
}

export async function saveGrades(formData: FormData) {
    console.log("Attempted to save grades:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Nilai berhasil disimpan (mode dummy).' };
}

export async function updateProfile(profileData: any) {
    console.log("Attempted to update profile:", profileData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Profil berhasil diperbarui (mode dummy).' };
}

export async function updateSchoolData(schoolData: any) {
    console.log("Attempted to update school data:", schoolData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Data sekolah berhasil diperbarui (mode dummy).' };
}

export async function uploadProfileImage(formData: FormData, type: 'avatar' | 'logo') {
    const file = formData.get('file') as File;
    console.log(`Attempted to upload ${type} image:`, file.name);
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Create a dummy URL for the uploaded image to be displayed on the client
    const dummyUrl = URL.createObjectURL(file);
    return { success: true, message: 'Gambar berhasil diunggah (mode dummy).', url: dummyUrl };
}
