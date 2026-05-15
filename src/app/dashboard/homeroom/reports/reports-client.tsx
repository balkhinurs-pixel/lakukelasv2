
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
import { 
    Download, 
    Printer, 
    Calendar, 
    Search,
    Info,
    FileSpreadsheet,
    LayoutList,
    Table as TableIcon
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

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
  const isMobile = useIsMobile();
  const { className, students, attendanceMap, holidayDates, daysInMonth, month, year } = initialData;
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [viewMode, setViewMode] = React.useState<'summary' | 'matrix'>('summary');

  React.useEffect(() => {
    if (isMobile !== undefined) {
        setViewMode(isMobile ? 'summary' : 'matrix');
    }
  }, [isMobile]);

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
    <div className="space-y-6 max-w-full overflow-hidden pb-10">
      <div className="flex flex-col gap-4 px-1">
        <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Laporan Bulanan <span className="text-indigo-600">{className}</span>
            </h1>
            <p className="text-xs md:text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Sistem Matriks Kehadiran Siswa</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
             <Button variant="outline" size="sm" className="rounded-xl border-slate-200 shrink-0 bg-white">
                <Printer className="mr-2 h-4 w-4" /> Cetak
             </Button>
             <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                <Download className="mr-2 h-4 w-4" /> PDF
             </Button>
             <Button variant="outline" size="sm" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0 bg-white">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
             </Button>
        </div>
      </div>

      <Card className="rounded-3xl border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b border-slate-50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Calendar className="h-5 w-5" />
                </div>
                <Select value={String(month)} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-10 w-full md:w-[160px] rounded-xl border-slate-200 bg-white font-bold text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                        {months.map(m => <SelectItem key={m.value} value={m.value} className="py-2.5 font-bold uppercase text-xs tracking-widest">{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Cari siswa..." 
                        className="pl-9 h-10 rounded-xl border-slate-200 bg-white text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8 rounded-lg", viewMode === 'summary' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400")}
                        onClick={() => setViewMode('summary')}
                    >
                        <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8 rounded-lg", viewMode === 'matrix' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400")}
                        onClick={() => setViewMode('matrix')}
                    >
                        <TableIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {viewMode === 'summary' ? (
              <div className="divide-y divide-slate-50">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, idx) => {
                        const summary = getRowSummary(student.id);
                        return (
                            <div key={student.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between group gap-4">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-black shrink-0 mt-0.5">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-slate-900 break-words text-sm leading-tight">{student.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">NIS: {student.nis}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-1 shrink-0 max-w-[140px]">
                                    <Badge variant="outline" className="h-7 px-2 border-emerald-100 bg-emerald-50 text-emerald-700 text-[10px] font-black">H:{summary.h}</Badge>
                                    <Badge variant="outline" className="h-7 px-2 border-amber-100 bg-amber-50 text-amber-700 text-[10px] font-black">S:{summary.s}</Badge>
                                    <Badge variant="outline" className="h-7 px-2 border-blue-100 bg-blue-50 text-blue-700 text-[10px] font-black">I:{summary.i}</Badge>
                                    <Badge variant="outline" className="h-7 px-2 border-red-100 bg-red-50 text-red-700 text-[10px] font-black">A:{summary.a}</Badge>
                                </div>
                            </div>
                        );
                    })
                  ) : (
                    <div className="py-20 text-center flex flex-col items-center opacity-30">
                        <Search className="h-12 w-12 mb-2" />
                        <p className="text-sm font-bold">Siswa tidak ditemukan</p>
                    </div>
                  )}
              </div>
          ) : (
            <div className="relative w-full max-w-full overflow-hidden">
                <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="inline-block min-w-max align-middle">
                        <table className="border-collapse text-[10px] sm:text-xs">
                          <thead>
                            <tr className="bg-slate-100/80">
                              <th className="sticky left-0 z-40 bg-slate-100 px-3 py-4 font-black uppercase tracking-widest text-slate-500 border-r border-b border-slate-200 min-w-[40px]" rowSpan={2}>No</th>
                              <th className="sticky left-[40px] z-40 bg-slate-100 px-6 py-4 text-left font-black uppercase tracking-widest text-slate-500 border-r border-b border-slate-200 min-w-[180px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)]" rowSpan={2}>Nama Lengkap</th>
                              <th className="px-2 py-4 font-black uppercase tracking-widest text-slate-500 border-r border-b border-slate-200 min-w-[40px]" rowSpan={2}>JK</th>
                              <th className="px-4 py-2 font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 text-center" colSpan={daysInMonth}>Bulan {months.find(m=>m.value === String(month))?.label}</th>
                              <th className="px-4 py-2 font-black uppercase tracking-widest text-slate-500 border-l border-b border-slate-200 text-center bg-slate-100" colSpan={4}>Rekap</th>
                            </tr>
                            <tr className="bg-slate-50/50">
                              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                                  const isHoliday = holidayDates.has(dateStr) || isSunday(d);
                                  return (
                                      <th key={d} className={cn(
                                          "w-8 h-10 text-center font-bold border-r border-b border-slate-200",
                                          isHoliday ? "bg-red-100 text-red-600" : "text-slate-400"
                                      )}>
                                          {d}
                                      </th>
                                  );
                              })}
                              <th className="w-9 font-black text-emerald-600 border-l border-b border-slate-200 bg-emerald-50/30">H</th>
                              <th className="w-9 font-black text-amber-600 border-b border-slate-200 bg-amber-50/30">S</th>
                              <th className="w-9 font-black text-blue-600 border-b border-slate-200 bg-blue-50/30">I</th>
                              <th className="w-9 font-black text-red-600 border-b border-slate-200 bg-red-50/30">A</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredStudents.map((student, idx) => {
                                const summary = getRowSummary(student.id);
                                return (
                                  <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors group">
                                    <td className="sticky left-0 z-30 bg-white group-hover:bg-slate-50 text-center font-bold text-slate-400 border-r border-slate-100 py-3.5">{idx + 1}</td>
                                    <td className="sticky left-[40px] z-30 bg-white group-hover:bg-slate-50 px-6 py-3.5 font-bold text-slate-900 border-r border-slate-100 truncate shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)]">{student.name}</td>
                                    <td className="text-center font-bold text-slate-400 border-r border-slate-100 uppercase">{student.gender.charAt(0)}</td>
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                                        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                                        const isHoliday = holidayDates.has(dateStr) || isSunday(d);
                                        const status = getDayStatus(student.id, d);
                                        return (
                                          <td key={d} className={cn(
                                              "text-center font-black border-r border-slate-100 h-10 w-8",
                                              isHoliday && "bg-red-50/30",
                                              status === 'H' && "text-emerald-600",
                                              status === 'S' && "text-amber-600 bg-amber-50/10",
                                              status === 'I' && "text-blue-600 bg-blue-50/10",
                                              status === 'A' && "text-red-600 bg-red-50/10"
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
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-1">
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">H</div>
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Hadir</div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-[10px]">S</div>
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Sakit</div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-[10px]">I</div>
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Izin</div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-[10px]">A</div>
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Alpha</div>
            </div>
      </div>
    </div>
  );
}
