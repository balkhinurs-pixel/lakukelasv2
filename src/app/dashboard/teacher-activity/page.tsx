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
import { Activity, BookText, ClipboardCheck, Award } from "lucide-react";
import { getTeacherActivityStats } from "@/lib/data";

export default async function TeacherActivityPage() {
    const activityStats = await getTeacherActivityStats();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
                    <Activity className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Aktivitas Guru</h1>
                    <p className="text-muted-foreground">
                        Pantau jumlah entri yang dibuat oleh setiap guru.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Statistik Aktivitas</CardTitle>
                    <CardDescription>
                        Total entri yang tercatat di sistem untuk setiap guru. Data ini diperbarui secara real-time.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="md:hidden space-y-4">
                        {activityStats.map((teacher, index) => (
                             <div key={teacher.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                                 <p className="font-semibold text-base">{teacher.name}</p>
                                 <div className="grid grid-cols-3 gap-2 text-center text-sm pt-3 border-t">
                                     <div>
                                        <p className="font-bold text-lg">{teacher.attendance_count}</p>
                                        <p className="text-xs text-muted-foreground">Presensi</p>
                                     </div>
                                     <div>
                                        <p className="font-bold text-lg">{teacher.journal_count}</p>
                                        <p className="text-xs text-muted-foreground">Jurnal</p>
                                     </div>
                                     <div>
                                        <p className="font-bold text-lg">{teacher.grades_count}</p>
                                        <p className="text-xs text-muted-foreground">Nilai</p>
                                     </div>
                                 </div>
                             </div>
                        ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Guru</TableHead>
                                    <TableHead className="text-center">Total Presensi</TableHead>
                                    <TableHead className="text-center">Total Jurnal</TableHead>
                                    <TableHead className="text-center">Total Input Nilai</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activityStats.map((teacher) => (
                                    <TableRow key={teacher.id}>
                                        <TableCell className="font-medium">{teacher.name}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-mono">
                                                <ClipboardCheck className="h-3 w-3 mr-2" />
                                                {teacher.attendance_count}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-mono">
                                                <BookText className="h-3 w-3 mr-2" />
                                                {teacher.journal_count}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="font-mono">
                                                <Award className="h-3 w-3 mr-2" />
                                                {teacher.grades_count}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {activityStats.length === 0 && (
                        <div className="text-center text-muted-foreground py-16">
                            <Activity className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium">Belum Ada Aktivitas</h3>
                            <p className="mt-1 text-sm text-gray-500">Data aktivitas guru akan muncul di sini setelah mereka mulai mengisi data.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
