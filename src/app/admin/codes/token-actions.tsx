
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, Share2, Check, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteActivationToken } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TokenActions({ token, appUrl, id }: { token: string, appUrl: string, id: string }) {
    const { toast } = useToast();
    const router = useRouter();
    const [copied, setCopied] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(token);
        setCopied(true);
        toast({ title: "Berhasil!", description: "Token telah disalin ke clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const message = `📢 *AKTIVASI AKUN LAKUKELAS* 📢

Halo Bapak/Ibu Staf pengajar. Berikut adalah *Token Aktivasi* Anda untuk mengakses platform LakuKelas:

🔑 Token: *${token}*
🌐 Alamat Web: ${appUrl}

*Cara Aktivasi:*
1. Buka alamat web di atas.
2. Login menggunakan Google.
3. Masukkan Token 8-digit di atas.

Selamat beraktivitas! ✨
_Sistem Administrasi LakuKelas_`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteActivationToken(id);
        if (result.success) {
            toast({ title: "Dihapus", description: "Token berhasil dihapus." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    };

    return (
        <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 font-bold" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                Salin
            </Button>
            <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={handleWhatsApp}>
                <Share2 className="h-4 w-4 mr-2" />
                WhatsApp
            </Button>
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Hapus Token?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Token <span className="font-mono font-bold text-slate-900">{token}</span> akan dihapus dan tidak bisa digunakan lagi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row gap-2 pt-4">
                        <AlertDialogCancel className="flex-1 rounded-xl">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="flex-1 rounded-xl bg-red-600">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
