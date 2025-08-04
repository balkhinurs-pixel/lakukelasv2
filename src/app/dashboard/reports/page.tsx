
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
  Cell
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, CheckCircle, Award, Download, Sparkles, BookCheck, TrendingDown, UserX, UserCheck } from "lucide-react";
import { classes, students, subjects, journalEntries } from "@/lib/placeholder-data";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useSubscription } from "@/hooks/use-subscription";
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
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
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
  const [selectedClass, setSelectedClass] = React.useState("all");
  const [selectedSubject, setSelectedSubject] = React.useState("all");
  const [selectedMonth, setSelectedMonth] = React.useState("all");
  const [selectedSemester, setSelectedSemester] = React.useState("all");
  const { isPremium, limits } = useSubscription();
  const { toast } = useToast();

  const pieData = Object.entries(overallAttendance).map(([name, value]) => ({name, value}));

  const handleDownloadClick = (title: string, head: string[][], body: any[][]) => {
      if (!limits.canDownloadPdf) {
          toast({
              title: "Fitur Premium",
              description: "Unduh laporan PDF adalah fitur premium. Silakan upgrade paket Anda.",
              variant: "destructive"
          });
          return;
      }
      downloadPdf(title, head, body);
  }

  const downloadPdf = async (title: string, head: string[][], body: any[][]) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // --- Add Header ---
    try {
        const response = await fetch(schoolData.logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            doc.addImage(base64data, 'PNG', margin, margin, 20, 20);
            
            doc.setFontSize(14).setFont(undefined, 'bold');
            doc.text(schoolData.name.toUpperCase(), margin + 25, margin + 8);
            doc.setFontSize(10).setFont(undefined, 'normal');
            doc.text(schoolData.address, margin + 25, margin + 14);
            doc.setLineWidth(0.5);
            doc.line(margin, margin + 25, pageWidth - margin, margin + 25);
            
            // --- Add Table ---
            generateTableAndFooter(doc, title, head, body, margin, pageWidth, pageHeight);
        };
    } catch (error) {
        console.error("Error fetching logo, proceeding without it.", error);
        generateTableAndFooter(doc, title, head, body, margin, pageWidth, pageHeight);
    }
  }

  const generateTableAndFooter = (doc: jsPDFWithAutoTable, title: string, head: string[][], body: any[][], margin: number, pageWidth: number, pageHeight: number) => {
    doc.setFontSize(12).setFont(undefined, 'bold');
    doc.text(title, pageWidth / 2, margin + 35, { align: 'center' });
    
    doc.autoTable({
        head: head,
        body: body,
        startY: margin + 40,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
    });

    // --- Add Footer ---
    const tableEndY = (doc.lastAutoTable as any).finalY;
    const signatureY = tableEndY + 20 > pageHeight - 50 ? pageHeight - 50 : tableEndY + 20;

    const todayDate = format(new Date(), "eeee, dd MMMM yyyy", { locale: id });
    const city = schoolData.address.split(',')[1]?.trim() || "Kota";

    doc.setFontSize(10);
    doc.text(`${city}, ${todayDate}`, pageWidth - margin, signatureY, { align: 'right' });
    
    const signatureXLeft = margin;
    const signatureXRight = pageWidth - margin;
    const signatureYBase = signatureY + 8;
    
    doc.text("Mengetahui,", signatureXLeft, signatureYBase, { align: 'left'});
    doc.text("Guru Mata Pelajaran", signatureXRight, signatureYBase, { align: 'right'});
    doc.text("Kepala Sekolah", signatureXLeft, signatureYBase, { align: 'left'});

    const signatureYName = signatureYBase + 30;
    doc.setFont(undefined, 'bold').text(schoolData.headmasterName, signatureXLeft, signatureYName, { align: 'left'});
    doc.setFont(undefined, 'normal').text(`NIP. ${schoolData.headmasterNip}`, signatureXLeft, signatureYName + 5, { align: 'left'});

    doc.setFont(undefined, 'bold').text(teacherData.name, signatureXRight, signatureYName, { align: 'right'});
    doc.setFont(undefined, 'normal').text(`NIP. ${teacherData.nip}`, signatureXRight, signatureYName + 5, { align: 'right'});


    doc.save(`${title.toLowerCase().replace(/ /g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`);
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
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">Laporan Akademik</h1>
                <p className="text-muted-foreground">Analisis komprehensif tentang kehadiran dan nilai siswa.</p>
            </div>
        </div>

         {!isPremium && (
            <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Laporan Profesional dengan Paket Premium</AlertTitle>
                <AlertDescription>
                    Upgrade ke paket premium untuk dapat mengunduh semua laporan dalam format PDF profesional dengan kop surat sekolah Anda.
                    <Button variant="link" className="p-0 h-auto ml-1" asChild>
                        <Link href="/dashboard/subscription">Upgrade sekarang</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )}

        <Tabs defaultValue="summary">
            <TabsList>
                <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                <TabsTrigger value="attendance">Laporan Kehadiran</TabsTrigger>
                <TabsTrigger value="grades">Laporan Nilai</TabsTrigger>
                <TabsTrigger value="journal">Laporan Jurnal</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-6 space-y-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Perbandingan Kehadiran Antar Kelas</CardTitle>
                            <CardDescription>Visualisasi persentase kehadiran untuk setiap status di berbagai kelas.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={300}>
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
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={100}
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
                                <Button variant="outline" onClick={() => handleDownloadClick('Laporan Kehadiran Siswa', [['ID', 'Nama', 'Hadir', 'Sakit', 'Izin', 'Alpha', '% Hadir']], detailedAttendance.map(s => [s.id, s.name, s.hadir, s.sakit, s.izin, s.alpha, ((s.hadir/s.pertemuan)*100).toFixed(1) + '%']))} disabled={!isPremium}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Unduh PDF
                                </Button>
                            </div>
                        </div>
                         <div className="mt-4 flex flex-col md:flex-row gap-2">
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Pilih kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kelas</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Pilih Mapel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Mapel</SelectItem>
                                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full md:w-[180px]">
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
                                <SelectTrigger className="w-full md:w-[180px]">
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
                                <Button variant="outline" onClick={() => handleDownloadClick('Laporan Nilai Siswa', [['ID', 'Nama', 'UH1', 'UH2', 'Tugas 1', 'UTS', 'UAS']], detailedGrades.map(s => [s.id, s.name, s.uh1, s.uh2, s.tugas1, s.uts, s.uas]))} disabled={!isPremium}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Unduh PDF
                                </Button>
                            </div>
                        </div>
                         <div className="mt-4 flex gap-2">
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Pilih kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kelas</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="w-full md:w-[200px]">
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
                            <Button variant="outline" onClick={() => handleDownloadClick('Laporan Jurnal Mengajar', [['Tanggal', 'Info', 'Tujuan Pembelajaran', 'Kegiatan Pembelajaran']], journalEntries.map(j => [format(j.date, "dd MMM yyyy"), `${j.className} - ${j.subjectName} (P-${j.meetingNumber})`, j.learningObjectives, j.learningActivities]))} disabled={!isPremium}>
                                <Download className="mr-2 h-4 w-4" />
                                Unduh PDF
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[120px]">Tanggal</TableHead>
                            <TableHead>Info</TableHead>
                            <TableHead>Tujuan Pembelajaran</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {journalEntries.map((entry) => (
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
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
