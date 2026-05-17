'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Setup folder utama "LakuKelas AI" di Google Drive guru.
 */
export async function setupGoogleDriveFolder() {
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.provider_token) {
        return { success: false, error: "Token akses Google tidak ditemukan. Silakan login ulang." };
    }

    const providerToken = session.provider_token;
    const userId = session.user.id;

    try {
        const { data: existingIntegration } = await supabase
            .from('google_drive_integrations')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (existingIntegration?.folder_id) {
            return { success: true, folder_id: existingIntegration.folder_id };
        }

        const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: "LakuKelas AI",
                mimeType: 'application/vnd.google-apps.folder',
                description: 'Folder untuk menyimpan dokumen hasil AI Pembelajaran LakuKelas.'
            }),
        });

        if (!driveResponse.ok) {
            const errorData = await driveResponse.json();
            return { success: false, error: `Gagal membuat folder: ${errorData.error?.message}` };
        }

        const folderData = await driveResponse.json();
        const folderId = folderData.id;
        const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

        await supabase.from('google_drive_integrations').upsert({
            user_id: userId,
            folder_id: folderId,
            folder_url: folderUrl,
            status: 'connected',
            connected_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        return { success: true, folder_id: folderId };
    } catch (error: any) {
        return { success: false, error: "Kesalahan sistem Drive." };
    }
}

/**
 * Menyimpan konten Markdown ke Google Drive sebagai dokumen Google Doc.
 */
export async function saveAiDocumentToDrive(title: string, content: string, type: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.provider_token) {
        return { success: false, error: "Sesi Google tidak aktif. Harap login ulang." };
    }

    const providerToken = session.provider_token;
    const userId = session.user.id;

    try {
        // 1. Ambil folder_id
        const { data: integration } = await supabase
            .from('google_drive_integrations')
            .select('folder_id')
            .eq('user_id', userId)
            .single();

        if (!integration?.folder_id) {
            const setup = await setupGoogleDriveFolder();
            if (!setup.success) return setup;
            integration!.folder_id = setup.folder_id!;
        }

        // 2. Buat File di Google Drive
        // Karena v3 sederhana tidak mendukung content langsung dalam JSON, 
        // kita menggunakan multipart/related untuk mengirim metadata dan konten
        const metadata = {
            name: title,
            mimeType: 'application/vnd.google-apps.document',
            parents: [integration.folder_id]
        };

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const multipartBody = 
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: text/markdown\r\n\r\n' +
            content +
            close_delim;

        const driveResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
        });

        if (!driveResponse.ok) {
            const err = await driveResponse.json();
            return { success: false, error: err.error?.message || "Gagal simpan ke Drive." };
        }

        const fileData = await driveResponse.json();

        // 3. Simpan metadata ke Supabase
        await supabase.from('ai_documents').insert({
            user_id: userId,
            document_type: type,
            title: title,
            drive_file_id: fileData.id,
            drive_file_url: `https://docs.google.com/document/d/${fileData.id}/edit`,
            drive_folder_id: integration.folder_id,
            status: 'created'
        });

        revalidatePath('/dashboard/ai-pembelajaran');
        return { success: true, file_url: `https://docs.google.com/document/d/${fileData.id}/edit` };

    } catch (error: any) {
        return { success: false, error: "Terjadi kesalahan sistem saat menyimpan ke Drive." };
    }
}

export async function createTestDocument() {
    return saveAiDocumentToDrive(`Tes Koneksi - ${new Date().toLocaleTimeString()}`, "Ini adalah file uji coba.", "test");
}

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

    revalidatePath('/dashboard/settings');
    return { success: true };
}
