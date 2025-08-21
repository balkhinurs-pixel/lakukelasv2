import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function StudentProgressPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Perkembangan Siswa</CardTitle>
                    <CardDescription>
                        Ini adalah halaman untuk wali kelas memantau perkembangan akademik dan non-akademik setiap siswa di kelasnya.
                        Fitur ini sedang dalam pengembangan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Konten untuk memantau perkembangan siswa akan ditampilkan di sini.</p>
                    <p className="mt-4 text-sm text-muted-foreground">Rencananya, halaman ini akan berisi:</p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                        <li>Grafik tren nilai siswa per mata pelajaran.</li>
                        <li>Analisis kehadiran dan rekapitulasi absensi.</li>
                        <li>Catatan khusus atau anecdotal records dari guru-guru.</li>
                        <li>Perbandingan performa siswa dengan rata-rata kelas.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
