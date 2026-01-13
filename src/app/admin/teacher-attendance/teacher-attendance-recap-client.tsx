
"use client";

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
  UserCheck,
  Calendar as CalendarIcon,
  User as UserIcon,
  Download,
  Loader2,
  Clock,
  LogOut,
  AlertCircle,
  FileText
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { cn, formatTime } from "@/lib/utils";
import type { TeacherAttendance, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const months = [
    { value: "1", label: 'Januari' }, { value: "2", label: 'Februari' },
    { value: "3", label: 'Maret' }, { value: "4", label: 'April' },
    { value: "5", label: 'Mei' }, { value: "6", label: 'Juni' },
    { value: "7", label: 'Juli' }, { value: "8", label: 'Agustus' },
    { value: "9", label: 'September' }, { value: "10", label: 'Oktober' },
    { value: "11", label: 'November' }, { value: "12", label: 'Desember' }
];

interface Holiday {
  id: string;
  date: string;
  description: string;
}

export default function TeacherAttendanceRecapPageClient({
    initialHistory,
    users,
    profile,
    schoolProfile,
    holidays
}: {
    initialHistory: TeacherAttendance[],
    users: Profile[],
    profile: Profile,
    schoolProfile: Profile | null,
    holidays: Holiday[]
}) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [selectedTeacher, setSelectedTeacher] = React.useState<string>("all");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("all");
  const isMobile = useIsMobile();

  const filteredHistory = React.useMemo(() => {
    return initialHistory.filter((item) => {
      const itemDate = new Date(item.date);
      const teacherMatch = selectedTeacher === "all" || item.teacherId === selectedTeacher;

      if (selectedDate) {
          const dateMatch = format(itemDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          return dateMatch && teacherMatch;
      }

      const monthMatch = selectedMonth === 'all' || format(itemDate, 'M') === selectedMonth;
      return monthMatch && teacherMatch;
    });
  }, [initialHistory, selectedDate, selectedTeacher, selectedMonth]);

  const handleDownloadPdf = async () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const generateContent = () => {
        const addHeader = (docInstance: jsPDF) => {
            if (!schoolProfile) return;
            const schoolData = {
                logo: schoolProfile?.school_logo_url || "https://placehold.co/100x100.png",
                name: schoolProfile?.school_name || "Nama Sekolah Belum Diatur",
                address: schoolProfile?.school_address || "Alamat Sekolah Belum Diatur",
            };
            docInstance.setFontSize(14).setFont('helvetica', 'bold');
            docInstance.text((schoolData.name || '').toUpperCase(), margin + 25, margin + 8);
            docInstance.setFontSize(10).setFont('helvetica', 'normal');
            docInstance.text(schoolData.address, margin + 25, margin + 14);
            docInstance.setLineWidth(0.5);
            docInstance.line(margin, margin + 25, pageWidth - margin, margin + 25);
        };
        
        addHeader(doc);
        doc.setFontSize(12).setFont('helvetica', 'bold');
        doc.text("REKAPITULASI KEHADIRAN GURU", pageWidth / 2, margin + 35, { align: 'center' });
        
        doc.setFontSize(10).setFont('helvetica', 'normal');
        const teacherName = users.find(u => u.id === selectedTeacher)?.full_name || 'Semua Guru';
        const monthLabel = months.find(m => m.value === selectedMonth)?.label;
        const dateLabel = selectedDate 
            ? format(selectedDate, "d MMMM yyyy", { locale: id }) 
            : (selectedMonth !== 'all' ? `Bulan ${monthLabel}` : 'Semua Tanggal');
            
        doc.text(`Guru: ${teacherName}`, margin, margin + 45);
        doc.text(`Periode: ${dateLabel}`, margin, margin + 50);

        const summaryData: { [teacherId: string]: { name: string; tepatWaktu: number; terlambat: number; tidakHadir: number, sakit: number, izin: number } } = {};
        
        const teacherListToProcess = selectedTeacher === "all" ? users : users.filter(u => u.id === selectedTeacher);
        
        teacherListToProcess.forEach(teacher => {
          summaryData[teacher.id] = { name: teacher.full_name, tepatWaktu: 0, terlambat: 0, tidakHadir: 0, sakit: 0, izin: 0 };
        });

        // Use filteredHistory for calculations
        const historyToUse = filteredHistory;

        // Populate summary from existing records
        historyToUse.forEach(item => {
            if (!summaryData[item.teacherId]) {
                 summaryData[item.teacherId] = { name: item.teacherName, tepatWaktu: 0, terlambat: 0, tidakHadir: 0, sakit: 0, izin: 0 };
            }
            if (item.status === 'Tepat Waktu') summaryData[item.teacherId].tepatWaktu++;
            else if (item.status === 'Terlambat') summaryData[item.teacherId].terlambat++;
            else if (item.status === 'Tidak Hadir') summaryData[item.teacherId].tidakHadir++;
            else if (item.status === 'Sakit') summaryData[item.teacherId].sakit++;
            else if (item.status === 'Izin') summaryData[item.teacherId].izin++;
        });

        // Now, calculate "Belum Absen" as "Tidak Hadir" (Alpha)
        if (selectedMonth !== 'all') {
            const year = new Date().getFullYear(); // This might need to be smarter based on school year
            const monthIndex = parseInt(selectedMonth) - 1;
            const startDate = startOfMonth(new Date(year, monthIndex));
            const endDate = endOfMonth(new Date(year, monthIndex));
            const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
            const holidayDates = new Set(holidays.map(h => h.date));
            
            teacherListToProcess.forEach(teacher => {
                daysInMonth.forEach(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayOfWeek = day.getDay(); // 0 for Sunday, 6 for Saturday
                    
                    // Skip weekends and holidays
                    if (dayOfWeek === 0 || dayOfWeek === 6 || holidayDates.has(dayStr)) {
                        return;
                    }
                    
                    const hasRecord = historyToUse.some(record => record.teacherId === teacher.id && record.date === dayStr);
                    
                    if (!hasRecord) {
                        summaryData[teacher.id].tidakHadir++;
                    }
                });
            });
        }


        const summaryBody = Object.values(summaryData).map(item => [
            item.name,
            item.tepatWaktu,
            item.terlambat,
            item.sakit,
            item.izin,
            item.tepatWaktu + item.terlambat,
            item.tidakHadir
        ]);

        doc.autoTable({
            head: [['Nama Guru', 'Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Total Hadir', 'Tidak Hadir (Alpha)']],
            body: summaryBody,
            startY: margin + 55,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
        });

        let lastY = (doc as any).lastAutoTable.finalY || margin + 70;
        
        doc.setFontSize(12).setFont('helvetica', 'bold');
        doc.text("Rincian Kehadiran Harian", margin, lastY + 10);

        const detailBody = historyToUse.map((item) => [
            item.teacherName,
            format(new Date(item.date), 'EEEE, dd MMM yyyy', { locale: id }),
            item.checkIn ? formatTime(item.checkIn) : '-',
            item.checkOut ? formatTime(item.checkOut) : '-',
            item.status,
            item.reason || '-',
        ]);

        doc.autoTable({
            head: [['Nama Guru', 'Tanggal', 'Absen Masuk', 'Absen Pulang', 'Status', 'Keterangan']],
            body: detailBody,
            startY: lastY + 15,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
        });

        const finalY = (doc as any).lastAutoTable.finalY || lastY + 20;
        let signatureY = finalY + 20;

        if (signatureY > pageHeight - 50) {
            doc.addPage();
            signatureY = margin;
        }

        const todayDate = format(new Date(), "dd MMMM yyyy", { locale: id });
        const city = schoolProfile?.school_address?.split(',')[1]?.trim() || "Kota";

        doc.text(`${city}, ${todayDate}`, pageWidth - margin, signatureY, { align: 'right' });
        
        const signatureXLeft = margin;
        const signatureXRight = pageWidth - margin;
        const signatureYBase = signatureY + 8;
        
        doc.text("Mengetahui,", signatureXLeft, signatureYBase, { align: 'left'});
        doc.text("Administrator,", signatureXRight, signatureYBase, { align: 'right'});
        doc.text("Kepala Sekolah", signatureXLeft, signatureYBase + 5, { align: 'left'});

        const signatureYName = signatureYBase + 30;

        doc.setFont(undefined, 'bold').text(schoolProfile?.headmaster_name || "Nama Kepsek Belum Diatur", signatureXLeft, signatureYName, { align: 'left'});
        doc.setFont(undefined, 'normal').text(`NIP. ${schoolProfile?.headmaster_nip || "-"}`, signatureXLeft, signatureYName + 5, { align: 'left'});
        
        doc.setFont(undefined, 'bold').text(profile.full_name || 'Admin', signatureXRight, signatureYName, { align: 'right' });
        if (profile.nip) {
            doc.setFont(undefined, 'normal').text(`NIP. ${profile.nip}`, signatureXRight, signatureYName + 5, { align: 'right' });
        }

        doc.save(`laporan_kehadiran_guru_${format(new Date(), "yyyyMMdd")}.pdf`);
    };

    try {
      const logoUrl = schoolProfile?.school_logo_url || "https://placehold.co/100x100.png";
      if(logoUrl && (logoUrl.includes('http') || logoUrl.startsWith('data:image'))) {
          if (logoUrl.startsWith('data:image')) {
              doc.addImage(logoUrl, 'PNG', margin, margin, 20, 20);
              generateContent();
              return;
          }
          const response = await fetch(logoUrl);
          if (response.ok) {
              const blob = await response.blob();
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                  const base64data = reader.result as string;
                  doc.addImage(base64data, 'PNG', margin, margin, 20, 20);
                  generateContent();
              };
          } else {
              console.error("Failed to fetch logo, proceeding without it.");
              generateContent();
          }
      } else {
          generateContent();
      }
    } catch (error) {
        console.error("Error processing logo, proceeding without it.", error);
        generateContent();
    }
  };

  const getStatusBadge = (status: TeacherAttendance["status"]) => {
    switch (status) {
      case "Tepat Waktu":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
      case "Terlambat":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100";
      case "Tidak Hadir":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
      case "Sakit":
        return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100";
      case "Izin":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shrink-0">
              <UserCheck className={cn("h-5 w-5", !isMobile && "sm:h-6 sm:w-6")} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={cn(
                "font-bold font-headline text-slate-900",
                isMobile ? "text-xl" : "text-2xl"
              )}>
                Rekap Kehadiran Guru
              </h1>
              <p className={cn(
                "text-slate-600 mt-1",
                isMobile ? "text-sm" : ""
              )}>
                Pantau catatan kehadiran semua guru di sekolah.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleDownloadPdf} 
              disabled={filteredHistory.length === 0}
              className={isMobile ? "w-full" : ""}
            >
              <Download className="mr-2 h-4 w-4"/>
              Cetak PDF
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className={isMobile ? "p-4" : ""}>
          <CardTitle className={isMobile ? "text-lg" : ""}>Filter Laporan</CardTitle>
          <CardDescription className={isMobile ? "text-sm" : ""}>
            Saring data absensi berdasarkan guru, bulan, atau tanggal tertentu.
          </CardDescription>
          <div className="pt-4 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-2">
            <div className="flex items-center gap-2 w-full">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter berdasarkan guru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Guru</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedMonth} onValueChange={(value) => { setSelectedMonth(value); setSelectedDate(undefined); }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter berdasarkan bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Bulan</SelectItem>
                        {months.map((month) => (
                             <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2 w-full">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: id })
                    ) : (
                      <span>Pilih tanggal spesifik</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(undefined)}
                  className={isMobile ? "px-2" : ""}
                >
                  {isMobile ? "×" : "Reset"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? "p-3 pt-0" : ""}>
          {isMobile ? (
            <div className="space-y-3">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <Card key={item.id} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">
                              {item.teacherName}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                              {format(parseISO(item.date), "EEEE, dd MMM yyyy", {
                                locale: id,
                              })}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("font-semibold text-xs", getStatusBadge(item.status))}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs text-slate-500">Masuk</p>
                              <p className="font-mono text-sm font-semibold">
                                {item.checkIn ? formatTime(item.checkIn) : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <LogOut className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-slate-500">Pulang</p>
                              <p className="font-mono text-sm font-semibold">
                                {item.checkOut ? formatTime(item.checkOut) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed border-2 border-slate-200">
                  <CardContent className="p-8 text-center">
                    <UserCheck className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">Belum Ada Data</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {initialHistory.length === 0 
                        ? "Belum ada guru yang melakukan absensi."
                        : "Tidak ada data kehadiran yang cocok dengan filter Anda."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Guru</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Absen Masuk</TableHead>
                  <TableHead>Absen Pulang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.teacherName}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(item.date), "EEEE, dd MMM yyyy", {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell>{item.checkIn ? formatTime(item.checkIn) : '-'}</TableCell>
                      <TableCell>{item.checkOut ? formatTime(item.checkOut) : '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("font-semibold", getStatusBadge(item.status))}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-muted-foreground text-xs">{item.reason}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium">Belum Ada Data</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {initialHistory.length === 0 
                          ? "Belum ada guru yang melakukan absensi."
                          : "Tidak ada data kehadiran yang cocok dengan filter Anda."
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
