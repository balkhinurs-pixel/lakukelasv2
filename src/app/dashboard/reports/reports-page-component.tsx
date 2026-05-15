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
    FileSpreadsheet
} from "lucide-react";
import type { Class, Subject, Profile, SchoolYear } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { getGradesReportList, getJournalReportList, getAttendanceSemesterMatrix } from "@/lib/data";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { useToast } from "@/hooks/use-toast";

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
            if (schoolProfile) {
                doc.setFontSize(16).setFont('helvetica', 'bold');
                doc.text((schoolProfile.school_name || "LAKUKELAS").toUpperCase(), margin + 25, margin + 8);
                doc.setFontSize(10).setFont('helvetica', 'normal');
                doc.text(schoolProfile.school_address || "Alamat Sekolah", margin + 25, margin + 14);
                doc.setLineWidth(0.5);
                doc.line(margin, margin + 22, pageWidth - margin, margin + 22);
            }

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
            const city = schoolProfile?.school_address?.split(',')[1]?.trim() || "Kota";

            doc.setFontSize(10);
            doc.text(`${city}, ${today}`, pageWidth - margin - 60, finalY - 5);
            
            doc.text("Mengetahui,", margin + 20, finalY);
            doc.text("Kepala Sekolah,", margin + 20, finalY + 6);
            doc.text("Guru Mata Pelajaran,", pageWidth - margin - 60, finalY + 6);

            doc.setFont('helvetica', 'bold');
            doc.text(schoolProfile?.headmaster_name || "(...........................)", margin + 20, finalY + 32);
            doc.text(profile.full_name, pageWidth - margin - 60, finalY + 32);
            
            doc.setFont('helvetica', 'normal').setFontSize(9);
            doc.text(`NIP. ${schoolProfile?.headmaster_nip || "-"}`, margin + 20, finalY + 37);
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
    <div className="space-y-8 p-1 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <HandWrittenTitle title="Laporan Akademik" subtitle="Pusat Dokumentasi Administrasi" className="py-4 md:py-6" />
        </div>
        
        <Card className="rounded-xl border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 shadow-inner">
                        <Filter className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Filter Laporan</CardTitle>
                        <CardDescription>Tahun Ajaran Aktif: <span className="font-bold text-indigo-600">{summaryCards.activeSchoolYearName}</span></CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 rounded-xl shadow-lg border-2">
                <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit bg-emerald-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Presensi</Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-emerald-600">{summaryCards.overallAttendanceRate}%</p>
                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-bold">Rata-rata Semester</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 rounded-xl shadow-lg border-2">
                <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit bg-blue-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Nilai</Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-blue-600">{summaryCards.overallAverageGrade}</p>
                        <Award className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-bold">Rata-rata Semester</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 rounded-xl shadow-lg border-2">
                <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit bg-purple-500 text-white border-0 font-black text-[10px] tracking-[0.1em] uppercase px-3 py-1">Jurnal</Badge>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <p className="text-5xl font-black text-purple-600">{summaryCards.totalJournals}</p>
                        <FileText className="h-6 w-6 text-purple-400" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-bold">Total Semester Ini</p>
                </CardContent>
            </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto bg-slate-100 p-1.5 rounded-xl shadow-inner h-14">
                <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Presensi</TabsTrigger>
                <TabsTrigger value="grades" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Nilai</TabsTrigger>
                <TabsTrigger value="journal" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Jurnal</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-xl border-0 shadow-xl overflow-hidden bg-white p-8 md:p-12 text-center">
                    <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
                        <div className="p-6 rounded-xl bg-emerald-50 text-emerald-600 shadow-inner">
                            <Users className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900">Rekap Presensi Semester</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Matriks kehadiran siswa berdasarkan nomor pertemuan selama satu semester penuh.</p>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('attendance')} 
                            disabled={downloading}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 text-lg font-bold gap-3"
                        >
                            {downloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Printer className="h-6 w-6" />}
                            Cetak Laporan Presensi
                        </Button>
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="grades" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-xl border-0 shadow-xl overflow-hidden bg-white p-8 md:p-12 text-center">
                    <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
                        <div className="p-6 rounded-xl bg-blue-50 text-blue-600 shadow-inner">
                            <ClipboardList className="h-12 w-12" />
                        </div>
                        <div className="space-y-4 w-full">
                            <h3 className="text-2xl font-black text-slate-900">Leger Nilai Semester</h3>
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Saring Berdasarkan Ulangan</Label>
                                <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0 shadow-inner font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-0 shadow-2xl">
                                        <SelectItem value="all" className="font-bold">Semua Penilaian Semester</SelectItem>
                                        {uniqueAssessments.map(a => (
                                            <SelectItem key={a} value={a}>{a}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Button 
                                onClick={() => handleDownloadPdf('grades')} 
                                disabled={downloading}
                                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 text-lg font-bold gap-3"
                            >
                                {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                                Cetak PDF
                            </Button>
                            <Button 
                                onClick={handleDownloadExcel}
                                disabled={downloading}
                                variant="outline"
                                className="flex-1 h-14 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-2xl text-lg font-bold gap-3"
                            >
                                <FileSpreadsheet className="h-5 w-5" />
                                Excel
                            </Button>
                        </div>
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="journal" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-xl border-0 shadow-xl overflow-hidden bg-white p-8 md:p-12 text-center">
                    <div className="flex flex-col items-center max-w-md mx-auto space-y-6">
                        <div className="p-6 rounded-xl bg-purple-50 text-purple-600 shadow-inner">
                            <BookCheck className="h-12 w-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900">Log Jurnal Mengajar</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Rekapitulasi seluruh aktivitas KBM selama satu semester penuh untuk dokumen supervisi.</p>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('journal')} 
                            disabled={downloading}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 text-lg font-bold gap-3"
                        >
                            {downloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Printer className="h-6 w-6" />}
                            Cetak Jurnal Mengajar
                        </Button>
                    </div>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}