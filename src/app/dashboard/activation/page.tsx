
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
import { KeyRound, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { useActivation } from "@/hooks/use-activation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { activateAccount } from "@/lib/actions";

export default function ActivationPage() {
    const { isPro, limits, setActivationStatus } = useActivation();
    const [activationCode, setActivationCode] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const handleActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await activateAccount(activationCode);

        if (result.success) {
            setActivationStatus(true); // Update the context state
            toast({
                title: "Aktivasi Berhasil!",
                description: "Akun Anda kini Pro. Semua fitur telah terbuka.",
                className: "bg-green-100 text-green-900 border-green-200",
            });
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
                    <CheckCircle className="h-8 w-8 text-green-700"/>
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
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Memverifikasi..." : "Aktifkan Akun Pro"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
      )}

      <Card className="bg-muted/30">
          <CardHeader>
              <CardTitle>Perbandingan Fitur</CardTitle>
              <CardDescription>Lihat perbedaan antara akun Gratis dan Pro.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg">Akun Gratis</h3>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                           <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                           <span className="text-muted-foreground">Manajemen **{limits.classes} kelas**</span>
                        </li>
                         <li className="flex items-start gap-2">
                           <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                           <span className="text-muted-foreground">Manajemen **{limits.studentsPerClass} siswa** per kelas</span>
                        </li>
                        <li className="flex items-start gap-2">
                           <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                           <span className="text-muted-foreground">Pencatatan Presensi, Nilai, & Jurnal</span>
                        </li>
                    </ul>
                </div>
                 <div className="space-y-4 p-4 rounded-lg border-2 border-primary bg-background shadow-lg">
                    <h3 className="font-semibold text-lg flex items-center">
                        Akun Pro
                        <Sparkles className="h-4 w-4 ml-2 text-primary" />
                    </h3>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                           <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                           <span className="text-foreground">**Semua fitur Gratis**, plus:</span>
                        </li>
                         <li className="flex items-start gap-2">
                           <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                           <span className="text-foreground">Manajemen Kelas & Siswa **Tanpa Batas**</span>
                        </li>
                         <li className="flex items-start gap-2">
                           <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                           <span className="text-foreground">**Unduh Laporan PDF** Profesional</span>
                        </li>
                        <li className="flex items-start gap-2">
                           <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                           <span className="text-foreground">**Impor & Ekspor** Data Siswa</span>
                        </li>
                         <li className="flex items-start gap-2">
                           <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                           <span className="text-foreground">Fitur **Promosi & Mutasi** Siswa</span>
                        </li>
                    </ul>
                </div>
          </CardContent>
      </Card>

    </div>
  );
}
