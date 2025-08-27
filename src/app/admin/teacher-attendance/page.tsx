
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
  Filter,
  Download,
  Loader2,
  Clock,
  LogOut,
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
import { format } from "date-fns";
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
import { getAllUsers, getTeacherAttendanceHistory, getUserProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
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

export default function TeacherAttendanceRecapPage() {
  const [history, setHistory] = React.useState<TeacherAttendance[]>([]);
  const [users, setUsers] = React.useState<Profile[]>([]);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date()); // Default to today
  const [selectedTeacher, setSelectedTeacher] = React.useState<string>("all");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [testLoading, setTestLoading] = React.useState(false);
  const isMobile = useIsMobile();

  // Test function to create sample data
  const createTestData = async () => {
    setTestLoading(true);
    try {
      const supabase = createClient();
      
      if (!supabase) {
        alert('Supabase client not available');
        return;
      }
      
      // Get a random teacher
      const randomTeacher = users[Math.floor(Math.random() * users.length)];
      if (!randomTeacher) {
        alert('No teachers found to create test data');
        return;
      }
      
      // Create a test attendance record
      const { error } = await supabase
        .from('teacher_attendance')
        .insert({
          teacher_id: randomTeacher.id,
          date: new Date().toISOString().split('T')[0], // Today's date
          check_in: '07:30:00',
          check_out: '15:30:00',
          status: 'Tepat Waktu'
        });
      
      if (error) {
        console.error('Error creating test data:', error);
        alert('Error creating test data: ' + error.message);
      } else {
        alert('Test attendance data created successfully!');
        // Refresh data
        const attendanceData = await getTeacherAttendanceHistory();
        setHistory(attendanceData);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error as Error).message);
    }
    setTestLoading(false);
  };

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log('Fetching teacher attendance data...');
      const [attendanceData, userData, profileData] = await Promise.all([
        getTeacherAttendanceHistory(),
        getAllUsers(),
        getUserProfile(), // Assuming this fetches the current admin's profile with school data
      ]);
      console.log('Attendance data received:', attendanceData);
      console.log('Users data received:', userData.filter((u) => u.role === "teacher"));
      setHistory(attendanceData);
      setUsers(userData.filter((u) => u.role === "teacher"));
      setProfile(profileData as Profile);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredHistory = React.useMemo(() => {
    console.log('Filtering history. Total records:', history.length);
    console.log('Filter criteria - Teacher:', selectedTeacher, 'Month:', selectedMonth, 'Date:', selectedDate);
    
    const filtered = history.filter((item) => {
      const itemDate = new Date(item.date);
      const teacherMatch = selectedTeacher === "all" || item.teacherId === selectedTeacher;

      // If a specific date is selected, it takes precedence over the month filter.
      if (selectedDate) {
          const dateMatch = format(itemDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          return dateMatch && teacherMatch;
      }

      // If no specific date is selected, use the month filter.
      const monthMatch = selectedMonth === 'all' || format(itemDate, 'M') === selectedMonth;
      return monthMatch && teacherMatch;
    });
    
    console.log('Filtered results:', filtered.length, 'records');
    return filtered;
  }, [history, selectedDate, selectedTeacher, selectedMonth]);

  const handleDownloadPdf = async () => {
    if (!profile) return;

    const doc = new jsPDF() as jsPDFWithAutoTable;
    const title = "REKAPITULASI KEHADIRAN GURU";
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    const schoolData = {
      logo: profile.school_logo_url || "https://placehold.co/100x100.png",
      name: profile.school_name || "Nama Sekolah Belum Diatur",
      address: profile.school_address || "Alamat Sekolah Belum Diatur",
      headmasterName: profile.headmaster_name || "Nama Kepsek Belum Diatur",
      headmasterNip: profile.headmaster_nip || "-",
    };

    const addHeader = (docInstance: jsPDF) => {
        docInstance.setFontSize(14).setFont('helvetica', 'bold');
        docInstance.text((schoolData.name || '').toUpperCase(), margin + 25, margin + 8);
        docInstance.setFontSize(10).setFont('helvetica', 'normal');
        docInstance.text(schoolData.address, margin + 25, margin + 14);
        docInstance.setLineWidth(0.5);
        docInstance.line(margin, margin + 25, pageWidth - margin, margin + 25);
    };

    const generatePdf = () => {
        addHeader(doc);
        doc.setFontSize(12).setFont('helvetica', 'bold');
        doc.text(title, pageWidth / 2, margin + 35, { align: 'center' });
        
        doc.setFontSize(10).setFont('helvetica', 'normal');
        const teacherName = users.find(u => u.id === selectedTeacher)?.full_name || 'Semua Guru';
        const monthLabel = months.find(m => m.value === selectedMonth)?.label;
        const dateLabel = selectedDate 
            ? format(selectedDate, "d MMMM yyyy", { locale: id }) 
            : (selectedMonth !== 'all' ? `Bulan ${monthLabel}` : 'Semua Tanggal');
            
        doc.text(`Guru: ${teacherName}`, margin, margin + 45);
        doc.text(`Periode: ${dateLabel}`, margin, margin + 50);

        const tableBody = filteredHistory.map((item) => [
            item.teacherName,
            format(new Date(item.date), 'EEEE, dd MMM yyyy', { locale: id }),
            item.checkIn ? formatTime(item.checkIn) : '-',
            item.checkOut ? formatTime(item.checkOut) : '-',
            item.status,
        ]);

        doc.autoTable({
            head: [['Nama Guru', 'Tanggal', 'Absen Masuk', 'Absen Pulang', 'Status']],
            body: tableBody,
            startY: margin + 55,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
        });

        const finalY = (doc as any).lastAutoTable.finalY || margin + 70;
        
        const signatureY = finalY + 20;
        doc.text(`Mengetahui,`, margin, signatureY);
        doc.text(`Administrator,`, pageWidth - margin, signatureY, { align: 'right' });
        doc.text(`Kepala Sekolah`, margin, signatureY + 5);

        doc.text(schoolData.headmasterName, margin, signatureY + 30);
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${schoolData.headmasterNip}`, margin, signatureY + 35);
        
        doc.setFont('helvetica', 'bold');
        doc.text(profile.full_name || 'Admin', pageWidth - margin, signatureY + 30, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        if (profile.nip) {
            doc.text(`NIP. ${profile.nip}`, pageWidth - margin, signatureY + 35, { align: 'right' });
        }


        doc.save(`laporan_kehadiran_guru_${format(new Date(), "yyyyMMdd")}.pdf`);
    };

    try {
        const response = await fetch(schoolData.logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            doc.addImage(base64data, 'PNG', margin, margin, 20, 20);
            generatePdf();
        };
    } catch (error) {
        console.error("Error fetching logo, proceeding without it.", error);
        generatePdf();
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
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                onClick={createTestData} 
                disabled={testLoading || users.length === 0}
                className={isMobile ? "w-full" : ""}
              >
                {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Data
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile Statistics Cards - Optional */}
        {isMobile && filteredHistory.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="text-center">
                <p className="text-xs text-slate-500">Total Data</p>
                <p className="text-lg font-bold text-slate-900">{filteredHistory.length}</p>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <p className="text-xs text-slate-500">Guru Aktif</p>
                <p className="text-lg font-bold text-slate-900">
                  {new Set(filteredHistory.map(item => item.teacherId)).size}
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
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
          {/* Mobile Card View */}
          {isMobile ? (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
                </div>
              ) : filteredHistory.length > 0 ? (
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
                              {format(new Date(item.date), "EEEE, dd MMM yyyy", {
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
                      {history.length === 0 
                        ? "Belum ada guru yang melakukan absensi. Pastikan guru sudah melakukan absen masuk melalui menu absensi guru."
                        : "Tidak ada data kehadiran yang cocok dengan filter Anda. Coba ubah filter atau pilih 'Semua' untuk melihat semua data."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Guru</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Absen Masuk</TableHead>
                  <TableHead>Absen Pulang</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-2" />
                      <p>Memuat data...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.teacherName}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.date), "EEEE, dd MMM yyyy", {
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16">
                      <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium">Belum Ada Data</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {history.length === 0 
                          ? "Belum ada guru yang melakukan absensi. Pastikan guru sudah melakukan absen masuk melalui menu absensi guru."
                          : "Tidak ada data kehadiran yang cocok dengan filter Anda. Coba ubah filter atau pilih 'Semua' untuk melihat semua data."
                        }
                      </p>
                      {history.length === 0 && (
                        <p className="mt-2 text-xs text-gray-400">
                          Total records: {history.length} | Teachers: {users.length}
                        </p>
                      )}
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
