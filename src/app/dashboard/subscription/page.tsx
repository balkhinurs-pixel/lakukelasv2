
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2, X } from "lucide-react";
import { createPaymentTransaction } from "@/ai/flows/payment-flow";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";

const premiumFeatures = [
    "Manajemen Siswa & Kelas Tanpa Batas",
    "Pencatatan Presensi, Nilai, Jurnal Tanpa Batas",
    "Unduh Laporan PDF Profesional dengan Kop Surat",
    "Impor & Ekspor Data Siswa",
    "Fitur Kenaikan Kelas & Kelulusan",
    "Dukungan Prioritas"
];

const freeFeatures = [
    { text: "Manajemen 1 kelas", included: true },
    { text: "Manajemen 10 siswa per kelas", included: true },
    { text: "Pencatatan Presensi, Nilai, Jurnal (terbatas)", included: true },
    { text: "Unduh Laporan PDF Profesional", included: false },
    { text: "Impor & Ekspor Data Siswa", included: false },
]

export default function SubscriptionPage() {
  const [loading, setLoading] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { isPremium } = useSubscription();

  const handleSubscription = async (packageName: 'semester' | 'tahunan', amount: number) => {
    setLoading(packageName);
    try {
        const result = await createPaymentTransaction({
            packageName,
            amount,
            productDetails: `Langganan Classroom Zephyr - Paket ${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`,
        });

        if (result.paymentUrl) {
            console.log("Redirecting to payment URL:", result.paymentUrl);
            window.open(result.paymentUrl, '_blank');
            toast({
                title: "Mengarahkan ke Pembayaran",
                description: "Anda sedang diarahkan ke halaman pembayaran yang aman.",
            });
        } else {
            throw new Error(result.errorMessage || "Gagal membuat transaksi.");
        }
    } catch (error) {
        console.error("Payment error:", error);
        toast({
            title: "Terjadi Kesalahan",
            description: (error as Error).message || "Tidak dapat memproses permintaan Anda saat ini.",
            variant: "destructive",
        });
    } finally {
        setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Pilih Paket yang Tepat Untuk Anda</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Akses semua fitur premium Classroom Zephyr untuk memaksimalkan efisiensi mengajar Anda. Batalkan kapan saja.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Plan Card */}
        <Card className="flex flex-col">
           {isPremium ? null : (
                <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                    <div className="bg-muted-foreground/80 text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">Paket Anda Saat Ini</div>
                </div>
           )}
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Paket Gratis</CardTitle>
            <CardDescription>Coba fitur-fitur inti untuk memulai.</CardDescription>
            <div className="pt-4">
                <span className="text-4xl font-bold">Rp 0</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="font-semibold">Fitur yang termasuk:</p>
            <ul className="space-y-2">
                {freeFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                        {feature.included ? <Check className="h-5 w-5 text-green-500 mt-0.5" /> : <X className="h-5 w-5 text-destructive mt-0.5" />}
                        <span className="text-muted-foreground">{feature.text}</span>
                    </li>
                ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>
               Aktif
            </Button>
          </CardFooter>
        </Card>
        
        {/* Semester Plan Card */}
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
            <p className="font-semibold">Semua di Paket Gratis, plus:</p>
            <ul className="space-y-2">
                {premiumFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={() => handleSubscription('semester', 150000)} disabled={loading !== null || isPremium}>
               {loading === 'semester' ? <Loader2 className="animate-spin" /> : (isPremium ? "Sudah Berlangganan" : "Pilih Paket Semester")}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Annual Plan Card */}
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
             <p className="font-semibold">Semua di Paket Gratis, plus:</p>
             <ul className="space-y-2">
                {premiumFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
                 <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="text-muted-foreground font-semibold">Akses fitur baru lebih awal</span>
                </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={() => handleSubscription('tahunan', 250000)} disabled={loading !== null || isPremium}>
                {loading === 'tahunan' ? <Loader2 className="animate-spin" /> : (isPremium ? "Sudah Berlangganan" : "Pilih Paket Tahunan")}
            </Button>
          </CardFooter>
        </Card>
      </div>

       <div className="text-center text-muted-foreground text-sm max-w-2xl mx-auto">
            <p>Pembayaran akan diproses melalui payment gateway Duitku yang aman. Langganan akan diperpanjang secara otomatis. Anda dapat membatalkan perpanjangan kapan saja melalui halaman pengaturan akun.</p>
        </div>
    </div>
  );
}
