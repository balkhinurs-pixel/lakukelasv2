
import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";

/**
 * Fungsi untuk mensinkronisasi hari libur nasional dari API ke Database.
 * Menggunakan pengecekan tanggal untuk menghindari duplikasi data.
 */
async function syncNationalHolidays() {
    const nowIndo = getIndonesianTime();
    const currentYear = nowIndo.getFullYear();
    // Sinkronisasi tahun ini dan tahun depan agar perencanaan jangka panjang akurat
    const yearsToSync = [currentYear, currentYear + 1];
    const supabase = createClient();

    try {
        // 1. Ambil data tanggal libur yang sudah ada di DB untuk menghindari duplikasi
        const { data: existingHolidays } = await supabase
            .from('holidays')
            .select('date');
        
        const existingDates = new Set(existingHolidays?.map(h => h.date) || []);

        for (const year of yearsToSync) {
            const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
                next: { revalidate: 86400 } // Revalidasi setiap 24 jam
            });

            if (res.ok) {
                const responseData = await res.json();
                
                // Mendukung format array langsung atau objek yang dibungkus properti 'data'
                const rawList = Array.isArray(responseData) ? responseData : (responseData.data || []);
                
                if (Array.isArray(rawList)) {
                    // Filter hanya data yang belum ada di database kita
                    const newHolidays = rawList
                        .map((h: any) => ({
                            date: h.date || h.holiday_date || h.tanggal,
                            description: h.description || h.name || h.holiday_name || h.keterangan || h.event
                        }))
                        .filter(h => h.date && h.description && !existingDates.has(h.date));

                    if (newHolidays.length > 0) {
                        console.log(`[SYNC] Menambahkan ${newHolidays.length} hari libur baru ke DB untuk tahun ${year}`);
                        // Insert kolektif ke database
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
    // Jalankan proses sinkronisasi otomatis sebelum merender halaman
    await syncNationalHolidays();

    // Ambil data terbaru dari Database (Kombinasi Input Admin + Hasil Auto-Sync API)
    const [agendas, dbHolidays] = await Promise.all([
        getAgendas(),
        getHolidays()
    ]);

    // Format data hari libur untuk dikirim ke komponen client
    const combinedHolidays = dbHolidays.map(h => ({
        date: h.date,
        name: h.description,
        is_holiday: true
    }));

    return (
        <AgendaPageClient 
            initialAgendas={agendas} 
            indonesianHolidays={combinedHolidays} 
        />
    );
}
