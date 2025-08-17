
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
import { KeyRound, CheckCircle, Sparkles, Loader2, Users, Download, ArrowRightLeft, ShieldCheck, XCircle, Star, Crown, Zap, Gift } from "lucide-react";
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
    const [isVisible, setIsVisible] = React.useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Animation trigger
    React.useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activationCode) return;
        setLoading(true);

        const result = await activateAccount(activationCode);

        if (result.success) {
            setActivationStatus(true);
            toast({
                title: "Aktivasi Berhasil!",
                description: "Akun Anda kini Pro. Semua fitur telah terbuka.",
                className: "bg-green-100 text-green-900 border-green-200",
            });
            router.refresh();
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
            {/* Hero Section */}
            <div className={cn(
                "relative overflow-hidden pt-16 pb-8 transition-all duration-1000 ease-out",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-6">
                        {/* Main heading with gradient */}
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                <Crown className="h-4 w-4" />
                                Upgrade ke Pro
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-headline bg-gradient-to-r from-slate-900 via-primary to-purple-600 dark:from-slate-100 dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
                                Aktivasi Akun Pro
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                Buka semua fitur premium dan rasakan pengalaman tanpa batas dengan Lakukelas Pro
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {/* Activation Card */}
                <div className={cn(
                    "mb-16 transition-all duration-1000 ease-out delay-200",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    {isPro ? (
                        <Card className="max-w-2xl mx-auto border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-xl shadow-green-100/50 dark:shadow-green-900/20">
                            <CardHeader className="text-center items-center space-y-4 pb-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                                    <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-full">
                                        <ShieldCheck className="h-12 w-12 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl md:text-3xl text-green-800 dark:text-green-200">
                                        Akun Anda Sudah Pro! 🎉
                                    </CardTitle>
                                    <CardDescription className="text-green-700 dark:text-green-300 text-lg">
                                        Terima kasih telah melakukan aktivasi. Nikmati semua fitur Lakukelas tanpa batas!
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                    <Star className="h-4 w-4 text-green-600 fill-current" />
                                    <span className="text-green-700 dark:text-green-300 font-medium">Status: Premium Active</span>
                                </div>
                            </CardHeader>
                        </Card>
                    ) : (
                        <Card className="max-w-2xl mx-auto shadow-2xl shadow-primary/10 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                            <form onSubmit={handleActivation}>
                                <CardHeader className="text-center items-center space-y-4 pb-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                                        <div className="relative bg-gradient-to-br from-primary to-purple-600 p-4 rounded-full">
                                            <KeyRound className="h-12 w-12 text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl md:text-3xl">Masukkan Kode Aktivasi</CardTitle>
                                        <CardDescription className="text-base">
                                            Dapatkan kode aktivasi dari vendor atau distributor resmi kami
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 px-8">
                                    <div className="space-y-3">
                                        <Label htmlFor="activation-code" className="text-base font-medium">
                                            Kode Aktivasi
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                id="activation-code" 
                                                placeholder="XXXXXXXX-XXXX-XXXX-XXXXXXXX" 
                                                value={activationCode}
                                                onChange={(e) => setActivationCode(e.target.value)}
                                                required
                                                className="h-14 text-lg text-center font-mono tracking-wider border-2 focus:border-primary/50 focus:ring-primary/20"
                                            />
                                            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-purple-500/5 pointer-events-none"></div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="px-8 pb-8">
                                    <Button 
                                        type="submit" 
                                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300" 
                                        disabled={loading || !activationCode}
                                    >
                                        {loading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                                        {loading ? "Memverifikasi..." : (
                                            <>
                                                <Zap className="mr-2 h-5 w-5" />
                                                Aktifkan Akun Pro
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    )}
                </div>

                {/* Feature Comparison */}
                <div className={cn(
                    "space-y-8 transition-all duration-1000 ease-out delay-400",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Perbandingan Fitur</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Lihat perbedaan antara akun Gratis dan Pro
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 items-stretch">
                        {/* Free Plan */}
                        <Card className="relative p-8 h-full flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-2">
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl md:text-3xl font-bold font-headline">Gratis</h3>
                                    <p className="text-muted-foreground">Fitur dasar untuk memulai</p>
                                </div>
                                
                                <div className="space-y-4 flex-grow">
                                    {[
                                        { icon: CheckCircle, text: `Manajemen ${limits.classes} kelas`, available: true },
                                        { icon: CheckCircle, text: `Manajemen ${limits.studentsPerClass} siswa per kelas`, available: true },
                                        { icon: CheckCircle, text: "Pencatatan Presensi, Nilai, & Jurnal", available: true },
                                        { icon: XCircle, text: "Unduh Laporan PDF", available: false },
                                        { icon: XCircle, text: "Impor & Ekspor Data Siswa", available: false },
                                        { icon: XCircle, text: "Fitur Promosi & Mutasi Siswa", available: false },
                                    ].map((feature, index) => (
                                        <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <feature.icon className={cn(
                                                "h-6 w-6 mt-0.5 shrink-0",
                                                feature.available ? "text-green-500" : "text-red-400"
                                            )} />
                                            <p className={cn(
                                                "text-base leading-relaxed",
                                                feature.available ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {feature.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Pro Plan */}
                        <div className="relative">
                            {/* Glow effect */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-2xl blur-xl opacity-75 animate-pulse"></div>
                            
                            <Card className="relative p-8 h-full flex flex-col bg-gradient-to-br from-primary/5 via-white to-purple-500/5 dark:from-primary/10 dark:via-slate-900 dark:to-purple-500/10 border-2 border-primary/20">
                                {/* Popular badge - Optimized */}
                                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 text-white px-3 py-1 text-xs font-semibold shadow-lg">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Paling Populer
                                </Badge>

                                <div className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center gap-2">
                                            Pro
                                            <Sparkles className="h-6 w-6 text-primary" />
                                        </h3>
                                        <p className="text-muted-foreground">Fitur lengkap tanpa batas</p>
                                    </div>
                                    
                                    <div className="space-y-4 flex-grow">
                                        {[
                                            { icon: CheckCircle, text: "Semua fitur Gratis, plus:", highlight: true },
                                            { icon: Users, text: "Manajemen Kelas & Siswa Tanpa Batas", highlight: true },
                                            { icon: Download, text: "Unduh Laporan PDF Profesional", highlight: true },
                                            { icon: ArrowRightLeft, text: "Impor & Ekspor Data Siswa", highlight: true },
                                            { icon: ShieldCheck, text: "Fitur Promosi & Mutasi Siswa", highlight: true },
                                            { icon: Gift, text: "Dukungan Prioritas", highlight: true },
                                        ].map((feature, index) => (
                                            <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-white/50 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/50 transition-all duration-300">
                                                <feature.icon className="h-6 w-6 mt-0.5 shrink-0 text-primary" />
                                                <p className="text-base leading-relaxed font-medium text-foreground">
                                                    {feature.text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {!isPro && (
                                        <Button 
                                            size="lg" 
                                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300" 
                                            onClick={() => document.getElementById('activation-code')?.focus()}
                                        >
                                            <Crown className="mr-2 h-5 w-5" />
                                            Aktifkan Sekarang
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
