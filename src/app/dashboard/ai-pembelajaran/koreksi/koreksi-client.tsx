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
    Target,
    Zap
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
            toast({ title: "Foto Siap", description: "Klik Mulai Koreksi untuk memproses lokal." });
        };
        reader.readAsDataURL(file);
    };

    const handleStartCorrection = async () => {
        if (!pendingPhoto || !selectedNaskahId || !hiddenImageRef.current) return;

        setLoading(true);
        try {
            // 1. PROSES LOKAL DENGAN OPENCV (PERSPECTIVE WARP)
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
                toast({ title: "Scan Berhasil!", description: `Siswa: ${newResult.studentName} terdeteksi.` });
            } else {
                const err = result.error || "";
                setErrorType('generic');
                setErrorMsg(err);
                setIsErrorOpen(true);
            }
        } catch (err: any) {
            console.error("OpenCV Error:", err);
            setErrorType('generic');
            setErrorMsg("Gagal memproses gambar. Pastikan 4 kotak di pojok LJK terlihat jelas dan tidak terpotong.");
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
            toast({ title: "Data Tidak Valid", description: "Tidak ada siswa yang teridentifikasi untuk disimpan.", variant: "destructive" });
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
                toast({ title: "Berhasil!", description: `${validResults.length} nilai telah masuk ke leger akademik.` });
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
                onLoad={() => {
                    // Cek jika opencv sudah benar-benar terdefinisi
                    if (typeof cv !== 'undefined') setCvReady(true);
                }}
            />

            <AiErrorDialog open={isErrorOpen} onOpenChange={setIsErrorOpen} errorType={errorType} errorMessage={errorMsg} onRetry={handleStartCorrection} />

            <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileCapture} />
            
            {/* Hidden Image untuk OpenCV Source */}
            {pendingPhoto && <img ref={hiddenImageRef} src={pendingPhoto} className="hidden" alt="hidden-source" />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-1">
                <div className="lg:col-span-5 space-y-6">
                    {/* Scoring Rules Card */}
                    <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden border border-indigo-100">
                        <CardHeader className="bg-indigo-50/50 border-b p-6">
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-indigo-600" />
                                Bobot Nilai Manual
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Poin PG (Benar)</Label>
                                <Input type="number" value={points.multiple_choice} onChange={e => setPoints({...points, multiple_choice: parseInt(e.target.value) || 0})} className="h-11 rounded-xl font-black bg-slate-50 border-0" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Poin Jodohkan</Label>
                                <Input type="number" value={points.matching} onChange={e => setPoints({...points, matching: parseInt(e.target.value) || 0})} className="h-11 rounded-xl font-black bg-slate-50 border-0" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Poin Isian</Label>
                                <Input type="number" value={points.short_answer} onChange={e => setPoints({...points, short_answer: parseInt(e.target.value) || 0})} className="h-11 rounded-xl font-black bg-slate-50 border-0" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Poin Benar/Salah</Label>
                                <Input type="number" value={points.true_false} onChange={e => setPoints({...points, true_false: parseInt(e.target.value) || 0})} className="h-11 rounded-xl font-black bg-slate-50 border-0" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-3 text-indigo-950">
                                <LayoutGrid className="h-6 w-6 text-indigo-600" />
                                Scanner OMR Lokal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Paket Ujian</Label>
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
                                            className="w-full h-24 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest gap-4 shadow-xl shadow-indigo-100 transition-all active:scale-95 text-lg flex flex-col items-center justify-center p-0"
                                        >
                                            {!cvLoaded ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                                            <span className="text-xs">{!cvLoaded ? "Memuat Mesin OpenCV..." : "Ambil Foto LJK"}</span>
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                                        <div className="relative rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl aspect-[3/4] bg-slate-900 group">
                                            <img src={pendingPhoto} className="w-full h-full object-contain" alt="Preview LJK" />
                                            {loading && (
                                                <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 gap-6">
                                                    <LottieAiProcess size={150} />
                                                    <div className="space-y-2">
                                                        <p className="font-black text-xl text-indigo-950 uppercase tracking-tight">Meratakan Gambar...</p>
                                                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] animate-pulse">Perspective Warp Active</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Button variant="outline" onClick={() => setPendingPhoto(null)} disabled={loading} className="h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Ganti Foto</Button>
                                            <Button onClick={handleStartCorrection} disabled={loading} className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] gap-2">Mulai Scan Lokal</Button>
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
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><History className="h-5 w-5" /></div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Antrean Hasil Scan</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Siap untuk direkap ke leger</p>
                            </div>
                        </div>
                        {resultsList.length > 0 && (
                            <Button onClick={handleSaveAll} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-100 px-6">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Rekap ({resultsList.length})
                            </Button>
                        )}
                    </div>

                    <ScrollArea className="h-[700px] pr-4">
                        <AnimatePresence mode="popLayout">
                            {resultsList.length > 0 ? (
                                <div className="space-y-4 pb-10">
                                    {resultsList.map((res) => (
                                        <motion.div key={res.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                            <Card className="border-0 shadow-md rounded-[2.5rem] bg-white group hover:shadow-xl transition-all border border-slate-100/50">
                                                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                                        <div className="p-4 rounded-3xl bg-slate-50 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform"><Fingerprint className="h-7 w-7" /></div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-xl text-slate-900 truncate uppercase tracking-tight">{res.studentName}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[9px] font-black uppercase border-indigo-100 text-indigo-500 bg-indigo-50/30">NIS: {res.detectedNis}</Badge>
                                                                <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-100 text-slate-400">{format(res.timestamp, 'HH:mm', { locale: id })} WIB</Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-10">
                                                        <div className="text-center">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Skor</p>
                                                            <p className={cn("text-4xl font-black tracking-tighter", res.totalScore >= 75 ? "text-emerald-600" : "text-rose-600")}>{res.totalScore}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => setCurrentScan(res)} className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><ClipboardCheck className="h-6 w-6" /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => removeResult(res.id)} className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="h-6 w-6" /></Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[550px] flex flex-col items-center justify-center text-center opacity-40">
                                    <div className="p-20 rounded-[4rem] bg-slate-50 shadow-inner mb-8 group transition-all hover:bg-indigo-50">
                                        <ScanLine className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-colors group-hover:rotate-12" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Siap Memindai Gratis</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-2 max-w-xs leading-relaxed">
                                        OpenCV (V84.0) akan meluruskan gambar dan membaca LJK langsung di browser Anda tanpa biaya API.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </ScrollArea>
                </div>
            </div>

            <Dialog open={!!currentScan} onOpenChange={(open) => !open && setCurrentScan(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 overflow-hidden rounded-[3rem] border-0 shadow-2xl bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                    {currentScan && (
                        <div className="flex flex-col h-[85vh]">
                            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-8 text-white shrink-0">
                                <DialogHeader>
                                    <div className="flex items-center gap-2 mb-2 opacity-70">
                                        <Zap className="h-4 w-4 fill-white" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">OpenCV Scan Analysis</span>
                                    </div>
                                    <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-white leading-tight">Review Hasil Koreksi</DialogTitle>
                                    <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest mt-2 bg-white/10 w-fit px-3 py-1 rounded-full">{currentScan.studentName} • NIS {currentScan.detectedNis}</p>
                                </DialogHeader>
                            </div>
                            <ScrollArea className="flex-1 p-8">
                                <div className="space-y-10">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                                            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-6 w-6" /></div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Skor</span>
                                                <p className="text-4xl font-black text-emerald-600 leading-none mt-1">{currentScan.totalScore}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                                            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600"><Target className="h-6 w-6" /></div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Akurasi Scan</span>
                                                <p className="text-4xl font-black text-indigo-600 leading-none mt-1">100%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Kecocokan Jawaban</h4>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-slate-400 uppercase">Benar</span></div>
                                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[9px] font-black text-slate-400 uppercase">Salah</span></div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                                            {currentScan.studentAnswers.map((item: any, idx: number) => (
                                                <div key={idx} className={cn(
                                                    "aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all shadow-sm group hover:scale-105",
                                                    item.isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                                                )}>
                                                    <span className="text-[8px] font-black opacity-30 leading-none mb-1">{item.questionNum}</span>
                                                    <span className="text-lg font-black uppercase">{item.studentChoice === "EMPTY" ? "?" : item.studentChoice}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                            <div className="p-8 bg-white border-t shrink-0">
                                <Button className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95" onClick={() => setCurrentScan(null)}>Tutup Review</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

