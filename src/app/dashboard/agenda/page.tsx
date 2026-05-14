
import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";

async function syncNationalHolidays() {
    const nowIndo = getIndonesianTime();
    const currentYear = nowIndo.getFullYear();
    // Sinkronisasi tahun ini dan tahun depan
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
                next: { revalidate: 86400 } // Cache selama 24 jam
            });

            if (res.ok) {
                const responseData = await res.json();
                
                // API ini mengirimkan data dalam responseData.data (berdasarkan screenshot user)
                const rawList = Array.isArray(responseData) ? responseData : (responseData.data || []);
                
                if (Array.isArray(rawList)) {
                    const newHolidays = rawList
                        .map((h: any) => ({
                            date: h.date || h.holiday_date || h.tanggal,
                            description: h.description || h.name || h.holiday_name || h.keterangan || h.event
                        }))
                        .filter(h => h.date && h.description && !existingDates.has(h.date));

                    if (newHolidays.length > 0) {
                        console.log(`[SYNC] Menambahkan ${newHolidays.length} hari libur nasional baru ke database untuk tahun ${year}`);
                        await supabase.from('holidays').insert(newHolidays);
                    }
                }
            }
        }
    } catch (error) {
        console.error("[SYNC-ERROR] Gagal sinkronisasi hari libur nasional:", error);
    }
}

export default async function AgendaPage() {
    // Jalankan sinkronisasi (Data akan masuk ke tabel holidays)
    await syncNationalHolidays();

    // Ambil data terbaru dari Database (Internal + Hasil Sync API)
    const [agendas, dbHolidays] = await Promise.all([
        getAgendas(),
        getHolidays()
    ]);

    // Format data untuk dikirim ke client component
    const combinedHolidays = dbHolidays.map(h => ({
        date: h.date,
        name: h.description,
        is_holiday: true
    }));

    return <AgendaPageClient initialAgendas={agendas} indonesianHolidays={combinedHolidays} />;
}
