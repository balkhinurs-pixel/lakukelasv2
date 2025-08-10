import { getAgendas } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";


export default async function AgendaPage() {
    const agendas = await getAgendas();
    return <AgendaPageClient initialAgendas={agendas} />;
}
