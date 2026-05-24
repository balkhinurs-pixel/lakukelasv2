import { createClient } from "@/lib/supabase/server";
import CpAtpRepositoryClient from "./cp-atp-repository-client";
import { getAdminProfile } from "@/lib/data";

export default async function ArsipCpAtpPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Akses ditolak.</div>;

    // Ambil daftar dokumen pemetaan kurikulum CP/ATP dan profil sekolah
    const [docsRes, schoolProfile] = await Promise.all([
        supabase
            .from('cp_atp')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        getAdminProfile()
    ]);

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Premium Gradient Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 blur-2xl rounded-full -ml-10 -mb-10" />
                
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                            Daftar CP & ATP
                        </h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">
                            Master Kurikulum
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section with matched padding */}
            <div className="px-4 sm:px-6 lg:px-10">
                <CpAtpRepositoryClient initialDocuments={docsRes.data || []} schoolProfile={schoolProfile} />
            </div>
        </div>
    );
}
