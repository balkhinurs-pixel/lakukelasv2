
import { getSchoolYears } from "@/lib/data";
import SchoolYearPageComponent from "./school-year-page-component";

export default async function SchoolYearPage() {
    const { schoolYears, activeSchoolYearId } = await getSchoolYears();
    
    return <SchoolYearPageComponent 
        initialSchoolYears={schoolYears}
        initialActiveSchoolYearId={activeSchoolYearId}
    />;
}
