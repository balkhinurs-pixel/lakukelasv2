import { createClient } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/data";
import { redirect } from "next/navigation";
import PrintView from "./print-view";

/**
 * Halaman Cetak Terisolasi Total (V43.0)
 * Berada di luar folder dashboard agar tidak mewarisi komponen navigasi.
 */
export default async function NaskahPrintPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ mode?: string }> }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch Naskah Details
    const { data: doc } = await supabase
        .from('ai_documents')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!doc) return <div className="p-10 text-center font-bold">Naskah tidak ditemukan.</div>;

    // Fetch Questions
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .in('id', doc.question_ids || [])
        .order('sort_order', { ascending: true });

    // Fetch School Profile for Kop Surat (Admin data)
    const schoolProfile = await getAdminProfile();

    return (
        <PrintView 
            doc={doc} 
            questions={questions || []} 
            schoolProfile={schoolProfile}
            mode={(searchParams.mode as any) || 'soal'}
        />
    );
}
