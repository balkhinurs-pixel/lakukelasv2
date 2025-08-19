
import { ClassSettingsPageComponent } from "./class-settings-page";
import { getClasses } from "@/lib/data";

export default async function ClassSettingsPage() {
    const classes = await getClasses();
    return <ClassSettingsPageComponent initialClasses={classes} />;
}
