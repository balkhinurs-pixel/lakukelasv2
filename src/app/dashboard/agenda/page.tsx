
import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";

/**
 * Fungsi untuk mensinkronisasi hari libur nasional dari API ke Database secara otomatis.
 * Strategi: Mengambil data tahun berjalan dan tahun depan, lalu menyimpannya ke tabel 'holidays'.
 */
async function syncNationalHolidays() {
    const nowIndo = getIndonesianTime();
    const currentYear = nowIndo.getFullYear();
    // Sinkronkan tahun ini dan tahun depan untuk perencanaan jangka panjang
    const yearsToSync = [currentYear, currentYear + 1];
    const supabase = createClient();

    try {
        for (const year of yearsToSync) {
            // Gunakan API Hari Libur Nasional Indonesia
            const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
                next: { revalidate: 86400 } // Cache selama 24 jam
            });

            if (res.ok) {
                const responseData = await res.json();
                
                // API ini terkadang mengembalikan Array langsung, terkadang Objek dengan properti 'data'
                const rawList = Array.isArray(responseData) ? responseData : (responseData.data || []);
                
                if (rawList.length > 0) {
                    // Petakan data ke format database kita
                    const newHolidays = rawList.map((h: any) => ({
                        date: h.date || h.holiday_date,
                        description: h.name || h.holiday_name || h.description || h.keterangan,
                        type: 'national'
                    })).filter(h => h.date && h.description);

                    if (newHolidays.length > 0) {
                        // Simpan ke database dengan upsert (menghindari duplikasi berdasarkan tanggal)
                        const { error } = await supabase
                            .from('holidays')
                            .upsert(newHolidays, { onConflict: 'date' });
                        
                        if (error) {
                            console.error(`[SYNC-DB-ERROR] Tahun ${year}:`, error.message);
                        } else {
                            console.log(`[SYNC-SUCCESS] Berhasil memperbarui ${newHolidays.length} hari libur nasional tahun ${year}`);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("[SYNC-FATAL-ERROR] Gagal menghubungi API hari libur:", error);
    }
}

export default async function AgendaPage() {
    // Jalankan sinkronisasi otomatis setiap kali halaman dibuka di sisi server
    await syncNationalHolidays();

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
