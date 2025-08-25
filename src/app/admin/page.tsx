

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Clock, UserX, Activity, UserCheck, TrendingUp, Calendar, BookOpen, AlertTriangle, RefreshCw } from "lucide-react";
import { getAdminDashboardData, getAllUsers, getTeacherAttendanceHistory } from "@/lib/data";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn, formatTime } from "@/lib/utils";
import { formatIndonesianDate, formatIndonesianDateTime, getIndonesianTime } from '@/lib/timezone';
import WeeklyAttendanceChart from "./weekly-attendance-chart";
import { Suspense } from "react";

// Loading skeleton component
const StatCardSkeleton = () => (
    <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </CardHeader>
        <CardContent>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
        </CardContent>
    </Card>
);

const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color, 
    bgColor, 
    trend, 
    trendDirection 
}: { 
    icon: React.ElementType; 
    title: string; 
    value: string | number; 
    subtitle: string; 
    color: string; 
    bgColor: string; 
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
}) => {
    const getTrendColor = () => {
        switch (trendDirection) {
            case 'up': return 'text-green-600';
            case 'down': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <Card className={cn("border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]", bgColor)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("text-sm font-medium", color)}>{title}</CardTitle>
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", bgColor === 'bg-blue-50' ? 'bg-blue-100' : bgColor === 'bg-green-50' ? 'bg-green-100' : bgColor === 'bg-yellow-50' ? 'bg-yellow-100' : 'bg-red-100')}>
                    <Icon className={cn("h-4 w-4", color)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{value}</div>
                    {trend && (
                        <div className={cn("text-xs font-medium flex items-center gap-1", getTrendColor())}>
                            <TrendingUp className={cn("h-3 w-3", trendDirection === 'down' && 'rotate-180')} />
                            {trend}
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    );
};

const getStatusBadge = (status: 'Tepat Waktu' | 'Terlambat' | 'Tidak Hadir' | 'Belum Absen') => {
    switch (status) {
        case 'Tepat Waktu':
            return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
        case 'Terlambat':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
        case 'Tidak Hadir':
        case 'Belum Absen':
            return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
    }
}


export default async function AdminDashboardPage() {
  try {
    const [dashboardData, allUsers, attendanceHistory] = await Promise.all([
      getAdminDashboardData(),
      getAllUsers(),
      getTeacherAttendanceHistory()
    ]);

    const today = format(getIndonesianTime(), 'yyyy-MM-dd');
    const yesterday = format(new Date(getIndonesianTime().getTime() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    
    const teachers = allUsers.filter(u => u.role === 'teacher');
    const admins = allUsers.filter(u => u.role === 'admin');
    
    const todayAttendance = attendanceHistory.filter(a => a.date === today);
    const yesterdayAttendance = attendanceHistory.filter(a => a.date === yesterday);

    const teacherAttendanceStatus = teachers.map(teacher => {
      const attendance = todayAttendance.find(a => a.teacherId === teacher.id);
      if (attendance) {
          return {
              name: teacher.full_name,
              checkIn: attendance.checkIn,
              status: attendance.status
          }
      }
      return {
          name: teacher.full_name,
          checkIn: null,
          status: 'Belum Absen' as const
      }
    });

    const summary = {
        present: teacherAttendanceStatus.filter(t => t.status === 'Tepat Waktu').length,
        late: teacherAttendanceStatus.filter(t => t.status === 'Terlambat').length,
        notCheckedIn: teacherAttendanceStatus.filter(t => t.status === 'Belum Absen').length,
        absent: teacherAttendanceStatus.filter(t => t.status === 'Tidak Hadir').length,
        attendanceRate: teachers.length > 0 ? Math.round(((teacherAttendanceStatus.filter(t => t.status !== 'Belum Absen' && t.status !== 'Tidak Hadir').length) / teachers.length) * 100) : 0,
    }
    
    // Calculate trends
    const yesterdayPresent = yesterdayAttendance.filter(a => a.status === 'Tepat Waktu' || a.status === 'Terlambat').length;
    const todayPresent = summary.present + summary.late;
    const attendanceTrend = todayPresent - yesterdayPresent;
    
    // Calculate weekly statistics
    const weeklyStats = {
        totalActivities: dashboardData.recentActivities.length,
        activeTeachers: todayAttendance.length,
        attendanceRate: summary.attendanceRate
    };

    return (
      <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                  <h1 className="text-3xl font-bold font-headline text-gray-900">Dasbor Admin</h1>
                  <p className="text-muted-foreground">Ringkasan umum dan pemantauan aktivitas guru - {formatIndonesianDate(getIndonesianTime(), 'EEEE, dd MMMM yyyy')}</p>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refresh Data
                  </Button>
              </div>
          </div>
          
          {/* Alert for low attendance */}
          {summary.attendanceRate < 80 && (
              <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                      <strong>Perhatian:</strong> Tingkat kehadiran guru hari ini hanya {summary.attendanceRate}%. 
                      Mohon pastikan semua guru melakukan absensi tepat waktu.
                  </AlertDescription>
              </Alert>
          )}
          
          {/* Enhanced Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard 
                  icon={Users} 
                  title="Total Guru" 
                  value={teachers.length} 
                  subtitle={`${admins.length} administrator`}
                  color="text-blue-600" 
                  bgColor="bg-blue-50"
                  trend={`${teachers.length} guru aktif`}
                  trendDirection="neutral"
              />
              <StatCard 
                  icon={UserCheck} 
                  title="Hadir Hari Ini" 
                  value={summary.present + summary.late} 
                  subtitle="Absen masuk terkonfirmasi"
                  color="text-green-600" 
                  bgColor="bg-green-50"
                  trend={attendanceTrend > 0 ? `+${attendanceTrend}` : attendanceTrend < 0 ? `${attendanceTrend}` : '±0'}
                  trendDirection={attendanceTrend > 0 ? 'up' : attendanceTrend < 0 ? 'down' : 'neutral'}
              />
              <StatCard 
                  icon={Clock} 
                  title="Terlambat" 
                  value={summary.late} 
                  subtitle="Absen masuk melewati batas"
                  color="text-yellow-600" 
                  bgColor="bg-yellow-50"
                  trend={`${Math.round((summary.late / teachers.length) * 100)}% dari total`}
                  trendDirection={summary.late > 0 ? 'up' : 'neutral'}
              />
              <StatCard 
                  icon={UserX} 
                  title="Belum/Tidak Hadir" 
                  value={summary.notCheckedIn + summary.absent} 
                  subtitle="Perlu tindak lanjut"
                  color="text-red-600" 
                  bgColor="bg-red-50"
                  trend={`${summary.attendanceRate}% tingkat kehadiran`}
                  trendDirection={summary.attendanceRate >= 90 ? 'up' : summary.attendanceRate >= 75 ? 'neutral' : 'down'}
              />
          </div>

        <div className="grid gap-6 lg:grid-cols-5">
            {/* --- DAILY ATTENDANCE TABLE --- */}
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Kehadiran Guru Hari Ini</CardTitle>
                    <CardDescription>{format(new Date(), 'eeee, dd MMMM yyyy', { locale: id })}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="md:hidden space-y-4">
                        {teacherAttendanceStatus.map((teacher, index) => (
                             <div key={index} className="border rounded-lg p-4 flex justify-between items-center bg-muted/20">
                                <div>
                                    <p className="font-semibold">{teacher.name}</p>
                                    <p className="text-sm text-muted-foreground">Masuk: {teacher.checkIn ? formatTime(teacher.checkIn) : '-'}</p>
                                </div>
                                <Badge variant="outline" className={cn("font-semibold text-xs", getStatusBadge(teacher.status))}>{teacher.status}</Badge>
                            </div>
                        ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Guru</TableHead>
                                    <TableHead className="text-center">Jam Masuk</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teacherAttendanceStatus.map((teacher, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{teacher.name}</TableCell>
                                        <TableCell className="text-center font-mono">{teacher.checkIn ? formatTime(teacher.checkIn) : '-'}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn("font-semibold", getStatusBadge(teacher.status))}>{teacher.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* --- RECENT ACTIVITIES --- */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Aktivitas Terbaru</CardTitle>
                    <CardDescription>Pantau aktivitas terakhir dari para guru.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {dashboardData.recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-full">
                                    <Activity className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium">{activity.text}</p>
                                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                         {dashboardData.recentActivities.length === 0 && (
                            <p className="text-sm text-center py-8 text-muted-foreground">Belum ada aktivitas tercatat.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* --- WEEKLY ATTENDANCE CHART --- */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Grafik Kehadiran Mingguan
                </CardTitle>
                <CardDescription>Tren kehadiran guru dalam 7 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <Suspense fallback={
                    <div className="h-[350px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p>Memuat grafik...</p>
                        </div>
                    </div>
                }>
                    <WeeklyAttendanceChart data={dashboardData.weeklyAttendance} />
                </Suspense>
            </CardContent>
        </Card>
    </div>
  );
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    return (
      <div className="space-y-6">
          <div>
              <h1 className="text-3xl font-bold font-headline text-gray-900">Dasbor Admin</h1>
              <p className="text-muted-foreground">Ringkasan umum dan pemantauan aktivitas guru</p>
          </div>
          
          <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                  <strong>Error:</strong> Gagal memuat data dashboard. Silakan refresh halaman atau hubungi administrator.
              </AlertDescription>
          </Alert>
          
          {/* Fallback skeleton cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
          </div>
          
          <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                  <CardHeader>
                      <CardTitle>Kehadiran Guru Hari Ini</CardTitle>
                      <CardDescription>Data tidak tersedia</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Gagal memuat data kehadiran</p>
                      </div>
                  </CardContent>
              </Card>
              
              <Card>
                  <CardHeader>
                      <CardTitle>Aktivitas Terbaru</CardTitle>
                      <CardDescription>Data tidak tersedia</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Gagal memuat aktivitas</p>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    );
  }
}
