import { getClasses, getSubjects, getGoogleDriveIntegration } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import ModulAjarClient from "./modul-ajar-client";

export default async function ModulAjarPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Ambil data dasar dan daftar CP/ATP untuk referensi
    const [classes, subjects, driveIntegration, atpDocsRes] = await Promise.all([
        getClasses(),
        getSubjects(),
        getGoogleDriveIntegration(),
        supabase
            .from('cp_atp')
            .select('id, title, subject, phase, class_level')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
    ]);

    return (
        <div className="p-0">
            <ModulAjarClient 
                classes={classes} 
                subjects={subjects}
                driveIntegration={driveIntegration}
                userProvider={user?.app_metadata?.provider}
                atpDocuments={atpDocsRes.data || []}
            />
        </div>
    );
}
