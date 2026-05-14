
import { getAgendas } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";

async function getIndonesianHolidays() {
    try {
        const year = new Date().getFullYear();
        const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
            next: { revalidate: 86400 } // Cache for 24 hours
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch holidays:", error);
        return [];
    }
}

export default async function AgendaPage() {
    const [agendas, holidays] = await Promise.all([
        getAgendas(),
        getIndonesianHolidays()
    ]);

    // Map API structure to a simpler internal format
    const formattedHolidays = Array.isArray(holidays) ? holidays.map((h: any) => ({
        date: h.holiday_date,
        name: h.holiday_name,
        is_holiday: true
    })) : [];

    return <AgendaPageClient initialAgendas={agendas} indonesianHolidays={formattedHolidays} />;
}
