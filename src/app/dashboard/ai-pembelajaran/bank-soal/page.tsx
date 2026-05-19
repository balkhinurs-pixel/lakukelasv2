
import { createClient } from "@/lib/supabase/server";
import { getAdminProfile, getActiveSchoolYearName, getGoogleDriveIntegration } from "@/lib/data";
import BankSoalClient from "./bank-soal-client";

export default async function BankSoalPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Akses ditolak.</div>;

    // Ambil data soal, profil sekolah, tahun ajaran aktif, dan integrasi drive secara bersamaan
    const [questionsRes, schoolProfile, activeYearName, driveIntegration] = await Promise.all([
        supabase
            .from('questions')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false }),
        getAdminProfile(),
        getActiveSchoolYearName(),
        getGoogleDriveIntegration()
    ]);

    const qList = questionsRes.data || [];

    // --- Helper Normalisasi untuk Filter ---
    const getUniqueNormalized = (arr: string[]) => {
        const uniqueMap = new Map<string, string>();
        arr.forEach(val => {
            if (!val) return;
            const trimmed = val.trim();
            const lower = trimmed.toLowerCase();
            if (!uniqueMap.has(lower)) {
                const pretty = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                uniqueMap.set(lower, pretty);
            }
        });
        return Array.from(uniqueMap.values()).sort();
    };

    const subjects = getUniqueNormalized(qList.map(q => q.subject));
    const topics = getUniqueNormalized(qList.map(q => q.topic));
    const classes = Array.from(new Set(qList.map(q => q.kelas))).sort((a,b) => Number(a) - Number(b));

    return (
        <div className="p-0">
            <BankSoalClient 
                initialQuestions={qList} 
                uniqueSubjects={subjects}
                uniqueClasses={classes}
                uniqueTopics={topics}
                schoolProfile={schoolProfile}
                activeSchoolYearName={activeYearName}
                driveIntegration={driveIntegration}
                userProvider={user.app_metadata?.provider}
            />
        </div>
    );
}
