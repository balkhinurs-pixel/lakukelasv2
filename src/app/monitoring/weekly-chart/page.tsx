
'use server';

import { getAttendanceTrendData } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
    ArrowLeft, 
    ListFilter, 
    ChevronDown, 
    Info, 
    TrendingUp,
    BarChart3,
    CalendarDays
} from "lucide-react";
import Link from "next/link";
import WeeklyAttendanceChart from "../../admin/weekly-attendance-chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { getIndonesianTime } from "@/lib/timezone";

export default async function WeeklyChartPage({ 
    searchParams 
}: { 
    searchParams: { range?: string } 
}) {
    const range = searchParams.range || "7";
    const trendData = await getAttendanceTrendData(range);
    const nowIndo = getIndonesianTime();

    if (!trendData || trendData.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Gagal memuat data grafik. Silakan coba rentang waktu lain.</div>;
    }

    // Deteksi Semester Aktif
    const currentMonth = nowIndo.getMonth() + 1;
    const isGanjil = currentMonth >= 7 && currentMonth <= 12;
    const semesterMonths = isGanjil 
        ? [
            { id: 7, label: 'Juli' }, { id: 8, label: 'Agu' }, { id: 9, label: 'Sep' },
            { id: 10, label: 'Okt' }, { id: 11, label: 'Nov' }, { id: 12, label: 'Des' }
          ]
        : [
            { id: 1, label: 'Jan' }, { id: 2, label: 'Feb' }, { id: 3, label: 'Mar' },
            { id: 4, label: 'Apr' }, { id: 5, label: 'Mei' }, { id: 6, label: 'Jun' }
          ];

    // Filter data: Hanya hitung hari yang BUKAN masa depan (isFuture = false)
    const processedData = trendData.filter(d => !d.isFuture);
    
    const totalBerangkat = processedData.reduce((acc, curr) => acc + curr.berangkat, 0);
    const totalAlpha = processedData.reduce((acc, curr) => acc + curr.tidakAbsen, 0);
    const totalIzinSakit = processedData.reduce((acc, curr) => acc + curr.izinSakit, 0);
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

    let rangeLabel = "Periode";
    if (range === '7') rangeLabel = "7 Hari";
    else if (range === '30') rangeLabel = "30 Hari";
    else if (range === '90') rangeLabel = "90 Hari";
    else if (range === 'semester') rangeLabel = "Semester Ini";
    else if (range.startsWith('month-')) {
        const mId = parseInt(range.split('-')[1]);
        rangeLabel = "Bulan " + (semesterMonths.find(m => m.id === mId)?.label || "");
    }

    const startDateDisplay = trendData[0]?.tanggal_full;
    const endDateDisplay = trendData[trendData.length - 1]?.tanggal_full;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {/* Header Area */}
            <div className="flex items-center justify-between px-1">
                <Link href="/monitoring" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ArrowLeft className="h-6 w-6 text-slate-900" />
                </Link>
                <div className="text-center">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Tren Keberangkatan Guru</h1>
                    <div className="flex items-center justify-center gap-1 mt-0.5 text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {startDateDisplay} - {endDateDisplay}
                        </span>
                        <ChevronDown className="h-3 w-3" />
                    </div>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                            <ListFilter className="h-5 w-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-0 shadow-2xl p-2 w-48">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 py-1.5">Pilih Rentang</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="rounded-xl font-bold py-2.5 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer">
                            <Link href="?range=7">7 Hari Terakhir</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl font-bold py-2.5 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer">
                            <Link href="?range=30">30 Hari Terakhir</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl font-bold py-2.5 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer">
                            <Link href="?range=semester" className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Semester Aktif
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Quick Range Tabs */}
            <div className="bg-slate-100/80 p-1 rounded-2xl flex gap-1 mx-1 overflow-x-auto scrollbar-none">
                {[
                    { id: '7', label: '7 HARI' },
                    { id: '30', label: '30 HARI' },
                    { id: 'semester', label: 'SEMESTER' }
                ].map((tab) => (
                    <Link 
                        key={tab.id}
                        href={`?range=${tab.id}`} 
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all whitespace-nowrap",
                            range === tab.id ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Monthly Selector - Bounded by Semester */}
            <div className="space-y-3 px-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Laporan Per Bulan ({isGanjil ? 'Ganjil' : 'Genap'})</p>
                <div className="grid grid-cols-6 gap-1.5">
                    {semesterMonths.map((m) => (
                        <Link 
                            key={m.id}
                            href={`?range=month-${m.id}`}
                            className={cn(
                                "py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter text-center border transition-all",
                                range === `month-${m.id}` 
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105" 
                                    : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                            )}
                        >
                            {m.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Section: Ringkasan */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="pb-4 pt-6">
                    <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Ringkasan {rangeLabel}</CardTitle>
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
                            label="Total Rekam" 
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
                        <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Tren Keberangkatan Guru</CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visualisasi Harian {rangeLabel}</p>
                    </div>
                    <div className="p-2 text-slate-300"><Info className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent className="pb-8">
                    <WeeklyAttendanceChart data={trendData} />
                    
                    <div className="flex justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Berangkat</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Alpha</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Izin/Sakit</span>
                        </div>
                    </div>

                    <div className="mt-10 p-5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-100 text-indigo-600">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700 leading-tight">
                                    Rata-rata keberangkatan <br/>
                                    {rangeLabel.toLowerCase()} ini <span className="text-emerald-600 font-black">{getPercent(totalBerangkat)}%</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <Badge className="bg-emerald-100 text-emerald-700 border-0 font-black text-[10px] py-1 px-3 rounded-full shadow-sm">
                                <TrendingUp className="h-3 w-3 mr-1" /> 5.2%
                             </Badge>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1.5">vs Periode Lalu</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
