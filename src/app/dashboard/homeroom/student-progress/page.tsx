
import { getHomeroomStudentProgress, getHomeroomTodayStatus } from "@/lib/data";
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
import { cn } from "@/lib/utils";
import { TrendingUp, UserCheck, TrendingDown, UserX, Users2, Info, Percent, Award, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const AttendanceBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'Hadir': return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Hadir</Badge>;
        case 'Sakit': return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" /> Sakit</Badge>;
        case 'Izin': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" /> Izin</Badge>;
        case 'Alpha': return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Alpha</Badge>;
        default: return <Badge variant="outline" className="text-slate-400 border-slate-200 italic">Belum Terabsen</Badge>;
    }
}

export default async function StudentProgressPage() {
    const [progressData, todayStatus] = await Promise.all([
        getHomeroomStudentProgress(),
        getHomeroomTodayStatus()
    ]);

    const { studentData, className } = progressData;

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Sangat Baik':
                return { icon: TrendingUp, className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" };
            case 'Stabil':
                return { icon: UserCheck, className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200" };
            case 'Butuh Perhatian':
                return { icon: TrendingDown, className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200" };
            case 'Berisiko':
                return { icon: UserX, className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200" };
            default:
                return { icon: UserCheck, className: "bg-muted text-muted-foreground" };
        }
    }

    if (!className) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Anda Bukan Wali Kelas</AlertTitle>
                    <AlertDescription>
                        Anda tidak ditugaskan sebagai wali kelas untuk kelas manapun. Fitur ini hanya tersedia untuk wali kelas.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-slate-900 tracking-tight">Monitoring Wali Kelas - {className}</h1>
                    <p className="text-muted-foreground">Status kehadiran real-time dan analisis perkembangan siswa.</p>
                </div>
            </div>

            {/* LIVE TODAY STATUS SECTION */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
                <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Kehadiran Live Hari Ini</CardTitle>
                                <CardDescription className="text-indigo-100 opacity-80">Update status terakhir dari guru mata pelajaran hari ini.</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-white/10 text-white border-white/20 animate-pulse font-bold">LIVE UPDATE</Badge>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todayStatus?.statuses.slice(0, 6).map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all duration-300">
                                <div className="min-w-0">
                                    <p className="font-bold truncate text-sm">{s.name}</p>
                                    <p className="text-[10px] text-indigo-100 uppercase tracking-widest mt-0.5">Status Sekarang</p>
                                </div>
                                <AttendanceBadge status={s.status} />
                            </div>
                        ))}
                    </div>
                    {todayStatus && todayStatus.statuses.length > 6 && (
                        <p className="text-center text-[10px] text-indigo-100 mt-4 font-medium italic opacity-70">
                            + {todayStatus.statuses.length - 6} siswa lainnya tercatat di sistem.
                        </p>
                    )}
                    {!todayStatus || todayStatus.statuses.length === 0 && (
                        <div className="text-center py-8 opacity-60">
                            <p className="text-sm font-medium italic">Belum ada input presensi dari guru mapel hari ini.</p>
                        </div>
                    )}
                </CardContent>
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            </Card>

            {/* PERFORMANCE ANALYSIS SECTION */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shadow-sm">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Analisis Performa Semester</CardTitle>
                            <CardDescription>
                            Status dihitung dari kombinasi rata-rata nilai dan persentase kehadiran.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {studentData.length > 0 ? (
                        <>
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {studentData.map((student) => {
                                const StatusIcon = getStatusInfo(student.status).icon;
                                return (
                                    <div key={student.id} className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 leading-tight truncate">{student.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest mt-1 uppercase">NIS: {student.nis}</p>
                                            </div>
                                            <Badge variant="outline" className={cn("font-bold text-[10px] uppercase tracking-wider py-1 px-2.5", getStatusInfo(student.status).className)}>
                                                <StatusIcon className="mr-1.5 h-3 w-3" />
                                                {student.status}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-center pt-4 border-t border-slate-50">
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-blue-600 flex items-center justify-center gap-1.5">
                                                    <Award className="h-4 w-4 opacity-70" />
                                                    {student.average_grade}
                                                </p>
                                                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Rata-rata Nilai</p>
                                            </div>
                                            <div className="space-y-1 border-l border-slate-50">
                                                <p className="text-lg font-black text-emerald-600 flex items-center justify-center gap-1.5">
                                                    <Percent className="h-4 w-4 opacity-70" />
                                                    {student.attendance_percentage}%
                                                </p>
                                                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Kehadiran</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-700">Nama Siswa</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700">NIS</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700">Rata-rata Nilai</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700">Kehadiran (%)</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700">Status Performa</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentData.map((student) => {
                                        const StatusIcon = getStatusInfo(student.status).icon;
                                        return (
                                            <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-bold text-slate-900">{student.name}</TableCell>
                                                <TableCell className="text-center font-mono text-xs text-slate-500">{student.nis}</TableCell>
                                                <TableCell className="text-center font-black text-blue-600 text-lg">{student.average_grade}</TableCell>
                                                <TableCell className="text-center font-black text-emerald-600 text-lg">{student.attendance_percentage}%</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={cn("font-bold uppercase tracking-wider py-1.5 px-3", getStatusInfo(student.status).className)}>
                                                        <StatusIcon className="mr-2 h-3.5 w-3.5" />
                                                        {student.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        </>
                    ) : (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Users2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-600">Belum Ada Data Siswa</h3>
                            <p className="text-sm text-slate-400 mt-1">Siswa di kelas {className} akan muncul di sini setelah didaftarkan oleh admin.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
