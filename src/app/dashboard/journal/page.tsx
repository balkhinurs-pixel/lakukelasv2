
import { getJournalEntries, getClasses, getSubjects, getUserProfile, getActiveSchoolYearName } from "@/lib/data";
import JournalPageComponent from "./journal-page-component";

export default async function JournalPage() {
    const [journalEntries, classes, subjects, profile, activeSchoolYearName] = await Promise.all([
        getJournalEntries(),
        getClasses(),
        getSubjects(),
        getUserProfile(),
        getActiveSchoolYearName()
    ]);
    
    return <JournalPageComponent initialJournalEntries={journalEntries} classes={classes} subjects={subjects} activeSchoolYearName={activeSchoolYearName} />;
}
