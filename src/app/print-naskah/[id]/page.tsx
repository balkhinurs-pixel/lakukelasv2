import { createClient } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/data";
import { redirect } from "next/navigation";
import PrintSoalView from "./print-soal-view";
import PrintLjkView from "./print-ljk-view";

/**
 * Halaman Cetak Terisolasi Total (V73.0)
 * Memisahkan perenderan berdasarkan 'mode' untuk isolasi tata letak yang sempurna.
 */
export default async function NaskahPrintPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ mode?: string }> }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // 1. Ambil Detail Naskah
    const { data: doc } = await supabase
        .from('ai_documents')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!doc) return <div className="p-10 text-center font-bold text-rose-600">Naskah tidak ditemukan di database.</div>;

    // 2. Ambil Butir Soal Mentah
    const { data: rawQuestions } = await supabase
        .from('questions')
        .select('*')
        .in('id', doc.question_ids || []);

    // 3. Urutkan kembali hasil query agar SAMA PERSIS dengan urutan question_ids di naskah
    const questions = doc.question_ids?.map(id => rawQuestions?.find(q => q.id === id)).filter(Boolean) || [];

    // 4. Ambil Profil Sekolah untuk Kop Surat
    const schoolProfile = await getAdminProfile();

    const mode = searchParams.mode || 'soal';

    // RENDER LJK (RIGID ABSOLUTE)
    if (mode === 'ljk') {
        return <PrintLjkView doc={doc} questions={questions} schoolProfile={schoolProfile} />;
    }

    // RENDER SOAL / KUNCI (FLOWING)
    return (
        <PrintSoalView 
            doc={doc} 
            questions={questions} 
            schoolProfile={schoolProfile} 
            isKunci={mode === 'kunci'} 
        />
    );
}
