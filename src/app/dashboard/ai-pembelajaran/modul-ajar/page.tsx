import { getClasses, getSubjects, getGoogleDriveIntegration } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import ModulAjarClient from "./modul-ajar-client";

export default async function ModulAjarPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [classes, subjects, driveIntegration] = await Promise.all([
        getClasses(),
        getSubjects(),
        getGoogleDriveIntegration()
    ]);

    return (
        <div className="p-0">
            <ModulAjarClient 
                classes={classes} 
                subjects={subjects}
                driveIntegration={driveIntegration}
                userProvider={user?.app_metadata?.provider}
            />
        </div>
    );
}
