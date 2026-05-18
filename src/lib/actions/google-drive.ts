
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Mendapatkan atau membuat sub-folder secara rekursif.
 * Memungkinkan struktur: LakuKelas AI / Bank Soal / [Jenjang] / Kelas [Angka] / [Mapel]
 */
async function getOrCreateRecursiveFolder(providerToken: string, parentId: string, pathParts: string[]): Promise<string> {
    let currentParentId = parentId;

    for (const part of pathParts) {
        const query = `name = '${part.replace(/'/g, "\\")}' and '${currentParentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
            headers: { 'Authorization': `Bearer ${providerToken}` }
        });
        
        if (!searchResponse.ok) {
            throw new Error(`Gagal mencari folder: ${part}`);
        }

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
    const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession()
    ]);
    
    if (!user || !session || !session.provider_token) {
        return { success: false, error: "Token akses Google tidak ditemukan. Silakan login ulang." };
    }

    const providerToken = session.provider_token;
    const userId = user.id;

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
        return { success: false, error: "Terjadi kesalahan saat menyiapkan folder Drive." };
    }
}

/**
 * Server Action untuk menyimpan naskah ke Google Drive dengan dukungan format PDF atau Google Doc.
 */
export async function saveNaskahToDrive(
    title: string, 
    content: string, 
    metadata: { jenjang: string, class: string, subject: string },
    format: 'pdf' | 'doc' = 'doc'
) {
    const supabase = createClient();
    const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession()
    ]);
    
    if (!user || !session || !session.provider_token) {
        return { success: false, error: "Sesi Google tidak aktif. Harap login ulang." };
    }

    const providerToken = session.provider_token;
    const userId = user.id;

    try {
        let { data: integration } = await supabase
            .from('google_drive_integrations')
            .select('folder_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (!integration?.folder_id) {
            const setup = await setupGoogleDriveFolder();
            if (!setup.success) return setup;
            integration = { folder_id: setup.folder_id! };
        }

        // Tentukan path folder berjenjang sesuai PRD V2.2
        const path = ['Bank Soal', metadata.jenjang, `Kelas ${metadata.class}`, metadata.subject];
        const targetFolderId = await getOrCreateRecursiveFolder(providerToken, integration.folder_id!, path);

        const mimeType = format === 'doc' ? 'application/vnd.google-apps.document' : 'application/pdf';
        const fileExtension = format === 'doc' ? '' : '.pdf';
        
        const fileMetadata = {
            name: title + fileExtension,
            mimeType: mimeType,
            parents: [targetFolderId]
        };

        const boundary = '-------LakuKelasBinaryBoundary';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        let body;
        if (format === 'pdf') {
            body = 
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(fileMetadata) +
                delimiter +
                'Content-Type: application/pdf\r\n' +
                'Content-Transfer-Encoding: base64\r\n\r\n' +
                content +
                close_delim;
        } else {
            body = 
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(fileMetadata) +
                delimiter +
                'Content-Type: text/markdown; charset=UTF-8\r\n\r\n' +
                content +
                close_delim;
        }

        const driveResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: body,
        });

        if (!driveResponse.ok) {
            const err = await driveResponse.json();
            return { success: false, error: err.error?.message || "Gagal upload ke Drive." };
        }

        const fileData = await driveResponse.json();

        // Simpan metadata ke tabel repository
        await supabase.from('ai_documents').insert({
            user_id: userId,
            document_type: 'naskah_ujian',
            title: title,
            class_level: metadata.class,
            subject: metadata.subject,
            drive_file_id: fileData.id,
            drive_file_url: format === 'doc' 
                ? `https://docs.google.com/document/d/${fileData.id}/edit`
                : `https://drive.google.com/file/d/${fileData.id}/view`,
            drive_folder_id: targetFolderId,
            mime_type: mimeType,
            status: 'created'
        });

        revalidatePath('/dashboard/ai-pembelajaran/naskah-soal');
        return { 
            success: true, 
            file_url: format === 'doc' 
                ? `https://docs.google.com/document/d/${fileData.id}/edit`
                : `https://drive.google.com/file/d/${fileData.id}/view` 
        };

    } catch (error: any) {
        console.error("[DRIVE_NASKAH_ERR]", error);
        return { success: false, error: error.message || "Gagal menyimpan naskah ke Drive." };
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

export async function createTestDocument() {
    const supabase = createClient();
    const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession()
    ]);
    
    if (!user || !session || !session.provider_token) {
        return { success: false, error: "Sesi Google tidak aktif. Harap login ulang." };
    }

    const providerToken = session.provider_token;

    try {
        const { data: integration } = await supabase
            .from('google_drive_integrations')
            .select('folder_id')
            .eq('user_id', user.id)
            .single();

        if (!integration?.folder_id) return { success: false, error: "Folder belum siap." };

        const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: "Uji_Coba_LakuKelas.txt",
                mimeType: 'text/plain',
                parents: [integration.folder_id],
                description: 'Berhasil!'
            }),
        });

        if (!driveResponse.ok) return { success: false, error: "Upload gagal." };
        const fileData = await driveResponse.json();
        return { success: true, message: "Berhasil!", file_url: `https://drive.google.com/file/d/${fileData.id}/view` };
    } catch (e) {
        return { success: false, error: "Gagal." };
    }
}

export async function saveAiDocumentToDrive(title: string, content: string, type: string) {
    return saveNaskahToDrive(title, content, { jenjang: 'Umum', class: 'Umum', subject: 'Dokumen AI' }, 'doc');
}
