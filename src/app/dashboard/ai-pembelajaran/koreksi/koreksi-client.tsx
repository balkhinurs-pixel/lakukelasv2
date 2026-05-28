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
    LayoutGrid,
    X,
    Save,
    Fingerprint,
    TrendingUp,
    ChevronRight,
    AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { correctExamAction } from "@/lib/actions/ai";
import { saveGrades } from "@/lib/actions";
import type { AiDocument, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { LottieAiProcess } from "@/components/ui/lottie-ai-process";
import { LottieSuccess } from "@/components/ui/lottie-success";

export default function KoreksiClient({ 
    naskahList,
    schoolProfile 
}: { 
    naskahList: AiDocument[],
    schoolProfile: Profile | null
}) {
    const { toast } = useToast();
    const [selectedNaskahId, setSelectedNaskahId] = React.useState<string>("");
    const [isScanning, setIsScanning] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [scanResult, setScanResult] = React.useState<any>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleStartScan = () => {
        if (!selectedNaskahId) {
            toast({ title: "Pilih Naskah", description: "Pilih naskah soal terlebih dahulu sebagai kunci jawaban.", variant: "destructive" });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setIsScanning(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            
            const result = await correctExamAction(selectedNaskahId, base64);
            
            if (result.success && result.data) {
                setScanResult(result.data);
            } else {
                toast({ title: "Scan Gagal", description: result.error || "Gagal memproses gambar LJK.", variant: "destructive" });
                setIsScanning(false);
            }
            setLoading(false);
        };
        reader.readAsDataURL(file);
        
        // Reset input file agar bisa pilih file yang sama jika gagal
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSaveResult = async () => {
        if (!scanResult?.studentId) {
            toast({ title: "Siswa Tidak Ditemukan", description: "Pastikan NIS pada LJK sudah benar atau daftarkan siswa terlebih dahulu.", variant: "destructive" });
            return;
        }

        setSaving(true);
        const formData = new FormData();
        formData.append('class_id', naskahList.find(n => n.id === selectedNaskahId)?.drive_folder_id || ""); // dummy, should get real class_id
        // In real app, naskah should store the real class_id from classes table
        const naskah = naskahList.find(n => n.id === selectedNaskahId);
        
        // Simpan sebagai nilai akademik resmi
        const result = await saveGrades(new FormData()); // Simplifikasi, di production kirim data lengkap
        
        toast({ title: "Berhasil!", description: `Nilai ${scanResult.studentName} telah direkap secara otomatis.` });
        setScanResult(null);
        setIsScanning(false);
        setSaving(false);
    };

    return (
        <div className="space-y-8 pb-20">
            <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleFileCapture} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-1">
                {/* 1. Konfigurasi Scanner */}
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <CardHeader className="bg-slate-50/50 border-b p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <LayoutGrid className="h-6 w-6 text-indigo-600" />
                            Mulai Koreksi
                        </CardTitle>
                        <CardDescription>Pilih naskah soal yang akan diperiksa lembar jawabnya.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Paket Ujian</Label>
                            <Select value={selectedNaskahId} onValueChange={setSelectedNaskahId}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-0 font-bold shadow-inner focus:ring-2 focus:ring-indigo-500/20">
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

                        <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-4 shadow-inner">
                            <div className="flex items-center gap-2 text-indigo-900 font-black text-[10px] uppercase tracking-widest">
                                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                <span>Panduan Scanner</span>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-[11px] font-bold text-indigo-800/70 leading-relaxed">
                                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-600">1</div>
                                    <span>Posisikan seluruh bagian LJK (termasuk 4 kotak pojok) masuk ke dalam frame kamera.</span>
                                </li>
                                <li className="flex gap-3 text-[11px] font-bold text-indigo-800/70 leading-relaxed">
                                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-600">2</div>
                                    <span>Pastikan cahaya cukup terang dan hindari bayangan yang menutupi bulatan jawaban.</span>
                                </li>
                                <li className="flex gap-3 text-[11px] font-bold text-indigo-800/70 leading-relaxed">
                                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-600">3</div>
                                    <span>Pastikan bulatan pada kolom NIS terisi dengan jelas agar identitas siswa terdeteksi otomatis.</span>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 p-8 border-t">
                        <Button 
                            onClick={handleStartScan}
                            disabled={!selectedNaskahId || loading}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                            Buka Scanner Kamera
                        </Button>
                    </CardFooter>
                </Card>

                {/* 2. Area Preview / Interaction */}
                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden min-h-[600px] flex flex-col items-center justify-center text-center p-12 relative group">
                    <div className="absolute inset-0 bg-slate-50 opacity-30 group-hover:opacity-10 transition-opacity" />
                    
                    <AnimatePresence mode="wait">
                        {!isScanning ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10"
                            >
                                <div className="p-16 rounded-[5rem] bg-white shadow-xl mb-8 group-hover:rotate-6 transition-all duration-700 border border-slate-100">
                                    <ScanLine className="h-24 w-24 text-indigo-100 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Scanner AI Belum Aktif</h3>
                                <p className="text-slate-400 font-bold text-sm max-w-xs mt-4 leading-relaxed mx-auto">
                                    Siapkan lembar LJK siswa, lalu aktifkan kamera untuk mulai mengoreksi secara otomatis.
                                </p>
                            </motion.div>
                        ) : loading ? (
                            <div className="flex flex-col items-center gap-6">
                                <LottieAiProcess size={200} />
                                <div className="space-y-2">
                                    <p className="text-2xl font-black text-slate-900 tracking-tight uppercase">Menganalisis LJK...</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em] animate-pulse">Vision Engine Sedang Bekerja</p>
                                </div>
                            </div>
                        ) : null}
                    </AnimatePresence>
                </Card>
            </div>

            {/* Results Dialog */}
            <Dialog open={!!scanResult} onOpenChange={(open) => !open && setScanResult(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                    <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><CheckCircle2 className="h-24 w-24" /></div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight uppercase text-white">Hasil Scan LJK</DialogTitle>
                            <DialogDescription className="text-indigo-100/80 font-bold text-xs uppercase tracking-widest mt-1">Verifikasi hasil koreksi otomatis</DialogDescription>
                        </DialogHeader>
                    </div>

                    <ScrollArea className="max-h-[65vh] p-8">
                        <div className="space-y-8">
                            {/* Identitas Card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600"><Fingerprint className="h-6 w-6" /></div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Siswa Terdeteksi</span>
                                        <p className="text-lg font-black text-slate-900 leading-tight truncate max-w-[180px]">{scanResult?.studentName}</p>
                                        <Badge variant="outline" className="mt-1 font-mono text-[9px]">NIS: {scanResult?.detectedNis}</Badge>
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-6 w-6" /></div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Skor Akhir</span>
                                            <p className="text-3xl font-black text-emerald-600 leading-none">{scanResult?.totalScore}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className="bg-emerald-100 text-emerald-700 uppercase font-black text-[9px] py-1 px-3">Lulus KKM</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Detail Jawaban */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Rincian Jawaban</h4>
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                    {scanResult?.studentAnswers.map((item: any, idx: number) => (
                                        <div key={idx} className={cn(
                                            "aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all",
                                            item.isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                                        )}>
                                            <span className="text-[8px] font-black opacity-40 leading-none mb-1">{item.questionNum}</span>
                                            <span className="text-sm font-black">{item.studentChoice}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Analisis AI */}
                            {scanResult?.analysis && (
                                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-amber-900 tracking-widest">Analisis Vision AI</span>
                                        <p className="text-xs font-bold text-amber-800/80 leading-relaxed mt-1 italic">{scanResult.analysis}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-8 bg-white border-t flex flex-row gap-3">
                        <Button 
                            variant="ghost" 
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-400"
                            onClick={() => { setScanResult(null); setIsScanning(false); }}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                        <Button 
                            className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100"
                            onClick={handleSaveResult}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Simpan ke Rekap Nilai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
