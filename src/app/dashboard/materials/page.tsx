import { getMaterials, getClasses, getSubjects } from "@/lib/data";
import MaterialsPageClient from "./materials-page-client";

export default async function MaterialsPage() {
    const [materials, classes, subjects] = await Promise.all([
        getMaterials(),
        getClasses(),
        getSubjects(),
    ]);
    
    return (
        <MaterialsPageClient 
            initialMaterials={materials} 
            classes={classes} 
            subjects={subjects} 
        />
    );
}
