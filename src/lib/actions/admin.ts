

'use server';

import type { ActivationCode } from '../types';

// THIS FILE IS DISABLED FOR DESIGN MODE.
// All actions are mocked to prevent database writes.

export async function deleteUser(userId: string) {
    console.log("Attempted to delete user:", userId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Pengguna berhasil dihapus (mode dummy).' };
}

export async function saveSchedule(formData: FormData) {
    console.log("Admin attempted to save schedule:", Object.fromEntries(formData.entries()));
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Jadwal berhasil disimpan (mode dummy).' };
}

export async function deleteSchedule(scheduleId: string) {
    console.log("Admin attempted to delete schedule:", scheduleId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Jadwal berhasil dihapus (mode dummy).' };
}
