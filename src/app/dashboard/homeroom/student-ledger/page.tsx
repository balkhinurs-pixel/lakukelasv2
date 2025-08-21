import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardList, BookUser, BarChart3, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StudentLedgerPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
                    <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Catatan & Leger Siswa</h1>
                    <p className="text-slate-600 mt-1">
                        Pusat data terpadu untuk setiap siswa di kelas perwalian Anda.
                    </p>
                </div>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fitur Dalam Pengembangan</AlertTitle>
                <AlertDescription>
                    Halaman ini sedang dalam pengembangan aktif. Di sini Anda akan dapat melihat buku leger nilai digital, riwayat absensi, dan catatan perkembangan untuk setiap siswa.
                </AlertDescription>
            </Alert>
            
            <div className="grid md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookUser /> Buku Leger Digital</CardTitle>
                        <CardDescription>
                            Lihat rekapitulasi nilai dan absensi lengkap siswa dari semua mata pelajaran dalam satu tampilan terpadu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Konten buku leger digital akan ditampilkan di sini.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3 /> Catatan Perkembangan</CardTitle>
                        <CardDescription>
                            Buat dan lihat catatan penting tentang perkembangan siswa, baik catatan pribadi maupun masukan dari guru mapel lain.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Sistem pencatatan perkembangan siswa akan tersedia di sini.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
