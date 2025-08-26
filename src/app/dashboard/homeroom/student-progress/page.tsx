

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
import { TrendingUp, UserCheck, TrendingDown, UserX, Users2, Info, Percent, Award } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function StudentProgressPage() {
    const { studentData, className } = await getHomeroomStudentProgress();

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
                        Anda tidak ditugaskan sebagai wali kelas untuk kelas manapun. Fitur ini hanya tersedia untuk wali kelas. Hubungi administrator jika Anda merasa ini adalah kesalahan.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
    
    if (studentData.length === 0) {
        return (
            <div className="space-y-6">
                 <div>
                    <h1 className="text-2xl font-bold font-headline">Perkembangan Siswa</h1>
                    <p className="text-muted-foreground">Memantau kemajuan akademik dan kehadiran siswa di kelas Anda.</p>
                </div>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Kelas Anda Belum Memiliki Siswa</AlertTitle>
                    <AlertDescription>
                        Tidak ada siswa yang terdaftar di kelas <span className="font-semibold">{className}</span>. Silakan hubungi administrator untuk menambahkan data siswa ke kelas Anda.
                        <Button asChild variant="link" className="p-0 h-auto ml-1 font-semibold">
                            <Link href="/dashboard/settings">Lihat Profil Saya</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Perkembangan Siswa - Kelas {className}</h1>
                <p className="text-muted-foreground">Pantau kemajuan akademik dan kehadiran setiap siswa di kelas Anda.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Ringkasan Performa Kelas</CardTitle>
                    <CardDescription>
                       Daftar siswa diurutkan berdasarkan status performa. Status ditentukan dari kombinasi rata-rata nilai dan persentase kehadiran.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {studentData.map((student) => {
                            const StatusIcon = getStatusInfo(student.status).icon;
                            return (
                                <div key={student.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{student.name}</p>
                                            <p className="text-sm text-muted-foreground">NIS: {student.nis}</p>
                                        </div>
                                        <Badge variant="outline" className={cn("font-semibold text-xs", getStatusInfo(student.status).className)}>
                                            <StatusIcon className="mr-1 h-3 w-3" />
                                            {student.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-around text-center text-sm pt-2 border-t mt-2">
                                        <div>
                                            <p className="font-bold text-base flex items-center justify-center gap-1"><Award className="h-4 w-4 text-blue-500" />{student.average_grade}</p>
                                            <p className="text-xs text-muted-foreground">Rata-rata Nilai</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-base flex items-center justify-center gap-1"><Percent className="h-4 w-4 text-green-500" />{student.attendance_percentage}</p>
                                            <p className="text-xs text-muted-foreground">Kehadiran</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Siswa</TableHead>
                                    <TableHead>NIS</TableHead>
                                    <TableHead className="text-center">Rata-rata Nilai</TableHead>
                                    <TableHead className="text-center">Kehadiran (%)</TableHead>
                                    <TableHead className="text-center">Status Performa</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentData.map((student) => {
                                    const StatusIcon = getStatusInfo(student.status).icon;
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.nis}</TableCell>
                                            <TableCell className="text-center font-semibold text-blue-600">{student.average_grade}</TableCell>
                                            <TableCell className="text-center font-semibold text-green-600">{student.attendance_percentage}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={cn("font-semibold", getStatusInfo(student.status).className)}>
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

                </CardContent>
            </Card>
        </div>
    )
}
