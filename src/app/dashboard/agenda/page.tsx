import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";

async function getIndonesianHolidays() {
    const nowIndo = getIndonesianTime();
    const year = nowIndo.getFullYear();
    
    const fetchFromSource = async (url: string) => {
        try {
            const res = await fetch(url, { 
                next: { revalidate: 86400 },
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) return null;
            const data = await res.json();
            // Handle both { data: [] } and []
            return Array.isArray(data) ? data : (data.data || null);
        } catch (error) {
            return null;
        }
    };

    try {
        // Coba beberapa sumber API populer
        const sources = [
            `https://api-hari-libur.vercel.app/api?year=${year}`,
            `https://day-off-api.vercel.app/api?year=${year}`,
        ];

        let allData: any[] = [];
        
        for (const source of sources) {
            const data = await fetchFromSource(source);
            if (data && Array.isArray(data) && data.length > 0) {
                allData = data;
                break; 
            }
        }

        // Mapping data agar kompatibel dengan berbagai format field API
        return allData.map((h: any) => ({
            date: h.date || h.holiday_date || h.tanggal,
            name: h.name || h.holiday_name || h.keterangan || h.event,
            is_holiday: h.is_holiday !== undefined ? h.is_holiday : true
        })).filter(h => !!h.date && !!h.name);
        
    } catch (error) {
        console.error("Critical failure fetching holidays:", error);
        return [];
    }
}

export default async function AgendaPage() {
    // Ambil data dari Database (Libur Sekolah) dan API (Libur Nasional)
    const [agendas, dbHolidays, apiHolidays] = await Promise.all([
        getAgendas(),
        getHolidays(),
        getIndonesianHolidays()
    ]);

    // Gabungkan keduanya
    const combinedHolidays = [
        ...apiHolidays,
        ...dbHolidays.map(h => ({
            date: h.date,
            name: h.description,
            is_holiday: true
        }))
    ];

    return <AgendaPageClient initialAgendas={agendas} indonesianHolidays={combinedHolidays} />;
}
