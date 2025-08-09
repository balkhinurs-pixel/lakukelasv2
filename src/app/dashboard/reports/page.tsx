import { getClasses, getSubjects, getReportsData } from "@/lib/data";
import ReportsPageComponent from "./reports-page-component";

export default async function ReportsPage() {
    const [classes, subjects, reportsData] = await Promise.all([
        getClasses(),
        getSubjects(),
        getReportsData()
    ]);

    if (!reportsData) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Tidak dapat memuat data laporan. Pastikan Anda sudah login.
            </div>
        )
    }

    return <ReportsPageComponent 
        classes={classes} 
        subjects={subjects} 
        reportsData={reportsData}
    />;
}
