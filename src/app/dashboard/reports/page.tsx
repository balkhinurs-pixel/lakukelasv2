import { getClasses, getSubjects, getJournalEntries } from "@/lib/data";
import ReportsPageComponent from "./reports-page-component";

export default async function ReportsPage() {
    const [classes, subjects, journalEntries] = await Promise.all([
        getClasses(),
        getSubjects(),
        getJournalEntries()
    ]);

    return <ReportsPageComponent 
        classes={classes} 
        subjects={subjects} 
        journalEntries={journalEntries} 
    />;
}
