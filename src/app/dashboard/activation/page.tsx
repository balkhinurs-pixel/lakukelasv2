
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Sparkles, Users, Download, ArrowRightLeft, ShieldCheck, Star, Crown, Zap, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ActivationPage() {
    const [isVisible, setIsVisible] = React.useState(false);
    const router = useRouter();

    // Animation trigger
    React.useEffect(() => {
        setIsVisible(true);
    }, []);

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
                                Akses Penuh
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-headline bg-gradient-to-r from-slate-900 via-primary to-purple-600 dark:from-slate-100 dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
                                Selamat Datang di Akun Pro
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                Semua fitur premium kini telah terbuka dan dapat Anda nikmati sepenuhnya, gratis.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className={cn(
                    "mb-16 transition-all duration-1000 ease-out delay-200",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
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
                                    Nikmati semua fitur Lakukelas tanpa batas dan tanpa biaya tambahan.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <Star className="h-4 w-4 text-green-600 fill-current" />
                                <span className="text-green-700 dark:text-green-300 font-medium">Status: Premium Active</span>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                {/* Feature Comparison */}
                <div className={cn(
                    "space-y-8 transition-all duration-1000 ease-out delay-400",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Fitur Tanpa Batas</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Semua pengguna kini mendapatkan akses penuh ke fitur-fitur terbaik kami.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto">
                         <Card className="relative p-8 h-full flex flex-col bg-gradient-to-br from-primary/5 via-white to-purple-500/5 dark:from-primary/10 dark:via-slate-900 dark:to-purple-500/10 border-2 border-primary/20">
                            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 text-white px-3 py-1 text-xs font-semibold shadow-lg">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Akses Penuh
                            </Badge>

                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl md:text-3xl font-bold font-headline flex items-center justify-center gap-2">
                                        Fitur Unggulan
                                        <Sparkles className="h-6 w-6 text-primary" />
                                    </h3>
                                    <p className="text-muted-foreground">Fitur lengkap tanpa batas untuk semua</p>
                                </div>
                                
                                <div className="space-y-4 flex-grow">
                                    {[
                                        { icon: Users, text: "Manajemen Kelas & Siswa Tanpa Batas" },
                                        { icon: Download, text: "Unduh Laporan PDF Profesional" },
                                        { icon: ArrowRightLeft, text: "Impor & Ekspor Data Siswa" },
                                        { icon: ShieldCheck, text: "Fitur Promosi & Mutasi Siswa" },
                                        { icon: Gift, text: "Dukungan Prioritas" },
                                    ].map((feature, index) => (
                                        <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-white/50 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/50 transition-all duration-300">
                                            <feature.icon className="h-6 w-6 mt-0.5 shrink-0 text-primary" />
                                            <p className="text-base leading-relaxed font-medium text-foreground">
                                                {feature.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
