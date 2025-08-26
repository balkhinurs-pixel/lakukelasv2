
import { getAllSubjects } from "@/lib/data";
import SubjectSettingsPageComponent from "./subject-settings-page";

export default async function SubjectSettingsPage() {
    const subjects = await getAllSubjects();
    return <SubjectSettingsPageComponent initialSubjects={subjects} />;
}
