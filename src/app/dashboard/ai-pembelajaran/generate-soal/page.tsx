import { getClasses, getSubjects } from "@/lib/data";
import GenerateSoalClient from "./generate-soal-client";

export default async function GenerateSoalPage() {
    const [classes, subjects] = await Promise.all([
        getClasses(),
        getSubjects(),
    ]);

    return (
        <GenerateSoalClient classes={classes} subjects={subjects} />
    );
}
