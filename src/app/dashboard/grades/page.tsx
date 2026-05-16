
import { getGradesPageData } from "@/lib/data";
import GradesPageComponent from "./grades-page-component";
import { redirect } from "next/navigation";

export default async function GradesPage() {
    // Optimized bulk fetcher for Grades page.
    const data = await getGradesPageData();

    if (!data) {
        redirect('/login');
    }

    return <GradesPageComponent 
        classes={data.classes} 
        subjects={data.subjects} 
        initialHistory={data.history} 
        allStudents={data.allStudents} 
        activeSchoolYearName={data.activeSchoolYearName} 
    />;
}
