
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
  LabelList
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, CheckCircle, Award, Download, Sparkles, BookCheck, TrendingDown, UserX, UserCheck } from "lucide-react";
import { classes, students, subjects, journalEntries } from "@/lib/placeholder-data";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useActivation } from "@/hooks/use-activation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


const attendanceData = [
  { name: 'Kelas 10-A', Hadir: 95, Sakit: 2, Izin: 3, Alpha: 0 },
  { name: 'Kelas 10-B', Hadir: 92, Sakit: 4, Izin: 2, Alpha: 2 },
  { name: 'Kelas 11-A', Hadir: 98, Sakit: 1, Izin: 1, Alpha: 0 },
  { name: 'Kelas 11-B', Hadir: 90, Sakit: 5, Izin: 3, Alpha: 2 },
];

const overallAttendance = {
    Hadir: 375,
    Sakit: 12,
    Izin: 9,
    Alpha: 4
};

const COLORS = ['#22c55e', '#f97316', '#0ea5e9', '#ef4444'];

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


const studentPerformance = [
    { id: 'S004', name: 'Eko Prasetyo', class: '10-A', average_grade: 95, attendance: 100, status: 'Sangat Baik' },
    { id: 'S001', name: 'Budi Santoso', class: '10-A', average_grade: 92, attendance: 98, status: 'Sangat Baik' },
    { id: 'S006', name: 'Gilang Ramadhan', class: '10-B', average_grade: 85, attendance: 95, status: 'Stabil' },
    { id: 'S002', name: 'Citra Lestari', class: '10-A', average_grade: 82, attendance: 90, status: 'Stabil' },
    { id: 'S007', name: 'Hana Yulita', class: '11-A', average_grade: 78, attendance: 88, status: 'Butuh Perhatian' },
    { id: 'S003', name: 'Dewi Anggraini', class: '11-A', average_grade: 74, attendance: 85, status: 'Berisiko' },
];

// Mock data for detailed reports
const detailedAttendance = students.map(s => ({
    ...s,
    hadir: Math.floor(Math.random() * 16) + 15, // 15-30
    sakit: Math.floor(Math.random() * 3), // 0-2
    izin: Math.floor(Math.random() * 2), // 0-1
    alpha: Math.floor(Math.random() * 2), // 0-1
    pertemuan: 32,
}));

const detailedGrades = students.map(s => ({
    ...s,
    uh1: Math.floor(Math.random() * 30) + 70,
    uh2: Math.floor(Math.random() * 30) + 71,
    tugas1: Math.floor(Math.random() * 20) + 80,
    uts: Math.floor(Math.random() * 25) + 75,
    uas: Math.floor(Math.random() * 25) + 72,
}));

// Mock data from settings
const schoolData = {
    logo: "https://placehold.co/100x100.png",
    name: "SMA Negeri 1 Harapan Bangsa",
    address: "Jl. Pendidikan No. 1, Kota Cerdas, 12345",
    headmasterName: "Dr. H. Bijaksana, M.Pd.",
    headmasterNip: "198001012010121001",
};

const teacherData = {
    name: "Guru Tangguh, S.Pd.",
    nip: "199001012020121001"
}

