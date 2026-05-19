
'use server';

import { getAdminDashboardData } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, TrendingUp, Calendar, Info } from "lucide-react";
import WeeklyAttendanceChart from "../../admin/weekly-attendance-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function WeeklyChartPage() {
    const dashboardData = await getAdminDashboardData();

    if (!dashboardData) {
        return <div className="p-8 text-center text-muted-foreground">Gagal memuat data grafik.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">
                        <LineChart className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-slate-900">Grafik Mingguan</h1>
                        <p className="text-muted-foreground">Analisis tren kehadiran staf pengajar selama 7 hari terakhir.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Alert className="bg-indigo-50 border-indigo-200">
                    <Info className="h-4 w-4 text-indigo-600" />
                    <AlertTitle className="text-indigo-800 font-bold uppercase tracking-tight">Keterangan Grafik</AlertTitle>
                    <AlertDescription className="text-indigo-700 text-sm">
                        Area hijau menunjukkan jumlah guru yang hadir. Garis merah menunjukkan guru yang absen (Alpha), dan garis oranye menunjukkan guru yang sedang Izin atau Sakit.
                    </AlertDescription>
                </Alert>

                <Card className="border-0 shadow-xl bg-white overflow-hidden rounded-[2rem]">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Tren Kehadiran
                        </CardTitle>
                        <CardDescription>Data dihitung berdasarkan catatan absensi harian di sistem.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-10">
                        <div className="h-[400px] w-full">
                            <WeeklyAttendanceChart data={dashboardData.weeklyAttendance} />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-md bg-white p-6 rounded-2xl flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Status Utama</p>
                            <p className="font-bold text-slate-900">Hadir / Berangkat</p>
                        </div>
                    </Card>
                    <Card className="border-0 shadow-md bg-white p-6 rounded-2xl flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Status Negatif</p>
                            <p className="font-bold text-slate-900">Alpha / Tanpa Ket.</p>
                        </div>
                    </Card>
                    <Card className="border-0 shadow-md bg-white p-6 rounded-2xl flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Status Izin</p>
                            <p className="font-bold text-slate-900">Sakit & Izin Resmi</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
