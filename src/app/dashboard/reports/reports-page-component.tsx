
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
    Printer
} from "lucide-react";
import type { Class, Subject, Profile, SchoolYear } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { getReportsData } from "@/lib/data";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

type ReportsData = NonNullable<Awaited<ReturnType<typeof getReportsData>>>;

const monthsGanjil = [{ value: "7", label: 'Juli' }, { value: "8", label: 'Agustus' }, { value: "9", label: 'September' }, { value: "10", label: 'Oktober' }, { value: "11", label: 'November' }, { value: "12", label: 'Desember' }];
const monthsGenap = [{ value: "1", label: 'Januari' }, { value: "2", label: 'Februari' }, { value: "3", label: 'Maret' }, { value: "4", label: 'April' }, { value: "5", label: 'Mei' }, { value: "6", label: 'Juni' }];
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

  const [selectedClass, setSelectedClass] = React.useState(searchParams.get('class') || "all");
  const [selectedSubject, setSelectedSubject] = React.useState(searchParams.get('subject') || "all");
  const [downloading, setDownloading] = React.useState(false);
  
  const currentSchoolYearId = searchParams.get('schoolYear') || reportsData.summaryCards.activeSchoolYearId || "all";
  const currentMonth = searchParams.get('month') || "all";

  const handleFilterChange = React.useCallback(
    (key: 'schoolYear' | 'month' | 'class' | 'subject', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') params.delete(key); else params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );
  
  const { summaryCards, attendanceHistory, gradeHistory, journalEntries } = reportsData;
  
  const selectedSchoolYear = schoolYears.find(sy => sy.id === currentSchoolYearId);
  const availableMonths = React.useMemo(() => {
    if (!selectedSchoolYear) return allMonths;
    return selectedSchoolYear.name.toLowerCase().includes('ganjil') ? monthsGanjil : monthsGenap;
  }, [selectedSchoolYear]);

  const handleDownloadPdf = async (type: 'attendance' | 'grades' | 'journal') => {
    setDownloading(true);
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const generateContent = () => {
        if (schoolProfile) {
            doc.setFontSize(16).setFont(undefined, 'bold');
            doc.text((schoolProfile.school_name || "LAKUKELAS").toUpperCase(), margin + 25, margin + 8);
            doc.setFontSize(10).setFont(undefined, 'normal');
            doc.text(schoolProfile.school_address || "Alamat Sekolah", margin + 25, margin + 14);
            doc.setLineWidth(0.5);
            doc.line(margin, margin + 22, pageWidth - margin, margin + 22);
        }

        let title = "";
        let head: any[][] = [];
        let body: any[][] = [];

        if (type === 'attendance') {
            title = "LAPORAN REKAPITULASI PRESENSI SISWA";
            head = [['No', 'Tanggal', 'Siswa', 'Kelas', 'Mapel', 'Status']];
            body = attendanceHistory.map((h, i) => [i + 1, format(parseISO(h.date), 'dd/MM/yyyy'), h.student_name || 'N/A', h.class_name, h.subject_name, h.status]);
        } else if (type === 'grades') {
            title = "LAPORAN LEGER NILAI SISWA";
            head = [['No', 'Nama Siswa', 'Kelas', 'Mapel', 'Jenis Penilaian', 'Nilai']];
            body = gradeHistory.map((g, i) => [i + 1, g.student_name || 'N/A', g.class_name, g.subject_name, g.assessment_type, g.score]);
        } else {
            title = "LAPORAN JURNAL MENGAJAR GURU";
            head = [['No', 'Tanggal', 'Kelas', 'Mapel', 'Tujuan Pembelajaran']];
            body = journalEntries.map((j, i) => [i + 1, format(parseISO(j.date), 'dd/MM/yyyy'), j.className, j.subjectName, j.learning_objectives]);
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
        doc.text(`Dicetak pada: ${today}`, margin, finalY - 5);
        
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
        img.onload = () => { doc.addImage(img, 'PNG', margin, margin, 20, 20); generateContent(); };
        img.onerror = () => generateContent();
    } else {
        generateContent();
    }
  };

  return (
    <div className="space-y-8 p-1 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <HandWrittenTitle title="Laporan Akademik" subtitle="Pusat Pencetakan Dokumen" className="py-4 md:py-6" />
        </div>
        
        <Card className="rounded-[2rem] border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 shadow-inner">
                        <Filter className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Filter Laporan</CardTitle>
                        <CardDescription>Pilih kriteria data sebelum mengunduh laporan.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tahun Ajaran</Label>
                        <Select value={currentSchoolYearId} onValueChange={(v) => handleFilterChange('schoolYear', v)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                {schoolYears.map(sy => <SelectItem key={sy.id} value={sy.id} className="py-3 font-bold">{sy.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Bulan</Label>
                        <Select value={currentMonth} onValueChange={(v) => handleFilterChange('month', v)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                <SelectItem value="all" className="py-3 font-bold">Semua Bulan</SelectItem>
                                {availableMonths.map(m => <SelectItem key={m.value} value={m.value} className="py-3 font-bold">{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Kelas</Label>
                        <Select value={selectedClass} onValueChange={(v) => handleFilterChange('class', v)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                <SelectItem value="all" className="py-3 font-bold">Semua Kelas</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={c.id} className="py-3 font-bold">{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mata Pelajaran</Label>
                        <Select value={selectedSubject} onValueChange={(v) => handleFilterChange('subject', v)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                <SelectItem value="all" className="py-3 font-bold">Semua Mapel</SelectItem>
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
                    <Badge variant="outline" className="w-fit bg-emerald-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Kehadiran</Badge>
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
                    <Badge variant="outline" className="w-fit bg-blue-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Akademik</Badge>
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
                    <Badge variant="outline" className="w-fit bg-purple-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Administrasi</Badge>
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
                <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 shadow-inner">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Data Presensi</CardTitle>
                                <CardDescription>Data mentah presensi siswa sebelum dicetak.</CardDescription>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('attendance')} 
                            disabled={downloading || attendanceHistory.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-11 px-6 font-bold"
                        >
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            Unduh PDF Presensi
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold py-5 px-8">Tanggal</TableHead>
                                        <TableHead className="font-bold">Nama Siswa</TableHead>
                                        <TableHead className="font-bold">Mata Pelajaran</TableHead>
                                        <TableHead className="text-center font-bold">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceHistory.slice(0, 20).map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="py-4 px-8 font-medium text-slate-500">{format(parseISO(record.date), 'dd MMM yyyy')}</TableCell>
                                            <TableCell className="font-bold text-slate-900">{record.student_name || 'Siswa'}</TableCell>
                                            <TableCell className="text-slate-600 text-sm font-medium">{record.subject_name}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={cn(
                                                    "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                                                    record.status === 'Hadir' ? "bg-emerald-100 text-emerald-700" :
                                                    record.status === 'Alpha' ? "bg-red-100 text-red-700" :
                                                    "bg-blue-100 text-blue-700"
                                                )}>
                                                    {record.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="grades" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shadow-inner">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Leger Nilai</CardTitle>
                                <CardDescription>Daftar perolehan skor akademik siswa.</CardDescription>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('grades')} 
                            disabled={downloading || gradeHistory.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-11 px-6 font-bold"
                        >
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            Unduh PDF Nilai
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold py-5 px-8">Siswa</TableHead>
                                        <TableHead className="font-bold">Mata Pelajaran</TableHead>
                                        <TableHead className="font-bold">Asesmen</TableHead>
                                        <TableHead className="text-center font-bold">Skor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gradeHistory.slice(0, 20).map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="py-4 px-8 font-bold text-slate-900">{record.student_name || 'Siswa'}</TableCell>
                                            <TableCell className="text-slate-600 text-sm font-medium">{record.subject_name}</TableCell>
                                            <TableCell className="text-slate-500 text-xs font-bold uppercase">{record.assessment_type}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    "text-lg font-black",
                                                    record.score >= (record.subject_kkm || 75) ? "text-emerald-600" : "text-red-600"
                                                )}>
                                                    {record.score}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="journal" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 shadow-inner">
                                <BookCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Log Jurnal Mengajar</CardTitle>
                                <CardDescription>Catatan proses belajar mengajar harian.</CardDescription>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('journal')} 
                            disabled={downloading || journalEntries.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-11 px-6 font-bold"
                        >
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            Unduh PDF Jurnal
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold py-5 px-8">Tanggal</TableHead>
                                        <TableHead className="font-bold">Kelas/Mapel</TableHead>
                                        <TableHead className="font-bold">Tujuan Pembelajaran</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {journalEntries.map((journal) => (
                                        <TableRow key={journal.id}>
                                            <TableCell className="py-4 px-8 font-medium text-slate-500">{format(parseISO(journal.date), 'dd/MM/yy')}</TableCell>
                                            <TableCell>
                                                <p className="font-bold text-slate-900 leading-tight">{journal.className}</p>
                                                <p className="text-[10px] font-bold text-indigo-500 uppercase">{journal.subjectName}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-slate-600 line-clamp-1 max-w-md">{journal.learning_objectives}</p>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
