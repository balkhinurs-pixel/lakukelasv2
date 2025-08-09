
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
import { KeyRound, CheckCircle, Sparkles, Loader2, Users, Download, ArrowRightLeft, ShieldCheck, XCircle } from "lucide-react";
import { useActivation } from "@/hooks/use-activation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { activateAccount } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


export default function ActivationPage() {
    const { isPro, limits, setActivationStatus } = useActivation();
    const [activationCode, setActivationCode] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activationCode) return;
        setLoading(true);

        const result = await activateAccount(activationCode);

        if (result.success) {
            setActivationStatus(true); // Update the context state
            toast({
                title: "Aktivasi Berhasil!",
                description: "Akun Anda kini Pro. Semua fitur telah terbuka.",
                className: "bg-green-100 text-green-900 border-green-200",
            });
            router.refresh(); // Refresh the page to reflect new Pro status everywhere
        } else {
             toast({
                title: "Aktivasi Gagal",
                description: result.error || "Kode aktivasi tidak valid atau sudah digunakan.",
                variant: "destructive",
            });
        }
        setLoading(false);
        setActivationCode("");
    }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Aktivasi Akun Pro</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Buka semua fitur tanpa batas dengan memasukkan kode aktivasi Anda.
        </p>
      </div>
      
      {isPro ? (
        <Card className="max-w-lg mx-auto border-green-200 bg-green-50/50 shadow-sm">
              <CardHeader className="text-center items-center">
                  <div className="mx-auto bg-green-100 p-3 rounded-full w-fit">
                    <ShieldCheck className="h-8 w-8 text-green-700"/>
                  </div>
                  <CardTitle>Akun Anda Sudah Pro</CardTitle>
                  <CardDescription className="text-green-800">
                    Terima kasih telah melakukan aktivasi. Nikmati semua fitur Lakukelas tanpa batas!
                  </CardDescription>
              </CardHeader>
        </Card>
      ) : (
        <Card className="max-w-lg mx-auto">
            <form onSubmit={handleActivation}>
                <CardHeader>
                    <div className="flex justify-center mb-2">
                        <KeyRound className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-center">Masukkan Kode Aktivasi</CardTitle>
                    <CardDescription className="text-center">
                        Dapatkan kode aktivasi dari vendor atau distributor resmi kami.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="activation-code">Kode Aktivasi</Label>
                        <Input 
                            id="activation-code" 
                            placeholder="XXXXXXXX-XXXX-XXXX-XXXXXXXX" 
                            value={activationCode}
                            onChange={(e) => setActivationCode(e.target.value)}
                            required
                        />
                     </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" size="lg" disabled={loading || !activationCode}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Memverifikasi..." : "Aktifkan Akun Pro"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
      )}

      <div className="space-y-4">
        <div className="text-center">
            <h2 className="text-2xl font-bold font-headline">Perbandingan Fitur</h2>
            <p className="text-muted-foreground mt-1">Lihat perbedaan antara akun Gratis dan Pro.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 items-start">
            <Card className="p-6 h-full flex flex-col">
                <h3 className="text-2xl font-bold font-headline mb-4">Gratis</h3>
                <div className="space-y-3 flex-grow">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">Manajemen **{limits.classes} kelas**</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">Manajemen **{limits.studentsPerClass} siswa** per kelas</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">Pencatatan Presensi, Nilai, & Jurnal</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">Unduh Laporan PDF</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">Impor & Ekspor Data Siswa</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">Fitur Promosi & Mutasi Siswa</p>
                    </div>
                </div>
            </Card>

            <div className="relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Card className="p-6 relative h-full flex flex-col">
                    <Badge className="absolute -top-3 right-5 bg-primary hover:bg-primary">Paling Populer</Badge>
                    <h3 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2">
                        Pro
                        <Sparkles className="h-5 w-5 text-primary" />
                    </h3>
                    <div className="space-y-3 flex-grow">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <p className="text-foreground">Semua fitur **Gratis**, plus:</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <p className="text-foreground">Manajemen Kelas & Siswa **Tanpa Batas**</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Download className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <p className="text-foreground">**Unduh Laporan PDF** Profesional</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <ArrowRightLeft className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <p className="text-foreground">**Impor & Ekspor** Data Siswa</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <p className="text-foreground">Fitur **Promosi & Mutasi** Siswa</p>
                        </div>
                    </div>
                     {!isPro && (
                        <Button size="lg" className="w-full mt-6" onClick={() => document.getElementById('activation-code')?.focus()}>
                            Aktifkan Sekarang
                        </Button>
                    )}
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}

