
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Memutuskan integrasi Google Drive dari akun guru.
 */
export async function disconnectGoogleDrive() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { error } = await supabase
        .from('google_drive_integrations')
        .update({ 
            status: 'disconnected',
            disconnected_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

    if (error) {
        console.error("Error disconnecting drive:", error);
        return { success: false, error: "Gagal memutus integrasi di database." };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}

/**
 * Memulai ulang integrasi (memaksa login ulang dengan Google).
 */
export async function reconnectGoogleDrive() {
    // Logic ini biasanya dijalankan di client side menggunakan supabase.auth.signInWithOAuth
    // Fungsi ini hanya sebagai placeholder jika dibutuhkan aksi server-side di masa depan.
    return { success: true };
}
