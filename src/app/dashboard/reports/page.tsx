import { getClasses, getSubjects, getReportsData, getUserProfile, getSchoolYears } from "@/lib/data";
import ReportsPageComponent from "./reports-page-component";
import type { Profile } from "@/lib/types";

export default async function ReportsPage() {
    const [classes, subjects, profile, { schoolYears }] = await Promise.all([
        getClasses(),
        getSubjects(),
        getUserProfile(),
        getSchoolYears()
    ]);
    
    // Initial data load for the active school year
    const reportsData = await getReportsData(profile?.active_school_year_id);

    if (!reportsData || !profile) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Tidak dapat memuat data laporan. Pastikan Anda sudah login dan profil Anda ada.
            </div>
        )
    }

    return <ReportsPageComponent 
        classes={classes} 
        subjects={subjects} 
        schoolYears={schoolYears}
        reportsData={reportsData}
        profile={profile}
    />;
}
