
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Fingerprint, Phone, LogOut, CheckCircle2 } from "lucide-react";
import { completeInitialProfile } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CompleteProfilePage() {
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        
        const data = {
            fullName: formData.get('fullName') as string,
            nip: formData.get('nip') as string,
            phoneNumber: formData.get('phoneNumber') as string,
        };

        if (!data.fullName || !data.phoneNumber) {
            toast({ title: "Data Tidak Lengkap", description: "Nama Lengkap dan Nomor WhatsApp wajib diisi.", variant: "destructive" });
            setLoading(false);
            return;
        }

        try {
            const result = await completeInitialProfile(data);
            if (result.success) {
                toast({ 
                    title: "Data Terkirim", 
                    description: "Profil Anda telah diperbarui. Mengalihkan ke halaman tunggu..." 
                });
                
                // Refresh router agar middleware mendapatkan data profil terbaru
                router.refresh();
                
                // Otomatis pindah ke halaman tunggu
                setTimeout(() => {
                    router.push('/waiting-approval');
                }, 500);
            } else {
                toast({ title: "Gagal", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Terjadi kesalahan koneksi.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-lg shadow-2xl rounded-[2.5rem] border-0 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <CardHeader className="text-center space-y-4 pt-10 px-8">
                    <div className="mx-auto bg-blue-50 p-5 rounded-full w-fit relative">
                        <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-black tracking-tight">Lengkapi Data Diri</CardTitle>
                        <CardDescription className="text-base font-medium">
                            Mohon identifikasi diri Anda agar Admin sekolah dapat menyetujui akses Anda dengan mudah.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-10 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Nama Lengkap & Gelar</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input id="fullName" name="fullName" placeholder="e.g. Ahmad Fauzi, S.Pd." className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nip" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">NIP / ID Guru</Label>
                            <div className="relative">
                                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input id="nip" name="nip" placeholder="e.g. 1987XXXXXXXXXXXX" className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Nomor WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input id="phoneNumber" name="phoneNumber" placeholder="e.g. 62812XXXXXXXX" className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20" required />
                            </div>
                            <p className="text-[10px] text-slate-400 italic pl-1">Penting: Gunakan format angka saja (contoh: 62812...)</p>
                        </div>

                        <div className="pt-4 grid gap-3">
                            <Button type="submit" disabled={loading} className="h-14 rounded-2xl font-bold text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95">
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                Ajukan Persetujuan
                            </Button>
                            <Button type="button" variant="ghost" onClick={handleLogout} className="h-12 text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 rounded-2xl">
                                <LogOut className="mr-2 h-4 w-4" /> Keluar & Batalkan
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
