
import { getAgendas, getHolidays } from "@/lib/data";
import AgendaPageClient from "./agenda-page-client";
import { getIndonesianTime } from "@/lib/timezone";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

/**
 * Fungsi cerdas untuk sinkronisasi hari libur.
 * Hanya berjalan 1x dalam 24 jam (saat pengunjung pertama membuka halaman).
 */
async function smartSyncNationalHolidays() {
    const supabase = createClient();
    const nowIndo = getIndonesianTime();
    const todayStr = format(nowIndo, 'yyyy-MM-dd');

    try {
        // 1. Cek kapan terakhir kali sinkronisasi dilakukan
        const { data: lastSync } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'last_holiday_sync')
            .single();

        // 2. Jika sudah sinkron hari ini, batalkan proses (hemat kuota)
        if (lastSync?.value === todayStr) {
            console.log(`[HOLIDAY-SYNC] Data already synced today (${todayStr}). Skipping.`);
            return;
        }

        console.log(`[HOLIDAY-SYNC] New day detected. Starting background sync for ${todayStr}...`);

        const currentYear = nowIndo.getFullYear();
        const yearsToSync = [currentYear, currentYear + 1];

        for (const year of yearsToSync) {
            const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
                next: { revalidate: 0 } // Bypass cache untuk memastikan data segar saat sync
            });

            if (res.ok) {
                const responseData = await res.json();
                const rawList = Array.isArray(responseData) ? responseData : (responseData.data || []);
                
                if (rawList.length > 0) {
                    const newHolidays = rawList.map((h: any) => ({
                        date: h.date || h.holiday_date,
                        description: h.name || h.holiday_name || h.description || h.keterangan,
                        type: 'national'
                    })).filter(h => h.date && h.description);

                    if (newHolidays.length > 0) {
                        // Simpan ke database
                        await supabase.from('holidays').upsert(newHolidays, { onConflict: 'date' });
                    }
                }
            }
        }

        // 3. Update tanggal terakhir sinkronisasi agar tidak berjalan lagi hari ini
        await supabase
            .from('settings')
            .upsert({ key: 'last_holiday_sync', value: todayStr }, { onConflict: 'key' });

        console.log(`[HOLIDAY-SYNC] Successfully updated holidays for 2025-2026.`);
    } catch (error) {
        console.error("[HOLIDAY-SYNC-ERROR]", error);
    }
}

export default async function AgendaPage() {
    // Jalankan Smart Sync (hanya 1x sehari secara efektif)
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
