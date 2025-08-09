
import { getClasses } from "@/lib/data";
import PromotionPageClient from './promotion-page-client';

export default async function PromotionPage() {
    const classes = await getClasses();
    return <PromotionPageClient classes={classes} />;
}

    