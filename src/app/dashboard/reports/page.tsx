import { getClasses, getSubjects, getReportsData, getUserProfile } from "@/lib/data";
import ReportsPageComponent from "./reports-page-component";
import type { Profile } from "@/lib/types";

export default async function ReportsPage() {
    const [classes, subjects, reportsData, profile] = await Promise.all([
        getClasses(),
        getSubjects(),
        getReportsData(),
        getUserProfile()
    ]);

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
        reportsData={reportsData}
        profile={profile}
    />;
}
