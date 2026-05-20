import { getClasses, getSubjects, getGoogleDriveIntegration } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import GenerateCpAtpClient from "./generate-cp-atp-client";

export default async function GenerateCpAtpPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [classes, subjects, driveIntegration] = await Promise.all([
        getClasses(),
        getSubjects(),
        getGoogleDriveIntegration()
    ]);

    return (
        <div className="p-0">
            <GenerateCpAtpClient 
                classes={classes} 
                subjects={subjects}
                driveIntegration={driveIntegration}
                userProvider={user?.app_metadata?.provider}
            />
        </div>
    );
}
