"use client";

import * as React from "react";
import { 
    ScanLine, 
    Camera, 
    FileText, 
    Users, 
    CheckCircle2, 
    Loader2, 
    ArrowRight, 
    RotateCcw,
    ShieldCheck,
    AlertCircle,
    Info,
    LayoutGrid
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiDocument, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function KoreksiClient({ 
    naskahList,
    schoolProfile 
}: { 
    naskahList: AiDocument[],
    schoolProfile: Profile | null
}) {
    const [selectedNaskahId, setSelectedNaskahId] = React.useState<string>("");
    const [isScanning, setIsScanning] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const handleStartScan = () => {
        if (!selectedNaskahId) return;
        setIsScanning(true);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* 1. Konfigurasi Scanner */}
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <CardHeader className="bg-slate-50/50 border-b p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <LayoutGrid className="h-6 w-6 text-emerald-600" />
                            Mulai Koreksi
                        </CardTitle>
                        <CardDescription>Pilih naskah soal yang akan diperiksa lembar jawabnya.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Paket Ujian</Label>
                            <Select value={selectedNaskahId} onValueChange={setSelectedNaskahId}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-0 font-bold shadow-inner">
                                    <SelectValue placeholder="Daftar naskah tersedia..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                    {naskahList.map(doc => (
                                        <SelectItem key={doc.id} value={doc.id} className="py-3 font-bold">
                                            {doc.title} ({doc.subject})
                                        </SelectItem>
                                    ))}
                                    {naskahList.length === 0 && (
                                        <div className="p-4 text-center text-xs text-slate-400 font-bold">
                                            Belum ada naskah di Repository
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-5 rounded-[2rem] bg-emerald-50 border border-emerald-100 space-y-3 shadow-inner">
                            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-tight">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                <span>Cara Penggunaan</span>
                            </div>
                            <ul className="space-y-2 text-[11px] font-medium text-emerald-800/80 leading-relaxed">
                                <li className="flex gap-2"><span>1.</span> Pastikan Anda menggunakan LJK resmi dari LakuKelas.</li>
                                <li className="flex gap-2"><span>2.</span> Gunakan pencahayaan yang cukup saat memotret.</li>
                                <li className="flex gap-2"><span>3.</span> AI akan otomatis mendeteksi NIS dan menghitung skor.</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 p-8 border-t">
                        <Button 
                            onClick={handleStartScan}
                            disabled={!selectedNaskahId || loading}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                            Buka Scanner AI
                        </Button>
                    </CardFooter>
                </Card>

                {/* 2. Area Scanner / Placeholder */}
                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden min-h-[600px] flex flex-col items-center justify-center text-center p-12 relative group">
                    <div className="absolute inset-0 bg-slate-50 opacity-30 group-hover:opacity-10 transition-opacity" />
                    
                    <AnimatePresence mode="wait">
                        {!isScanning ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10"
                            >
                                <div className="p-16 rounded-[5rem] bg-white shadow-xl mb-8 group-hover:rotate-6 transition-all duration-700">
                                    <ScanLine className="h-24 w-24 text-emerald-100 group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Scanner AI Belum Aktif</h3>
                                <p className="text-slate-400 font-bold text-sm max-w-xs mt-4 leading-relaxed mx-auto">
                                    Pilih naskah di samping, lalu aktifkan kamera untuk mulai mengoreksi lembar jawab siswa secara otomatis.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                                <div className="p-8 text-center space-y-4">
                                    <AlertCircle className="h-16 w-16 text-emerald-500 mx-auto animate-pulse" />
                                    <p className="text-white font-black uppercase tracking-widest text-lg">Inisialisasi Kamera...</p>
                                    <p className="text-white/40 text-xs font-bold max-w-xs mx-auto">Pastikan browser mengizinkan akses kamera untuk fitur Vision AI.</p>
                                    <Button variant="outline" className="mt-8 border-white/20 text-white rounded-xl" onClick={() => setIsScanning(false)}>
                                        Batalkan
                                    </Button>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </div>
    );
}

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={cn("block text-sm font-medium text-gray-700", className)}>{children}</label>
);
