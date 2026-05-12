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
import { Activity, BookText, ClipboardCheck, Award, Info, RefreshCw } from "lucide-react";
import { getTeacherActivityStats } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function TeacherActivityPage() {
    const activityStats = await getTeacherActivityStats();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-headline text-slate-900">Aktivitas Guru</h1>
                        <p className="text-muted-foreground">
                            Pantau tingkat kedisiplinan pengisian data oleh staf pengajar.
                        </p>
                    </div>
                </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle>Metode Perhitungan</AlertTitle>
                <AlertDescription>
                    Statistik dihitung berdasarkan <strong>jumlah sesi/pertemuan</strong> yang diinput, bukan jumlah baris siswa.
                    Ini memberikan gambaran yang lebih adil tentang keaktifan guru.
                </AlertDescription>
            </Alert>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Statistik Keaktifan Keseluruhan</CardTitle>
                            <CardDescription>
                                Total sesi atau entri yang tercatat di sistem untuk setiap guru.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="hidden sm:flex gap-1.5 py-1.5 px-3 bg-slate-50">
                            <RefreshCw className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-600">Real-time</span>
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Mobile View - Modern Cards */}
                    <div className="md:hidden space-y-4">
                        {activityStats.map((teacher, index) => (
                             <div key={teacher.id} className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white shadow-sm hover:shadow-md transition-all duration-200">
                                 <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                         {teacher.name.charAt(0)}
                                     </div>
                                     <p className="font-bold text-slate-900">{teacher.name}</p>
                                 </div>
                                 <div className="grid grid-cols-3 gap-3 text-center pt-4 border-t border-slate-100">
                                     <div className="space-y-1">
                                        <p className="text-lg font-black text-emerald-600">{teacher.attendance_count}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sesi Presensi</p>
                                     </div>
                                     <div className="space-y-1 border-x border-slate-100 px-2">
                                        <p className="text-lg font-black text-indigo-600">{teacher.journal_count}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Entri Jurnal</p>
                                     </div>
                                     <div className="space-y-1">
                                        <p className="text-lg font-black text-amber-600">{teacher.grades_count}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Set Nilai</p>
                                     </div>
                                 </div>
                             </div>
                        ))}
                    </div>

                    {/* Desktop View - Professional Table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[300px] font-bold text-slate-700">Nama Guru</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700">Sesi Presensi</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700">Entri Jurnal</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700">Set Nilai</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activityStats.map((teacher) => (
                                    <TableRow key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-semibold text-slate-900">{teacher.name}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 py-1.5 px-3 font-mono text-sm">
                                                <ClipboardCheck className="h-3.5 w-3.5 mr-2 opacity-70" />
                                                {teacher.attendance_count}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 py-1.5 px-3 font-mono text-sm">
                                                <BookText className="h-3.5 w-3.5 mr-2 opacity-70" />
                                                {teacher.journal_count}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100 py-1.5 px-3 font-mono text-sm">
                                                <Award className="h-3.5 w-3.5 mr-2 opacity-70" />
                                                {teacher.grades_count}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {activityStats.length === 0 && (
                        <div className="text-center text-muted-foreground py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 mt-4">
                            <Activity className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-600">Belum Ada Aktivitas</h3>
                            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Data aktivitas guru akan muncul di sini setelah mereka mulai melakukan input data ke sistem.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
