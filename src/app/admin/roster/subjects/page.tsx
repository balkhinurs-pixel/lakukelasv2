
import { getSubjects } from "@/lib/data";
import SubjectSettingsPageComponent from "./subject-settings-page";

export default async function SubjectSettingsPage() {
    const subjects = await getSubjects();
    return <SubjectSettingsPageComponent initialSubjects={subjects} />;
}
