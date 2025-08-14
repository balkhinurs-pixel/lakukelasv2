
import { getAlumni, getClasses } from "@/lib/data";
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
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/lib/types";

export default async function AlumniPage() {
    const alumni = await getAlumni();
    const classes = await getClasses();

    const getClassName = (classId: string) => {
        return classes.find(c => c.id === classId)?.name || "N/A";
    }

    const getStatusLabel = (status: Student['status']) => {
        switch (status) {
            case 'graduated': return 'Lulus';
            case 'dropout': return 'Pindah/Keluar';
            case 'inactive': return 'Tidak Aktif';
            default: return 'Lainnya';
        }
    }

    const getStatusBadgeVariant = (status: Student['status']) => {
        switch (status) {
            case 'graduated': return 'default';
            case 'dropout': return 'secondary';
            case 'inactive': return 'secondary';
            default: return 'outline';
        }
    }

     const getStatusBadgeClass = (status: Student['status']) => {
        switch (status) {
            case 'graduated': return 'bg-blue-600 hover:bg-blue-700';
            default: return '';
        }
    }


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Daftar Alumni</h1>
                <p className="text-muted-foreground">
                    Daftar siswa yang telah lulus atau tidak aktif lagi di sekolah.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Alumni & Siswa Tidak Aktif</CardTitle>
                    <CardDescription>
                        Total siswa tidak aktif yang tercatat: {alumni.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-4">
                        {alumni.map((student) => (
                            <div key={student.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold">{student.name}</p>
                                    <Badge variant={getStatusBadgeVariant(student.status)} className={getStatusBadgeClass(student.status)}>
                                        {getStatusLabel(student.status)}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1 border-t pt-3 mt-3">
                                    <p><span className="font-medium">NIS:</span> {student.nis}</p>
                                    <p><span className="font-medium">Kelas Terakhir:</span> {getClassName(student.class_id)}</p>
                                    <p><span className="font-medium">Gender:</span> {student.gender}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Siswa</TableHead>
                                    <TableHead>NIS</TableHead>
                                    <TableHead>Kelas Terakhir</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alumni.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.nis}</TableCell>
                                        <TableCell>{getClassName(student.class_id)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(student.status)} className={getStatusBadgeClass(student.status)}>
                                                {getStatusLabel(student.status)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {alumni.length === 0 && (
                        <div className="text-center text-muted-foreground py-16">
                            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium">Belum Ada Alumni</h3>
                            <p className="mt-1 text-sm text-gray-500">Siswa yang telah lulus atau keluar akan ditampilkan di sini.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
