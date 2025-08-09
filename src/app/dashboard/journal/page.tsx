import { getJournalEntries, getClasses, getSubjects } from "@/lib/data";
import JournalPageComponent from "./journal-page-component";

export default async function JournalPage() {
    const [journalEntries, classes, subjects] = await Promise.all([
        getJournalEntries(),
        getClasses(),
        getSubjects()
    ]);
    return <JournalPageComponent initialJournalEntries={journalEntries} classes={classes} subjects={subjects} />;
}
