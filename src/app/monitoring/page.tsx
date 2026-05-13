import { getAdminDashboardData } from "@/lib/data";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getIndonesianTime } from '@/lib/timezone';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, UserX, UserCheck, Calendar, RefreshCw, ShieldCheck, User as UserIcon, ListFilter } from "lucide-react";
import WeeklyAttendanceChart from "../admin/weekly-attendance-chart";
import { cn } from "@/lib/utils";

const StatCard = ({ icon: Icon, title, value, subtitle, color, bgColor, trend }: any) => (
    <Card className={cn("border-0 shadow-lg transition-all duration-300 hover:scale-[1.02]", bgColor)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn("text-sm font-medium", color)}>{title}</CardTitle>
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", bgColor.replace('bg-', 'bg-').replace('50', '100'))}>
                <Icon className={cn("h-4 w-4", color)} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            {trend && <p className="text-[10px] font-semibold mt-1 uppercase opacity-70">{trend}</p>}
        </CardContent>
    </Card>
);

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Tepat Waktu': return 'bg-green-100 text-green-800 border-green-200';
        case 'Terlambat': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Sakit': return "bg-amber-100 text-amber-800 border-amber-200";
        case 'Izin': return "bg-blue-100 text-blue-800 border-blue-200";
        case 'Belum Absen': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export default async function MonitoringDashboardPage() {
  const dashboardData = await getAdminDashboardData();
  const now = getIndonesianTime();

  if (!dashboardData) {
      return <div className="p-8 text-center text-muted-foreground">Gagal memuat data monitoring.</div>;
  }

  const { summary, isTodayHoliday, activePolicy, todayAttendanceList } = dashboardData;
  const policyLabel = activePolicy === 'schedule_based' ? 'Berbasis Jadwal' : 'Absensi Harian';

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline text-slate-900">Dasbor Monitoring</h1>
                <p className="text-muted-foreground">Status kehadiran real-time seluruh staf - {format(now, 'EEEE, dd MMMM yyyy', { locale: id })}</p>
            </div>
        </div>
        
        {isTodayHoliday && (
            <Alert className="border-blue-200 bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 font-medium">
                    Hari ini adalah Hari Libur Terdaftar. Kewajiban absen ditiadakan.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={ShieldCheck} title="Wajib Hadir" value={summary.total_expected} subtitle="Guru sesuai kebijakan" color="text-blue-600" bgColor="bg-blue-50" trend={policyLabel} />
            <StatCard icon={UserCheck} title="Hadir" value={summary.total_present} subtitle={`${summary.attendance_rate}% tingkat kehadiran`} color="text-green-600" bgColor="bg-green-50" />
            <StatCard icon={Clock} title="Terlambat" value={summary.total_late} subtitle="Melewati batas waktu" color="text-yellow-600" bgColor="bg-yellow-50" />
            <StatCard icon={UserX} title="Belum Absen" value={summary.total_absent} subtitle="Tanpa keterangan" color="text-red-600" bgColor="bg-red-50" />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2 border-0 shadow-lg">
                <CardHeader className="bg-slate-50/50 border-b rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <ListFilter className="h-5 w-5 text-teal-600" />
                        <div>
                            <CardTitle className="text-lg">Kehadiran Guru Hari Ini</CardTitle>
                            <CardDescription className="text-xs">Guru yang masuk dalam kewajiban absen</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[450px]">
                        <div className="p-4 sm:p-6 space-y-4">
                            {todayAttendanceList.length > 0 ? (
                                todayAttendanceList.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm bg-white gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm shrink-0">
                                                <AvatarImage src={item.avatar_url || ""} />
                                                <AvatarFallback className="bg-teal-50 text-teal-600 font-bold">{item.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-900 leading-tight break-words">{item.name}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    <p className="text-[11px] text-slate-500 font-mono">{item.time} WIB</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold py-1 px-2.5 shrink-0", getStatusBadge(item.status))}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <UserIcon className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                                    <p className="text-sm text-slate-400 italic">Tidak ada guru wajib hadir hari ini.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-0 shadow-lg">
                <CardHeader className="bg-slate-50/50 border-b rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-blue-600" />
                        <div>
                            <CardTitle className="text-lg">Statistik Kehadiran Seminggu</CardTitle>
                            <CardDescription className="text-xs">Perbandingan kehadiran 7 hari terakhir</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <WeeklyAttendanceChart data={dashboardData.weeklyAttendance} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
