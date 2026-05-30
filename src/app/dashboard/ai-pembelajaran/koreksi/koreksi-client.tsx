"use client";

import * as React from "react";
import { 
    ScanLine, 
    Camera, 
    CheckCircle2, 
    Loader2, 
    ShieldCheck, 
    LayoutGrid, 
    X, 
    Save, 
    Fingerprint, 
    TrendingUp, 
    AlertTriangle, 
    Trash2, 
    History, 
    ClipboardCheck,
    RefreshCw,
    Play,
    Settings2,
    Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { AiErrorDialog, type AiErrorType } from "@/components/ui/ai-error-dialog";
import Script from "next/script";
import { processLJK } from "@/lib/omr/processor";

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

export default function KoreksiClient({ 
    naskahList,
    schoolProfile 
}: { 
    naskahList: AiDocument[],
    schoolProfile: Profile | null
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [cvLoaded, setCvReady] = React.useState(false);
    const [selectedNaskahId, setSelectedNaskahId] = React.useState<string>("");
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    
    const [pendingPhoto, setPendingPhoto] = React.useState<string | null>(null);
    const [resultsList, setResultsList] = React.useState<ScannedResult[]>([]);
    const [currentScan, setCurrentScan] = React.useState<ScannedResult | null>(null);

    // Scoring Settings (Manual Control)
    const [points, setPoints] = React.useState({
        multiple_choice: 2,
        matching: 5,
        true_false: 1,
        short_answer: 3,
        essay: 10
    });

    const [isErrorOpen, setIsErrorOpen] = React.useState(false);
    const [errorType, setErrorType] = React.useState<AiErrorType>(null);
    const [errorMsg, setErrorMsg] = React.useState("");

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const hiddenImageRef = React.useRef<HTMLImageElement>(null);

    const handleStartCapture = () => {
        if (!selectedNaskahId) {
            toast({ title: "Pilih Ujian", description: "Pilih paket ujian terlebih dahulu.", variant: "destructive" });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            setPendingPhoto(event.target?.result as string);
            toast({ title: "Foto Siap", description: "Klik Mulai Koreksi untuk memproses." });
        };
        reader.readAsDataURL(file);
    };

    const handleStartCorrection = async () => {
        if (!pendingPhoto || !selectedNaskahId || !hiddenImageRef.current) return;

        setLoading(true);
        try {
            // 1. PROSES LOKAL DENGAN OPENCV (GRATIS)
            const scanRaw = await processLJK(hiddenImageRef.current);
            
            // 2. KIRIM HASIL SCAN KE SERVER UNTUK PENCOCOKAN & SKORING
            const result = await correctExamAction(selectedNaskahId, scanRaw, points);
            
            if (result.success && result.data) {
                const newResult: ScannedResult = {
                    ...result.data,
                    id: crypto.randomUUID(),
                    timestamp: Date.now()
                };
                
                setResultsList(prev => [newResult, ...prev]);
                setCurrentScan(newResult);
                setPendingPhoto(null);
                toast({ title: "Scan Berhasil!", description: "Data NIS dan bulatan terbaca lokal." });
            } else {
                const err = result.error || "";
                setErrorType('generic');
                setErrorMsg(err);
                setIsErrorOpen(true);
            }
        } catch (err: any) {
            console.error("OpenCV Error:", err);
            setErrorType('generic');
            setErrorMsg("Gagal memproses gambar. Pastikan kualitas foto baik dan terang.");
            setIsErrorOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const removeResult = (id: string) => {
        setResultsList(prev => prev.filter(r => r.id !== id));
    };

    const handleSaveAll = async () => {
        if (resultsList.length === 0 || saving) return;
        
        const validResults = resultsList.filter(r => r.studentId);
        if (validResults.length === 0) {
            toast({ title: "Data Tidak Valid", description: "Siswa tidak teridentifikasi.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const naskah = naskahList.find(n => n.id === selectedNaskahId);
            const formData = new FormData();
            formData.append('date', format(new Date(), 'yyyy-MM-dd'));
            formData.append('class_id', naskah?.class_level || ""); 
            formData.append('subject_id', naskah?.subject || ""); 
            formData.append('assessment_type', `Scan LJK: ${naskah?.title}`);
            
            const records = validResults.map(r => ({
                student_id: r.studentId,
                score: r.totalScore
            }));
            
            formData.append('records', JSON.stringify(records));
            const result = await saveGrades(formData);

            if (result.success) {
                toast({ title: "Berhasil!", description: `${validResults.length} nilai telah direkap.` });
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
            <Script 
                src="https://docs.opencv.org/4.x/opencv.js" 
                strategy="lazyOnload"
                onLoad={() => setCvReady(true)}
            />

            <AiErrorDialog open={isErrorOpen} onOpenChange={setIsErrorOpen} errorType={errorType} errorMessage={errorMsg} onRetry={handleStartCorrection} />

            <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileCapture} />
            
            {/* Hidden Image untuk OpenCV Source */}
            {pendingPhoto && <img ref={hiddenImageRef} src={pendingPhoto} className="hidden" alt="hidden-source" />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-1">
                <div className="lg:col-span-5 space-y-6">
                    {/* Scoring Rules Card */}
                    <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="bg-indigo-50/50 border-b p-6">
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-indigo-600" />
                                Pengaturan Poin (Manual)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Poin PG</Label>
                                <Input type="number" value={points.multiple_choice} onChange={e => setPoints({...points, multiple_choice: parseInt(e.target.value) || 0})} className="h-10 rounded-xl font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Poin Jodohkan</Label>
                                <Input type="number" value={points.matching} onChange={e => setPoints({...points, matching: parseInt(e.target.value) || 0})} className="h-10 rounded-xl font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Poin Isian</Label>
                                <Input type="number" value={points.short_answer} onChange={e => setPoints({...points, short_answer: parseInt(e.target.value) || 0})} className="h-10 rounded-xl font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Poin Esai</Label>
                                <Input type="number" value={points.essay} onChange={e => setPoints({...points, essay: parseInt(e.target.value) || 0})} className="h-10 rounded-xl font-bold" />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-4">
                            <p className="text-[9px] text-slate-400 font-bold uppercase italic text-center w-full">Bobot nilai ini digunakan untuk menghitung skor akhir secara otomatis.</p>
                        </CardFooter>
                    </Card>

                    <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <LayoutGrid className="h-6 w-6 text-indigo-600" />
                                Paket & Scan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Naskah Kunci</Label>
                                <Select value={selectedNaskahId} onValueChange={setSelectedNaskahId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-0 font-bold shadow-inner">
                                        <SelectValue placeholder="Pilih paket naskah..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        {naskahList.map(doc => (
                                            <SelectItem key={doc.id} value={doc.id} className="py-3 font-bold">{doc.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <AnimatePresence mode="wait">
                                {!pendingPhoto ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                        <Button 
                                            onClick={handleStartCapture}
                                            disabled={!selectedNaskahId || loading || !cvLoaded}
                                            className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-4 shadow-xl shadow-indigo-100 transition-all active:scale-95 text-lg"
                                        >
                                            {!cvLoaded ? <Loader2 className="h-7 w-7 animate-spin" /> : <Camera className="h-7 w-7" />}
                                            {!cvLoaded ? "Memuat OpenCV..." : "Ambil Foto LJK"}
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                                        <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-xl aspect-[3/4] bg-slate-900">
                                            <img src={pendingPhoto} className="w-full h-full object-contain" alt="Preview LJK" />
                                            {loading && (
                                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 gap-4">
                                                    <LottieAiProcess size={120} />
                                                    <p className="font-black text-indigo-950 uppercase tracking-tight">OpenCV Sedang Membaca...</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" onClick={() => setPendingPhoto(null)} disabled={loading} className="h-14 rounded-2xl font-bold uppercase text-xs">Ganti Foto</Button>
                                            <Button onClick={handleStartCorrection} disabled={loading} className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs gap-2">Mulai Koreksi</Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between px-3">
                        <div className="flex items-center gap-3">
                            <History className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Hasil Scan Lokal</h3>
                        </div>
                        {resultsList.length > 0 && (
                            <Button onClick={handleSaveAll} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-10 font-bold gap-2">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Rekap ({resultsList.length})
                            </Button>
                        )}
                    </div>

                    <ScrollArea className="h-[600px] pr-4">
                        <AnimatePresence mode="popLayout">
                            {resultsList.length > 0 ? (
                                <div className="space-y-4">
                                    {resultsList.map((res) => (
                                        <motion.div key={res.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                            <Card className="border-0 shadow-md rounded-[2rem] bg-white group hover:shadow-xl transition-all">
                                                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                                        <div className="p-3 rounded-2xl bg-slate-50 text-indigo-600 shrink-0"><Fingerprint className="h-6 w-6" /></div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-lg text-slate-900 truncate uppercase">{res.studentName}</h4>
                                                            <Badge variant="outline" className="text-[9px] font-mono mt-1">NIS: {res.detectedNis}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <div className="text-center">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Skor</p>
                                                            <p className={cn("text-3xl font-black", res.totalScore >= 75 ? "text-emerald-600" : "text-rose-600")}>{res.totalScore}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => setCurrentScan(res)} className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600"><ClipboardCheck className="h-5 w-5" /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => removeResult(res.id)} className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600"><Trash2 className="h-5 w-5" /></Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[500px] flex flex-col items-center justify-center text-center opacity-30">
                                    <div className="p-16 rounded-[4rem] bg-slate-50 shadow-inner mb-8"><ScanLine className="h-20 w-20 text-slate-200" /></div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Siap Memindai Gratis</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-2">OpenCV akan membaca LJK langsung di browser Anda.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </ScrollArea>
                </div>
            </div>

            <Dialog open={!!currentScan} onOpenChange={(open) => !open && setCurrentScan(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                    {currentScan && (
                        <div className="flex flex-col h-[85vh]">
                            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-8 text-white shrink-0">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black tracking-tight uppercase text-white">Review Hasil Scan OpenCV</DialogTitle>
                                    <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mt-1">{currentScan.studentName} • NIS {currentScan.detectedNis}</p>
                                </DialogHeader>
                            </div>
                            <ScrollArea className="flex-1 p-8">
                                <div className="space-y-8">
                                    <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-6 w-6" /></div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Skor (Total Poin)</span>
                                                <p className="text-4xl font-black text-emerald-600 leading-none mt-1">{currentScan.totalScore}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Kecocokan Jawaban</h4>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                                            {currentScan.studentAnswers.map((item: any, idx: number) => (
                                                <div key={idx} className={cn("aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all shadow-sm", item.isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700")}>
                                                    <span className="text-[8px] font-black opacity-40 leading-none mb-1">{item.questionNum}</span>
                                                    <span className="text-base font-black uppercase">{item.studentChoice || '?'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                            <div className="p-8 bg-white border-t shrink-0"><Button className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest" onClick={() => setCurrentScan(null)}>Tutup Review</Button></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
