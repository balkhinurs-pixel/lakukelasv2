

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle, Award, Download, BookCheck, TrendingDown, UserX, UserCheck, FileSpreadsheet, PieChart as PieChartIcon, BarChart2, Users2, Filter, Calendar, GraduationCap, BarChart3, FileText } from "lucide-react";
import type { Class, Student, Subject, JournalEntry, Profile, SchoolYear } from "@/lib/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { getReportsData } from "@/lib/data";
import { useRouter, usePathname, useSearchParams } from "next/navigation";


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

const EmptyStatePlaceholder = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full py-16">
        <Icon className="h-12 w-12 mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm mt-1">{description}</p>
    </div>
);


type ReportsData = NonNullable<Awaited<ReturnType<typeof getReportsData>>>;

const monthsGanjil = [
    { value: "7", label: 'Juli' }, { value: "8", label: 'Agustus' },
    { value: "9", label: 'September' }, { value: "10", label: 'Oktober' },
    { value: "11", label: 'November' }, { value: "12", label: 'Desember' }
];

const monthsGenap = [
    { value: "1", label: 'Januari' }, { value: "2", label: 'Februari' },
    { value: "3", label: 'Maret' }, { value: "4", label: 'April' },
    { value: "5", label: 'Mei' }, { value: "6", label: 'Juni' },
];

const allMonths = [...monthsGenap, ...monthsGanjil].sort((a,b) => parseInt(a.value) - parseInt(b.value));


