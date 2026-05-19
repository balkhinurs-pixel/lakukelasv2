
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, UserX, UserCheck, Calendar, ShieldCheck, User as UserIcon, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";

const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
}: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle: string;
    color: string;
}) => (
    <Card className={cn("relative overflow-hidden text-white shadow-2xl border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl group", color)}>
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/20 opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 opacity-50 transition-opacity duration-300 group-hover:opacity-30" />
        
        <CardContent className="relative z-10 flex flex-col justify-between p-4 sm:p-6 h-full">
            <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                    <Icon className="h-6 w-6 drop-shadow-sm" />
                </div>
                <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            </div>
            
            <div className="space-y-1">
                <p className="text-[10px] sm:text-sm font-medium text-white/90 tracking-wide uppercase sm:normal-case">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold drop-shadow-sm tracking-tight">{value}</p>
                <p className="text-[10px] sm:text-xs text-white/80 leading-tight sm:leading-relaxed line-clamp-1">{subtitle}</p>
            </div>
        </CardContent>
        {/* Shine effect animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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

  const { summary, isTodayHoliday, todayHoliday, activePolicy, todayAttendanceList } = dashboardData;
  const policyLabel = activePolicy === 'schedule_based' ? 'Berbasis Jadwal' : 'Absensi Harian';

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline text-slate-900">Statistik Monitoring</h1>
                <p className="text-muted-foreground">Status kehadiran real-time seluruh staf - {format(now, 'EEEE, dd MMMM yyyy', { locale: id })}</p>
            </div>
        </div>
        
        {isTodayHoliday && (
            <Alert className="border-blue-200 bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 font-medium">
                    Hari ini Libur: <strong>{todayHoliday?.description}</strong>. Kewajiban absen ditiadakan.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            <StatCard 
                icon={ShieldCheck} 
                title="Wajib Hadir" 
                value={summary.total_expected} 
                subtitle={policyLabel} 
                color="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-600" 
            />
            <StatCard 
                icon={UserCheck} 
                title="Hadir" 
                value={summary.total_present} 
                subtitle={`${summary.attendance_rate}% Kehadiran`} 
                color="bg-gradient-to-br from-green-500 via-green-500 to-emerald-600" 
            />
            <StatCard 
                icon={Clock} 
                title="Terlambat" 
                value={summary.total_late} 
                subtitle="Melewati batas" 
                color="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-400" 
            />
            <StatCard 
                icon={UserX} 
                title="Belum Absen" 
                value={summary.total_absent} 
                subtitle="Tanpa keterangan" 
                color="bg-gradient-to-br from-red-500 via-red-500 to-orange-500" 
            />
        </div>

        <div className="grid gap-6 lg:grid-cols-1">
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-slate-50/50 border-b rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <ListFilter className="h-5 w-5 text-teal-600" />
                        <div>
                            <CardTitle className="text-lg">Daftar Kehadiran Guru Hari Ini</CardTitle>
                            <CardDescription className="text-xs">Monitor status absen staf secara real-time</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {todayAttendanceList.length > 0 ? (
                                todayAttendanceList.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm bg-white gap-3 group">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm shrink-0 transition-transform group-hover:scale-105">
                                                <AvatarImage src={item.avatar_url || ""} />
                                                <AvatarFallback className="bg-teal-50 text-teal-600 font-bold text-lg">{item.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-900 leading-tight break-words uppercase tracking-tight">{item.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    <p className="text-[11px] text-slate-500 font-mono font-bold">{item.time} WIB</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest py-1.5 px-3 shrink-0 rounded-xl border-0 shadow-sm", getStatusBadge(item.status))}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-32 opacity-30">
                                    <UserIcon className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                                    <p className="text-lg font-black uppercase tracking-widest text-slate-400">Tidak ada guru wajib hadir</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
