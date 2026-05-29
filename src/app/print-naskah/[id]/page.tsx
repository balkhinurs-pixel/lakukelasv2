import { createClient } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/data";
import { redirect } from "next/navigation";
import PrintView from "./print-view";

/**
 * Halaman Cetak Terisolasi Total (V47.0)
 * Menangani pengambilan data dengan mempertahankan urutan question_ids dari manifest.
 */
export default async function NaskahPrintPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ mode?: string }> }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // 1. Ambil Detail Naskah (Manifest)
    const { data: doc } = await supabase
        .from('ai_documents')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!doc) return <div className="p-10 text-center font-bold">Naskah tidak ditemukan.</div>;

    // 2. Ambil Butir Soal Mentah
    const { data: rawQuestions } = await supabase
        .from('questions')
        .select('*')
        .in('id', doc.question_ids || []);

    // 3. PENTING: Urutkan kembali hasil query agar SAMA PERSIS dengan urutan question_ids di naskah
    const questions = doc.question_ids?.map(id => rawQuestions?.find(q => q.id === id)).filter(Boolean) || [];

    // 4. Ambil Profil Sekolah untuk Kop Surat
    const schoolProfile = await getAdminProfile();

    return (
        <PrintView 
            doc={doc} 
            questions={questions} 
            schoolProfile={schoolProfile}
            mode={(searchParams.mode as any) || 'soal'}
        />
    );
}
