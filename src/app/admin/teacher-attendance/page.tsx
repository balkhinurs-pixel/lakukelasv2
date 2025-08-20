
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TeacherAttendanceRecapPage() {

    // Dummy data for display
    const dummyAttendance = [
        { id: '1', teacherName: 'Guru A', date: '2023-10-27', checkIn: '07:15', checkOut: '15:30', status: 'Tepat Waktu' },
        { id: '2', teacherName: 'Guru B', date: '2023-10-27', checkIn: '07:35', checkOut: '15:32', status: 'Terlambat' },
        { id: '3', teacherName: 'Guru C', date: '2023-10-27', checkIn: null, checkOut: null, status: 'Tidak Hadir' },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Tepat Waktu':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Terlambat':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Tidak Hadir':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
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
                    <CardTitle>Laporan Kehadiran Hari Ini</CardTitle>
                    <CardDescription>
                        Menampilkan data absensi guru untuk tanggal 27 Oktober 2023.
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
                            {dummyAttendance.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.teacherName}</TableCell>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{item.checkIn || '-'}</TableCell>
                                    <TableCell>{item.checkOut || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusBadge(item.status)}>{item.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
