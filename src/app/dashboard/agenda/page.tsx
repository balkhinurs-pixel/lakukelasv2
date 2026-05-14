
import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";

async function syncNationalHolidays() {
    const nowIndo = getIndonesianTime();
    const currentYear = nowIndo.getFullYear();
    const yearsToSync = [currentYear, currentYear + 1];
    const supabase = createClient();

    try {
        // 1. Ambil data yang sudah ada di DB untuk menghindari duplikasi
        const { data: existingHolidays } = await supabase
            .from('holidays')
            .select('date');
        
        const existingDates = new Set(existingHolidays?.map(h => h.date) || []);

        for (const year of yearsToSync) {
            const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
                next: { revalidate: 86400 }
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const newHolidays = data
                        .map((h: any) => ({
                            date: h.date || h.holiday_date || h.tanggal,
                            description: h.name || h.holiday_name || h.keterangan || h.event
                        }))
                        .filter(h => h.date && h.description && !existingDates.has(h.date));

                    if (newHolidays.length > 0) {
                        console.log(`[SYNC] Menambahkan ${newHolidays.length} hari libur baru untuk tahun ${year}`);
                        await supabase.from('holidays').insert(newHolidays);
                    }
                }
            }
        }
    } catch (error) {
        console.error("[SYNC-ERROR] Gagal sinkronisasi hari libur:", error);
    }
}

export default async function AgendaPage() {
    // Jalankan sinkronisasi di background (tidak menunggu selesai agar page load tetap cepat)
    syncNationalHolidays();

    // Ambil data dari Database (Sudah termasuk yang barusan disinkronkan)
    const [agendas, dbHolidays] = await Promise.all([
        getAgendas(),
        getHolidays()
    ]);

    // Format data untuk dikirim ke client
    const combinedHolidays = dbHolidays.map(h => ({
        date: h.date,
        name: h.description,
        is_holiday: true
    }));

    return <AgendaPageClient initialAgendas={agendas} indonesianHolidays={combinedHolidays} />;
}
