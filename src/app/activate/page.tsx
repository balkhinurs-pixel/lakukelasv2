'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, KeyRound, LogOut } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { activateAccount } from '@/lib/actions';

export default function ActivationPage() {
    const [token, setToken] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        const result = await activateAccount(token);

        if (result.success) {
            toast({ title: "Akun Aktif!", description: "Selamat datang di LakuKelas." });
            router.push('/dashboard');
            router.refresh();
        } else {
            toast({ title: "Gagal Aktivasi", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        const supabase = createClient();
        if (!supabase) return;
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-2xl rounded-3xl border-0">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                        <ShieldCheck className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-black">Aktivasi Akun</CardTitle>
                        <CardDescription>
                            Gunakan Token Aktivasi dari Administrator untuk mengakses sistem.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleActivate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="token" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Token Aktivasi</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input 
                                    id="token" 
                                    placeholder="Masukkan 8 digit token..." 
                                    className="h-14 pl-12 rounded-xl text-lg font-mono font-bold tracking-widest uppercase border-slate-200"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                                    maxLength={8}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20">
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Aktifkan Sekarang"}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Atau</span></div>
                    </div>

                    <Button variant="ghost" onClick={handleLogout} className="w-full text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 rounded-xl">
                        <LogOut className="mr-2 h-4 w-4" /> Keluar & Ganti Akun
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
