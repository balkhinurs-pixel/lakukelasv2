import { createClient } from "@/lib/supabase/server";
import CpAtpRepositoryClient from "./cp-atp-repository-client";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

export default async function ArsipCpAtpPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Akses ditolak.</div>;

    // Ambil daftar dokumen pemetaan kurikulum CP/ATP
    const { data: documents } = await supabase
        .from('cp_atp')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8 p-1 pb-20">
            <HandWrittenTitle 
                title="Daftar CP & ATP" 
                subtitle="Master Kurikulum"
                className="py-4 md:py-6"
            />

            <CpAtpRepositoryClient initialDocuments={documents || []} />
        </div>
    );
}