
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
import { TrendingUp, CheckCircle, Award, Download, BookCheck, FileSpreadsheet, PieChart as PieChartIcon, BarChart2, Filter, FileText, Loader2 } from "lucide-react";
import type { Class, Subject, Profile, SchoolYear, JournalEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { getReportsData } from "@/lib/data";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const COLORS = ['#22c55e', '#f97316', '#0ea5e9', '#ef4444'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, fill }: any) => {
  const radius = outerRadius + 15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`(${(percent * 100).toFixed(0)}%)`}
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
  
  const { summaryCards, attendanceByClass, overallAttendanceDistribution, journalEntries, attendanceHistory, gradeHistory, allStudents } = reportsData;
  const selectedSchoolYear = schoolYears.find(sy => sy.id === currentSchoolYearId);
  const availableMonths = React.useMemo(() => {
    if (!selectedSchoolYear) return allMonths;
    return selectedSchoolYear.name.toLowerCase().includes('ganjil') ? monthsGanjil : monthsGenap;
  }, [selectedSchoolYear]);

  const pieData = Object.entries(overallAttendanceDistribution).map(([name, value]) => ({name, value})).filter(item => item.value > 0);

  const downloadPdf = async (doc: jsPDFWithAutoTable, content: {title: string, head?: any[][], body?: any[][], journals?: JournalEntry[]}, meta?: Record<string, string | undefined>, customFileName?: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let finalY = margin;

    const schoolData = {
        logo: schoolProfile?.school_logo_url || "https://placehold.co/100x100.png",
        name: schoolProfile?.school_name || "Nama Sekolah",
        address: schoolProfile?.school_address || "Alamat",
        headmasterName: schoolProfile?.headmaster_name || "Kepala Sekolah",
        headmasterNip: schoolProfile?.headmaster_nip || "-",
    };

    const addHeader = (docInstance: jsPDF) => {
        docInstance.setFontSize(14).setFont(undefined, 'bold');
        docInstance.text((schoolData.name || '').toUpperCase(), margin + 25, margin + 8);
        docInstance.setFontSize(10).setFont(undefined, 'normal');
        docInstance.text(schoolData.address, margin + 25, margin + 14);
        docInstance.line(margin, margin + 25, pageWidth - margin, margin + 25);
    }
    
    addHeader(doc);
    finalY = margin + 40;
    doc.setFontSize(12).setFont(undefined, 'bold').text(content.title, pageWidth / 2, finalY, { align: 'center' });
    
    if (content.head && content.body) {
        doc.autoTable({ head: content.head, body: content.body, startY: finalY + 10, theme: 'grid' });
    }
    doc.save(customFileName || "laporan.pdf");
  }

  const handleDownloadAttendance = async () => {
    if (selectedClass === 'all' || selectedSubject === 'all') {
        toast({ title: "Filter Dibutuhkan", description: "Pilih kelas dan mapel.", variant: "destructive"});
        return;
    }
    setDownloading(true);
    const doc = new jsPDF() as jsPDFWithAutoTable;
    await downloadPdf(doc, { title: "REKAP ABSENSI", body: [] });
    setDownloading(false);
  }

  return (
    <div className="space-y-6 p-1">
        <HandWrittenTitle title="Laporan Akademik" subtitle="Guru" className="py-4 md:py-6" />
        
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border shadow-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Filter Laporan</h3>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <Select value={currentSchoolYearId} onValueChange={(v) => handleFilterChange('schoolYear', v)}>
                    <SelectTrigger><SelectValue placeholder="Tahun Ajaran" /></SelectTrigger>
                    <SelectContent>
                        {schoolYears.map(sy => <SelectItem key={sy.id} value={sy.id}>{sy.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={currentMonth} onValueChange={(v) => handleFilterChange('month', v)}>
                    <SelectTrigger><SelectValue placeholder="Bulan" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Bulan</SelectItem>
                        {availableMonths.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={selectedClass} onValueChange={(v) => handleFilterChange('class', v)}>
                    <SelectTrigger><SelectValue placeholder="Kelas" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={selectedSubject} onValueChange={(v) => handleFilterChange('subject', v)}>
                    <SelectTrigger><SelectValue placeholder="Mapel" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Mapel</SelectItem>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </Card>

        <Tabs defaultValue="summary" className="mt-6">
            <TabsList className="bg-white/80 border shadow-lg">
                <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
                <TabsTrigger value="grades">Nilai</TabsTrigger>
                <TabsTrigger value="journal">Jurnal</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-6 space-y-6">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-emerald-50/50 border-emerald-100 p-6">
                        <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2">Hadir Rata-rata</h4>
                        <p className="text-3xl font-black text-emerald-600">{summaryCards.overallAttendanceRate}%</p>
                    </Card>
                    <Card className="bg-blue-50/50 border-blue-100 p-6">
                        <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Rata-rata Nilai</h4>
                        <p className="text-3xl font-black text-blue-600">{summaryCards.overallAverageGrade}</p>
                    </Card>
                    <Card className="bg-purple-50/50 border-purple-100 p-6">
                        <h4 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-2">Total Jurnal</h4>
                        <p className="text-3xl font-black text-purple-600">{summaryCards.totalJournals}</p>
                    </Card>
                </div>
            </TabsContent>
            
            <TabsContent value="attendance" className="mt-6">
                 <Card>
                    <CardHeader className="flex-row justify-between items-center">
                        <CardTitle>Rekap Kehadiran</CardTitle>
                        <Button onClick={handleDownloadAttendance} disabled={downloading} variant="outline" className="rounded-xl">
                            {downloading ? <Loader2 className="animate-spin h-4 w-4"/> : <Download className="h-4 w-4 mr-2" />}
                            Unduh PDF
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <EmptyStatePlaceholder icon={CheckCircle} title="Siap Unduh" description="Klik tombol di atas untuk mengunduh rekap kehadiran guru." />
                    </CardContent>
                 </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
