'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Mendapatkan atau membuat sub-folder secara rekursif.
 * Memungkinkan struktur: LakuKelas AI / [Type] / [Jenjang] / Kelas [Angka] / [Mapel]
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
    const supabase = await createClient();
    
    const { data: userData } = await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();
    
    const user = userData?.user;
    const session = sessionData?.session;
    
    if (!user || !session?.provider_token) {
        return { success: false, error: "Token akses Google tidak ditemukan. Silakan login ulang menggunakan akun Google." };
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
            if (existingIntegration.status !== 'connected') {
                await supabase.from('google_drive_integrations').update({ status: 'connected' }).eq('user_id', userId);
                revalidatePath('/dashboard/settings');
            }
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

        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard');
        
        return { success: true, folder_id: folderId, message: "Berhasil membuat folder LakuKelas AI" };
    } catch (error: any) {
        console.error("[SETUP_DRIVE_ERR]", error);
        return { success: false, error: "Terjadi kesalahan saat menyiapkan folder Drive." };
    }
}

/**
 * Server Action untuk menyimpan naskah ke Google Drive.
 */
export async function saveNaskahToDrive(
    title: string, 
    content: string, 
    metadata: { jenjang: string, class: string, subject: string },
    format: 'pdf' | 'doc' = 'doc'
) {
    return saveGenericDocumentToDrive(title, content, metadata, 'Bank Soal', format);
}

/**
 * Server Action khusus untuk menyimpan Modul Ajar (RPP) ke Google Drive.
 */
export async function saveModulAjarToDrive(
    title: string,
    content: string,
    metadata: { jenjang: string, class: string, subject: string }
) {
    return saveGenericDocumentToDrive(title, content, metadata, 'Modul Ajar', 'doc');
}

/**
 * Fungsi internal untuk menyimpan dokumen ke Drive dengan path yang ditentukan.
 */
async function saveGenericDocumentToDrive(
    title: string, 
    content: string, 
    metadata: { jenjang: string, class: string, subject: string },
    rootFolderName: 'Bank Soal' | 'Modul Ajar' | 'Dokumen AI',
    format: 'pdf' | 'doc' = 'doc'
) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();
    
    const user = userData?.user;
    const session = sessionData?.session;
    
    if (!user || !session?.provider_token) {
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

        const path = [rootFolderName, metadata.jenjang, `Kelas ${metadata.class}`, metadata.subject];
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
            body = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(fileMetadata) + delimiter + 'Content-Type: application/pdf\r\n' + 'Content-Transfer-Encoding: base64\r\n\r\n' + content + close_delim;
        } else {
            body = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(fileMetadata) + delimiter + 'Content-Type: text/markdown; charset=UTF-8\r\n\r\n' + content + close_delim;
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
            return { success: false, error: err.error?.message || "Gagal upload." };
        }

        const fileData = await driveResponse.json();

        await supabase.from('ai_documents').insert({
            user_id: userId,
            document_type: rootFolderName === 'Bank Soal' ? 'naskah_ujian' : 'rpp',
            title: title,
            class_level: metadata.class,
            subject: metadata.subject,
            drive_file_id: fileData.id,
            drive_file_url: format === 'doc' ? `https://docs.google.com/document/d/${fileData.id}/edit` : `https://drive.google.com/file/d/${fileData.id}/view`,
            drive_folder_id: targetFolderId,
            mime_type: mimeType,
            status: 'created'
        });

        revalidatePath('/dashboard/ai-pembelajaran/naskah-soal');
        revalidatePath('/dashboard/ai-pembelajaran/arsip-rpp');
        return { success: true, file_url: format === 'doc' ? `https://docs.google.com/document/d/${fileData.id}/edit` : `https://drive.google.com/file/d/${fileData.id}/view` };

    } catch (error: any) {
        return { success: false, error: error.message || "Gagal menyimpan ke Drive." };
    }
}

export async function disconnectGoogleDrive() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { error } = await supabase.from('google_drive_integrations').update({ status: 'disconnected', disconnected_at: new Date().toISOString() }).eq('user_id', user.id);
    if (error) return { success: false, error: "Gagal memutuskan integrasi." };
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function deleteAiDocumentAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    const { error } = await supabase
        .from('ai_documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { success: false, error: "Gagal menghapus data." };

    revalidatePath('/dashboard/ai-pembelajaran/naskah-soal');
    revalidatePath('/dashboard/ai-pembelajaran/arsip-rpp');
    return { success: true };
}

export async function createTestDocument() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = userData?.user;
    const session = sessionData?.session;
    if (!user || !session?.provider_token) return { success: false, error: "Sesi tidak aktif." };
    const providerToken = session.provider_token;

    try {
        const { data: integration } = await supabase.from('google_drive_integrations').select('folder_id').eq('user_id', user.id).maybeSingle();
        if (!integration?.folder_id) return { success: false, error: "Folder belum siap." };
        const driveResponse = await fetch('https://www.googleapis.com/drive/v3/files', { method: 'POST', headers: { 'Authorization': `Bearer ${providerToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: "Uji_Coba_LakuKelas.txt", mimeType: 'text/plain', parents: [integration.folder_id], description: 'Koneksi berhasil!' }) });
        if (!driveResponse.ok) return { success: false, error: "Gagal mengirim file uji coba." };
        const fileData = await driveResponse.json();
        return { success: true, message: "Koneksi Google Drive Aktif!", file_url: `https://drive.google.com/file/d/${fileData.id}/view` };
    } catch (e) { return { success: false, error: "Terjadi kesalahan sistem." }; }
}

export async function saveAiDocumentToDrive(title: string, content: string, type: string) {
    return saveGenericDocumentToDrive(title, content, { jenjang: 'Umum', class: 'Umum', subject: 'Dokumen AI' }, 'Dokumen AI', 'doc');
}
