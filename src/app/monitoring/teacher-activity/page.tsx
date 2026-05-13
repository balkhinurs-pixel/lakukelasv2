'use server';

import { getTeacherActivityStats, getActiveSchoolYearName } from "@/lib/data";
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
import { Activity, BookText, ClipboardCheck, Award, Calendar, Info, RefreshCw, School } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function MonitoringTeacherActivityPage() {
    const [activityStats, activeSemester] = await Promise.all([
        getTeacherActivityStats(),
        getActiveSchoolYearName()
    ]);

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
                            Rekapitulasi kedisiplinan pengisian administrasi guru semester ini.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert className="bg-blue-50 border-blue-200">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Periode</AlertTitle>
                    <AlertDescription className="text-blue-700">Tahun Ajaran: <strong>{activeSemester}</strong></AlertDescription>
                </Alert>
                <Alert className="bg-emerald-50 border-emerald-200">
                    <Info className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-800">Info Data</AlertTitle>
                    <AlertDescription className="text-emerald-700">Dihitung berdasarkan jumlah sesi pertemuan unik.</AlertDescription>
                </Alert>
            </div>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Keaktifan Guru</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="md:hidden space-y-4">
                        {activityStats.map((teacher) => (
                             <div key={teacher.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                                 <p className="font-bold text-slate-900">{teacher.name}</p>
                                 <p className="text-xs text-muted-foreground mb-3">{teacher.classes_handled_count} Kelas Diampu</p>
                                 <div className="grid grid-cols-3 gap-2 text-center text-sm pt-3 border-t">
                                     <div>
                                        <p className="font-bold text-emerald-600">{teacher.attendance_count}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Absen</p>
                                     </div>
                                     <div>
                                        <p className="font-bold text-indigo-600">{teacher.journal_count}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Jurnal</p>
                                     </div>
                                     <div>
                                        <p className="font-bold text-amber-600">{teacher.grades_count}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Nilai</p>
                                     </div>
                                 </div>
                             </div>
                        ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto rounded-xl border">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold">Nama Guru</TableHead>
                                    <TableHead className="text-center font-bold">Beban Kelas</TableHead>
                                    <TableHead className="text-center font-bold">Sesi Absen</TableHead>
                                    <TableHead className="text-center font-bold">Entri Jurnal</TableHead>
                                    <TableHead className="text-center font-bold">Set Nilai</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activityStats.map((teacher) => (
                                    <TableRow key={teacher.id}>
                                        <TableCell className="font-semibold">{teacher.name}</TableCell>
                                        <TableCell className="text-center">{teacher.classes_handled_count} Kelas</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">{teacher.attendance_count}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{teacher.journal_count}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-amber-50 text-amber-700">{teacher.grades_count}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
