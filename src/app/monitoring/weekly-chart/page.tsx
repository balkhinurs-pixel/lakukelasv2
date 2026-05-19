
'use server';

import { getAdminDashboardData } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
    LineChart, 
    ArrowLeft, 
    ListFilter, 
    ChevronDown, 
    Info, 
    TrendingUp,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import WeeklyAttendanceChart from "../../admin/weekly-attendance-chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function WeeklyChartPage() {
    const dashboardData = await getAdminDashboardData();

    if (!dashboardData) {
        return <div className="p-8 text-center text-muted-foreground">Gagal memuat data grafik.</div>;
    }

    const { weeklyAttendance } = dashboardData;

    // Kalkulasi Ringkasan dari Data 7 Hari
    const totalBerangkat = weeklyAttendance.reduce((acc, curr) => acc + curr.berangkat, 0);
    const totalAlpha = weeklyAttendance.reduce((acc, curr) => acc + curr.tidakAbsen, 0);
    const totalIzinSakit = weeklyAttendance.reduce((acc, curr) => acc + curr.izinSakit, 0);
    const totalStafAll = totalBerangkat + totalAlpha + totalIzinSakit;

    const getPercent = (val: number) => totalStafAll > 0 ? ((val / totalStafAll) * 100).toFixed(1) : "0";

    const SummaryCard = ({ label, value, percent, color, dotColor }: any) => (
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <div className={cn("w-2.5 h-2.5 rounded-full", dotColor)} />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <Badge variant="outline" className={cn("w-fit px-2 py-0.5 border-0 font-black text-[10px]", color)}>
                {percent}%
            </Badge>
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {/* Header Area */}
            <div className="flex items-center justify-between px-1">
                <Link href="/monitoring" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ArrowLeft className="h-6 w-6 text-slate-900" />
                </Link>
                <div className="text-center">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Keberangkatan Guru</h1>
                    <div className="flex items-center justify-center gap-1 mt-0.5 text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Periode: {weeklyAttendance[0].tanggal} - {weeklyAttendance[6].tanggal} 2026</span>
                        <ChevronDown className="h-3 w-3" />
                    </div>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ListFilter className="h-5 w-5" />
                </div>
            </div>

            {/* Range Tabs */}
            <div className="bg-slate-100/80 p-1 rounded-2xl flex gap-1 mx-1">
                <button className="flex-1 bg-white shadow-sm text-indigo-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">7 Hari</button>
                <button className="flex-1 text-slate-400 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:text-slate-600">30 Hari</button>
                <button className="flex-1 text-slate-400 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:text-slate-600">90 Hari</button>
            </div>

            {/* Section: Ringkasan */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="pb-4 pt-6">
                    <CardTitle className="text-lg font-black text-slate-900">Ringkasan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <SummaryCard 
                            label="Berangkat" 
                            value={totalBerangkat} 
                            percent={getPercent(totalBerangkat)} 
                            dotColor="bg-emerald-500" 
                            color="bg-emerald-50 text-emerald-600" 
                        />
                        <SummaryCard 
                            label="Tidak Absen" 
                            value={totalAlpha} 
                            percent={getPercent(totalAlpha)} 
                            dotColor="bg-rose-500" 
                            color="bg-rose-50 text-rose-600" 
                        />
                        <SummaryCard 
                            label="Izin / Sakit" 
                            value={totalIzinSakit} 
                            percent={getPercent(totalIzinSakit)} 
                            dotColor="bg-amber-500" 
                            color="bg-amber-50 text-amber-600" 
                        />
                        <SummaryCard 
                            label="Total Guru" 
                            value={totalStafAll} 
                            percent="100" 
                            dotColor="bg-indigo-600" 
                            color="bg-indigo-50 text-indigo-600" 
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Section: Chart */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-8">
                    <div>
                        <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Tren Keberangkatan Guru</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Perbandingan 7 Hari Terakhir</p>
                    </div>
                    <div className="p-2 text-slate-300"><Info className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent className="pb-8">
                    <WeeklyAttendanceChart data={weeklyAttendance} />
                    
                    {/* Visual Legend */}
                    <div className="flex justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Berangkat</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Tidak Absen</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Izin / Sakit</span>
                        </div>
                    </div>

                    {/* Footer KPI Card */}
                    <div className="mt-10 p-5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-100 text-indigo-600">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700 leading-tight">
                                    Rata-rata keberangkatan guru <br/>
                                    minggu ini <span className="text-emerald-600 font-black">{getPercent(totalBerangkat)}%</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <Badge className="bg-emerald-100 text-emerald-700 border-0 font-black text-[10px] py-1 px-3 rounded-full shadow-sm">
                                <TrendingUp className="h-3 w-3 mr-1" /> 5.2%
                             </Badge>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1.5">dari minggu lalu</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
