
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
import { Users, CheckCircle, Clock, UserX, Percent, BarChart2, Activity, UserCheck } from "lucide-react";
import { getAdminDashboardData, getAllUsers, getTeacherAttendanceHistory } from "@/lib/data";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from "@/lib/utils";

const StatCard = ({ icon: Icon, title, value, subtitle, color, bgColor }: { icon: React.ElementType, title: string, value: string | number, subtitle: string, color: string, bgColor: string }) => (
    <Card className={cn("border-0 shadow-lg", bgColor)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn("text-sm font-medium", color)}>{title}</CardTitle>
            <Icon className={cn("h-5 w-5", color)} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
        </CardContent>
    </Card>
);

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
  const [dashboardData, allUsers, attendanceHistory] = await Promise.all([
    getAdminDashboardData(),
    getAllUsers(),
    getTeacherAttendanceHistory()
  ]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const teachers = allUsers.filter(u => u.role === 'teacher');
  const todayAttendance = attendanceHistory.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === today);

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
      attendanceRate: teachers.length > 0 ? Math.round(((teacherAttendanceStatus.filter(t => t.status !== 'Belum Absen' && t.status !== 'Tidak Hadir').length) / teachers.length) * 100) : 0,
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">Dasbor Admin</h1>
            <p className="text-muted-foreground">Ringkasan umum dan pemantauan aktivitas guru.</p>
        </div>
        
        {/* --- STATS CARDS --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} title="Total Guru" value={teachers.length} subtitle="Pengguna dengan role guru" color="text-blue-600" bgColor="bg-blue-50" />
            <StatCard icon={UserCheck} title="Hadir Hari Ini" value={summary.present} subtitle="Absen masuk tepat waktu" color="text-green-600" bgColor="bg-green-50" />
            <StatCard icon={Clock} title="Terlambat Hari Ini" value={summary.late} subtitle="Absen masuk melewati batas" color="text-yellow-600" bgColor="bg-yellow-50" />
            <StatCard icon={UserX} title="Belum Absen" value={summary.notCheckedIn} subtitle="Guru belum melakukan absen masuk" color="text-red-600" bgColor="bg-red-50" />
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
                                    <p className="text-sm text-muted-foreground">Masuk: {teacher.checkIn || '-'}</p>
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
                                        <TableCell className="text-center font-mono">{teacher.checkIn || '-'}</TableCell>
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
                <CardTitle>Grafik Kehadiran Mingguan</CardTitle>
                <CardDescription>Tren kehadiran guru dalam 7 hari terakhir.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={dashboardData.weeklyAttendance}>
                        <XAxis
                            dataKey="day"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '0.5rem',
                                border: '1px solid hsl(var(--border))',
                                background: 'hsl(var(--background))'
                            }}
                        />
                        <Bar dataKey="hadir" name="Hadir" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    </div>
  );
}
