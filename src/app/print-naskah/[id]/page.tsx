
import { createClient } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/data";
import { redirect } from "next/navigation";
import PrintSoalView from "./print-soal-view";
import PrintLjkView from "./print-ljk-view";

/**
 * Halaman Cetak Terisolasi (V132 - Enhanced Class Name Fetching)
 */
export default async function NaskahPrintPage(props: { 
    params: Promise<{ id: string }>, 
    searchParams: Promise<{ mode?: string }> 
}) {
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

    if (!doc) return <div className="p-10 text-center font-bold text-rose-600">Naskah tidak ditemukan.</div>;

    // 2. Ambil Butir Soal
    const { data: rawQuestions } = await supabase
        .from('questions')
        .select('*')
        .in('id', doc.question_ids || []);

    const questions = doc.question_ids?.map(id => rawQuestions?.find(q => q.id === id)).filter(Boolean) || [];

    // 3. Ambil Nama Kelas yang Sebenarnya
    let actualClassName = doc.class_level || "Umum";
    if (doc.class_level && doc.class_level.length > 20) { // Check if it looks like a UUID
        const { data: classData } = await supabase
            .from('classes')
            .select('name')
            .eq('id', doc.class_level)
            .maybeSingle();
        if (classData) actualClassName = classData.name;
    }

    // 4. Ambil Data Siswa (Personalized LJK)
    let students: any[] = [];
    if (searchParams.mode === 'ljk' && doc.class_level) {
        const { data: studentList } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', doc.class_level) 
            .eq('status', 'active')
            .order('name');
        
        students = studentList || [];
    }

    const schoolProfile = await getAdminProfile();
    const mode = searchParams.mode || 'soal';

    if (mode === 'ljk') {
        return (
            <PrintLjkView 
                doc={doc} 
                questions={questions} 
                schoolProfile={schoolProfile} 
                students={students} 
                actualClassName={actualClassName}
            />
        );
    }

    return (
        <PrintSoalView 
            doc={doc} 
            questions={questions} 
            schoolProfile={schoolProfile} 
            isKunci={mode === 'kunci'} 
            actualClassName={actualClassName}
        />
    );
}
