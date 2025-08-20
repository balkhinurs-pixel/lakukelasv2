

'use server';

import type { ActivationCode } from '../types';

// THIS FILE IS DISABLED FOR DESIGN MODE.
// All actions are mocked to prevent database writes.

export async function deleteUser(userId: string) {
    console.log("Attempted to delete user:", userId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Pengguna berhasil dihapus (mode dummy).' };
}
