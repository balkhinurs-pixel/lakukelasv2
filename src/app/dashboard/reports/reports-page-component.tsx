
"use client"

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle, Award, Download, Sparkles, BookCheck, TrendingDown, UserX, UserCheck, FileSpreadsheet } from "lucide-react";
import type { Class, Student, Subject, JournalEntry, Profile, SchoolYear } from "@/lib/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useActivation } from "@/hooks/use-activation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { getReportsData } from "@/lib/data";


// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const COLORS = ['#22c55e', '#f97316', '#0ea5e9', '#ef4444']; // Hadir, Sakit, Izin, Alpha

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, fill }: any) => {
  const radius = outerRadius + 15; // Position the label outside the pie
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill={fill} // Use the slice color for the text
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

type ReportsData = NonNullable<Awaited<ReturnType<typeof getReportsData>>>;

export default function ReportsPageComponent({
    classes,
    subjects,
    schoolYears,
    reportsData,
    profile
}: {
    classes: Class[];
    subjects: Subject[];
    schoolYears: SchoolYear[];
    reportsData: ReportsData;
    profile: Profile;
}) {
  const [selectedClass, setSelectedClass] = React.useState("all");
  const [selectedSubject, setSelectedSubject] = React.useState("all");
  const [selectedSchoolYear, setSelectedSchoolYear] = React.useState(profile.active_school_year_id || "all");
  const { isPro, limits } = useActivation();
  const { toast } = useToast();

  const {
      summaryCards,
      studentPerformance,
      attendanceByClass,
      overallAttendanceDistribution,
      journalEntries,
      attendanceHistory,
      gradeHistory,
      allStudents
  } = reportsData;

  const pieData = Object.entries(overallAttendanceDistribution).map(([name, value]) => ({name, value}));

    const handleDownloadAttendance = async () => {
        if (!limits.canDownloadPdf) {
            toast({ title: "Fitur Akun Pro", description: "Unduh laporan PDF adalah fitur Pro.", variant: "destructive" });
            return;
        }
        if (selectedClass === 'all' || selectedSubject === 'all') {
            toast({ title: "Filter Dibutuhkan", description: "Silakan pilih Kelas dan Mata Pelajaran untuk mengunduh laporan kehadiran.", variant: "destructive"});
            return;
        }

        const doc = new jsPDF() as jsPDFWithAutoTable;
        const title = 'REKAPITULASI KEHADIRAN SISWA';

        const filteredStudents = allStudents.filter(s => s.class_id === selectedClass);
        const filteredHistory = attendanceHistory.filter(h => h.class_id === selectedClass && h.subject_id === selectedSubject);

        const tableBody = filteredStudents.map((student, index) => {
            const studentRecords = filteredHistory.flatMap(h => h.records).filter(r => r.studentId === student.id);
            const hadir = studentRecords.filter(r => r.status === 'Hadir').length;
            const sakit = studentRecords.filter(r => r.status === 'Sakit').length;
            const izin = studentRecords.filter(r => r.status === 'Izin').length;
            const alpha = studentRecords.filter(r => r.status === 'Alpha').length;
            const total = hadir + sakit + izin + alpha;
            return [index + 1, student.name, hadir, sakit, izin, alpha, total];
        });
        
        const activeSchoolYear = schoolYears.find(sy => sy.id === selectedSchoolYear);

        await downloadPdf(doc, { 
            title: title, 
            head: [['No', 'Nama Siswa', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpha (A)', 'Total']],
            body: tableBody,
        }, {
            tahunAjaran: activeSchoolYear?.name || profile.active_school_year_name || "-"
        });
    }

    const handleDownloadGrades = async () => {
        if (!limits.canDownloadPdf) {
            toast({ title: "Fitur Akun Pro", description: "Unduh PDF adalah fitur Pro.", variant: "destructive" });
            return;
        }
        if (selectedClass === 'all' || selectedSubject === 'all') {
            toast({ title: "Filter Dibutuhkan", description: "Silakan pilih Kelas dan Mata Pelajaran untuk mengunduh laporan nilai.", variant: "destructive"});
            return;
        }

        const doc = new jsPDF() as jsPDFWithAutoTable;
        const title = 'DAFTAR NILAI SISWA';
        const subject = subjects.find(s => s.id === selectedSubject);
        const kkm = subject?.kkm || 75;

        const filteredStudents = allStudents.filter(s => s.class_id === selectedClass);
        const filteredGradeHistory = gradeHistory.filter(h => h.class_id === selectedClass && h.subject_id === selectedSubject);
        
        const assessments = [...new Set(filteredGradeHistory.map(h => h.assessment_type))];
        const head = [['No', 'Nama Siswa', ...assessments, 'Rata-rata', 'Predikat']];

        const tableBody = filteredStudents.map((student, index) => {
            const row = [index + 1, student.name];
            let totalScore = 0;
            let scoreCount = 0;

            assessments.forEach(assessment => {
                const gradeEntry = filteredGradeHistory.find(h => h.assessment_type === assessment);
                const studentRecord = gradeEntry?.records.find(r => r.studentId === student.id);
                const score = studentRecord ? Number(studentRecord.score) : '-';
                if (typeof score === 'number') {
                    totalScore += score;
                    scoreCount++;
                }
                row.push(score);
            });

            const average = scoreCount > 0 ? (totalScore / scoreCount).toFixed(2) : '-';
            const predicate = typeof average === 'string' ? '-' : (parseFloat(average) >= kkm ? 'Tuntas' : 'Remedial');
            row.push(average);
            row.push(predicate);

            return row;
        });
        
        const activeSchoolYear = schoolYears.find(sy => sy.id === selectedSchoolYear);

        await downloadPdf(doc, { 
            title: title, 
            head: head,
            body: tableBody,
        }, {
            tahunAjaran: activeSchoolYear?.name || profile.active_school_year_name || "-"
        });
    }

    const handleDownloadGradesExcel = () => {
        if (!isPro) {
            toast({ title: "Fitur Akun Pro", description: "Unduh laporan Excel adalah fitur Pro.", variant: "destructive" });
            return;
        }
        if (selectedClass === 'all' || selectedSubject === 'all') {
            toast({ title: "Filter Dibutuhkan", description: "Silakan pilih Kelas dan Mata Pelajaran untuk mengunduh laporan nilai.", variant: "destructive" });
            return;
        }

        const activeClass = classes.find(c => c.id === selectedClass);
        const activeSubject = subjects.find(s => s.id === selectedSubject);
        const activeSchoolYear = schoolYears.find(sy => sy.id === selectedSchoolYear);
        const kkm = activeSubject?.kkm || 75;

        // --- Data Preparation ---
        const filteredStudents = allStudents.filter(s => s.class_id === selectedClass);
        const filteredGradeHistory = gradeHistory.filter(h => h.class_id === selectedClass && h.subject_id === selectedSubject);
        const assessments = [...new Set(filteredGradeHistory.map(h => h.assessment_type))];

        const data: (string | number)[][] = [];

        // --- Header ---
        data.push(['DAFTAR NILAI SISWA']);
        data.push([`Mata Pelajaran: ${activeSubject?.name || 'Semua Mapel'}`]);
        data.push([`Kelas: ${activeClass?.name || 'Semua Kelas'}`]);
        data.push([`Tahun Ajaran: ${activeSchoolYear?.name || profile.active_school_year_name || "-"}`]);
        data.push([`KKM: ${kkm}`]);
        data.push([]); // Spacer row

        // --- Table Header ---
        const tableHeader = ['No', 'Nama Siswa', ...assessments, 'Rata-rata', 'Predikat'];
        data.push(tableHeader);

        // --- Table Body ---
        filteredStudents.forEach((student, index) => {
            const row: (string | number)[] = [index + 1, student.name];
            let totalScore = 0;
            let scoreCount = 0;

            assessments.forEach(assessment => {
                const gradeEntry = filteredGradeHistory.find(h => h.assessment_type === assessment);
                const studentRecord = gradeEntry?.records.find(r => r.studentId === student.id);
                const score = studentRecord ? Number(studentRecord.score) : '';
                if (typeof score === 'number') {
                    totalScore += score;
                    scoreCount++;
                }
                row.push(score);
            });

            const average = scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(2)) : '';
            const predicate = typeof average === 'number' ? (average >= kkm ? 'Tuntas' : 'Remedial') : '';
            row.push(average);
            row.push(predicate);
            data.push(row);
        });

        // --- Create Worksheet and Workbook ---
        const ws = XLSX.utils.aoa_to_sheet(data);

        // --- Styling ---
        const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center", vertical: "center" } };
        const titleStyle = { font: { bold: true, sz: 16 } };
        const subtitleStyle = { font: { bold: true } };
        const centeredStyle = { alignment: { horizontal: "center" } };

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: tableHeader.length - 1 } }, // Title
        ];

        // Apply styles
        ws['A1'].s = titleStyle;
        ws['A2'].s = subtitleStyle;
        ws['A3'].s = subtitleStyle;
        ws['A4'].s = subtitleStyle;
        ws['A5'].s = subtitleStyle;

        const tableHeaderRange = XLSX.utils.decode_range(`A7:${XLSX.utils.encode_col(tableHeader.length - 1)}7`);
        for (let C = tableHeaderRange.s.c; C <= tableHeaderRange.e.c; ++C) {
            const cell_address = { c: C, r: tableHeaderRange.s.r };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!ws[cell_ref]) ws[cell_ref] = {};
            ws[cell_ref].s = headerStyle;
        }

        // --- Conditional Formatting & Cell Styles ---
        const dataRange = { s: { r: 7, c: 2 }, e: { r: 6 + filteredStudents.length, c: 2 + assessments.length - 1 } };
        for (let R = dataRange.s.r; R <= dataRange.e.r; ++R) {
             // Center 'No' column
            const noCellRef = XLSX.utils.encode_cell({c: 0, r: R});
            if(ws[noCellRef]) ws[noCellRef].s = centeredStyle;

            for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
                const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cell_ref] || ws[cell_ref].v === '') continue;
                
                const score = Number(ws[cell_ref].v);
                if (!isNaN(score)) {
                    ws[cell_ref].s = {
                        fill: { fgColor: { rgb: score < kkm ? "FFD2D2" : "D2FFD2" } },
                        alignment: { horizontal: "center" }
                    };
                }
            }
        }
        
        // --- Column Widths ---
        const cols = [{ wch: 5 }, { wch: 35 }]; // 'No' and 'Nama Siswa'
        assessments.forEach(() => cols.push({ wch: 15 }));
        cols.push({ wch: 10 }, { wch: 12 }); // Rata-rata, Predikat
        ws['!cols'] = cols;

        // --- Generate and Download ---
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Nilai");
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        
        function s2ab(s: any) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }

        saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), `laporan_nilai_${activeClass?.name || 'semua'}.xlsx`);
    }
  
  const handleDownloadJournal = async () => {
    if (!limits.canDownloadPdf) {
        toast({ title: "Fitur Akun Pro", description: "Unduh PDF adalah fitur Pro.", variant: "destructive" });
        return;
    }

    const doc = new jsPDF() as jsPDFWithAutoTable;
    const title = 'JURNAL MENGAJAR GURU';
    
    const filteredJournals = journalEntries.filter(j => 
      (selectedClass === 'all' || j.class_id === selectedClass) &&
      (selectedSubject === 'all' || j.subject_id === selectedSubject)
    );
    
    const activeSchoolYear = schoolYears.find(sy => sy.id === selectedSchoolYear);

    await downloadPdf(doc, { title: title, journals: filteredJournals }, {
        tahunAjaran: activeSchoolYear?.name || profile.active_school_year_name || "-"
    });
  }


  const downloadPdf = async (doc: jsPDFWithAutoTable, content: {title: string, head?: any[][], body?: any[][], journals?: any[]}, meta?: Record<string, string | undefined>) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let finalY = margin;
    const pageBottomMargin = 25;

    const schoolData = {
        logo: profile.school_logo_url || "https://placehold.co/100x100.png",
        name: profile.school_name || "Nama Sekolah Belum Diatur",
        address: profile.school_address || "Alamat Sekolah Belum Diatur",
        headmasterName: profile.headmaster_name || "Nama Kepsek Belum Diatur",
        headmasterNip: profile.headmaster_nip || "-",
    };

    const teacherData = {
        name: profile.full_name || "Nama Guru",
        nip: profile.nip || "-"
    };

    // --- Add Header ---
    const addHeader = (docInstance: jsPDF) => {
        docInstance.setFontSize(14).setFont(undefined, 'bold');
        docInstance.text((schoolData.name || '').toUpperCase(), margin + 25, margin + 8);
        docInstance.setFontSize(10).setFont(undefined, 'normal');
        docInstance.text(schoolData.address, margin + 25, margin + 14);
        docInstance.setLineWidth(0.5);
        docInstance.line(margin, margin + 25, pageWidth - margin, margin + 25);
    }

    const addFooter = (docInstance: jsPDFWithAutoTable) => {
        const pageCount = (docInstance.internal as any).getNumberOfPages();
        docInstance.setFontSize(8).setFont(undefined, 'italic');
        for (let i = 1; i <= pageCount; i++) {
            docInstance.setPage(i);
            const text = `Halaman ${i} dari ${pageCount}`;
            docInstance.text(text, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }
    }
    
    try {
        const response = await fetch(schoolData.logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // Add logo only to the first page's header
            doc.addImage(base64data, 'PNG', margin, margin, 20, 20);
            generateContent();
        };
    } catch (error) {
        console.error("Error fetching logo, proceeding without it.", error);
        generateContent();
    }
    
    const generateContent = () => {
        // --- PAGE 1 SETUP ---
        addHeader(doc);
        finalY = margin + 25;

        doc.setFontSize(12).setFont(undefined, 'bold');
        doc.text(content.title, pageWidth / 2, finalY + 10, { align: 'center' });
        finalY += 15;

        if (meta) {
            doc.setFontSize(10).setFont(undefined, 'normal');
            const metaYStart = finalY;
            const activeClass = classes.find(c => c.id === selectedClass);
            const activeSubject = subjects.find(s => s.id === selectedSubject);

            doc.text(`Mata Pelajaran`, margin, metaYStart);
            doc.text(`: ${activeSubject?.name || 'Semua Mapel'}`, margin + 35, metaYStart);
            doc.text(`Kelas`, margin, metaYStart + 5);
            doc.text(`: ${activeClass?.name || 'Semua Kelas'}`, margin + 35, metaYStart + 5);
            doc.text(`Tahun Ajaran`, pageWidth / 2, metaYStart);
            doc.text(`: ${meta.tahunAjaran || '-'}`, pageWidth / 2 + 35, metaYStart);
            finalY = metaYStart + 15;
        }

        // --- CONTENT GENERATION ---
        if (content.head && content.body) {
             doc.autoTable({
                head: content.head,
                body: content.body,
                startY: finalY,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1, cellWidth: 'auto' },
                didDrawPage: (data) => {
                    // This function is called for every page the table creates, but NOT for the first one.
                    // We DON'T add a header here to subsequent pages.
                    finalY = data.cursor?.y || margin;
                }
            });
            finalY = (doc.lastAutoTable as any).finalY;
        } else if (content.journals) {
            finalY += 5;
            doc.setFontSize(10);
            
            content.journals.forEach((entry, index) => {
                if (finalY > pageHeight - 60) {
                    doc.addPage();
                    finalY = margin;
                }
                doc.setFont(undefined, 'bold');
                const entryHeader = `JURNAL KE-${index + 1}: ${entry.subjectName} - ${entry.className}`;
                doc.text(entryHeader, margin, finalY);
                finalY += 6;
                
                doc.setFont(undefined, 'normal');
                const entryMeta = `Tanggal: ${format(new Date(entry.date), "eeee, dd MMMM yyyy", { locale: id })} | Pertemuan ke-${entry.meeting_number || 'N/A'}`;
                doc.text(entryMeta, margin, finalY);
                finalY += 8;

                const addSection = (title: string, text: string) => {
                    if (!text) return;
                    const textLines = doc.splitTextToSize(text, pageWidth - margin * 2);
                    
                    doc.setFont(undefined, 'bold');
                    doc.text(title, margin, finalY);
                    finalY += 5;
                    doc.setFont(undefined, 'normal');
                    
                    textLines.forEach((line: string) => {
                         if (finalY > pageHeight - pageBottomMargin) {
                            doc.addPage();
                            finalY = margin;
                        }
                        doc.text(line, margin, finalY);
                        finalY += 5; // line height
                    });
                    finalY += 4;
                }

                addSection("A. Tujuan Pembelajaran", entry.learning_objectives);
                addSection("B. Kegiatan Pembelajaran (Sintaks)", entry.learning_activities);
                addSection("C. Penilaian (Asesmen)", entry.assessment || '-');
                addSection("D. Refleksi & Tindak Lanjut", entry.reflection || '-');

                finalY += 5;
                if (finalY < pageHeight - pageBottomMargin) {
                    doc.setLineDashPattern([1, 1], 0);
                    doc.line(margin, finalY, pageWidth - margin, finalY);
                    doc.setLineDashPattern([], 0);
                    finalY += 8;
                }
            });
        }
        
        // --- SIGNATURE AND FOOTER ---
        let signatureY = finalY + 15;
        if (signatureY > pageHeight - 50) {
            doc.addPage();
            finalY = margin;
            signatureY = finalY + 15;
        }

        const todayDate = format(new Date(), "eeee, dd MMMM yyyy", { locale: id });
        const city = schoolData.address.split(',')[1]?.trim() || "Kota";

        doc.setFontSize(10);
        doc.text(`${city}, ${todayDate}`, pageWidth - margin, signatureY, { align: 'right' });
        
        const signatureXLeft = margin;
        const signatureXRight = pageWidth - margin;
        const signatureYBase = signatureY + 8;
        
        doc.text("Mengetahui,", signatureXLeft, signatureYBase, { align: 'left'});
        doc.text("Guru Mata Pelajaran,", signatureXRight, signatureYBase, { align: 'right'});
        doc.text("Kepala Sekolah", signatureXLeft, signatureYBase + 5, { align: 'left'});

        const signatureYName = signatureYBase + 30;
        doc.setFont(undefined, 'bold').text(schoolData.headmasterName, signatureXLeft, signatureYName, { align: 'left'});
        doc.setFont(undefined, 'normal').text(`NIP. ${schoolData.headmasterNip}`, signatureXLeft, signatureYName + 5, { align: 'left'});

        doc.setFont(undefined, 'bold').text(teacherData.name, signatureXRight, signatureYName, { align: 'right'});
        doc.setFont(undefined, 'normal').text(`NIP. ${teacherData.nip}`, signatureXRight, signatureYName + 5, { align: 'right'});
        
        // Add footer to all pages after content is generated
        addFooter(doc);

        doc.save(`${content.title.toLowerCase().replace(/ /g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Sangat Baik':
            return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
        case 'Stabil':
            return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
        case 'Butuh Perhatian':
            return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
        case 'Berisiko':
            return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
        default:
            return "bg-muted text-muted-foreground";
    }
  }

  const CommonFilters = () => (
    <div className="mt-4 flex flex-col sm:flex-row gap-2 flex-wrap">
        <Select value={selectedSchoolYear} onValueChange={setSelectedSchoolYear}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {schoolYears.map(sy => <SelectItem key={sy.id} value={sy.id}>{sy.name}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
        </Select>
         <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Pilih Mapel" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Mapel</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
        </Select>
    </div>
  )

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-2xl font-bold font-headline">Laporan Akademik</h1>
                <p className="text-muted-foreground">Analisis komprehensif tentang kehadiran dan nilai siswa.</p>
            </div>
        </div>

         {!isPro && (
            <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Dapatkan Laporan Profesional dengan Akun Pro</AlertTitle>
                <AlertDescription>
                    Aktivasi akun Pro untuk dapat mengunduh semua laporan dalam format PDF profesional dengan kop surat sekolah Anda.
                    <Button variant="link" className="p-0 h-auto ml-1" asChild>
                        <Link href="/dashboard/activation">Aktivasi sekarang</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )}

        <Tabs defaultValue="summary">
            <div className="overflow-x-auto">
                <TabsList className="w-full sm:w-auto justify-start">
                    <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                    <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
                    <TabsTrigger value="grades">Nilai</TabsTrigger>
                    <TabsTrigger value="journal">Jurnal</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="summary" className="mt-6 space-y-6">
                 <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tingkat Kehadiran Rata-rata</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryCards.overallAttendanceRate}%</div>
                            <p className="text-xs text-muted-foreground">Rata-rata semua kelas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Nilai</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryCards.overallAverageGrade}</div>
                            <p className="text-xs text-muted-foreground">Skor rata-rata semua penilaian</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Jurnal Mengajar Terisi</CardTitle>
                            <BookCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summaryCards.totalJournals}</div>
                            <p className="text-xs text-muted-foreground">Total jurnal yang telah dibuat</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Analisis Performa Siswa</CardTitle>
                        <CardDescription>Siswa dikelompokkan berdasarkan rata-rata nilai dan tingkat kehadiran.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {studentPerformance.map((student) => (
                                <div key={student.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{student.name}</p>
                                            <p className="text-sm text-muted-foreground">{student.class}</p>
                                        </div>
                                        <Badge variant="outline" className={cn("font-semibold text-xs", getStatusBadge(student.status))}>
                                            {student.status === 'Sangat Baik' && <TrendingUp className="mr-1 h-3 w-3" />}
                                            {student.status === 'Stabil' && <UserCheck className="mr-1 h-3 w-3" />}
                                            {student.status === 'Butuh Perhatian' && <TrendingDown className="mr-1 h-3 w-3" />}
                                            {student.status === 'Berisiko' && <UserX className="mr-1 h-3 w-3" />}
                                            {student.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-around text-center text-sm pt-2">
                                        <div>
                                            <p className="font-bold text-base">{student.average_grade}</p>
                                            <p className="text-xs text-muted-foreground">Rata-rata Nilai</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">{student.attendance}%</p>
                                            <p className="text-xs text-muted-foreground">Kehadiran</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Nama Siswa</TableHead>
                                    <TableHead>Kelas</TableHead>
                                    <TableHead className="text-center">Rata-rata Nilai</TableHead>
                                    <TableHead className="text-center">Kehadiran</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentPerformance.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.class}</TableCell>
                                        <TableCell className="text-center font-mono">{student.average_grade}</TableCell>
                                        <TableCell className="text-center font-mono">{student.attendance}%</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn("font-semibold", getStatusBadge(student.status))}>
                                                {student.status === 'Sangat Baik' && <TrendingUp className="mr-2 h-3 w-3" />}
                                                {student.status === 'Stabil' && <UserCheck className="mr-2 h-3 w-3" />}
                                                {student.status === 'Butuh Perhatian' && <TrendingDown className="mr-2 h-3 w-3" />}
                                                {student.status === 'Berisiko' && <UserX className="mr-2 h-3 w-3" />}
                                                {student.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {studentPerformance.length === 0 && (
                            <div className="text-center text-muted-foreground py-12">
                                <p>Belum ada data nilai atau kehadiran yang cukup untuk dianalisis.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Perbandingan Kehadiran Antar Kelas</CardTitle>
                            <CardDescription>Visualisasi persentase kehadiran untuk setiap status.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                             <div className="w-full overflow-x-auto">
                                <ResponsiveContainer width="100%" height={300} minWidth={500}>
                                    <BarChart data={attendanceByClass}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                                        <Bar dataKey="Hadir" stackId="a" fill="#22c55e" name="Hadir" />
                                        <Bar dataKey="Sakit" stackId="a" fill="#f97316" name="Sakit"/>
                                        <Bar dataKey="Izin" stackId="a" fill="#0ea5e9" name="Izin"/>
                                        <Bar dataKey="Alpha" stackId="a" fill="#ef4444" name="Alpha"/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Distribusi Kehadiran Umum</CardTitle>
                            <CardDescription>Proporsi setiap status kehadiran keseluruhan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend wrapperStyle={{fontSize: "12px", paddingTop: "20px"}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="attendance" className="mt-6">
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <CardTitle>Laporan Kehadiran Siswa</CardTitle>
                                <CardDescription>Pilih filter untuk mengunduh rekap kehadiran.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleDownloadAttendance} disabled={!isPro}>
                                <Download className="mr-2 h-4 w-4" />
                                Unduh PDF
                            </Button>
                        </div>
                        <CommonFilters />
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Data detail kehadiran siswa akan direkap di sini saat Anda mengunduh PDF.</p>
                            <p className="text-sm">Fitur ini memerlukan Akun Pro.</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="grades" className="mt-6">
                <Card>
                    <CardHeader>
                         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                               <CardTitle>Laporan Nilai Siswa</CardTitle>
                               <CardDescription>Pilih filter untuk mengunduh rekap nilai.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleDownloadGradesExcel} disabled={!isPro}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Unduh Excel
                                </Button>
                                <Button variant="outline" onClick={handleDownloadGrades} disabled={!isPro}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Unduh PDF
                                </Button>
                            </div>
                        </div>
                        <CommonFilters />
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Data detail nilai siswa akan direkap di sini saat Anda mengunduh PDF atau Excel.</p>
                            <p className="text-sm">Fitur ini memerlukan Akun Pro.</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="journal" className="mt-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <CardTitle>Laporan Jurnal Mengajar</CardTitle>
                                <CardDescription>Arsip semua jurnal mengajar yang telah Anda buat.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleDownloadJournal} disabled={!isPro}>
                                <Download className="mr-2 h-4 w-4" />
                                Unduh PDF
                            </Button>
                        </div>
                        <CommonFilters />
                    </CardHeader>
                    <CardContent>
                        {/* Mobile View */}
                         <div className="md:hidden space-y-4">
                            {journalEntries.map((entry) => (
                                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="space-y-1">
                                        <p className="font-semibold">{entry.subjectName}</p>
                                        <p className="text-sm text-muted-foreground">{entry.className} {entry.meeting_number ? `(P-${entry.meeting_number})` : ''}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(entry.date), "EEEE, dd MMM yyyy", { locale: id })}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{entry.learning_objectives}</p>
                                </div>
                            ))}
                         </div>
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[120px]">Tanggal</TableHead>
                                <TableHead>Info</TableHead>
                                <TableHead>Tujuan Pembelajaran</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {journalEntries
                                    .filter(j => 
                                        (selectedClass === 'all' || j.class_id === selectedClass) &&
                                        (selectedSubject === 'all' || j.subject_id === selectedSubject)
                                    )
                                    .map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">
                                    {format(new Date(entry.date), "EEEE, dd MMM yyyy", { locale: id })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{entry.subjectName}</div>
                                        <div className="text-sm text-muted-foreground">{entry.className} {entry.meeting_number ? `(P-${entry.meeting_number})` : ''}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <p className="line-clamp-2">{entry.learning_objectives}</p>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        </div>
                         {journalEntries.length === 0 && (
                            <div className="text-center text-muted-foreground py-12">
                                <p>Belum ada jurnal yang dibuat.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
