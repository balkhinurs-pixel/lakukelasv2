
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Mendapatkan atau membuat sub-folder secara rekursif.
 * Memungkinkan struktur: LakuKelas AI / Bank Soal / Kelas 10 / Matematika
 */
async function getOrCreateRecursiveFolder(providerToken: string, parentId: string, pathParts: string[]): Promise<string> {
    let currentParentId = parentId;

    for (const part of pathParts) {
        const query = `name = '${part.replace(/'/g, "\\'")}' and '${currentParentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
            headers: { 'Authorization': `Bearer ${providerToken}` }
        });
        const searchData = await searchResponse.json();

        if (searchData.files && searchData.files.length > 0) {
            currentParentId = searchData.files[0].id;
        } else {
            const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${providerToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: part,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [currentParentId]
                }),
            });
            const createData = await createResponse.json();
            if (!createData.id) throw new Error(`Gagal membuat folder: ${part}`);
            currentParentId = createData.id;
        }
    }

    return currentParentId;
}

/**
 * Setup folder utama "LakuKelas AI" di Google Drive guru.
 */
export async function setupGoogleDriveFolder() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.provider_token) {
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
 * Menyimpan Naskah ke Google Drive dengan struktur folder rapi.
 */
export async function saveNaskahToDrive(title: string, content: string, metadata: { class: string, subject: string }) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.provider_token) {
        return { success: false, error: "Sesi Google tidak aktif. Harap login ulang." };
    }

    const providerToken = session.provider_token;
    const userId = session.user.id;

    try {
        // 1. Ambil Root Folder ID
        let { data: integration } = await supabase
            .from('google_drive_integrations')
            .select('folder_id')
            .eq('user_id', userId)
            .single();

        if (!integration?.folder_id) {
            const setup = await setupGoogleDriveFolder();
            if (!setup.success) return setup;
            integration = { folder_id: setup.folder_id! };
        }

        // 2. Buat Deep Nesting Path: Bank Soal / Kelas X / Mapel
        const path = ['Bank Soal', `Kelas ${metadata.class}`, metadata.subject];
        const targetFolderId = await getOrCreateRecursiveFolder(providerToken, integration.folder_id!, path);

        // 3. Buat File di Google Drive (Markdown to Google Doc Conversion)
        const fileMetadata = {
            name: title,
            mimeType: 'application/vnd.google-apps.document',
            parents: [targetFolderId]
        };

        const boundary = '-------LakuKelasBoundary';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const multipartBody = 
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(fileMetadata) +
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

        const fileData = await driveResponse.json();

        // 4. Simpan metadata ke tabel repository (ai_documents)
        await supabase.from('ai_documents').insert({
            user_id: userId,
            document_type: 'naskah_ujian',
            title: title,
            class_level: metadata.class,
            subject: metadata.subject,
            drive_file_id: fileData.id,
            drive_file_url: `https://docs.google.com/document/d/${fileData.id}/edit`,
            drive_folder_id: targetFolderId,
            status: 'created'
        });

        revalidatePath('/dashboard/ai-pembelajaran/naskah-soal');
        return { success: true, file_url: `https://docs.google.com/document/d/${fileData.id}/edit` };

    } catch (error: any) {
        console.error("[DRIVE_NASKAH_ERR]", error);
        return { success: false, error: "Gagal menyimpan naskah ke Drive." };
    }
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
