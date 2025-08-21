
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, Download, Printer, User, Info, CalendarCheck, FileText, FileSpreadsheet } from "lucide-react";
import { getHomeroomClassDetails } from "@/lib/data";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function HomeroomReportsPage() {
    const homeroomData = await getHomeroomClassDetails();

    if (!homeroomData) {
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
        );
    }

    const { homeroomClass, studentsInClass } = homeroomData;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-headline text-slate-900">
                    Laporan Kelas - {homeroomClass.name}
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Cetak rekapitulasi dan dokumen resmi untuk seluruh kelas perwalian Anda.
                  </p>
                </div>
            </div>

            {studentsInClass.length === 0 ? (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Kelas Anda Belum Memiliki Siswa</AlertTitle>
                    <AlertDescription>
                        Tidak ada siswa yang terdaftar di kelas perwalian Anda. Fitur laporan akan aktif setelah data siswa ditambahkan oleh administrator.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Attendance Report Card */}
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>Laporan Kehadiran Kelas</CardTitle>
                                    <CardDescription>Rekap absensi bulanan atau semester.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pilih Periode</label>
                                <Select disabled>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Bulan atau Semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ganjil">Semester Ganjil</SelectItem>
                                        <SelectItem value="genap">Semester Genap</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button disabled className="w-full"><Download className="mr-2 h-4 w-4"/> Unduh Laporan Kehadiran (PDF)</Button>
                        </CardFooter>
                    </Card>

                    {/* Student Report Card */}
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                             <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                    <FileSpreadsheet className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>Cetak Leger & Rapor Siswa</CardTitle>
                                    <CardDescription>Hasilkan leger atau rapor individual.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pilih Semester</label>
                                 <Select disabled>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ganjil">Semester Ganjil</SelectItem>
                                        <SelectItem value="genap">Semester Genap</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3 mt-4 border-t pt-4">
                                <h4 className="text-sm font-medium">Daftar Siswa</h4>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                    {studentsInClass.map(student => (
                                        <div key={student.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground"/>
                                                <span className="text-sm font-medium">{student.name}</span>
                                            </div>
                                            <Button variant="outline" size="sm" disabled>
                                                <Printer className="mr-2 h-3.5 w-3.5"/> Cetak
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                             <Button disabled className="w-full bg-green-600 hover:bg-green-700">
                                <FileSpreadsheet className="mr-2 h-4 w-4"/> Unduh Leger Kelas (Excel)
                            </Button>
                            <Button disabled className="w-full">
                                <Printer className="mr-2 h-4 w-4"/> Cetak Semua Rapor
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
