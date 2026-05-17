
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Setup folder utama "LakuKelas AI" di Google Drive guru.
 */
export async function setupGoogleDriveFolder() {
    const supabase = createClient();
    
    // 1. Ambil sesi user untuk mendapatkan provider_token (Google Access Token)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.provider_token) {
        console.error("Session or Provider Token missing:", sessionError);
        return { 
            success: false, 
            error: "Token akses Google tidak ditemukan. Silakan login ulang menggunakan Google." 
        };
    }

    const providerToken = session.provider_token;
    const userId = session.user.id;

    try {
        // 2. Cek apakah integrasi sudah ada di database
        const { data: existingIntegration } = await supabase
            .from('google_drive_integrations')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (existingIntegration?.folder_id) {
            return { 
                success: true, 
                folder_id: existingIntegration.folder_id,
                message: "Folder sudah dikonfigurasi." 
            };
        }

        // 3. Panggil Google Drive API untuk membuat folder
        const folderName = "LakuKelas AI";
        const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                description: 'Folder untuk menyimpan dokumen hasil AI Pembelajaran LakuKelas.'
            }),
        });

        if (!driveResponse.ok) {
            const errorData = await driveResponse.json();
            console.error("Google Drive API Error:", errorData);
            return { 
                success: false, 
                error: `Gagal membuat folder di Google Drive: ${errorData.error?.message || 'Unknown error'}` 
            };
        }

        const folderData = await driveResponse.json();
        const folderId = folderData.id;
        const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

        // 4. Simpan metadata folder ke Supabase
        const { error: dbError } = await supabase
            .from('google_drive_integrations')
            .upsert({
                user_id: userId,
                folder_id: folderId,
                folder_url: folderUrl,
                folder_name: folderName,
                status: 'connected',
                drive_email: session.user.email,
                connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (dbError) {
            console.error("Database Update Error:", dbError);
            return { success: false, error: "Gagal menyimpan ID folder ke database." };
        }

        revalidatePath('/dashboard/settings');
        return { 
            success: true, 
            folder_id: folderId, 
            folder_url: folderUrl,
            message: "Folder LakuKelas AI berhasil dibuat!" 
        };

    } catch (error: any) {
        console.error("Setup Drive Error:", error);
        return { success: false, error: "Terjadi kesalahan sistem saat menghubungi Google Drive." };
    }
}

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
