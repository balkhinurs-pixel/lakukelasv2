"use client";

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
    Table as TableIcon,
    Loader2
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { Profile } from "@/lib/types";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface Props {
  initialData: {
      className: string;
      students: any[];
      attendanceMap: Record<string, Record<string, string>>;
      holidayDates: Set<string>;
      daysInMonth: number;
      month: number;
      year: number;
  },
  schoolProfile: Profile | null;
}

const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
    { value: "3", label: "Maret" }, { value: "4", label: "April" },
    { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
    { value: "9", label: "September" }, { value: "10", label: "Oktober" },
    { value: "11", label: "November" }, { value: "12", label: "Desember" }
];

export default function HomeroomReportsClient({ initialData, schoolProfile }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { className, students, attendanceMap, holidayDates, daysInMonth, month, year } = initialData;
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<'summary' | 'matrix'>('summary');
  const [downloading, setDownloading] = React.useState(false);

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

  const handleDownloadPdf = async () => {
    setDownloading(true);
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    }) as jsPDFWithAutoTable;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const monthLabel = months.find(m => m.value === String(month))?.label;

    const generateContent = () => {
        // 1. Kop Surat
        const addHeader = (docInstance: jsPDF) => {
            if (schoolProfile) {
                const logoSize = 22;
                // Add Logo if exists (handled outside in onload)
                docInstance.setFontSize(16).setFont('helvetica', 'bold');
                docInstance.text((schoolProfile.school_name || "NAMA SEKOLAH").toUpperCase(), 40, margin + 7);
                docInstance.setFontSize(10).setFont('helvetica', 'normal');
                docInstance.text(schoolProfile.school_address || "Alamat Sekolah", 40, margin + 13);
                docInstance.setLineWidth(0.8);
                docInstance.line(margin, margin + 18, pageWidth - margin, margin + 18);
                docInstance.setLineWidth(0.2);
                docInstance.line(margin, margin + 19, pageWidth - margin, margin + 19);
            }
        };

        addHeader(doc);

        // 2. Judul Laporan
        doc.setFontSize(13).setFont('helvetica', 'bold');
        doc.text("LAPORAN BULANAN PRESENSI SISWA", pageWidth / 2, margin + 28, { align: 'center' });
        doc.setFontSize(11).setFont('helvetica', 'normal');
        doc.text(`Kelas: ${className}   |   Bulan: ${monthLabel} ${year}`, pageWidth / 2, margin + 34, { align: 'center' });

        // 3. Persiapan Data Tabel
        const tableHeader = [
            ['No', 'Nama Lengkap', 'JK', ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1)), 'H', 'S', 'I', 'A']
        ];

        const tableBody = filteredStudents.map((student, idx) => {
            const summary = getRowSummary(student.id);
            const dailyStatus = Array.from({ length: daysInMonth }, (_, i) => getDayStatus(student.id, i + 1));
            return [
                idx + 1,
                student.name,
                student.gender.charAt(0),
                ...dailyStatus,
                summary.h,
                summary.s,
                summary.i,
                summary.a
            ];
        });

        // 4. Render Tabel
        doc.autoTable({
            head: tableHeader,
            body: tableBody,
            startY: margin + 40,
            theme: 'grid',
            styles: {
                fontSize: 7,
                cellPadding: 1.2,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.1,
                lineColor: [150, 150, 150],
                textColor: [33, 33, 33]
            },
            headStyles: {
                fillColor: [59, 130, 246], // Indigo Primary
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 7.5
            },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
                2: { cellWidth: 7 },
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            didParseCell: (data: any) => {
                // Warna merah untuk hari libur (Minggu/Nasional) pada Header
                if (data.section === 'head' && data.column.index >= 3 && data.column.index < 3 + daysInMonth) {
                    const dayNum = parseInt(data.cell.text[0]);
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    if (isSunday(dayNum) || holidayDates.has(dateStr)) {
                        data.cell.styles.fillColor = [239, 68, 68]; // Red 500
                    }
                }
                // Warnai isi sel jika libur
                if (data.section === 'body' && data.column.index >= 3 && data.column.index < 3 + daysInMonth) {
                    const dayNum = data.column.index - 2;
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    if (isSunday(dayNum) || holidayDates.has(dateStr)) {
                        data.cell.styles.fillColor = [254, 226, 226]; // Red 50
                    }
                }
                // Styling khusus untuk rekap di ujung kanan
                if (data.section === 'body' && data.column.index >= 3 + daysInMonth) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [241, 245, 249]; // Slate 100
                }
            }
        });

        // 5. Penanganan Tanda Tangan & Halaman Baru
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        const requiredSpace = 45; // Space needed for signatures (mm)
        
        // Cek apakah sisa ruang cukup untuk tanda tangan
        if (finalY + requiredSpace > pageHeight - margin) {
            doc.addPage();
            finalY = margin + 10; // Start at top of new page
        }

        const todayDate = format(new Date(), "dd MMMM yyyy", { locale: id });
        const city = schoolProfile?.school_address?.split(',')[1]?.trim() || "Kota";

        doc.setFontSize(9).setFont('helvetica', 'italic');
        doc.text(`Dicetak melalui aplikasi LakuKelas pada: ${todayDate}`, margin, finalY - 5);

        // Grid tanda tangan
        doc.setFontSize(10).setFont('helvetica', 'normal');
        const signY = finalY + 5;
        
        // Kiri: Kepala Sekolah
        doc.text("Mengetahui,", margin + 25, signY);
        doc.text("Kepala Sekolah,", margin + 25, signY + 6);
        
        // Kanan: Wali Kelas
        doc.text(`${city}, ${todayDate}`, pageWidth - margin - 65, signY);
        doc.text("Wali Kelas,", pageWidth - margin - 65, signY + 6);

        // Baris Nama
        doc.setFont(undefined, 'bold');
        doc.text(schoolProfile?.headmaster_name || "..................................................", margin + 25, signY + 32);
        doc.text(schoolProfile?.full_name || "..................................................", pageWidth - margin - 65, signY + 32);
        
        // Baris NIP
        doc.setFont(undefined, 'normal').setFontSize(9);
        doc.text(`NIP. ${schoolProfile?.headmaster_nip || "..........................."}`, margin + 25, signY + 37);
        doc.text(`NIP. ${schoolProfile?.nip || "..........................."}`, pageWidth - margin - 65, signY + 37);

        doc.save(`Presensi_${className}_${monthLabel}_${year}.pdf`);
        setDownloading(false);
    };

    // Load logo if exists, then generate
    if (schoolProfile?.school_logo_url) {
        const img = new Image();
        img.src = schoolProfile.school_logo_url;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            // Background cleanup for white logos or weird transparency
            doc.addImage(img, 'PNG', margin + 5, margin, 22, 22);
            generateContent();
        };
        img.onerror = () => generateContent();
    } else {
        generateContent();
    }
  };

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
             <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 shrink-0 bg-white"
                onClick={() => window.print()}
             >
                <Printer className="mr-2 h-4 w-4" /> Cetak Layar
             </Button>
             <Button 
                size="sm" 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-lg shadow-indigo-200"
                onClick={handleDownloadPdf}
                disabled={downloading}
             >
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Unduh PDF Resmi
             </Button>
             <Button variant="outline" size="sm" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0 bg-white">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Ekspor Excel
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
