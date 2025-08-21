import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function HomeroomReportsPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 /> Laporan Kelas</CardTitle>
                    <CardDescription>
                        Ini adalah halaman untuk wali kelas melihat laporan spesifik kelasnya.
                        Fitur ini sedang dalam pengembangan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Konten untuk laporan kelas oleh wali kelas akan ditampilkan di sini.</p>
                </CardContent>
            </Card>
        </div>
    )
}
