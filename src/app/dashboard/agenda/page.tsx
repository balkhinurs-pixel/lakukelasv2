
import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";

export default async function AgendaPage() {
    // Halaman agenda sekarang murni membaca dari database untuk kecepatan maksimal.
    // Sinkronisasi libur nasional dilakukan secara manual oleh Admin di menu Pengaturan.

    const [agendas, dbHolidays] = await Promise.all([
        getAgendas(),
        getHolidays()
    ]);

    const combinedHolidays = dbHolidays.map(h => ({
        date: h.date,
        name: h.description,
        type: h.type as 'national' | 'school',
        is_holiday: true
    }));

    return (
        <AgendaPageClient 
            initialAgendas={agendas} 
            indonesianHolidays={combinedHolidays} 
        />
    );
}
