"use client";

import * as React from "react";
import { 
    FileText, 
    Sparkles, 
    Loader2, 
    Save, 
    CheckCircle2, 
    Wand2,
    Settings2,
    Database,
    RefreshCw,
    ArrowRight,
    Target,
    GitBranchPlus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { streamModulAjarAction } from "@/lib/actions/ai";
import { saveModulAjarToDrive, setupGoogleDriveFolder } from "@/lib/actions/google-drive";
import type { Class, Subject, ModulAjarInput, GoogleDriveIntegration, CpAtpDocument } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LottieAiProcess } from "@/components/ui/lottie-ai-process";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AiErrorDialog, type AiErrorType } from "@/components/ui/ai-error-dialog";
import { readStreamableValue } from 'ai/rsc';

// --- Data Constants ---
const mapelByJenjang: Record<string, string[]> = {
    'SD / MI': ['Bahasa Indonesia', 'Matematika', 'IPA', 'IPS', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Budaya', 'Bahasa Inggris'],
    'SMP / MTs': ['Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'IPA', 'IPS', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Budaya', 'Informatika', 'Prakarya', 'Bahasa Arab'],
    'SMA / MA': ['Bahasa Indonesia', 'Matematika Umum', 'Matematika Tingkat Lanjut', 'Bahasa Inggris', 'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'Seni Budaya', 'TIK', 'Bahasa Arab', 'Fiqih', 'Akidah Akhlak', 'Quran Hadist'],
    'SMK / MAK': ['Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'Informatika', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Culture', 'Dasar-dasar Kejuruan', 'Produk Kreatif & Kewirausahaan']
};

const getClassOptions = (jenjang: string) => {
    if (jenjang === 'SD / MI') return ['1', '2', '3', '4', '5', '6'];
    if (jenjang === 'SMP / MTs') return ['7', '8', '9'];
    if (jenjang === 'SMA / MA' || jenjang === 'SMK / MAK') return ['10', '11', '12'];
    return [];
};

export default function ModulAjarClient({ 
    classes: _classes, 
    subjects: _subjects,
    driveIntegration,
    userProvider,
    atpDocuments = []
}: { 
    classes: Class[], 
    subjects: Subject[],
    driveIntegration: GoogleDriveIntegration | null,
    userProvider?: string,
    atpDocuments: Partial<CpAtpDocument>[]
}) {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [generatedResult, setGeneratedResult] = React.useState<{ title: string, content: string } | null>(null);
    const [isDriveAuthDialogOpen, setIsDriveAuthDialogOpen] = React.useState(false);
    const [countdown, setCountdown] = React.useState(30);

    // AI Error Dialog State
    const [isErrorOpen, setIsErrorOpen] = React.useState(false);
    const [errorType, setErrorType] = React.useState<AiErrorType>(null);
    const [errorMsg, setErrorMsg] = React.useState("");

    const [form, setForm] = React.useState<ModulAjarInput>({
        jenjang: 'SMP / MTs',
        kelas: '7',
        semester: 'Ganjil',
        subject: 'Bahasa Indonesia',
        topic: '',
        alokasiWaktu: '2 x 45 Menit',
        profilPancasila: [],
        modelPembelajaran: 'Problem Based Learning (PBL)',
        saranaPrasarana: '',
        targetSiswa: 'Peserta didik reguler',
        atp_id: 'none'
    });

    // Countdown Logic
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading && !generatedResult) {
            setCountdown(30);
            interval = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loading, generatedResult]);

    const handleJenjangChange = (val: string) => {
        const classOpts = getClassOptions(val);
        const mapelOpts = mapelByJenjang[val] || [];
        setForm(prev => ({ ...prev, jenjang: val, kelas: classOpts[0] || '1', subject: mapelOpts[0] || 'Bahasa Indonesia' }));
    };

    const handleConnectDrive = async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.href,
                scopes: "openid email profile https://www.googleapis.com/auth/drive.file",
                queryParams: { access_type: "offline", prompt: "consent" },
            },
        });
        if (error) toast({ title: "Gagal", description: "Terjadi kesalahan sistem.", variant: "destructive" });
    };

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!form.topic) {
            toast({ title: "Topik Kosong", description: "Mohon isi materi pokok atau bab.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setGeneratedResult(null);
        setCountdown(30);

        try {
            const payload = { ...form };
            if (payload.atp_id === 'none') delete payload.atp_id;

            const { output } = await streamModulAjarAction(payload);
            
            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    setGeneratedResult(delta as any);
                }
            }

            toast({ title: "Berhasil!", description: "Modul Ajar telah dirumuskan." });
        } catch (error: any) {
            const err = error.message || "";
            let type: AiErrorType = 'generic';
            if (err.includes('429') || err.toLowerCase().includes('quota')) type = 'quota';
            else if (err.includes('503') || err.toLowerCase().includes('overloaded')) type = 'overloaded';
            else if (err.toLowerCase().includes('api key')) type = 'api_key';
            setErrorType(type);
            setErrorMsg(err);
            setIsErrorOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToDrive = async () => {
        if (!generatedResult) return;
        if (userProvider !== 'google') {
            toast({ title: "Login Google Diperlukan", description: "Fitur simpan Drive hanya untuk pengguna akun Google.", variant: "destructive" });
            return;
        }
        setSaving(true);
        const result = await saveModulAjarToDrive(generatedResult.title, generatedResult.content, {
            jenjang: form.jenjang,
            class: form.kelas,
            subject: form.subject
        });
        if (result.success) {
            toast({ title: "Tersimpan!", description: "Modul Ajar telah disimpan di Google Drive." });
        } else {
            if (result.error?.toLowerCase().includes('token')) setIsDriveAuthDialogOpen(true);
            else toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setSaving(false);
    };

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            <AiErrorDialog 
                open={isErrorOpen} 
                onOpenChange={setIsErrorOpen} 
                errorType={errorType} 
                errorMessage={errorMsg}
                onRetry={handleGenerate}
            />

            {/* Premium Loading Overlay */}
            {loading && !generatedResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-2xl animate-in fade-in duration-700">
                    <div className="relative p-10 sm:p-14 rounded-[3.5rem] bg-white/80 border border-white/40 shadow-2xl flex flex-col items-center text-center gap-8 max-w-[90vw] overflow-hidden">
                         <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl rounded-full animate-pulse" />
                         <div className="relative">
                             <LottieAiProcess size={220} />
                             <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent pointer-events-none" />
                         </div>
                         <div className="space-y-6">
                             <div className="space-y-2">
                                <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">Merumuskan<br/>Modul Ajar</p>
                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] animate-pulse">AI Pedagogis Sedang Berpikir</p>
                             </div>
                             <div className="flex flex-col items-center gap-3">
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="40" cy="40" r="36" className="stroke-slate-100 fill-none" strokeWidth="6" />
                                        <motion.circle 
                                            cx="40" cy="40" r="36" 
                                            className="stroke-indigo-600 fill-none" 
                                            strokeWidth="6" 
                                            strokeLinecap="round"
                                            strokeDasharray="226"
                                            initial={{ strokeDashoffset: 226 }}
                                            animate={{ strokeDashoffset: 226 - (226 * (30 - countdown) / 30) }}
                                            transition={{ duration: 1, ease: "linear" }}
                                        />
                                    </svg>
                                    <span className="absolute font-mono font-black text-indigo-600 text-xl">{countdown}s</span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Selesai</p>
                             </div>
                         </div>
                    </div>
                </div>
            )}

            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">Generate RPP</h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">Modul Ajar Terintegrasi ATP</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-4 sm:px-6 lg:px-10">
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2"><Settings2 className="h-5 w-5 text-indigo-600" />Konfigurasi RPP</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="space-y-1.5 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-inner">
                                <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1 flex items-center gap-2"><GitBranchPlus className="h-3 w-3" /> Gunakan Referensi ATP</Label>
                                <Select value={form.atp_id} onValueChange={v => setForm({...form, atp_id: v})}>
                                    <SelectTrigger className="rounded-xl bg-white border-0 h-11 font-bold shadow-sm"><SelectValue placeholder="Pilih ATP (Opsional)" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="none" className="font-bold text-slate-400">Tanpa Referensi (Manual)</SelectItem>
                                        {atpDocuments.map(doc => (
                                            <SelectItem key={doc.id} value={doc.id!} className="font-bold">{doc.title} ({doc.subject})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang</Label>
                                    <Select value={form.jenjang} onValueChange={handleJenjangChange}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {Object.keys(mapelByJenjang).map(j => <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.kelas} onValueChange={v => setForm(prev => ({...prev, kelas: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mata Pelajaran</Label><Select value={form.subject} onValueChange={v => setForm(prev => ({...prev, subject: v}))}><SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl border-0 shadow-2xl">{(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pokok / Bab</Label><Input placeholder="e.g. Struktur Sel" className="rounded-xl bg-slate-50 border-0 h-11 font-bold" value={form.topic} onChange={e => setForm(prev => ({...prev, topic: e.target.value}))} required /></div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t"><Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 text-lg font-black uppercase tracking-widest gap-3 transition-all active:scale-95">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}Generate Modul Ajar</Button></CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col relative">
                    <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-indigo-100 text-indigo-600"><FileText className="h-5 w-5" /></div><CardTitle className="text-xl font-black tracking-tight text-indigo-950">Pratinjau Modul</CardTitle></div>
                        {generatedResult && <Button onClick={handleSaveToDrive} disabled={saving} className="rounded-xl h-10 bg-indigo-600 text-white font-bold gap-2 shadow-lg shadow-indigo-100">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Simpan ke Drive</Button>}
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                        <ScrollArea className="h-full">
                            <AnimatePresence mode="wait">
                                {generatedResult ? (
                                    <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 sm:p-10"><div className="prose prose-slate max-w-none text-slate-700"><h1 className="text-2xl border-b pb-4 mb-8 text-indigo-700">{generatedResult.title}</h1><div className="whitespace-pre-wrap text-sm leading-relaxed">{generatedResult.content}</div></div></motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center"><div className="p-16 rounded-[5rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700"><Sparkles className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" /></div><h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Pedagogis Siap Bekerja</h3></div>
                                )}
                            </AnimatePresence>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
