
import { getHomeroomStudentProgress } from "@/lib/data";
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
import { TrendingUp, UserCheck, TrendingDown, UserX, Info, Percent, Award } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

export default async function StudentProgressPage() {
    const progressData = await getHomeroomStudentProgress();
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
        <div className="space-y-8 p-1">
            <HandWrittenTitle 
                title={`Progres Siswa ${className}`} 
                subtitle="Wali Kelas"
                className="py-4 md:py-6"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert className="bg-indigo-50 border-indigo-200">
                    <Info className="h-4 w-4 text-indigo-600" />
                    <AlertTitle className="text-indigo-800 font-bold uppercase tracking-tight">Kriteria Analisis</AlertTitle>
                    <AlertDescription className="text-indigo-700 text-sm">
                        Status performa siswa dihitung berdasarkan kombinasi rata-rata nilai akademik dan persentase kehadiran selama semester berjalan.
                    </AlertDescription>
                </Alert>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-slate-50/30 border-b border-slate-100 px-6 py-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 shadow-inner">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Peta Performa Siswa</CardTitle>
                            <CardDescription>
                                Pemantauan holistik terhadap perkembangan belajar seluruh anak didik.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {studentData.length > 0 ? (
                        <>
                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {studentData.map((student) => {
                                const StatusIcon = getStatusInfo(student.status).icon;
                                return (
                                    <div key={student.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900 leading-tight truncate text-lg">{student.name}</p>
                                                <p className="text-[10px] text-slate-400 font-black tracking-widest mt-1 uppercase">NIS: {student.nis}</p>
                                            </div>
                                            <Badge variant="outline" className={cn("font-black text-[10px] uppercase tracking-widest py-1.5 px-3 rounded-xl shrink-0", getStatusInfo(student.status).className)}>
                                                <StatusIcon className="mr-2 h-3.5 w-3.5" />
                                                {student.status}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="space-y-1">
                                                <p className="text-xl font-black text-blue-600">{student.average_grade}</p>
                                                <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Rata-rata Nilai</p>
                                            </div>
                                            <div className="space-y-1 border-l border-slate-200">
                                                <p className="text-xl font-black text-emerald-600">{student.attendance_percentage}%</p>
                                                <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Kehadiran</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-bold text-slate-700 py-6 px-8">Nama Siswa</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700">NIS</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700">Rata-rata Nilai</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700">Kehadiran (%)</TableHead>
                                        <TableHead className="text-center font-bold text-slate-700 pr-8">Status Performa</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentData.map((student) => {
                                        const StatusIcon = getStatusInfo(student.status).icon;
                                        return (
                                            <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-bold text-slate-900 py-5 px-8 text-base">{student.name}</TableCell>
                                                <TableCell className="text-center font-mono text-xs text-slate-500 font-bold">{student.nis}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xl font-black text-blue-600">{student.average_grade}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xl font-black text-emerald-600">{student.attendance_percentage}%</span>
                                                </TableCell>
                                                <TableCell className="text-center pr-8">
                                                    <Badge variant="outline" className={cn("font-black uppercase tracking-widest py-2 px-4 rounded-xl", getStatusInfo(student.status).className)}>
                                                        <StatusIcon className="mr-2 h-4 w-4" />
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
                        <div className="text-center py-32 opacity-40">
                             <TrendingUp className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                             <p className="text-lg font-bold text-slate-900">Data Kosong</p>
                             <p className="text-sm font-medium text-slate-500 mt-2">Belum ada analisis untuk semester ini.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
