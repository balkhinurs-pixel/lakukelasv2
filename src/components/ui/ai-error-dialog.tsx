"use client";

import * as React from "react";
import { 
    AlertTriangle, 
    Clock, 
    Key, 
    RefreshCw, 
    Settings,
    X,
    ShieldAlert
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type AiErrorType = 'quota' | 'overloaded' | 'api_key' | 'generic' | null;

interface AiErrorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    errorType: AiErrorType;
    errorMessage?: string;
    onRetry?: () => void;
}

export function AiErrorDialog({ 
    open, 
    onOpenChange, 
    errorType, 
    errorMessage,
    onRetry 
}: AiErrorDialogProps) {
    
    const getErrorContent = () => {
        switch (errorType) {
            case 'quota':
                return {
                    title: "Batas Kuota Tercapai",
                    description: "Anda telah mencapai batas penggunaan API gratis untuk saat ini. Google Gemini membatasi jumlah permintaan per menit.",
                    solution: "Silakan tunggu sekitar 1 menit, lalu klik tombol 'Coba Lagi' di bawah.",
                    icon: <Clock className="h-10 w-10 text-amber-500" />,
                    iconBg: "bg-amber-50",
                    action: (
                        <Button onClick={onRetry} className="w-full h-12 rounded-xl bg-indigo-600 font-bold gap-2">
                            <RefreshCw className="h-4 w-4" /> Coba Lagi Sekarang
                        </Button>
                    )
                };
            case 'overloaded':
                return {
                    title: "Server AI Sedang Sibuk",
                    description: "Server Google Gemini (Error 503) sedang menerima terlalu banyak permintaan dari seluruh dunia.",
                    solution: "Ini adalah masalah dari sisi Google. Silakan coba kembali dalam beberapa saat.",
                    icon: <AlertTriangle className="h-10 w-10 text-rose-500" />,
                    iconBg: "bg-rose-50",
                    action: (
                        <Button onClick={onRetry} className="w-full h-12 rounded-xl bg-indigo-600 font-bold gap-2">
                            <RefreshCw className="h-4 w-4" /> Coba Lagi
                        </Button>
                    )
                };
            case 'api_key':
                return {
                    title: "Masalah API Key",
                    description: "API Key Gemini Anda tidak valid, kadaluwarsa, atau belum dikonfigurasi dengan benar.",
                    solution: "Pastikan Anda sudah memasukkan API Key yang benar di menu Pengaturan.",
                    icon: <Key className="h-10 w-10 text-blue-500" />,
                    iconBg: "bg-blue-50",
                    action: (
                        <Button asChild className="w-full h-12 rounded-xl bg-slate-900 font-bold gap-2">
                            <Link href="/dashboard/settings">
                                <Settings className="h-4 w-4" /> Buka Pengaturan
                            </Link>
                        </Button>
                    )
                };
            default:
                return {
                    title: "Terjadi Kesalahan AI",
                    description: errorMessage || "AI gagal merespon permintaan Anda karena kendala teknis yang tidak terduga.",
                    solution: "Silakan periksa koneksi internet Anda atau coba muat ulang halaman.",
                    icon: <ShieldAlert className="h-10 w-10 text-slate-500" />,
                    iconBg: "bg-slate-50",
                    action: (
                        <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl bg-slate-900 font-bold gap-2">
                            <RefreshCw className="h-4 w-4" /> Muat Ulang Halaman
                        </Button>
                    )
                };
        }
    };

    const content = getErrorContent();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-0 shadow-2xl p-0 overflow-hidden bg-white">
                <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                    <div className={cn("p-6 rounded-[2rem] mb-6 shadow-inner", content.iconBg)}>
                        {content.icon}
                    </div>
                    
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                            {content.title}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium leading-relaxed text-sm">
                            {content.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="w-full mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Rekomendasi Solusi</p>
                        <p className="text-xs font-bold text-slate-700 leading-normal italic">{content.solution}</p>
                    </div>

                    <div className="w-full mt-8 flex flex-col gap-3">
                        {content.action}
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                            Tutup
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}