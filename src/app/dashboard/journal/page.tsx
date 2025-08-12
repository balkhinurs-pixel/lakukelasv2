
import { getJournalEntries, getClasses, getSubjects, getUserProfile } from "@/lib/data";
import JournalPageComponent from "./journal-page-component";

export default async function JournalPage() {
    const [journalEntries, classes, subjects, profile] = await Promise.all([
        getJournalEntries(),
        getClasses(),
        getSubjects(),
        getUserProfile()
    ]);
    
    const activeSchoolYearName = profile?.active_school_year_name || "Belum Diatur";

    return <JournalPageComponent initialJournalEntries={journalEntries} classes={classes} subjects={subjects} activeSchoolYearName={activeSchoolYearName} />;
}
