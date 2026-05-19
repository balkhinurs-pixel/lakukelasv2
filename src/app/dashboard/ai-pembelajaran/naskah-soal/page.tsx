
import { createClient } from "@/lib/supabase/server";
import NaskahRepositoryClient from "./naskah-repository-client";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

export default async function NaskahSoalPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Akses ditolak.</div>;

    // Ambil daftar naskah yang sudah pernah diekspor
    const { data: documents } = await supabase
        .from('ai_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_type', 'naskah_ujian')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8 p-1 pb-20">
            <HandWrittenTitle 
                title="Daftar Naskah Soal" 
                subtitle="Repository Dokumen"
                className="py-4 md:py-6"
            />

            <NaskahRepositoryClient initialDocuments={documents || []} />
        </div>
    );
}
