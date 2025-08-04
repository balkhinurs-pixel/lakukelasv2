
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

const features = [
    "Manajemen Siswa & Kelas Tanpa Batas",
    "Pencatatan Presensi, Nilai, Jurnal",
    "Laporan PDF Profesional",
    "Sinkronisasi Antar Perangkat",
    "Dukungan Prioritas"
]

export default function SubscriptionPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Pilih Paket Langganan Anda</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Akses semua fitur premium Classroom Zephyr untuk memaksimalkan efisiensi mengajar Anda. Batalkan kapan saja.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Paket Semester</CardTitle>
            <CardDescription>Ideal untuk mencoba semua fitur premium selama satu semester penuh.</CardDescription>
            <div className="pt-4">
                <span className="text-4xl font-bold">Rp 150.000</span>
                <span className="text-muted-foreground"> / semester</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="font-semibold">Semua fitur termasuk:</p>
            <ul className="space-y-2">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg">Pilih Paket Semester</Button>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col border-2 border-primary relative shadow-2xl">
          <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
             <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">Paling Populer</div>
          </div>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Paket Tahunan</CardTitle>
            <CardDescription>Pilihan terbaik untuk penggunaan jangka panjang dengan harga lebih hemat.</CardDescription>
            <div className="pt-4">
                <span className="text-4xl font-bold">Rp 250.000</span>
                <span className="text-muted-foreground"> / tahun</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="font-semibold">Semua fitur termasuk:</p>
             <ul className="space-y-2">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
                 <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground font-semibold">Akses fitur baru lebih awal</span>
                </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg">Pilih Paket Tahunan</Button>
          </CardFooter>
        </Card>
      </div>

       <div className="text-center text-muted-foreground text-sm max-w-2xl mx-auto">
            <p>Pembayaran akan diproses melalui payment gateway Duitku yang aman. Langganan akan diperpanjang secara otomatis. Anda dapat membatalkan perpanjangan kapan saja melalui halaman pengaturan akun.</p>
        </div>
    </div>
  );
}
