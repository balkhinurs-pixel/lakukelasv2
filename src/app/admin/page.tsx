
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
import { Users, Clock, UserX, Activity, UserCheck, TrendingUp, Calendar, AlertTriangle, RefreshCw, ShieldCheck, Info } from "lucide-react";
import { getAdminDashboardData, getAllUsers, getTeacherAttendanceHistory, getHolidays } from "@/lib/data";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn, formatTime } from "@/lib/utils";
import { getIndonesianTime } from '@/lib/timezone';
import WeeklyAttendanceChart from "./weekly-attendance-chart";
import { Suspense } from "react";
import type { TeacherAttendance } from "@/lib/types";

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
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", bgColor.replace('bg-', 'bg-').replace('50', '100'))}>
                    <Icon className={cn("h-4 w-4", color)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{value}</div>
                    {trend && (
                        <div className={cn("text-xs font-medium flex items-center gap-1", getTrendColor())}>
                            {trend}
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    );
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Tepat Waktu': return 'bg-green-100 text-green-800 border-green-200';
        case 'Terlambat': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Sakit': return "bg-amber-100 text-amber-800 border-amber-200";
        case 'Izin': return "bg-blue-100 text-blue-800 border-blue-200";
        case 'Tidak Hadir':
        case 'Belum Absen': return 'bg-red-100 text-red-800 border-red-200';
        case 'Libur': return 'bg-slate-100 text-slate-800 border-slate-200';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export default async function AdminDashboardPage() {
  const dashboardData = await getAdminDashboardData();
  const now = getIndonesianTime();
  const today = format(now, 'yyyy-MM-dd');

  if (!dashboardData) {
      return <div className="p-8 text-center">Gagal memuat data dasbor admin.</div>;
  }

  const { summary, isTodayHoliday, activePolicy } = dashboardData;

  const policyLabel = activePolicy === 'schedule_based' ? 'Berbasis Jadwal' : 'Absensi Harian (Full-Time)';

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline text-gray-900">Dasbor Admin</h1>
                <p className="text-muted-foreground">Monitoring kehadiran cerdas berbasis kebijakan sekolah - {format(now, 'EEEE, dd MMMM yyyy', { locale: id })}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>
        </div>
        
        {isTodayHoliday && (
            <Alert className="border-blue-200 bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    <strong>Hari Ini Libur.</strong> Kewajiban absen guru ditiadakan menurut sistem.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                icon={ShieldCheck} 
                title="Wajib Hadir" 
                value={summary.total_expected} 
                subtitle="Guru sesuai kebijakan"
                color="text-blue-600" 
                bgColor="bg-blue-50"
                trend={policyLabel}
            />
            <StatCard 
                icon={UserCheck} 
                title="Hadir" 
                value={summary.total_present} 
                subtitle={`${summary.attendance_rate}% tingkat kehadiran`}
                color="text-green-600" 
                bgColor="bg-green-50"
                trend={`${summary.total_present} guru`}
                trendDirection="up"
            />
            <StatCard 
                icon={Clock} 
                title="Terlambat" 
                value={summary.total_late} 
                subtitle="Absen melewati batas"
                color="text-yellow-600" 
                bgColor="bg-yellow-50"
                trendDirection="neutral"
            />
            <StatCard 
                icon={UserX} 
                title="Tanpa Keterangan" 
                value={summary.total_absent} 
                subtitle="Wajib hadir tapi belum absen"
                color="text-red-600" 
                bgColor="bg-red-50"
                trendDirection="down"
            />
        </div>

      <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
              <CardHeader>
                  <CardTitle>Kehadiran Guru Hari Ini</CardTitle>
                  <CardDescription>Visualisasi harian berdasarkan rekaman absensi terbaru.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      <WeeklyAttendanceChart data={dashboardData.weeklyAttendance} />
                  </div>
              </CardContent>
          </Card>

          <Card className="lg:col-span-2">
              <CardHeader>
                  <CardTitle>Aktivitas Jurnal Terbaru</CardTitle>
                  <CardDescription>Aktivitas administrasi guru terakhir.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {dashboardData.recentActivities.length > 0 ? (
                          dashboardData.recentActivities.map((activity, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="p-2 bg-slate-100 rounded-full">
                                      <Activity className="h-4 w-4 text-slate-500" />
                                  </div>
                                  <div className="text-sm">
                                      <p className="font-medium">{activity.text}</p>
                                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-10 text-muted-foreground italic text-sm">
                              Belum ada aktivitas jurnal hari ini.
                          </div>
                      )}
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
