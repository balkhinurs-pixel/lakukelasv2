'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Setujui akses pengguna (Approval System).
 */
export async function approveUser(userId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { error } = await supabase
        .from('profiles')
        .update({ is_activated: true })
        .eq('id', userId);

    if (error) return { success: false, error: "Gagal menyetujui pengguna." };

    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Sinkronisasi Libur Nasional secara manual dari API eksternal.
 */
export async function syncNationalHolidaysManual() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    try {
        const years = [2025, 2026];
        let allHolidays: any[] = [];

        for (const year of years) {
            try {
                const res = await fetch(`https://libur.deno.dev/api?year=${year}`, {
                    cache: 'no-store',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    }
                });
                
                if (res.ok) {
                    const rawData = await res.json();
                    const list = Array.isArray(rawData) ? rawData : (rawData.data || []);
                    
                    if (Array.isArray(list) && list.length > 0) {
                        const mapped = list.map((h: any) => ({
                            date: h.date,
                            description: h.name || h.keterangan || "Hari Libur Nasional",
                            type: 'national'
                        }));
                        allHolidays = [...allHolidays, ...mapped];
                    }
                }
            } catch (err: any) {
                console.error(`[SYNC-ERR] Failed to fetch year ${year}:`, err.message);
            }
        }

        if (allHolidays.length === 0) return { success: false, error: "Gagal mengambil data API." };

        const { error } = await supabase.from('holidays').upsert(allHolidays, { onConflict: 'date' });
        if (error) throw error;

        revalidatePath('/admin/settings/holidays');
        return { success: true, message: `Berhasil sinkronisasi ${allHolidays.length} hari libur.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Hapus semua data libur nasional.
 */
export async function clearNationalHolidays() {
    const supabase = createClient();
    const { error } = await supabase.from('holidays').delete().eq('type', 'national');
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/settings/holidays');
    return { success: true, message: "Data berhasil dihapus." };
}

/**
 * Undang guru baru via email.
 */
export async function inviteTeacher(fullName: string, email: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName, role: 'teacher' }
    });
    if (error) return { success: false, error: error.message };
    revalidatePath('/admin/users');
    return { success: true, data };
}

/**
 * Hapus profil pengguna.
 */
export async function deleteUser(userId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) return { success: false, error: "Gagal menghapus profil." };
    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Update peran pengguna.
 */
export async function updateUserRole(userId: string, newRole: 'teacher' | 'headmaster' | 'admin') {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) return { success: false, error: "Gagal memperbarui peran." };
    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Update profil staf oleh admin.
 */
export async function updateStaffProfile(userId: string, data: { fullName: string, nip: string, phoneNumber: string }) {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({
        full_name: data.fullName,
        nip: data.nip,
        phone_number: data.phoneNumber
    }).eq('id', userId);
    if (error) return { success: false, error: "Gagal memperbarui data." };
    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Simpan atau perbarui jadwal mengajar.
 */
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
        await supabase.from('schedule').update(scheduleData).eq('id', scheduleData.id);
    } else {
        await supabase.from('schedule').insert(scheduleData);
    }
    revalidatePath('/admin/settings/schedule');
    return { success: true };
}

/**
 * Hapus item jadwal.
 */
export async function deleteSchedule(scheduleId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('schedule').delete().eq('id', scheduleId);
    if (error) return { success: false, error: 'Gagal menghapus.' };
    revalidatePath('/admin/settings/schedule');
    return { success: true };
}

/**
 * Sinkronisasi flag is_homeroom_teacher.
 */
export async function syncHomeroomTeacherStatus() {
    const supabase = createClient();
    const { data: homeroomAssignments } = await supabase.from('classes').select('teacher_id').not('teacher_id', 'is', null);
    if (!homeroomAssignments) return { success: false };
    const ids = [...new Set(homeroomAssignments.map(c => c.teacher_id))];
    await supabase.from('profiles').update({ is_homeroom_teacher: false });
    if (ids.length > 0) await supabase.from('profiles').update({ is_homeroom_teacher: true }).in('id', ids);
    return { success: true };
}

/**
 * Simpan atau perbarui data Kelas.
 */
export async function saveClass(formData: FormData) {
    const supabase = createClient();
    const data = { id: formData.get('id') as string || undefined, name: formData.get('name') as string, teacher_id: formData.get('teacher_id') as string || null };
    if (data.id) await supabase.from('classes').update({ name: data.name, teacher_id: data.teacher_id }).eq('id', data.id);
    else await supabase.from('classes').insert({ name: data.name, teacher_id: data.teacher_id });
    await syncHomeroomTeacherStatus();
    revalidatePath('/admin/roster/classes');
    return { success: true };
}

/**
 * Hapus data Kelas.
 */
export async function deleteClass(classId: string) {
    const supabase = createClient();
    await supabase.from('classes').delete().eq('id', classId);
    await syncHomeroomTeacherStatus();
    revalidatePath('/admin/roster/classes');
    return { success: true };
}

/**
 * Simpan atau perbarui data Mata Pelajaran.
 */
export async function saveSubject(formData: FormData) {
    const supabase = createClient();
    const data = { id: formData.get('id') as string || undefined, name: formData.get('name') as string, kkm: Number(formData.get('kkm')) };
    if (data.id) await supabase.from('subjects').update({ name: data.name, kkm: data.kkm }).eq('id', data.id);
    else await supabase.from('subjects').insert({ name: data.name, kkm: data.kkm });
    revalidatePath('/admin/roster/subjects');
    return { success: true };
}

/**
 * Simpan pengaturan absensi berbasis lokasi.
 */
export async function saveAttendanceSettings(formData: FormData) {
    const supabase = createClient();
    const settings = [
        { key: 'attendance_latitude', value: formData.get('latitude') as string },
        { key: 'attendance_longitude', value: formData.get('longitude') as string },
        { key: 'attendance_radius', value: formData.get('radius') as string },
        { key: 'attendance_check_in_start', value: formData.get('check_in_start') as string },
        { key: 'attendance_check_in_deadline', value: formData.get('check_in_deadline') as string },
        { key: 'attendance_policy', value: formData.get('attendance_policy') as string },
    ];
    for (const s of settings) await supabase.from('settings').upsert(s, { onConflict: 'key' });
    revalidatePath('/admin/settings/location');
    return { success: true };
}

/**
 * Update informasi dasar sekolah.
 */
export async function updateSchoolData(data: { schoolName: string, schoolAddress: string, headmasterName: string, headmasterNip: string }) {
    const supabase = createClient();
    const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
    if (!admin) return { success: false, error: "Admin tidak ditemukan." };
    await supabase.from('profiles').update({
        school_name: data.schoolName,
        school_address: data.schoolAddress,
        headmaster_name: data.headmasterName,
        headmaster_nip: data.headmasterNip,
    }).eq('id', admin.id);
    revalidatePath('/admin/settings/school');
    return { success: true };
}

/**
 * Unggah gambar profil atau logo sekolah.
 */
export async function uploadProfileImage(formData: FormData, type: 'avatar' | 'logo') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };
    let targetId = user.id;
    if (type === 'logo') {
         const {data: admin} = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
         if(!admin) return { success: false, error: "Admin tidak ditemukan." };
         targetId = admin.id;
    }
    const file = formData.get('file') as File;
    const fileExt = file.name.split('.').pop();
    const fileName = `${targetId}/${type}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (uploadError) return { success: false, error: uploadError.message };
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const col = type === 'avatar' ? 'avatar_url' : 'school_logo_url';
    await supabase.from('profiles').update({ [col]: publicUrl }).eq('id', targetId);
    revalidatePath('/dashboard/settings');
    revalidatePath('/admin/settings/school');
    return { success: true, url: publicUrl };
}

/**
 * Simpan data hari libur.
 */
export async function saveHoliday(h: { date: string, description: string, type: 'national' | 'school' }) {
    const supabase = createClient();
    await supabase.from('holidays').upsert(h, { onConflict: 'date' });
    revalidatePath('/admin/settings/holidays');
    return { success: true };
}

/**
 * Hapus data hari libur.
 */
export async function deleteHoliday(id: string) {
    const supabase = createClient();
    await supabase.from('holidays').delete().eq('id', id);
    revalidatePath('/admin/settings/holidays');
    return { success: true };
}

/**
 * Simpan konfigurasi WhatsApp Gateway.
 */
export async function saveWhatsAppSettings(token: string, enabled: boolean, time: string, appUrl: string) {
    const supabase = createClient();
    const s = [{ key: 'fonnte_api_token', value: token.trim() }, { key: 'wa_reminder_enabled', value: String(enabled) }, { key: 'wa_reminder_time', value: time }, { key: 'app_url', value: appUrl.trim() }];
    for (const item of s) await supabase.from('settings').upsert(item, { onConflict: 'key' });
    revalidatePath('/admin/settings/whatsapp');
    return { success: true };
}

/**
 * Kirim pesan tes WhatsApp.
 */
export async function sendTestWhatsApp(token: string, target: string) {
    const msg = "🌟 *LAKUKELAS TEST* 🌟\nKoneksi WA Gateway Berhasil!";
    try {
        const res = await fetch('https://api.fonnte.com/send', { method: 'POST', headers: { 'Authorization': token.trim() }, body: new URLSearchParams({ 'token': token.trim(), 'target': target.trim(), 'message': msg }) });
        const resData = await res.json();
        return resData.status ? { success: true, message: 'Terkirim.' } : { success: false, error: resData.reason };
    } catch (e) { return { success: false, error: 'Gagal menghubungi Fonnte.' }; }
}
