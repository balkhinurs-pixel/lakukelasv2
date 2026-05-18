
import { createClient } from "@/lib/supabase/server";
import BankSoalClient from "./bank-soal-client";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

export default async function BankSoalPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Akses ditolak.</div>;

    // Ambil data soal milik guru tersebut
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

    const qList = questions || [];

    // Ambil daftar unik untuk filter
    const subjects = Array.from(new Set(qList.map(q => q.subject))).sort();
    const classes = Array.from(new Set(qList.map(q => q.kelas))).sort((a,b) => Number(a) - Number(b));
    const topics = Array.from(new Set(qList.map(q => q.topic))).sort();

    return (
        <div className="space-y-8 p-1">
            <HandWrittenTitle 
                title="Bank Soal AI" 
                subtitle="Manajemen Aset"
                className="py-4 md:py-6"
            />

            <BankSoalClient 
                initialQuestions={qList} 
                uniqueSubjects={subjects}
                uniqueClasses={classes}
                uniqueTopics={topics}
            />
        </div>
    );
}
