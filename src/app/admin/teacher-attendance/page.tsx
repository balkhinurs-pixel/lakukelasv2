
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getTeacherAttendanceHistory } from "@/lib/data";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TeacherAttendance } from "@/lib/types";

export default async function TeacherAttendanceRecapPage() {
    const attendanceHistory = await getTeacherAttendanceHistory();

    const getStatusBadge = (status: TeacherAttendance['status']) => {
        switch (status) {
            case 'Tepat Waktu':
                return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
            case 'Terlambat':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
            case 'Tidak Hadir':
                return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                    <UserCheck className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Rekap Kehadiran Guru</h1>
                    <p className="text-slate-600 mt-1">Pantau catatan kehadiran semua guru di sekolah.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Laporan Kehadiran</CardTitle>
                    <CardDescription>
                        Menampilkan data absensi guru.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Guru</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Absen Masuk</TableHead>
                                <TableHead>Absen Pulang</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceHistory.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.teacherName}</TableCell>
                                    <TableCell>{format(new Date(item.date), 'EEEE, dd MMM yyyy', { locale: id })}</TableCell>
                                    <TableCell>{item.checkIn || '-'}</TableCell>
                                    <TableCell>{item.checkOut || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("font-semibold", getStatusBadge(item.status))}>{item.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {attendanceHistory.length === 0 && (
                        <div className="text-center text-muted-foreground py-16">
                            <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium">Belum Ada Data</h3>
                            <p className="mt-1 text-sm text-gray-500">Data kehadiran guru akan muncul di sini setelah mereka melakukan absensi.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
