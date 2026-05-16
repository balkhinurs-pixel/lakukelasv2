
"use client"

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
    TrendingUp, 
    Award, 
    Download, 
    BookCheck, 
    Filter, 
    FileText, 
    Loader2, 
    Users, 
    ClipboardList,
    Printer,
    BookOpen,
    School,
    FileSpreadsheet,
    CalendarDays,
    ChevronDown,
    LineChart
} from "lucide-react";
import type { Class, Subject, Profile, SchoolYear } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { getGradesReportList, getJournalReportList, getAttendanceSemesterMatrix } from "@/lib/data";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LottieWelcome } from "@/components/ui/lottie-welcome";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

type ReportsData = {
    summaryCards: {
        overallAttendanceRate: string;
        overallAverageGrade: string;
        totalJournals: number;
        activeSchoolYearId: string;
        activeSchoolYearName: string;
    };
    uniqueAssessments: string[];
};

const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    colorClass, 
    bgColorClass,
    trend
}: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    icon: React.ElementType; 
    colorClass: string; 
    bgColorClass: string;
    trend?: string;
}) => (
    <Card className="border-0 shadow-sm rounded-[32px] overflow-hidden bg-white group hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
                <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-70", colorClass)}>{title}</p>
                <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", bgColorClass)}>
                    <Icon className={cn("h-5 w-5", colorClass)} />
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                <div className="flex items-center gap-1.5">
                    {trend && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{subtitle}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function ReportsPageComponent({
    classes,
    subjects,
    reportsData,
    profile,
    schoolProfile,
}: {
    classes: Class[];
    subjects: Subject[];
    schoolYears: SchoolYear[];
    reportsData: ReportsData;
    profile: Profile;
    schoolProfile: Profile | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState('attendance');
  const [downloading, setDownloading] = React.useState(false);
  const [selectedAssessment, setSelectedAssessment] = React.useState('all');
  
  const selectedClass = searchParams.get('class') || (classes.length > 0 ? classes[0].id : "");
  const selectedSubject = searchParams.get('subject') || (subjects.length > 0 ? subjects[0].id : "");

  const handleFilterChange = React.useCallback(
    (key: 'class' | 'subject', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );
  
  const { summaryCards, uniqueAssessments } = reportsData;

  const handleDownloadPdf = async (type: 'attendance' | 'grades' | 'journal') => {
    if (!selectedClass || !selectedSubject) {
        toast({ title: "Filter belum lengkap", description: "Pilih kelas dan mata pelajaran terlebih dahulu.", variant: "destructive" });
        return;
    }
    
    setDownloading(true);
    
    try {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        }) as jsPDFWithAutoTable;

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;

        const generatePDFContent = (head: any[][], body: any[][], title: string) => {
            const schoolData = {
                name: schoolProfile?.school_name || "LAKUKELAS",
                address: schoolProfile?.school_address || "Alamat Sekolah Belum Diatur",
                headmaster: schoolProfile?.headmaster_name || "Nama Kepala Sekolah",
                nip: schoolProfile?.headmaster_nip || "-",
            };

            doc.setFontSize(16).setFont('helvetica', 'bold');
            doc.text(schoolData.name.toUpperCase(), margin + 25, margin + 8);
            doc.setFontSize(10).setFont('helvetica', 'normal');
            doc.text(schoolData.address, margin + 25, margin + 14);
            doc.setLineWidth(0.5);
            doc.line(margin, margin + 22, pageWidth - margin, margin + 22);

            doc.setFontSize(12).setFont('helvetica', 'bold');
            doc.text(title, pageWidth / 2, margin + 32, { align: 'center' });
            
            doc.setFontSize(10).setFont('helvetica', 'normal');
            doc.text(`Tahun Ajaran: ${summaryCards.activeSchoolYearName}`, margin, margin + 42);
            doc.text(`Mata Pelajaran: ${subjects.find(s => s.id === selectedSubject)?.name}`, margin, margin + 47);
            doc.text(`Guru Pengampu: ${profile.full_name}`, pageWidth - margin - 80, margin + 42);
            doc.text(`Kelas: ${classes.find(c => c.id === selectedClass)?.name}`, pageWidth - margin - 80, margin + 47);

            doc.autoTable({
                head: head,
                body: body,
                startY: margin + 55,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: 255, halign: 'center' },
                styles: { fontSize: 7, halign: 'center', valign: 'middle' },
                columnStyles: type === 'journal' ? {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 15 },
                    3: { cellWidth: 100, halign: 'left' },
                    4: { cellWidth: 120, halign: 'left' }
                } : {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 50, halign: 'left' }
                }
            });

            let finalY = (doc as any).lastAutoTable.finalY + 15;
            if (finalY > pageHeight - 60) { doc.addPage(); finalY = margin + 20; }

            const today = format(new Date(), 'dd MMMM yyyy', { locale: id });
            const city = schoolData.address.split(',')[1]?.trim() || "Kota";

            doc.setFontSize(10);
            doc.text(`${city}, ${today}`, pageWidth - margin - 60, finalY - 5);
            
            doc.text("Mengetahui,", margin + 20, finalY);
            doc.text("Kepala Sekolah,", margin + 20, finalY + 6);
            doc.text("Guru Mata Pelajaran,", pageWidth - margin - 60, finalY + 6);

            doc.setFont('helvetica', 'bold');
            doc.text(schoolData.headmaster, margin + 20, finalY + 32);
            doc.text(profile.full_name, pageWidth - margin - 60, finalY + 32);
            
            doc.setFont('helvetica', 'normal').setFontSize(9);
            doc.text(`NIP. ${schoolData.nip}`, margin + 20, finalY + 37);
            doc.text(`NIP. ${profile.nip || "-"}`, pageWidth - margin - 60, finalY + 37);

            doc.save(`Laporan_${type}_${format(new Date(), 'yyyyMMdd')}.pdf`);
            setDownloading(false);
        };

        if (type === 'attendance') {
            const data = await getAttendanceSemesterMatrix({
                schoolYearId: summaryCards.activeSchoolYearId,
                classId: selectedClass,
                subjectId: selectedSubject
            });
            
            if (!data || data.students.length === 0) {
                toast({ title: "Data Kosong", description: "Tidak ada riwayat presensi ditemukan untuk periode ini.", variant: "destructive" });
                setDownloading(false);
                return;
            }

            const { students, attendanceMap, maxMeeting } = data;
            const meetings = Array.from({ length: Math.max(maxMeeting, 1) }, (_, i) => String(i + 1));
            const head = [['No', 'Nama Lengkap', ...meetings, 'H', 'S', 'I', 'A']];
            
            const body = students.map((s, idx) => {
                let h=0, st=0, i=0, a=0;
                const dailyStatuses = meetings.map(m => {
                    const status = attendanceMap[s.id]?.[Number(m)];
                    if (status === 'Hadir') { h++; return 'H'; }
                    if (status === 'Sakit') { st++; return 'S'; }
                    if (status === 'Izin') { i++; return 'I'; }
                    if (status === 'Alpha') { a++; return 'A'; }
                    return '';
                });
                return [idx + 1, s.name, ...dailyStatuses, h, st, i, a];
            });

            const logoUrl = schoolProfile?.school_logo_url || "https://placehold.co/100x100.png";
            const img = new Image();
            img.src = logoUrl;
            img.crossOrigin = "Anonymous";
            img.onload = () => { 
                try { doc.addImage(img, 'PNG', margin, margin, 20, 20); } catch(e) {}
                generatePDFContent(head, body, "LAPORAN PRESENSI SISWA PER SEMESTER");
            };
            img.onerror = () => generatePDFContent(head, body, "LAPORAN PRESENSI SISWA PER SEMESTER");

        } else if (type === 'grades') {
            const data = await getGradesReportList({
                schoolYearId: summaryCards.activeSchoolYearId,
                classId: selectedClass,
                subjectId: selectedSubject,
                assessmentType: selectedAssessment
            });

            if (!data || data.length === 0) {
                toast({ title: "Data Kosong", description: "Tidak ada data nilai ditemukan untuk filter ini.", variant: "destructive" });
                setDownloading(false);
                return;
            }

            const head = [['No', 'Nama Siswa', 'Jenis Penilaian', 'KKM', 'Nilai', 'Status']];
            const body = data.map((g: any, i: number) => [
                i + 1, 
                g.student_name, 
                g.assessment_type, 
                g.subject_kkm, 
                g.score,
                g.score >= g.subject_kkm ? 'Tuntas' : 'Remedial'
            ]);
            
            const logoUrl = schoolProfile?.school_logo_url || "https://placehold.co/100x100.png";
            const img = new Image();
            img.src = logoUrl;
            img.crossOrigin = "Anonymous";
            img.onload = () => { 
                try { doc.addImage(img, 'PNG', margin, margin, 20, 20); } catch(e) {}
                generatePDFContent(head, body, "LEGER NILAI SISWA PER SEMESTER");
            };
            img.onerror = () => generatePDFContent(head, body, "LEGER NILAI SISWA PER SEMESTER");

        } else if (type === 'journal') {
            const data = await getJournalReportList({
                schoolYearId: summaryCards.activeSchoolYearId,
                classId: selectedClass,
                subjectId: selectedSubject
            });

            if (!data || data.length === 0) {
                toast({ title: "Data Kosong", description: "Belum ada entri jurnal mengajar untuk semester ini.", variant: "destructive" });
                setDownloading(false);
                return;
            }

            const head = [['No', 'Tanggal', 'Pertemuan', 'Tujuan Pembelajaran', 'Kegiatan (Sintaks)']];
            const body = data.map((j: any, i: number) => [
                i + 1, 
                format(parseISO(j.date), 'dd/MM/yyyy'), 
                j.meeting_number || '-', 
                j.learning_objectives,
                j.learning_activities
            ]);
            
            const logoUrl = schoolProfile?.school_logo_url || "https://placehold.co/100x100.png";
            const img = new Image();
            img.src = logoUrl;
            img.crossOrigin = "Anonymous";
            img.onload = () => { 
                try { doc.addImage(img, 'PNG', margin, margin, 20, 20); } catch(e) {}
                generatePDFContent(head, body, "LOG JURNAL MENGAJAR GURU PER SEMESTER");
            };
            img.onerror = () => generatePDFContent(head, body, "LOG JURNAL MENGAJAR GURU PER SEMESTER");
        }

    } catch (error: any) {
        console.error("Failed to generate report:", error);
        toast({ title: "Gagal Mencetak", description: "Terjadi kesalahan saat memproses dokumen PDF.", variant: "destructive" });
        setDownloading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedClass || !selectedSubject) {
        toast({ title: "Filter belum lengkap", description: "Pilih kelas dan mata pelajaran terlebih dahulu.", variant: "destructive" });
        return;
    }
    setDownloading(true);
    
    try {
        const data = await getGradesReportList({
            schoolYearId: summaryCards.activeSchoolYearId,
            classId: selectedClass,
            subjectId: selectedSubject,
            assessmentType: selectedAssessment
        });

        if (!data || data.length === 0) {
            toast({ title: "Data Tidak Ditemukan", description: "Tidak ada data nilai yang bisa diekspor.", variant: "destructive" });
            setDownloading(false);
            return;
        }

        const worksheetData = data.map((g: any, i: number) => ({
            "No": i + 1,
            "Nama Siswa": g.student_name,
            "Jenis Penilaian": g.assessment_type,
            "KKM": g.subject_kkm,
            "Nilai": g.score,
            "Status": g.score >= g.subject_kkm ? 'Tuntas' : 'Remedial',
            "Tanggal": format(parseISO(g.date), 'dd/MM/yyyy')
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Nilai");
        XLSX.writeFile(workbook, `Leger_Nilai_${summaryCards.activeSchoolYearName.replace(/\//g, '-')}.xlsx`);
        
        toast({ title: "Berhasil", description: "File Excel berhasil diunduh." });
    } catch (error: any) {
        console.error("Excel export error:", error);
        toast({ title: "Ekspor Gagal", description: "Gagal membuat file Excel.", variant: "destructive" });
    }
    setDownloading(false);
  }

  return (
    <div className="space-y-6 pb-24 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
        {/* 1. Header Premium Indigo */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-8 sm:p-10 text-white rounded-b-[4rem] shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 blur-2xl rounded-full -ml-10 -mb-10" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left flex-1">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-100 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">
                        <span>📊</span>
                        <span>Dokumentasi Akademik</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                            Laporan Akademik
                        </h1>
                        <p className="text-indigo-100/80 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
                            Pusat analisis dan rekapitulasi data administrasi kelas Anda. Pantau progres siswa dan cetak dokumen resmi dengan mudah.
                        </p>
                    </div>
                    
                    {/* Active Year Badge / Select Style */}
                    <div className="pt-4">
                        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-3 pl-5 rounded-[2rem] shadow-inner group transition-all hover:bg-white/15">
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] font-black uppercase text-indigo-200 tracking-widest">Tahun Ajaran Aktif</span>
                                <span className="text-sm font-black tracking-tight">{summaryCards.activeSchoolYearName}</span>
                            </div>
                            <div className="h-8 w-px bg-white/20 mx-1" />
                            <div className="p-2 bg-white/20 rounded-full group-hover:rotate-180 transition-transform duration-500">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="hidden md:block w-48 h-48 lg:w-64 lg:h-64 shrink-0 relative">
                     <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
                     <LottieWelcome />
                </div>
            </div>
        </div>

        {/* 2. Content Container */}
        <div className="px-4 sm:px-6 lg:px-10 -mt-12 space-y-8">
            {/* 3. Grid Statistik (4 Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Presensi Rata-rata"
                    value={`${summaryCards.overallAttendanceRate}%`}
                    subtitle="Tingkat kehadiran"
                    icon={LineChart}
                    colorClass="text-emerald-600"
                    bgColorClass="bg-emerald-50"
                    trend="+8% dari semester lalu"
                />
                <StatCard 
                    title="Nilai Rata-rata"
                    value={summaryCards.overallAverageGrade}
                    subtitle="Capaian akademik"
                    icon={Award}
                    colorClass="text-blue-600"
                    bgColorClass="bg-blue-50"
                    trend="+5 poin dari semester lalu"
                />
                <StatCard 
                    title="Jurnal Terisi"
                    value={`${summaryCards.totalJournals}`}
                    subtitle="Entri semester ini"
                    icon={BookOpen}
                    colorClass="text-purple-600"
                    bgColorClass="bg-purple-50"
                />
                <StatCard 
                    title="Total Pertemuan"
                    value="16"
                    subtitle="Selesai 15 dari 16"
                    icon={CalendarDays}
                    colorClass="text-amber-600"
                    bgColorClass="bg-amber-50"
                />
            </div>

            {/* 4. Filter Row */}
            <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex items-center gap-3 bg-slate-50 p-2 pl-4 rounded-2xl border border-slate-100 flex-1 w-full">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                <Users className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kelas</span>
                                <Select value={selectedClass} onValueChange={(v) => handleFilterChange('class', v)}>
                                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 font-black text-slate-900 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        {classes.map(c => <SelectItem key={c.id} value={c.id} className="py-3 font-bold">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 p-2 pl-4 rounded-2xl border border-slate-100 flex-1 w-full">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mata Pelajaran</span>
                                <Select value={selectedSubject} onValueChange={(v) => handleFilterChange('subject', v)}>
                                    <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 font-black text-slate-900 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        {subjects.map(s => <SelectItem key={s.id} value={s.id} className="py-3 font-bold">{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 p-2 pl-4 rounded-2xl border border-slate-100 flex-1 w-full">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                                <CalendarDays className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semester</span>
                                <div className="font-black text-slate-900 text-sm mt-0.5">Genap</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 5. Main Action Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-100/80 p-1.5 rounded-[2rem] h-14 w-full max-w-2xl shadow-inner border border-slate-200/50">
                        <TabsTrigger value="attendance" className="rounded-[1.5rem] flex-1 font-black text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300">Presensi</TabsTrigger>
                        <TabsTrigger value="grades" className="rounded-[1.5rem] flex-1 font-black text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300">Nilai</TabsTrigger>
                        <TabsTrigger value="journal" className="rounded-[1.5rem] flex-1 font-black text-xs uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all duration-300">Jurnal</TabsTrigger>
                    </TabsList>
                </div>

                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="rounded-[3rem] border-0 shadow-2xl overflow-hidden bg-white min-h-[400px]">
                        <CardHeader className="p-8 sm:p-12 text-center space-y-6">
                            <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
                                <div className={cn(
                                    "p-8 rounded-[2.5rem] shadow-inner",
                                    activeTab === 'attendance' ? "bg-emerald-50 text-emerald-600" :
                                    activeTab === 'grades' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                )}>
                                    {activeTab === 'attendance' ? <Users className="h-14 w-14" /> :
                                     activeTab === 'grades' ? <ClipboardList className="h-14 w-14" /> : <BookCheck className="h-14 w-14" />}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                                        {activeTab === 'attendance' ? 'Rekap Presensi' :
                                         activeTab === 'grades' ? 'Leger Nilai' : 'Log Jurnal Mengajar'}
                                    </h3>
                                    <p className="text-slate-500 font-bold text-sm leading-relaxed">
                                        {activeTab === 'attendance' ? 'Matriks kehadiran siswa berdasarkan nomor pertemuan selama satu semester penuh.' :
                                         activeTab === 'grades' ? 'Daftar nilai akademik siswa yang dapat difilter berdasarkan jenis penilaian.' : 
                                         'Rekapitulasi seluruh aktivitas KBM selama satu semester untuk dokumen supervisi.'}
                                    </p>
                                </div>
                                
                                {activeTab === 'grades' && (
                                    <div className="w-full space-y-2 text-left bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Saring Penilaian</Label>
                                        <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                                            <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200 font-bold text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                                <SelectItem value="all" className="font-bold">Semua Penilaian Semester</SelectItem>
                                                {uniqueAssessments.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                                    <Button 
                                        onClick={() => handleDownloadPdf(activeTab as any)} 
                                        disabled={downloading}
                                        className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 text-base font-black uppercase tracking-widest gap-3"
                                    >
                                        {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                                        Cetak PDF
                                    </Button>
                                    {activeTab === 'grades' && (
                                        <Button 
                                            onClick={handleDownloadExcel}
                                            disabled={downloading}
                                            variant="outline"
                                            className="flex-1 h-14 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-2xl text-base font-black uppercase tracking-widest gap-3 bg-white"
                                        >
                                            <FileSpreadsheet className="h-5 w-5" />
                                            Excel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </motion.div>
            </Tabs>
        </div>
    </div>
  );
}
