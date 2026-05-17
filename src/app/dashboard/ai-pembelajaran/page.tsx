import { getClasses, getSubjects, getUserProfile } from "@/lib/data";
import AiPembelajaranClient from "./ai-client-page";
import { redirect } from "next/navigation";

export default async function AiPembelajaranPage() {
    const [classes, subjects, profile] = await Promise.all([
        getClasses(),
        getSubjects(),
        getUserProfile()
    ]);

    if (!profile) {
        redirect('/login');
    }

    return (
        <AiPembelajaranClient 
            classes={classes}
            subjects={subjects}
            profile={profile}
        />
    );
}
