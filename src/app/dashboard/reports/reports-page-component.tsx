
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
import { 
    TrendingUp, 
    CheckCircle, 
    Award, 
    Download, 
    BookCheck, 
    PieChart as PieChartIcon, 
    BarChart2, 
    Filter, 
    FileText, 
    Loader2, 
    Users, 
    AlertCircle, 
    TrendingDown, 
    UserX,
    ClipboardList,
    GraduationCap
} from "lucide-react";
import type { Class, Subject, Profile, SchoolYear, JournalEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { getReportsData } from "@/lib/data";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const ATTENDANCE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444']; // Emerald, Amber, Blue, Red

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, fill }: any) => {
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-black">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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

  const { toast } = useToast();

  const handleFilterChange = React.useCallback(
    (key: 'schoolYear' | 'month' | 'class' | 'subject', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') params.delete(key); else params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );
  
  const { summaryCards, attendanceByClass, overallAttendanceDistribution, studentPerformance, journalEntries, attendanceHistory, gradeHistory } = reportsData;
  
  const selectedSchoolYear = schoolYears.find(sy => sy.id === currentSchoolYearId);
  const availableMonths = React.useMemo(() => {
    if (!selectedSchoolYear) return allMonths;
    return selectedSchoolYear.name.toLowerCase().includes('ganjil') ? monthsGanjil : monthsGenap;
  }, [selectedSchoolYear]);

  const pieData = [
    { name: 'Hadir', value: overallAttendanceDistribution.Hadir },
    { name: 'Sakit', value: overallAttendanceDistribution.Sakit },
    { name: 'Izin', value: overallAttendanceDistribution.Izin },
    { name: 'Alpha', value: overallAttendanceDistribution.Alpha },
  ].filter(item => item.value > 0);

  const getPerformanceBadge = (status: string) => {
      switch (status) {
          case 'Sangat Baik': return "bg-green-100 text-green-700 border-green-200";
          case 'Stabil': return "bg-blue-100 text-blue-700 border-blue-200";
          case 'Butuh Perhatian': return "bg-yellow-100 text-yellow-700 border-yellow-200";
          case 'Berisiko': return "bg-red-100 text-red-700 border-red-200";
          default: return "";
      }
  }

  const getPerformanceIcon = (status: string) => {
      switch (status) {
          case 'Sangat Baik': return TrendingUp;
          case 'Stabil': return CheckCircle;
          case 'Butuh Perhatian': return AlertCircle;
          case 'Berisiko': return TrendingDown;
          default: return CheckCircle;
      }
  }

  const handleDownloadPdf = async (type: 'attendance' | 'grades' | 'journal') => {
    setDownloading(true);
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const generateContent = () => {
        // Kop Surat
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

        // Signatures
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
            <HandWrittenTitle title="Laporan Akademik" subtitle="Analisis & Rekapitulasi" className="py-4 md:py-6" />
        </div>
        
        {/* Filters Card */}
        <Card className="rounded-[2rem] border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6 px-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 shadow-inner">
                        <Filter className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Filter Laporan</CardTitle>
                        <CardDescription>Saring data untuk analisis yang lebih spesifik.</CardDescription>
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

        {/* Main Tabs */}
        <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner h-14">
                <TabsTrigger value="summary" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Ringkasan</TabsTrigger>
                <TabsTrigger value="attendance" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Presensi</TabsTrigger>
                <TabsTrigger value="grades" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Nilai</TabsTrigger>
                <TabsTrigger value="journal" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold text-xs">Jurnal</TabsTrigger>
            </TabsList>

            {/* SUMMARY TAB */}
            <TabsContent value="summary" className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            <p className="text-sm font-bold text-slate-400 mt-2">Rata-rata kehadiran harian siswa</p>
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
                            <p className="text-sm font-bold text-slate-400 mt-2">Rata-rata nilai seluruh mata pelajaran</p>
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
                            <p className="text-sm font-bold text-slate-400 mt-2">Total entri jurnal mengajar dibuat</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <Card className="lg:col-span-3 rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white">
                        <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <BarChart2 className="h-5 w-5 text-blue-600" /> Grafik Kehadiran per Kelas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 h-[350px]">
                            {attendanceByClass.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={attendanceByClass}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} unit="%" />
                                        <Tooltip 
                                            cursor={{fill: '#f8fafc'}}
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                        />
                                        <Bar dataKey="rate" name="Tingkat Kehadiran" fill="#4f46e5" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center opacity-30"><BarChart2 className="h-16 w-16" /></div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white">
                         <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-emerald-600" /> Distribusi Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 h-[350px]">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="value"
                                            label={renderCustomizedLabel}
                                            labelLine={false}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} className="stroke-white stroke-2" />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: '20px', fontSize: '11px', fontWeight: 'bold'}} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center opacity-30"><PieChartIcon className="h-16 w-16" /></div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Analysis Section (PRD) */}
                <Card className="rounded-[2.5rem] border-0 shadow-2xl overflow-hidden bg-white">
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                                <GraduationCap className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tight">Analisis Performa Siswa</CardTitle>
                                <CardDescription className="text-slate-400">Peringkat performa berdasarkan gabungan nilai dan absensi.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 px-8">Nama Siswa</TableHead>
                                        <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Rata-rata Nilai</TableHead>
                                        <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Kehadiran</TableHead>
                                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">Status Performa</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentPerformance.slice(0, 10).map((student) => {
                                        const StatusIcon = getPerformanceIcon(student.status);
                                        return (
                                            <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="py-5 px-8">
                                                    <p className="font-bold text-slate-900 leading-tight">{student.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">NIS: {student.nis}</p>
                                                </TableCell>
                                                <TableCell className="text-center font-black text-lg text-blue-600">{student.avgGrade}</TableCell>
                                                <TableCell className="text-center font-black text-lg text-emerald-600">{student.attRate}%</TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <Badge variant="outline" className={cn("px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider", getPerformanceBadge(student.status))}>
                                                        <StatusIcon className="h-3 w-3 mr-1.5" />
                                                        {student.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {studentPerformance.length === 0 && (
                            <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                <UserX className="h-12 w-12 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">Data analisis belum tersedia</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ATTENDANCE TAB */}
            <TabsContent value="attendance" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 shadow-inner">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Log Kehadiran Detail</CardTitle>
                                <CardDescription>Daftar riwayat presensi siswa sesuai filter aktif.</CardDescription>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('attendance')} 
                            disabled={downloading || attendanceHistory.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-11 px-6 font-bold"
                        >
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Cetak Laporan Absensi
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
                                    {attendanceHistory.slice(0, 50).map((record) => (
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
                        {attendanceHistory.length === 0 && (
                             <div className="py-24 text-center opacity-30 flex flex-col items-center">
                                <Users className="h-12 w-12 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">Belum ada data presensi</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* GRADES TAB */}
            <TabsContent value="grades" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shadow-inner">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Leger Nilai Akademik</CardTitle>
                                <CardDescription>Ringkasan perolehan nilai siswa pada setiap asesmen.</CardDescription>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('grades')} 
                            disabled={downloading || gradeHistory.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-11 px-6 font-bold"
                        >
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Cetak Leger Nilai
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold py-5 px-8">Siswa</TableHead>
                                        <TableHead className="font-bold">Mata Pelajaran</TableHead>
                                        <TableHead className="font-bold">Jenis Penilaian</TableHead>
                                        <TableHead className="text-center font-bold">Nilai</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gradeHistory.slice(0, 50).map((record) => (
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
                        {gradeHistory.length === 0 && (
                             <div className="py-24 text-center opacity-30 flex flex-col items-center">
                                <Award className="h-12 w-12 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">Belum ada data nilai</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* JOURNAL TAB */}
            <TabsContent value="journal" className="mt-8 animate-in fade-in duration-500">
                <Card className="rounded-[2rem] border-0 shadow-xl overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600 shadow-inner">
                                <BookCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Riwayat Jurnal Mengajar</CardTitle>
                                <CardDescription>Catatan dokumentasi proses pembelajaran di kelas.</CardDescription>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleDownloadPdf('journal')} 
                            disabled={downloading || journalEntries.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 h-11 px-6 font-bold"
                        >
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Cetak Jurnal
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="font-bold py-5 px-8">Tanggal</TableHead>
                                        <TableHead className="font-bold">Info</TableHead>
                                        <TableHead className="font-bold">Tujuan Pembelajaran</TableHead>
                                        <TableHead className="text-center font-bold">Aksi</TableHead>
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
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/journal')} className="h-8 rounded-lg font-bold text-xs text-indigo-600">
                                                    Lihat Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {journalEntries.length === 0 && (
                             <div className="py-24 text-center opacity-30 flex flex-col items-center">
                                <FileText className="h-12 w-12 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">Jurnal mengajar masih kosong</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
