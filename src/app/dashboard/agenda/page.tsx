
import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";

/**
 * Fungsi untuk mensinkronisasi hari libur nasional dari API ke Database.
 * Dilengkapi dengan deteksi tipe 'national' untuk memisahkan dengan libur sekolah.
 */
async function syncNationalHolidays() {
    const nowIndo = getIndonesianTime();
    const currentYear = nowIndo.getFullYear();
    const yearsToSync = [currentYear, currentYear + 1];
    const supabase = createClient();

    try {
        // 1. Ambil semua tanggal libur yang sudah terdaftar
        const { data: existingHolidays } = await supabase
            .from('holidays')
            .select('date');
        
        const existingDates = new Set(existingHolidays?.map(h => h.date) || []);

        for (const year of yearsToSync) {
            // Gunakan API resmi Vercel Nasional
            const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
                next: { revalidate: 86400 } // Revalidasi harian
            });

            if (res.ok) {
                const responseData = await res.json();
                // Mengambil data dari properti 'data' sesuai struktur API
                const rawList = responseData.data || [];
                
                if (Array.isArray(rawList)) {
                    const newHolidays = rawList
                        .map((h: any) => ({
                            date: h.date || h.holiday_date,
                            description: h.description || h.name || h.holiday_name,
                            type: 'national' // Ditandai sebagai libur nasional
                        }))
                        .filter(h => h.date && h.description && !existingDates.has(h.date));

                    if (newHolidays.length > 0) {
                        console.log(`[SYNC] Menambahkan ${newHolidays.length} libur nasional baru tahun ${year}`);
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
    // Jalankan sinkronisasi background di server
    await syncNationalHolidays();

    const [agendas, dbHolidays] = await Promise.all([
        getAgendas(),
        getHolidays() // Sekarang mengembalikan semua tipe libur (national & school)
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
