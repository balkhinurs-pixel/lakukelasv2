
import { getAllClasses, getActiveStudents } from "@/lib/data";
import PromotionPageClient from './promotion-page-client';

export default async function PromotionPage() {
    const [classes, allStudents] = await Promise.all([
        getAllClasses(),
        getActiveStudents(),
    ]);

    return <PromotionPageClient classes={classes} allStudents={allStudents} />;
}