export default function ReportsPageComponent({
    classes,
    subjects,
    schoolYears,
    reportsData,
    profile,
}: {
    classes: Class[];
    subjects: Subject[];
    schoolYears: SchoolYear[];
    reportsData: ReportsData;
    profile: Profile;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedClass, setSelectedClass] = React.useState(searchParams.get('class') || "all");
  const [selectedSubject, setSelectedSubject] = React.useState(searchParams.get('subject') || "all");
  const [isVisible, setIsVisible] = React.useState(false);
  
  const currentSchoolYearId = searchParams.get('schoolYear') || profile?.active_school_year_id || "all";
  const currentMonth = searchParams.get('month') || "all";

  const { toast } = useToast();

  // Animation trigger
  React.useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const handleFilterChange = React.useCallback(
    (key: 'schoolYear' | 'month' | 'class' | 'subject', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      // If we change school year, reset month if it's no longer valid
      if (key === 'schoolYear') {
        const newSchoolYear = schoolYears.find(sy => sy.id === value);
        const currentMonthValue = params.get('month');
        if (newSchoolYear && currentMonthValue) {
            const isGanjil = newSchoolYear.name.toLowerCase().includes('ganjil');
            const validMonths = isGanjil ? monthsGanjil.map(m => m.value) : monthsGenap.map(m => m.value);
            if (!validMonths.includes(currentMonthValue)) {
                params.delete('month');
            }
        }
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname, schoolYears]
  );
  
  React.useEffect(() => {
    setSelectedClass(searchParams.get('class') || "all");
    setSelectedSubject(searchParams.get('subject') || "all");
  }, [searchParams]);

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

    const selectedSchoolYear = schoolYears.find(sy => sy.id === currentSchoolYearId);
    const availableMonths = React.useMemo(() => {
        if (!selectedSchoolYear) return allMonths;
        if (selectedSchoolYear.name.toLowerCase().includes('ganjil')) return monthsGanjil;
        if (selectedSchoolYear.name.toLowerCase().includes('genap')) return monthsGenap;
        return allMonths;
    }, [selectedSchoolYear]);

  const pieData = Object.entries(overallAttendanceDistribution).map(([name, value]) => ({name, value})).filter(item => item.value > 0);

    const handleDownloadAttendance = async () => {
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
        
        const monthLabel = availableMonths.find(m => m.value === currentMonth)?.label;

        await downloadPdf(doc, { 
            title: title, 
            head: [['No', 'Nama Siswa', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpha (A)', 'Total']],
            body: tableBody,
        }, {
            tahunAjaran: selectedSchoolYear?.name || profile.active_school_year_name || "-",
            periode: monthLabel ? `Bulan: ${monthLabel}` : "Periode: Satu Semester"
        });
    }

    const handleDownloadGrades = async () => {
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
            const predicate = typeof average === 'string' || average === '-' ? '-' : (parseFloat(average) >= kkm ? 'Tuntas' : 'Remedial');
            row.push(average);
            row.push(predicate);

            return row;
        });
        
        const monthLabel = availableMonths.find(m => m.value === currentMonth)?.label;

        await downloadPdf(doc, { 
            title: title, 
            head: head,
            body: tableBody,
        }, {
            tahunAjaran: selectedSchoolYear?.name || profile.active_school_year_name || "-",
            periode: monthLabel ? `Bulan: ${monthLabel}` : "Periode: Satu Semester"
        });
    }

    const handleDownloadGradesExcel = () => {
        if (selectedClass === 'all' || selectedSubject === 'all') {
            toast({ title: "Filter Dibutuhkan", description: "Silakan pilih Kelas dan Mata Pelajaran untuk mengunduh laporan nilai.", variant: "destructive" });
            return;
        }

        const activeClass = classes.find(c => c.id === selectedClass);
        const activeSubject = subjects.find(s => s.id === selectedSubject);
        const activeSchoolYear = schoolYears.find(sy => sy.id === currentSchoolYearId);
        const kkm = activeSubject?.kkm || 75;
        const monthLabel = availableMonths.find(m => m.value === currentMonth)?.label;

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
        data.push([`Periode: ${monthLabel ? `Bulan ${monthLabel}` : 'Satu Semester'}`]);
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
        ['A2','A3','A4','A5','A6'].forEach(cell => { if(ws[cell]) ws[cell].s = subtitleStyle; });

        const tableHeaderRange = XLSX.utils.decode_range(`A8:${XLSX.utils.encode_col(tableHeader.length - 1)}8`);
        for (let C = tableHeaderRange.s.c; C <= tableHeaderRange.e.c; ++C) {
            const cell_address = { c: C, r: tableHeaderRange.s.r };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!ws[cell_ref]) ws[cell_ref] = {};
            ws[cell_ref].s = headerStyle;
        }

        // --- Conditional Formatting & Cell Styles ---
        const dataRange = { s: { r: 8, c: 2 }, e: { r: 7 + filteredStudents.length, c: 2 + assessments.length - 1 } };
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
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const title = 'JURNAL MENGAJAR GURU';
    
    const filteredJournals = journalEntries.filter(j => 
      (selectedClass === 'all' || j.class_id === selectedClass) &&
      (selectedSubject === 'all' || j.subject_id === selectedSubject)
    );
    
    const monthLabel = availableMonths.find(m => m.value === currentMonth)?.label;

    await downloadPdf(doc, { title: title, journals: filteredJournals }, {
        tahunAjaran: selectedSchoolYear?.name || profile.active_school_year_name || "-",
        periode: monthLabel ? `Bulan: ${monthLabel}` : "Periode: Satu Semester"
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
            doc.text(`Periode`, pageWidth / 2, metaYStart + 5);
            doc.text(`: ${meta.periode || '-'}`, pageWidth / 2 + 35, metaYStart + 5);

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
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Select value={currentSchoolYearId} onValueChange={(value) => handleFilterChange('schoolYear', value)}>
            <SelectTrigger>
                <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {schoolYears.map(sy => <SelectItem key={sy.id} value={sy.id}>{sy.name}</SelectItem>)}
            </SelectContent>
        </Select>
         <Select value={currentMonth} onValueChange={(value) => handleFilterChange('month', value)}>
            <SelectTrigger>
                <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {availableMonths.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={selectedClass} onValueChange={(value) => handleFilterChange('class', value)}>
            <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
        </Select>
         <Select value={selectedSubject} onValueChange={(value) => handleFilterChange('subject', value)}>
            <SelectTrigger>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        {/* Hero Section */}
        <div className={cn(
            "relative overflow-hidden pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 transition-all duration-1000 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium">
                            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            Laporan & Analitik
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold font-headline bg-gradient-to-r from-slate-900 via-blue-600 to-primary dark:from-slate-100 dark:via-blue-400 dark:to-primary bg-clip-text text-transparent leading-tight">
                                Laporan Akademik
                            </h1>
                            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground max-w-2xl mt-1 sm:mt-2 leading-relaxed">
                                Analisis komprehensif tentang kehadiran dan nilai siswa dengan visualisasi data yang informatif
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pb-8 sm:pb-16">
            <div className={cn(
                "transition-all duration-1000 ease-out delay-300",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
                <Tabs defaultValue="summary">
                    <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
                        <TabsList className="w-full sm:w-auto justify-start bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg min-w-max">
                            <TabsTrigger value="summary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3">
                                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline sm:inline">Ringkasan</span>
                                <span className="xs:hidden sm:hidden">Ring</span>
                            </TabsTrigger>
                            <TabsTrigger value="attendance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3">
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline sm:inline">Kehadiran</span>
                                <span className="xs:hidden sm:hidden">Hadir</span>
                            </TabsTrigger>
                            <TabsTrigger value="grades" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3">
                                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline sm:inline">Nilai</span>
                                <span className="xs:hidden sm:hidden">Nilai</span>
                            </TabsTrigger>
                            <TabsTrigger value="journal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3">
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline sm:inline">Jurnal</span>
                                <span className="xs:hidden sm:hidden">Jurnal</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="summary" className="mt-4 sm:mt-8 space-y-6 sm:space-y-8">
                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full blur-2xl"></div>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200 leading-tight">Tingkat Kehadiran Rata-rata</CardTitle>
                                    <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-300">{summaryCards.overallAttendanceRate}%</div>
                                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">Rata-rata semua kelas</p>
                                </CardContent>
                            </Card>
                            
                            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">Rata-rata Nilai</CardTitle>
                                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">{summaryCards.overallAverageGrade}</div>
                                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">Skor rata-rata semua penilaian</p>
                                </CardContent>
                            </Card>
                            
                            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800 sm:col-span-2 lg:col-span-1">
                                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-purple-800 dark:text-purple-200">Jurnal Mengajar Terisi</CardTitle>
                                    <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                                        <BookCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300">{summaryCards.totalJournals}</div>
                                    <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mt-1">Total jurnal yang telah dibuat</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
                            <CardHeader className="space-y-3 pb-4 sm:pb-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg shrink-0">
                                        <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="text-base sm:text-xl leading-tight">Analisis Performa Siswa</CardTitle>
                                        <CardDescription className="text-sm sm:text-base mt-1 leading-relaxed">Siswa dikelompokkan berdasarkan rata-rata nilai dan tingkat kehadiran</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                        {studentPerformance.length > 0 ? (
                            <>
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
                            </>
                        ) : (
                             <EmptyStatePlaceholder icon={Users2} title="Belum Ada Data Performa" description="Catat presensi dan nilai untuk melihat analisis performa siswa." />
                        )}
                    </CardContent>
                </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
                            <Card className="lg:col-span-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
                                <CardHeader className="space-y-3 pb-4 sm:pb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg shrink-0">
                                            <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-base sm:text-xl leading-tight">Perbandingan Kehadiran Antar Kelas</CardTitle>
                                            <CardDescription className="text-sm sm:text-base mt-1 leading-relaxed">Visualisasi persentase kehadiran untuk setiap status</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-2">
                             {attendanceByClass.length > 0 ? (
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
                             ) : (
                                <EmptyStatePlaceholder icon={BarChart2} title="Grafik Kosong" description="Data kehadiran antar kelas akan muncul di sini." />
                             )}
                        </CardContent>
                    </Card>
                            <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
                                <CardHeader className="space-y-3 pb-4 sm:pb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg shrink-0">
                                            <PieChartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-base sm:text-xl leading-tight">Distribusi Kehadiran Umum</CardTitle>
                                            <CardDescription className="text-sm sm:text-base mt-1 leading-relaxed">Proporsi setiap status kehadiran keseluruhan</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                            {pieData.length > 0 ? (
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
                            ) : (
                                <EmptyStatePlaceholder icon={PieChartIcon} title="Grafik Kosong" description="Data distribusi kehadiran akan muncul di sini." />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
                    <TabsContent value="attendance" className="mt-4 sm:mt-8">
                        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
                            <CardHeader className="space-y-4 sm:space-y-6">
                                <div className="flex flex-col gap-4 sm:gap-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                                            <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl shrink-0">
                                                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="text-lg sm:text-2xl leading-tight">Laporan Kehadiran Siswa</CardTitle>
                                                <CardDescription className="text-sm sm:text-base mt-1 leading-relaxed">Pilih filter untuk mengunduh rekap kehadiran dalam format PDF profesional</CardDescription>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={handleDownloadAttendance} 
                                            className="h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 shrink-0 text-sm sm:text-base"
                                        >
                                            <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                            Unduh PDF
                                        </Button>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Filter Laporan</span>
                                        </div>
                                        <CommonFilters />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-8">
                                    <EmptyStatePlaceholder icon={FileSpreadsheet} title="Unduh Rekap Kehadiran" description="Data detail kehadiran siswa akan direkap dalam format PDF profesional dengan kop surat sekolah." />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="grades" className="mt-4 sm:mt-8">
                        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
                            <CardHeader className="space-y-4 sm:space-y-6">
                                <div className="flex flex-col gap-4 sm:gap-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl shrink-0">
                                                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="text-lg sm:text-2xl leading-tight">Laporan Nilai Siswa</CardTitle>
                                                <CardDescription className="text-sm sm:text-base mt-1 leading-relaxed">Pilih filter untuk mengunduh rekap nilai dalam format PDF atau Excel</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                            <Button 
                                                variant="outline" 
                                                onClick={handleDownloadGradesExcel} 
                                                className="h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm sm:text-base"
                                            >
                                                <FileSpreadsheet className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                                Unduh Excel
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={handleDownloadGrades} 
                                                className="h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm sm:text-base"
                                            >
                                                <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                                Unduh PDF
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Filter Laporan</span>
                                        </div>
                                        <CommonFilters />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-8">
                                    <EmptyStatePlaceholder icon={FileSpreadsheet} title="Unduh Rekap Nilai" description="Data detail nilai siswa akan direkap dalam format PDF profesional atau Excel dengan analisis lengkap." />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="journal" className="mt-4 sm:mt-8">
                        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg">
                            <CardHeader className="space-y-4 sm:space-y-6">
                                <div className="flex flex-col gap-4 sm:gap-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                                            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-xl shrink-0">
                                                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="text-lg sm:text-2xl leading-tight">Laporan Jurnal Mengajar</CardTitle>
                                                <CardDescription className="text-sm sm:text-base mt-1 leading-relaxed">Arsip semua jurnal mengajar yang telah Anda buat dengan format profesional</CardDescription>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={handleDownloadJournal} 
                                            className="h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 shrink-0 text-sm sm:text-base"
                                        >
                                            <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                            Unduh PDF
                                        </Button>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Filter Laporan</span>
                                        </div>
                                        <CommonFilters />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                        {journalEntries.length > 0 ? (
                            <>
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
                            </>
                                ) : (
                                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-xl p-6 sm:p-8">
                                        <EmptyStatePlaceholder icon={BookCheck} title="Belum Ada Jurnal" description="Data jurnal yang telah Anda buat akan ditampilkan di sini dengan format yang rapi dan mudah dibaca." />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </div>
  );
}
