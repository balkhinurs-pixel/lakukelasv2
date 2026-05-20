import { getClasses, getSubjects, getGoogleDriveIntegration } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import ModulAjarClient from "./modul-ajar-client";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

export default async function ModulAjarPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [classes, subjects, driveIntegration] = await Promise.all([
        getClasses(),
        getSubjects(),
        getGoogleDriveIntegration()
    ]);

    return (
        <div className="space-y-8 p-1">
            <HandWrittenTitle 
                title="Modul Ajar (RPP)" 
                subtitle="Kurikulum Merdeka"
                className="py-4 md:py-6"
            />

            <ModulAjarClient 
                classes={classes} 
                subjects={subjects}
                driveIntegration={driveIntegration}
                userProvider={user?.app_metadata?.provider}
            />
        </div>
    );
}
