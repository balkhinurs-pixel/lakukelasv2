'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, LogOut, RefreshCcw, Clock } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function WaitingApprovalPage() {
    const router = useRouter();
    const [checking, setChecking] = React.useState(false);

    const handleRefresh = () => {
        setChecking(true);
        window.location.reload();
    };

    const handleLogout = async () => {
        const supabase = createClient();
        if (!supabase) return;
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-2xl rounded-[2.5rem] border-0 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
                <CardHeader className="text-center space-y-4 pt-10">
                    <div className="mx-auto bg-amber-50 p-6 rounded-full w-fit relative">
                        <Clock className="h-12 w-12 text-amber-500 animate-pulse" />
                        <div className="absolute inset-0 bg-amber-200/20 rounded-full animate-ping" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-black tracking-tight">Menunggu Persetujuan</CardTitle>
                        <CardDescription className="text-base font-medium leading-relaxed">
                            Akun Anda telah terdaftar. Silakan hubungi Administrator sekolah untuk menyetujui akses Anda ke sistem LakuKelas.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pb-10">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            Status: Pending Approval
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Setelah disetujui, Anda akan dapat mengakses seluruh fitur Dashboard Guru, Presensi, dan Penilaian.
                        </p>
                    </div>

                    <div className="grid gap-3">
                        <Button onClick={handleRefresh} disabled={checking} className="h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95">
                            {checking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCcw className="mr-2 h-5 w-5" />}
                            Cek Status Sekarang
                        </Button>
                        <Button variant="ghost" onClick={handleLogout} className="h-12 text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 rounded-2xl">
                            <LogOut className="mr-2 h-4 w-4" /> Keluar & Ganti Akun
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
