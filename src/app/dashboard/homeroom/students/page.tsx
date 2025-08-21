import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users2 } from "lucide-react";

export default function HomeroomStudentsPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users2 /> Data Siswa Wali Kelas</CardTitle>
                    <CardDescription>
                        Ini adalah halaman untuk wali kelas mengelola data siswa di kelasnya.
                        Fitur ini sedang dalam pengembangan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Konten untuk manajemen siswa oleh wali kelas akan ditampilkan di sini.</p>
                </CardContent>
            </Card>
        </div>
    )
}
