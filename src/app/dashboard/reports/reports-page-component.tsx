
"use client"

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
    CalendarDays,
    BookOpen,
    School,
    CheckCircle,
    Info
} from "lucide-react";
import type { Class, Subject, Profile, SchoolYear } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { getReportsData, getAttendanceReportList, getGradesReportList, getJournalReportList } from "@/lib/data";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { cn } from "@/lib/utils";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

type ReportsData = NonNullable<Awaited<ReturnType<typeof getReportsData>>>;

const monthsGanjil = [
    { value: "7", label: 'Juli' }, { value: "8", label: 'Agustus' }, 
    { value: "9", label: 'September' }, { value: "10", label: 'Oktober' }, 
    { value: "11", label: 'November' }, { value: "12", label: 'Desember' }
];
const monthsGenap = [
    { value: "1", label: 'Januari' }, { value: "2", label: 'Februari' }, 
    { value: "3", label: 'Maret' }, { value: "4", label: 'April' }, 
    { value: "5", label: 'Mei' }, { value: "6", label: 'Juni' }
];
const allMonths = [...monthsGenap, ...monthsGanjil].sort((a,b) => parseInt(a.value) - parseInt(b.value));

export default function ReportsPageComponent({
    classes,
    subjects,
    schoolYears,
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

  const [downloading, setDownloading] = React.useState(false);
  
  const currentMonth = searchParams.get('month') || String(new Date().getMonth() + 1);
  const selectedClass = searchParams.get('class') || (classes.length > 0 ? classes[0].id : "");
  const selectedSubject = searchParams.get('subject') || (subjects.length > 0 ? subjects[0].id : "");

  const handleFilterChange = React.useCallback(
    (key: 'month' | 'class' | 'subject', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );
  
  const { summaryCards } = reportsData;

  const handleDownloadPdf = async (type: 'attendance' | 'grades' | 'journal') => {
    if (!selectedClass || !selectedSubject) return;
    
    setDownloading(true);
    
    try {
        const filters = {
            schoolYearId: summaryCards.activeSchoolYearId,
            month: Number(currentMonth),
            classId: selectedClass,
            subjectId: selectedSubject
        };

        let head: any[][] = [];
        let body: any[][] = [];
        let title = "";

        if (type === 'attendance') {
            const data = await getAttendanceReportList(filters);
            title = "LAPORAN REKAPITULASI PRESENSI SISWA";
            head = [['No', 'Tanggal', 'Siswa', 'Kelas', 'Mapel', 'Status']];
            body = data.map((h: any, i: number) => [i + 1, format(parseISO(h.date), 'dd/MM/yyyy'), h.student_name || 'N/A', h.class_name, h.subject_name, h.status]);
        } else if (type === 'grades') {
            const data = await getGradesReportList(filters);
            title = "LAPORAN LEGER NILAI SISWA";
            head = [['No', 'Nama Siswa', 'Kelas', 'Mapel', 'Jenis Penilaian', 'Nilai']];
            body = data.map((g: any, i: number) => [i + 1, g.student_name || 'N/A', g.class_name, g.subject_name, g.assessment_type, g.score]);
        } else {
            const data = await getJournalReportList(filters);
            title = "LAPORAN JURNAL MENGAJAR GURU";
            head = [['No', 'Tanggal', 'Kelas', 'Mapel', 'Tujuan Pembelajaran']];
            body = data.map((j: any, i: number) => [i + 1, format(parseISO(j.date), 'dd/MM/yyyy'), j.className, j.subjectName, j.learning_objectives]);
        }

        const doc = new jsPDF() as jsPDFWithAutoTable;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;

        const generatePDFContent = () => {
            if (schoolProfile) {
                doc.setFontSize(16).setFont(undefined, 'bold');
                doc.text((schoolProfile.school_name || "LAKUKELAS").toUpperCase(), margin + 25, margin + 8);
                doc.setFontSize(10).setFont(undefined, 'normal');
                doc.text(schoolProfile.school_address || "Alamat Sekolah", margin + 25, margin + 14);
                doc.setLineWidth(0.5);
                doc.line(margin, margin + 22, pageWidth - margin, margin + 22);
            }

            doc.setFontSize(12).setFont(undefined, 'bold');
            doc.text(title, pageWidth / 2, margin + 35, { align: 'center' });
            
            doc.setFontSize(10).setFont(undefined, 'normal');
            doc.text(`Tahun Ajaran: ${summaryCards.activeSchoolYearName}`, margin, margin + 45);
            doc.text(`Guru Pengampu: ${profile.full_name}`, margin, margin + 50);

            doc.autoTable({
                head: head,
                body: body,
                startY: margin + 55,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: 255 },
                styles: { fontSize: 8 }
            });

            let finalY = (doc as any).lastAutoTable.finalY + 20;
            if (finalY > pageHeight - 60) { doc.addPage(); finalY = margin + 20; }

            const today = format(new Date(), 'dd MMMM yyyy', { locale: id });
            const city = schoolProfile?.school_address?.split(',')[1]?.trim() || "Kota";

            doc.text(`${city}, ${today}`, pageWidth - margin - 60, finalY - 5);
            
            doc.text("Mengetahui,", margin + 20, finalY);
            doc.text("Kepala Sekolah,", margin + 20, finalY + 6);
            doc.text("Guru Mata Pelajaran,", pageWidth - margin - 60, finalY + 6);

            doc.setFont(undefined, 'bold');
            doc.text(schoolProfile?.headmaster_name || "(...........................)", margin + 20, finalY + 35);
            doc.text(profile.full_name, pageWidth - margin - 60, finalY + 35);
            
            doc.setFont(undefined, 'normal');
            doc.text(`NIP. ${schoolProfile?.headmaster_nip || "-"}`, margin + 20, finalY + 40);
            doc.text(`NIP. ${profile.nip || "-"}`, pageWidth - margin - 60, finalY + 40);

            doc.save(`Laporan_${type}_${format(new Date(), 'yyyyMMdd')}.pdf`);
            setDownloading(false);
        };

        if (schoolProfile?.school_logo_url) {
            const img = new Image();
            img.src = schoolProfile.school_logo_url;
            img.crossOrigin = "Anonymous";
            img.onload = () => { 
                try { doc.addImage(img, 'PNG', margin, margin, 20, 20); } catch(e) {}
                generatePDFContent(); 
            };
            img.onerror = () => generatePDFContent();
        } else {
            generatePDFContent();
        }
    } catch (error) {
        console.error("Failed to generate report:", error);
        setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 p-1 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <HandWrittenTitle title="Laporan Akademik" subtitle="Pusat Dokumentasi Administrasi" className="py-4 md:py-6" />
        </div>
        
        <Card className="rounded-[2rem] border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 shadow-inner">
                        <Filter className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Filter Laporan</CardTitle>
                        <CardDescription>Tahun Ajaran: <span className="font-bold text-indigo-600">{summaryCards.activeSchoolYearName}</span></CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                            <CalendarDays className="w-3.5 h-3.5" /> Bulan Laporan
                        </Label>
                        <Select value={currentMonth} onValueChange={(v) => handleFilterChange('month', v)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus:ring-primary/20"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                {allMonths.map(m => <SelectItem key={m.value} value={m.value} className="py-3 font-bold">{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                            <School className="w-3.5 h-3.5" /> Pilih Kelas
                        </Label>
                        <Select value={selectedClass} onValueChange={(v) => handleFilterChange('class', v)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus:ring-primary/20"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                {classes.map(c => <SelectItem key={c.id} value={c.id} className="py-3 font-bold">{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5" /> Pilih Mata Pelajaran
                        </Label>
                        <Select value={selectedSubject} onValueChange={(v) => handleFilterChange('subject', v)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus:ring-primary/20"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                {subjects.map(s => <SelectItem key={s.id} value={s.id} className="py-3 font-bold">{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 rounded-[2rem] shadow-lg border-2">
                <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit bg-emerald-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Presensi</Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-emerald-600">{summaryCards.overallAttendanceRate}%</p>
                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 rounded-[2rem] shadow-lg border-2">
                <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit bg-blue-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Nilai</Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-blue-600">{summaryCards.overallAverageGrade}</p>
                        <Award className="h-6 w-6 text-blue-400" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 rounded-[2rem] shadow-lg border-2">
                <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit bg-purple-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Jurnal</Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-purple-600">{summaryCards.totalJournals}</p>
                        <FileText className="h-6 w-6 text-purple-400" />
                    </div>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner h-14">
                <TabsTrigger value="attendance" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Presensi</TabsTrigger>
                <TabsTrigger value="grades" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Nilai</TabsTrigger>
                <TabsTrigger value="journal" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Jurnal</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden bg-white p-8 md:p-12 text-center">
                    <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
                        <div className="p-6 rounded-[2rem] bg-emerald-50 text-emerald-600 shadow-inner">
                            <Users className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900">Laporan Presensi Siswa</h3>
                            <p className="text-slate-500 font-medium">Klik tombol di bawah untuk mengunduh rekapitulasi kehadiran siswa dalam format PDF resmi.</p>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('attendance')} 
                            disabled={downloading}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 text-lg font-bold gap-3"
                        >
                            {downloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Printer className="h-6 w-6" />}
                            Cetak Laporan Presensi
                        </Button>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">
                            <CheckCircle className="h-4 w-4 text-emerald-500" /> Data Siap Cetak
                        </div>
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="grades" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden bg-white p-8 md:p-12 text-center">
                    <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
                        <div className="p-6 rounded-[2rem] bg-blue-50 text-blue-600 shadow-inner">
                            <ClipboardList className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900">Leger Nilai Siswa</h3>
                            <p className="text-slate-500 font-medium">Klik tombol di bawah untuk mengunduh daftar perolehan skor akademik siswa dalam format PDF resmi.</p>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('grades')} 
                            disabled={downloading}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 text-lg font-bold gap-3"
                        >
                            {downloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Printer className="h-6 w-6" />}
                            Cetak Leger Nilai
                        </Button>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">
                            <CheckCircle className="h-4 w-4 text-emerald-500" /> Data Siap Cetak
                        </div>
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="journal" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-[2.5rem] border-0 shadow-xl overflow-hidden bg-white p-8 md:p-12 text-center">
                    <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
                        <div className="p-6 rounded-[2rem] bg-purple-50 text-purple-600 shadow-inner">
                            <BookCheck className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900">Log Jurnal Mengajar</h3>
                            <p className="text-slate-500 font-medium">Klik tombol di bawah untuk mengunduh catatan proses belajar mengajar harian Bapak/Ibu dalam format PDF resmi.</p>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('journal')} 
                            disabled={downloading}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 text-lg font-bold gap-3"
                        >
                            {downloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Printer className="h-6 w-6" />}
                            Cetak Jurnal Mengajar
                        </Button>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">
                            <CheckCircle className="h-4 w-4 text-emerald-500" /> Data Siap Cetak
                        </div>
                    </div>
                </Card>
            </TabsContent>
        </Tabs>
        
        <div className="max-w-xl mx-auto">
            <Card className="bg-blue-50/50 border-blue-100 rounded-3xl p-6">
                <div className="flex gap-4">
                    <div className="p-3 bg-blue-100 rounded-2xl h-fit">
                        <Info className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-blue-900">Sistem Hemat Data Aktif</h4>
                        <p className="text-sm text-blue-700 leading-relaxed">Pratinjau tabel siswa disembunyikan untuk menghemat penggunaan data internet Anda. Seluruh informasi tetap akan muncul secara lengkap pada file PDF yang diunduh.</p>
                    </div>
                </div>
            </Card>
        </div>
    </div>
  );
}
