
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
    Download, 
    Printer, 
    Calendar, 
    Search,
    Info
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Input } from "@/components/ui/input";

interface Props {
  initialData: {
      className: string;
      students: any[];
      attendanceMap: Record<string, Record<string, string>>;
      holidayDates: Set<string>;
      daysInMonth: number;
      month: number;
      year: number;
  }
}

const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
    { value: "3", label: "Maret" }, { value: "4", label: "April" },
    { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
    { value: "9", label: "September" }, { value: "10", label: "Oktober" },
    { value: "11", label: "November" }, { value: "12", label: "Desember" }
];

export default function HomeroomReportsClient({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { className, students, attendanceMap, holidayDates, daysInMonth, month, year } = initialData;
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleMonthChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", val);
    router.push(`?${params.toString()}`);
  };

  const isSunday = (day: number) => {
    return new Date(year, month - 1, day).getDay() === 0;
  };

  const getDayStatus = (studentId: string, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const status = attendanceMap[studentId]?.[dateStr];
    
    if (status === "Hadir") return "H";
    if (status === "Sakit") return "S";
    if (status === "Izin") return "I";
    if (status === "Alpha") return "A";
    return "";
  };

  const getRowSummary = (studentId: string) => {
      let h=0, s=0, i=0, a=0;
      for(let d=1; d<=daysInMonth; d++) {
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const status = attendanceMap[studentId]?.[dateStr];
          if(status === "Hadir") h++;
          else if(status === "Sakit") s++;
          else if(status === "Izin") i++;
          else if(status === "Alpha") a++;
      }
      return { h, s, i, a };
  };

  const filteredStudents = React.useMemo(() => {
    return students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, searchTerm]);

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <HandWrittenTitle 
          title={`Laporan Bulanan ${className}`} 
          subtitle="Matriks Presensi"
          className="py-4 md:py-6"
        />
        <div className="flex items-center gap-3 shrink-0">
             <Button variant="outline" className="rounded-xl h-12 shadow-sm border-slate-200">
                <Printer className="mr-2 h-4 w-4" /> Cetak
             </Button>
             <Button className="rounded-xl h-12 shadow-md bg-indigo-600 hover:bg-indigo-700">
                <Download className="mr-2 h-4 w-4" /> Export PDF
             </Button>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 border-b px-6 sm:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner">
                    <Calendar className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className="text-xl font-black tracking-tight text-slate-900">Rekap Presensi Siswa</CardTitle>
                    <CardDescription className="font-medium">Periode {months.find(m => m.value === String(month))?.label} {year}</CardDescription>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Cari nama siswa..." 
                        className="pl-10 h-11 rounded-xl border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={String(month)} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-11 w-full sm:w-[180px] rounded-xl border-slate-200 bg-white font-bold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                        {months.map(m => <SelectItem key={m.value} value={m.value} className="py-3 font-bold uppercase text-xs tracking-widest">{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="inline-block min-w-full align-middle p-4 sm:p-6">
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="min-w-[1200px] border-collapse text-[10px] sm:text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="sticky left-0 z-40 bg-slate-100 px-3 py-4 font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" rowSpan={2}>No</th>
                      <th className="sticky left-[42px] z-40 bg-slate-100 px-3 py-4 font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" rowSpan={2}>NIS</th>
                      <th className="sticky left-[95px] z-40 bg-slate-100 px-6 py-4 text-left font-black uppercase tracking-widest text-slate-500 border-r border-slate-200 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" rowSpan={2}>Nama Lengkap</th>
                      <th className="px-2 py-4 font-black uppercase tracking-widest text-slate-500 border-r border-slate-200" rowSpan={2}>JK</th>
                      <th className="px-4 py-2 font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center" colSpan={daysInMonth}>Tanggal / Hari</th>
                      <th className="px-4 py-2 font-black uppercase tracking-widest text-slate-500 border-l border-slate-200 text-center" colSpan={4}>Rekap</th>
                    </tr>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                          const isHoliday = holidayDates.has(dateStr) || isSunday(d);
                          return (
                              <th key={d} className={cn(
                                  "w-9 h-10 text-center font-bold border-r border-slate-200",
                                  isHoliday ? "bg-red-100 text-red-600" : "text-slate-400"
                              )}>
                                  {d}
                              </th>
                          );
                      })}
                      <th className="w-10 font-black text-emerald-600 border-l border-slate-200 bg-emerald-50/50">H</th>
                      <th className="w-10 font-black text-amber-600 bg-amber-50/50">S</th>
                      <th className="w-10 font-black text-blue-600 bg-blue-50/50">I</th>
                      <th className="w-10 font-black text-red-600 bg-red-50/50">A</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredStudents.map((student, idx) => {
                        const summary = getRowSummary(student.id);
                        return (
                          <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors group">
                            <td className="sticky left-0 z-30 bg-white group-hover:bg-slate-50 text-center font-bold text-slate-400 border-r border-slate-100 py-3.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{idx + 1}</td>
                            <td className="sticky left-[42px] z-30 bg-white group-hover:bg-slate-50 text-center font-mono text-[9px] text-slate-500 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{student.nis}</td>
                            <td className="sticky left-[95px] z-30 bg-white group-hover:bg-slate-50 px-6 py-3.5 font-bold text-slate-900 border-r border-slate-100 truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{student.name}</td>
                            <td className="text-center font-bold text-slate-400 border-r border-slate-100 uppercase">{student.gender.charAt(0)}</td>
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                                const isHoliday = holidayDates.has(dateStr) || isSunday(d);
                                const status = getDayStatus(student.id, d);
                                return (
                                  <td key={d} className={cn(
                                      "text-center font-black border-r border-slate-100 h-11 w-9",
                                      isHoliday && "bg-red-50/30",
                                      status === 'H' && "text-emerald-600 bg-emerald-50/20",
                                      status === 'S' && "text-amber-600 bg-amber-50/20",
                                      status === 'I' && "text-blue-600 bg-blue-50/20",
                                      status === 'A' && "text-red-600 bg-red-50/20"
                                  )}>
                                      {status}
                                  </td>
                                );
                            })}
                            <td className="text-center font-black text-emerald-600 bg-emerald-50/40 border-l border-slate-100">{summary.h}</td>
                            <td className="text-center font-black text-amber-600 bg-amber-50/40 border-l border-slate-100">{summary.s}</td>
                            <td className="text-center font-black text-blue-600 bg-blue-50/40 border-l border-slate-100">{summary.i}</td>
                            <td className="text-center font-black text-red-600 bg-red-50/40 border-l border-slate-100">{summary.a}</td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">H</div>
                <div className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">Hadir</div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-amber-50 border border-amber-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs">S</div>
                <div className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Sakit</div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-blue-50 border border-blue-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs">I</div>
                <div className="text-[10px] font-black uppercase text-blue-800 tracking-widest">Izin</div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-3xl bg-red-50 border border-red-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs">A</div>
                <div className="text-[10px] font-black uppercase text-red-800 tracking-widest">Alpha</div>
            </div>
      </div>

      <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] flex items-start gap-4">
          <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
            <Info className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Catatan Teknis:</strong> Data matriks ini disinkronkan secara otomatis. Status harian diambil dari input presensi guru mata pelajaran pertama pada hari tersebut untuk menjamin konsistensi laporan bulanan. Gunakan fitur <strong>Cetak</strong> untuk mendapatkan salinan fisik yang rapi.
          </p>
      </div>
    </div>
  );
}