export default function ReportsPage() {
  const [selectedClass, setSelectedClass] = React.useState("C01");
  const [selectedSubject, setSelectedSubject] = React.useState("SUBJ01");
  const [selectedMonth, setSelectedMonth] = React.useState("all");
  const [selectedSemester, setSelectedSemester] = React.useState("2");
  const { isPro, limits } = useActivation();
  const { toast } = useToast();

  const pieData = Object.entries(overallAttendance).map(([name, value]) => ({name, value}));

  const handleDownloadClick = () => {
      if (!limits.canDownloadPdf) {
          toast({
              title: "Fitur Akun Pro",
              description: "Unduh laporan PDF adalah fitur Pro. Silakan aktivasi akun Anda.",
              variant: "destructive"
          });
          return;
      }

      const activeClass = classes.find(c => c.id === selectedClass);
      const activeSubject = subjects.find(s => s.id === selectedSubject);
      
      const title = `REKAPITULASI KEHADIRAN SISWA`;
      const doc = new jsPDF() as jsPDFWithAutoTable;
      
      const head = [['No.', 'NIS', 'Nama Siswa', 'H', 'S', 'I', 'A', 'Pertemuan', 'Kehadiran (%)']];
      const body = detailedAttendance
        .filter(s => selectedClass === 'all' || s.classId === selectedClass)
        .map((s, index) => [
            index + 1,
            s.nis,
            s.name,
            s.hadir,
            s.sakit,
            s.izin,
            s.alpha,
            s.pertemuan,
            ((s.hadir/s.pertemuan)*100).toFixed(1) + '%'
      ]);

      downloadPdf(doc, {title: title, head: head, body: body}, {
        kelas: activeClass?.name,
        mapel: activeSubject?.name,
        semester: selectedSemester === "1" ? "Ganjil" : "Genap",
        tahunAjaran: "2023/2024"
      });
  }
  
  const handleDownloadGrades = () => {
    if (!limits.canDownloadPdf) {
        toast({ title: "Fitur Akun Pro", description: "Unduh PDF adalah fitur Pro.", variant: "destructive" });
        return;
    }
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const activeClass = classes.find(c => c.id === selectedClass);
    const activeSubject = subjects.find(s => s.id === selectedSubject);
    const title = `REKAPITULASI NILAI SISWA`;

    const head = [['No.', 'NIS', 'Nama Siswa', 'UH 1', 'UH 2', 'Tugas 1', 'UTS', 'UAS', 'Rata-rata']];
    const body = detailedGrades
        .filter(s => selectedClass === 'all' || s.classId === selectedClass)
        .map((s, index) => {
            const avg = (s.uh1 + s.uh2 + s.tugas1 + s.uts + s.uas) / 5;
            return [
                index + 1,
                s.nis,
                s.name,
                s.uh1,
                s.uh2,
                s.tugas1,
                s.uts,
                s.uas,
                avg.toFixed(1)
            ];
        });

    downloadPdf(doc, {title: title, head: head, body: body}, {
        kelas: activeClass?.name,
        mapel: activeSubject?.name,
        semester: selectedSemester === "1" ? "Ganjil" : "Genap",
        tahunAjaran: "2023/2024"
      });
  }
  
  const handleDownloadJournal = () => {
    if (!limits.canDownloadPdf) {
        toast({ title: "Fitur Akun Pro", description: "Unduh PDF adalah fitur Pro.", variant: "destructive" });
        return;
    }
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const title = 'JURNAL MENGAJAR GURU';
    
    // For journals, we don't use autoTable. We build the content manually.
    const filteredJournals = journalEntries.filter(j => 
      (selectedClass === 'all' || j.classId === selectedClass) &&
      (selectedSubject === 'all' || j.subjectId === selectedSubject)
    );

    downloadPdf(doc, { title: title, journals: filteredJournals }, {
        semester: selectedSemester === "1" ? "Ganjil" : "Genap",
        tahunAjaran: "2023/2024"
    });
  }


  const downloadPdf = async (doc: jsPDFWithAutoTable, content: {title: string, head?: any[][], body?: any[][], journals?: any[]}, meta?: Record<string, string | undefined>) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let finalY = margin;

    // --- Add Header ---
    try {
        const response = await fetch(schoolData.logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            doc.addImage(base64data, 'PNG', margin, margin, 20, 20);
            generateContent();
        };
    } catch (error) {
        console.error("Error fetching logo, proceeding without it.", error);
        generateContent();
    }
    
    const generateContent = () => {
        doc.setFontSize(14).setFont(undefined, 'bold');
        doc.text(schoolData.name.toUpperCase(), margin + 25, margin + 8);
        doc.setFontSize(10).setFont(undefined, 'normal');
        doc.text(schoolData.address, margin + 25, margin + 14);
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 25, pageWidth - margin, margin + 25);
        finalY = margin + 25;

        // --- Add Title and Meta Info ---
        doc.setFontSize(12).setFont(undefined, 'bold');
        doc.text(content.title, pageWidth / 2, finalY + 10, { align: 'center' });
        finalY += 15;

        if (meta) {
            doc.setFontSize(10).setFont(undefined, 'normal');
            const metaYStart = finalY;
            doc.text(`Mata Pelajaran`, margin, metaYStart);
            doc.text(`: ${meta.mapel || 'Semua Mapel'}`, margin + 35, metaYStart);
            doc.text(`Kelas`, margin, metaYStart + 5);
            doc.text(`: ${meta.kelas || 'Semua Kelas'}`, margin + 35, metaYStart + 5);
            doc.text(`Semester`, pageWidth / 2, metaYStart);
            doc.text(`: ${meta.semester || '-'}`, pageWidth / 2 + 35, metaYStart);
            doc.text(`Tahun Ajaran`, pageWidth / 2, metaYStart + 5);
            doc.text(`: ${meta.tahunAjaran || '-'}`, pageWidth / 2 + 35, metaYStart + 5);
            finalY = metaYStart + 15;
        }

        // --- Add Table for Attendance/Grades OR Narrative for Journal ---
        if (content.head && content.body) {
             doc.autoTable({
                head: content.head,
                body: content.body,
                startY: finalY,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1, cellWidth: 'auto' },
                didDrawPage: (data) => {
                    finalY = data.cursor?.y || 0;
                }
            });
            finalY = (doc.lastAutoTable as any).finalY;
        } else if (content.journals) {
            finalY += 5; // Add a bit of space before the first entry
            doc.setFontSize(10);
            
            content.journals.forEach((entry, index) => {
                if (finalY > pageHeight - 60) { // Check for page break before rendering new entry
                    doc.addPage();
                    finalY = margin;
                }
                doc.setFont(undefined, 'bold');
                const entryHeader = `JURNAL KE-${index + 1}: ${entry.subjectName} - ${entry.className}`;
                doc.text(entryHeader, margin, finalY);
                finalY += 6;
                
                doc.setFont(undefined, 'normal');
                const entryMeta = `Tanggal: ${format(entry.date, "eeee, dd MMMM yyyy", { locale: id })} | Pertemuan ke-${entry.meetingNumber}`;
                doc.text(entryMeta, margin, finalY);
                finalY += 8;

                const addSection = (title: string, text: string) => {
                    if (!text) return;
                    doc.setFont(undefined, 'bold');
                    doc.text(title, margin, finalY);
                    finalY += 5;
                    doc.setFont(undefined, 'normal');
                    const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
                    doc.text(splitText, margin, finalY);
                    finalY += (splitText.length * 4) + 4; // Adjust spacing based on text lines
                }

                addSection("A. Tujuan Pembelajaran", entry.learningObjectives);
                addSection("B. Kegiatan Pembelajaran (Sintaks)", entry.learningActivities);
                addSection("C. Penilaian (Asesmen)", entry.assessment);
                addSection("D. Refleksi & Tindak Lanjut", entry.reflection);

                finalY += 5; // Extra space between entries
                doc.setLineDashPattern([1, 1], 0);
                doc.line(margin, finalY, pageWidth - margin, finalY);
                doc.setLineDashPattern([], 0);
                finalY += 8;
            });
        }
        
        // --- Add Footer ---
        const signatureY = finalY + 15 > pageHeight - 50 ? pageHeight - 50 : finalY + 15;
        if (finalY + 50 > pageHeight) { // Check if we need a new page for signature
            doc.addPage();
            finalY = margin;
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
                            <div className="text-2xl font-bold">94.2%</div>
                            <p className="text-xs text-muted-foreground">Rata-rata semua kelas bulan ini</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Nilai</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">84.5</div>
                            <p className="text-xs text-muted-foreground">Skor rata-rata semua penilaian</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Jurnal Mengajar Terisi</CardTitle>
                            <BookCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{journalEntries.length}</div>
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
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Perbandingan Kehadiran Antar Kelas</CardTitle>
                            <CardDescription>Visualisasi persentase kehadiran untuk setiap status di berbagai kelas.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                             <div className="w-full overflow-x-auto">
                                <ResponsiveContainer width="100%" height={300} minWidth={500}>
                                    <BarChart data={attendanceData}>
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
                            <CardDescription>Proporsi setiap status kehadiran secara keseluruhan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={props => <path d={props.points.reduce((acc, p) => acc + `${p.x},${p.y} `, 'M')} stroke={props.fill} />}
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
                                <CardDescription>Detail kehadiran siswa per periode.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleDownloadClick} disabled={!isPro}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Unduh PDF
                                </Button>
                            </div>
                        </div>
                         <div className="mt-4 flex flex-col sm:flex-row gap-2 flex-wrap">
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
                             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Pilih Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Bulan</SelectItem>
                                    <SelectItem value="1">Januari</SelectItem>
                                    <SelectItem value="2">Februari</SelectItem>
                                    <SelectItem value="3">Maret</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Pilih Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Semester</SelectItem>
                                    <SelectItem value="1">Semester Ganjil</SelectItem>
                                    <SelectItem value="2">Semester Genap</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                             {detailedAttendance.map((student) => (
                                <div key={student.id} className="border rounded-lg p-4 space-y-3">
                                    <p className="font-semibold">{student.name}</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                       <p><strong>Hadir:</strong> {student.hadir}</p>
                                       <p><strong>Sakit:</strong> {student.sakit}</p>
                                       <p><strong>Izin:</strong> {student.izin}</p>
                                       <p><strong>Alpha:</strong> {student.alpha}</p>
                                    </div>
                                    <div className="border-t pt-2 text-sm font-semibold flex justify-between">
                                        <span>Total Pertemuan: {student.pertemuan}</span>
                                        <span>Kehadiran: {((student.hadir / student.pertemuan) * 100).toFixed(1)}%</span>
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
                                <TableHead className="text-center">Hadir</TableHead>
                                <TableHead className="text-center">Sakit</TableHead>
                                <TableHead className="text-center">Izin</TableHead>
                                <TableHead className="text-center">Alpha</TableHead>
                                <TableHead className="text-center">Total Pertemuan</TableHead>
                                <TableHead className="text-right">Kehadiran (%)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detailedAttendance.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell className="text-center">{student.hadir}</TableCell>
                                    <TableCell className="text-center">{student.sakit}</TableCell>
                                    <TableCell className="text-center">{student.izin}</TableCell>
                                    <TableCell className="text-center">{student.alpha}</TableCell>
                                    <TableCell className="text-center">{student.pertemuan}</TableCell>
                                    <TableCell className="text-right font-semibold">{((student.hadir / student.pertemuan) * 100).toFixed(1)}%</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
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
                               <CardDescription>Detail nilai ulangan dan tugas siswa.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleDownloadGrades} disabled={!isPro}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Unduh PDF
                                </Button>
                            </div>
                        </div>
                         <div className="mt-4 flex flex-col sm:flex-row gap-2 flex-wrap">
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
                    </CardHeader>
                    <CardContent>
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {detailedGrades.map((student) => {
                                const avg = (student.uh1 + student.uh2 + student.tugas1 + student.uts + student.uas) / 5;
                                return (
                                    <div key={student.id} className="border rounded-lg p-4 space-y-3">
                                        <p className="font-semibold">{student.name}</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                            <p><strong>UH 1:</strong> {student.uh1}</p>
                                            <p><strong>UH 2:</strong> {student.uh2}</p>
                                            <p><strong>Tugas 1:</strong> {student.tugas1}</p>
                                            <p><strong>UTS:</strong> {student.uts}</p>
                                            <p><strong>UAS:</strong> {student.uas}</p>
                                        </div>
                                        <div className="border-t pt-2 text-sm font-semibold flex justify-end">
                                            <span>Rata-rata: {avg.toFixed(1)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Nama Siswa</TableHead>
                                <TableHead className="text-center">UH 1</TableHead>
                                <TableHead className="text-center">UH 2</TableHead>
                                <TableHead className="text-center">Tugas 1</TableHead>
                                <TableHead className="text-center">UTS</TableHead>
                                <TableHead className="text-center">UAS</TableHead>
                                <TableHead className="text-right font-semibold">Rata-rata</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detailedGrades.map((student) => {
                                    const avg = (student.uh1 + student.uh2 + student.tugas1 + student.uts + student.uas) / 5;
                                    return (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell className="text-center">{student.uh1}</TableCell>
                                        <TableCell className="text-center">{student.uh2}</TableCell>
                                        <TableCell className="text-center">{student.tugas1}</TableCell>
                                        <TableCell className="text-center">{student.uts}</TableCell>
                                        <TableCell className="text-center">{student.uas}</TableCell>
                                        <TableCell className="text-right font-semibold">{avg.toFixed(1)}</TableCell>
                                    </TableRow>
                                    )
                                })}
                            </TableBody>
                            </Table>
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
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 flex-wrap">
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
                    </CardHeader>
                    <CardContent>
                        {/* Mobile View */}
                         <div className="md:hidden space-y-4">
                            {journalEntries.map((entry) => (
                                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="space-y-1">
                                        <p className="font-semibold">{entry.subjectName}</p>
                                        <p className="text-sm text-muted-foreground">{entry.className} {entry.meetingNumber ? `(P-${entry.meetingNumber})` : ''}</p>
                                        <p className="text-xs text-muted-foreground">{format(entry.date, "dd MMM yyyy")}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{entry.learningObjectives}</p>
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
                                        (selectedClass === 'all' || j.classId === selectedClass) &&
                                        (selectedSubject === 'all' || j.subjectId === selectedClass)
                                    )
                                    .map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">
                                    {format(entry.date, "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{entry.subjectName}</div>
                                        <div className="text-sm text-muted-foreground">{entry.className} {entry.meetingNumber ? `(P-${entry.meetingNumber})` : ''}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        <p className="line-clamp-2">{entry.learningObjectives}</p>
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
