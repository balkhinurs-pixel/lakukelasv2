

'use server';

import type { ActivationCode } from '../types';

// THIS FILE IS DISABLED FOR DESIGN MODE.
// All actions are mocked to prevent database writes.

export async function generateActivationCode(): Promise<{ success: boolean; data?: ActivationCode, error?: string, code?: string }> {
    console.log("Attempted to generate activation code");
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newCode = {
        id: new Date().toISOString(),
        code: 'DUMMY-CODE-1234',
        is_used: false,
        used_by: null,
        used_at: null,
        created_at: new Date().toISOString()
    };
    return { success: true, data: newCode };
}


export async function updateUserStatus(userId: string, newStatus: 'Pro' | 'Free') {
    console.log("Attempted to update user status for:", userId, "to:", newStatus);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: `Status pengguna berhasil diubah menjadi ${newStatus} (mode dummy).` };
}

export async function deleteUser(userId: string) {
    console.log("Attempted to delete user:", userId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Pengguna berhasil dihapus (mode dummy).' };
}
