import { getClasses, getSubjects } from "@/lib/data";
import GenerateSoalClient from "./generate-soal-client";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

export default async function GenerateSoalPage() {
    const [classes, subjects] = await Promise.all([
        getClasses(),
        getSubjects(),
    ]);

    return (
        <div className="space-y-8 p-1">
            <HandWrittenTitle 
                title="Generate Soal" 
                subtitle="AI Question Engine"
                className="py-4 md:py-6"
            />

            <GenerateSoalClient classes={classes} subjects={subjects} />
        </div>
    );
}