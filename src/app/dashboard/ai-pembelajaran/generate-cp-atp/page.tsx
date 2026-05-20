import { getClasses, getSubjects, getGoogleDriveIntegration, getAdminProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import GenerateCpAtpClient from "./generate-cp-atp-client";

export default async function GenerateCpAtpPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [classes, subjects, driveIntegration, schoolProfile] = await Promise.all([
        getClasses(),
        getSubjects(),
        getGoogleDriveIntegration(),
        getAdminProfile()
    ]);

    return (
        <div className="p-0">
            <GenerateCpAtpClient 
                classes={classes} 
                subjects={subjects}
                driveIntegration={driveIntegration}
                userProvider={user?.app_metadata?.provider}
                schoolProfile={schoolProfile}
            />
        </div>
    );
}
