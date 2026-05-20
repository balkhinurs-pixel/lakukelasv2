
import { createClient } from "@/lib/supabase/server";
import RppRepositoryClient from "./rpp-repository-client";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

export default async function ArsipRppPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Akses ditolak. Silakan login kembali.</div>;

    // Ambil daftar dokumen AI yang bertipe 'rpp'
    const { data: documents } = await supabase
        .from('ai_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_type', 'rpp')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8 p-1 pb-20">
            <HandWrittenTitle 
                title="Daftar RPP & Modul" 
                subtitle="Arsip Administrasi"
                className="py-4 md:py-6"
            />

            <RppRepositoryClient initialDocuments={documents || []} />
        </div>
    );
}
