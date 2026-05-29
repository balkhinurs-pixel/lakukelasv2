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
    AlertTriangle,
    Trash2,
    Plus,
    History,
    ClipboardCheck
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
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface ScannedResult {
    id: string;
    detectedNis: string;
    studentName: string;
    studentId?: string;
    totalScore: number;
    studentAnswers: any[];
    analysis: string;
    timestamp: number;
}

/**
 * Helper function to compress and resize image on client side
 * V65.0 Optimized for Stability
 */
async function optimizeImage(base64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1600; // Optimal for Gemini Vision
            const MAX_HEIGHT = 1600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject("Could not get canvas context");
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with 80% quality (High compression, excellent detail)
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            resolve(compressed);
        };
        img.onerror = (e) => reject(e);
    });
}

export default function KoreksiClient({ 
    naskahList,
    schoolProfile 
}: { 
    naskahList: AiDocument[],
    schoolProfile: Profile | null
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedNaskahId, setSelectedNaskahId] = React.useState<string>("");
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    
    // Session State (Batch Scanning)
    const [resultsList, setResultsList] = React.useState<ScannedResult[]>([]);
    const [currentScan, setCurrentScan] = React.useState<ScannedResult | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleStartScan = () => {
        if (!selectedNaskahId) {
            toast({ title: "Pilih Ujian", description: "Pilih paket ujian terlebih dahulu untuk menentukan kunci jawaban.", variant: "destructive" });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const rawBase64 = event.target?.result as string;
            
            try {
                // Step 1: Optimize Image (Resize & Compress) before sending to server
                const optimizedBase64 = await optimizeImage(rawBase64);
                
                // Step 2: Send to Next.js Server Action -> Gemini Vision AI
                const result = await correctExamAction(selectedNaskahId, optimizedBase64);
                
                if (result.success && result.data) {
                    const newResult: ScannedResult = {
                        ...result.data,
                        id: crypto.randomUUID(),
                        timestamp: Date.now()
                    };
                    
                    setResultsList(prev => [newResult, ...prev]);
                    setCurrentScan(newResult);
                    toast({ title: "Scan Berhasil", description: `Lembar milik ${newResult.studentName} terdeteksi.` });
                } else {
                    toast({ title: "Scan Gagal", description: result.error || "AI kesulitan membaca LJK. Pastikan foto tegak lurus dan jelas.", variant: "destructive" });
                }
            } catch (err) {
                console.error("Scanning Error:", err);
                toast({ title: "Error", description: "Terjadi kesalahan saat memproses gambar. Pastikan format file benar.", variant: "destructive" });
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsDataURL(file);
    };

    const removeResult = (id: string) => {
        setResultsList(prev => prev.filter(r => r.id !== id));
    };

    const handleSaveAll = async () => {
        if (resultsList.length === 0) return;
        
        const validResults = resultsList.filter(r => r.studentId);
        if (validResults.length === 0) {
            toast({ title: "Data Tidak Valid", description: "Tidak ada siswa yang teridentifikasi secara valid untuk disimpan.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const naskah = naskahList.find(n => n.id === selectedNaskahId);
            if (!naskah) throw new Error("Informasi naskah hilang.");

            const formData = new FormData();
            formData.append('date', format(new Date(), 'yyyy-MM-dd'));
            formData.append('class_id', naskah.class_level || ""); 
            formData.append('subject_id', naskah.subject || ""); 
            formData.append('assessment_type', `Koreksi AI: ${naskah.title}`);
            
            const records = validResults.map(r => ({
                student_id: r.studentId,
                score: r.totalScore
            }));
            
            formData.append('records', JSON.stringify(records));

            const result = await saveGrades(formData);

            if (result.success) {
                toast({ 
                    title: "Berhasil!", 
                    description: `${validResults.length} nilai siswa telah direkap ke buku nilai.` 
                });
                setResultsList([]);
                router.refresh();
            } else {
                toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-32">
            <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleFileCapture} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-1">
                {/* 1. Kontrol & Scanner */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b p-6 sm:p-8">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <LayoutGrid className="h-6 w-6 text-indigo-600" />
                                Pilih Ujian
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 sm:p-8 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Naskah Sebagai Kunci</Label>
                                <Select value={selectedNaskahId} onValueChange={setSelectedNaskahId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-0 font-bold shadow-inner focus:ring-2 focus:ring-indigo-500/20">
                                        <SelectValue placeholder="Pilih paket naskah..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        {naskahList.map(doc => (
                                            <SelectItem key={doc.id} value={doc.id} className="py-3 font-bold">
                                                {doc.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <Button 
                                    onClick={handleStartScan}
                                    disabled={!selectedNaskahId || loading}
                                    className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                >
                                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                                    Ambil Foto LJK
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <p className="text-[9px] font-black uppercase tracking-widest">Smart Image Optimizer Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-6 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 space-y-4 shadow-inner">
                        <div className="flex items-center gap-2 text-indigo-900 font-black text-[10px] uppercase tracking-widest">
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                            <span>Status Sesi</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Scan</p>
                                <p className="text-2xl font-black text-slate-900">{resultsList.length}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rata-rata Skor</p>
                                <p className="text-2xl font-black text-emerald-600">
                                    {resultsList.length > 0 
                                        ? Math.round(resultsList.reduce((a, b) => a + b.totalScore, 0) / resultsList.length)
                                        : 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Daftar Hasil Scan */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-3">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Hasil Pemindaian Sesi Ini</h3>
                        </div>
                        {resultsList.length > 0 && (
                            <Button 
                                onClick={handleSaveAll}
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold gap-2 shadow-lg shadow-emerald-100"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Simpan Semua ke Rekap
                            </Button>
                        )}
                    </div>

                    <ScrollArea className="h-[600px] pr-4">
                        <AnimatePresence mode="popLayout">
                            {resultsList.length > 0 ? (
                                <div className="space-y-4">
                                    {resultsList.map((res) => (
                                        <motion.div 
                                            key={res.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            <Card className="border-0 shadow-md rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
                                                <CardContent className="p-0 flex items-stretch">
                                                    <div className={cn(
                                                        "w-1.5 shrink-0",
                                                        res.totalScore >= 75 ? "bg-emerald-500" : "bg-rose-500"
                                                    )} />
                                                    <div className="p-6 flex-1 flex flex-col sm:flex-row items-center justify-between gap-6">
                                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                                            <div className="p-3 rounded-2xl bg-slate-50 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                                                                <Fingerprint className="h-6 w-6" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-black text-lg text-slate-900 leading-tight truncate uppercase tracking-tight">
                                                                    {res.studentName}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="outline" className="text-[9px] font-mono">NIS: {res.detectedNis}</Badge>
                                                                    {!res.studentId && (
                                                                        <Badge variant="destructive" className="text-[8px] uppercase tracking-widest font-black">Siswa Tak Terdaftar</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-8 shrink-0">
                                                            <div className="text-center">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Skor Akhir</p>
                                                                <p className={cn(
                                                                    "text-3xl font-black leading-none",
                                                                    res.totalScore >= 75 ? "text-emerald-600" : "text-rose-600"
                                                                )}>{res.totalScore}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => setCurrentScan(res)}
                                                                    className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                                >
                                                                    <ClipboardCheck className="h-5 w-5" />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => removeResult(res.id)}
                                                                    className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[500px] flex flex-col items-center justify-center text-center opacity-30">
                                    <div className="p-16 rounded-[4rem] bg-slate-50 shadow-inner mb-8">
                                        <ScanLine className="h-20 w-20 text-slate-200" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Daftar Sesi Masih Kosong</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-2 max-w-xs mx-auto">
                                        Hasil scan LJK akan muncul di sini. Ambil foto lembar pertama untuk memulai.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </ScrollArea>
                </div>
            </div>

            {/* Results Review Dialog */}
            <Dialog open={!!currentScan} onOpenChange={(open) => !open && setCurrentScan(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                    {currentScan && (
                        <div className="flex flex-col h-[85vh]">
                            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-8 text-white shrink-0">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black tracking-tight uppercase text-white">Analisis Lembar Jawab</DialogTitle>
                                    <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mt-1">{currentScan.studentName} • NIS {currentScan.detectedNis}</p>
                                </DialogHeader>
                            </div>

                            <ScrollArea className="flex-1 p-8">
                                <div className="space-y-8">
                                    <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-6 w-6" /></div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Pencapaian Siswa</span>
                                                <p className="text-4xl font-black text-emerald-600 leading-none mt-1">{currentScan.totalScore}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={cn(
                                                "uppercase font-black text-[9px] py-1.5 px-4 rounded-xl",
                                                currentScan.totalScore >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                            )}>
                                                {currentScan.totalScore >= 75 ? "Tuntas KKM" : "Perlu Remedial"}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Detail Peta Jawaban</h4>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                                            {currentScan.studentAnswers.map((item: any, idx: number) => (
                                                <div key={idx} className={cn(
                                                    "aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all shadow-sm",
                                                    item.isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                                                )}>
                                                    <span className="text-[8px] font-black opacity-40 leading-none mb-1">{item.questionNum}</span>
                                                    <span className="text-base font-black uppercase">{item.studentChoice || '?'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {currentScan.analysis && (
                                        <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-start gap-4">
                                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-amber-900 tracking-widest">Catatan Koreksi AI</span>
                                                <p className="text-xs font-bold text-amber-800/80 leading-relaxed mt-1.5 italic">{currentScan.analysis}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="p-8 bg-white border-t shrink-0">
                                <Button 
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
                                    onClick={() => setCurrentScan(null)}
                                >
                                    Selesai Meninjau
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
