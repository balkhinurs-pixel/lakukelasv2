
import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";

async function getIndonesianHolidays() {
    const nowIndo = getIndonesianTime();
    const currentYear = nowIndo.getFullYear();
    
    // Kita ambil data untuk 3 tahun: tahun ini, tahun depan, dan tahun berikutnya
    // Ini penting karena user sering mengetes input untuk tahun depan (misal: 2026)
    const yearsToFetch = [currentYear, currentYear + 1, currentYear + 2];
    
    const fetchFromSource = async (url: string) => {
        try {
            const res = await fetch(url, { 
                next: { revalidate: 86400 }, // Cache 24 jam
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) return null;
            const data = await res.json();
            return Array.isArray(data) ? data : (data.data || null);
        } catch (error) {
            return null;
        }
    };

    try {
        let allHolidays: any[] = [];
        
        for (const year of yearsToFetch) {
            const sources = [
                `https://api-hari-libur.vercel.app/api?year=${year}`,
                `https://day-off-api.vercel.app/api?year=${year}`,
            ];

            for (const source of sources) {
                const data = await fetchFromSource(source);
                if (data && Array.isArray(data) && data.length > 0) {
                    // Mapping data agar kompatibel dengan berbagai format field API
                    const mapped = data.map((h: any) => ({
                        date: h.date || h.holiday_date || h.tanggal,
                        name: h.name || h.holiday_name || h.keterangan || h.event,
                        is_holiday: h.is_holiday !== undefined ? h.is_holiday : true
                    })).filter(h => !!h.date && !!h.name);
                    
                    allHolidays = [...allHolidays, ...mapped];
                    break; // Jika satu sumber berhasil untuk tahun ini, lanjut ke tahun berikutnya
                }
            }
        }

        return allHolidays;
        
    } catch (error) {
        console.error("Critical failure fetching holidays:", error);
        return [];
    }
}

export default async function AgendaPage() {
    // Ambil data dari Database (Agenda Guru, Libur Sekolah) dan API (Libur Nasional)
    const [agendas, dbHolidays, apiHolidays] = await Promise.all([
        getAgendas(),
        getHolidays(),
        getIndonesianHolidays()
    ]);

    // Gabungkan hari libur dari Database Admin dan API Nasional
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
