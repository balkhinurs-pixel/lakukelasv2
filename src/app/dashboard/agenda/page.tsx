import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

/**
 * Fungsi cerdas untuk sinkronisasi hari libur.
 * Hanya berjalan 1x dalam 24 jam (saat pengunjung pertama membuka halaman).
 * Menghemat kuota API eksternal dan Supabase Requests.
 */
async function smartSyncNationalHolidays() {
    const supabase = createClient();
    const nowIndo = getIndonesianTime();
    const todayStr = format(nowIndo, 'yyyy-MM-dd');

    try {
        // 1. Cek kapan terakhir kali sinkronisasi dilakukan hari ini
        const { data: lastSync } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'last_holiday_sync')
            .single();

        // 2. Jika sudah sinkron hari ini, batalkan proses (hemat kuota)
        if (lastSync?.value === todayStr) {
            return;
        }

        console.log(`[HOLIDAY-SYNC] New day detected (${todayStr}). Fetching latest holidays...`);

        const currentYear = nowIndo.getFullYear();
        const yearsToSync = [currentYear, currentYear + 1];
        let allFetchedHolidays: any[] = [];

        for (const year of yearsToSync) {
            const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
                next: { revalidate: 0 } // Bypass cache untuk data segar
            });

            if (res.ok) {
                const responseData = await res.json();
                // API ini mengirimkan array langsung atau dibungkus properti data
                const rawList = Array.isArray(responseData) ? responseData : (responseData.data || []);
                
                if (rawList.length > 0) {
                    const mapped = rawList.map((h: any) => ({
                        date: h.date || h.holiday_date,
                        description: h.name || h.holiday_name || h.description || h.keterangan,
                        type: 'national'
                    })).filter((h: any) => h.date && h.description);
                    allFetchedHolidays = [...allFetchedHolidays, ...mapped];
                }
            }
        }

        if (allFetchedHolidays.length > 0) {
            // Gunakan upsert berdasarkan kolom date yang unik
            await supabase.from('holidays').upsert(allFetchedHolidays, { onConflict: 'date' });
        }

        // 3. Update status agar sinkronisasi tidak berjalan lagi hari ini
        await supabase
            .from('settings')
            .upsert({ key: 'last_holiday_sync', value: todayStr }, { onConflict: 'key' });

        console.log(`[HOLIDAY-SYNC] Success!`);
    } catch (error) {
        console.error("[HOLIDAY-SYNC-ERROR]", error);
    }
}

export default async function AgendaPage() {
    // Jalankan Smart Sync (Lokal server-side logic)
    await smartSyncNationalHolidays();

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
