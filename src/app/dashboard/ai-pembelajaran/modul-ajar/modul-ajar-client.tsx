"use client";

import * as React from "react";
import { 
    FileText, 
    Sparkles, 
    Loader2, 
    Save, 
    Wand2,
    Settings2,
    Database,
    RefreshCw,
    ArrowRight,
    Target,
    GitBranchPlus,
    Plus,
    Heart,
    Brain,
    Lightbulb,
    GraduationCap,
    School,
    BookOpen,
    Layers,
    Printer,
    Download,
    Copy,
    ClipboardCheck,
    ArrowLeft,
    Code2,
    Terminal,
    Layout
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
import { saveModulAjarToDrive } from "@/lib/actions/google-drive";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

const PROFIL_PANCASILA = [
    "Beriman, bertakwa kepada Tuhan YME, dan berakhlak mulia",
    "Berkebinekaan global",
    "Bergotong royong",
    "Mandiri",
    "Bernalar kritis",
    "Kreatif"
];

const PROFIL_RAHMATAN_LIL_ALAMIN = [
    "Berkeadaban (Ta’addub)",
    "Keteladanan (Qudwah)",
    "Kewarganegaraan dan Kebangsaan (Muwatanah)",
    "Mengambil Jalan Tengah (Tawassut)",
    "Berimbang (Tawazun)",
    "Lurus dan Tegas (I’tidal)",
    "Kesetaraan (Musawah)",
    "Musyawarah (Syura)",
    "Toleransi (Tasamuh)",
    "Dinamis dan Inovatif (Tathawwur wa Ibtikar)"
];

const PEDAGOGICAL_PRACTICES = [
    "Scaffolding (Perancah)",
    "Diferensiasi Produk",
    "Diferensiasi Proses",
    "Diferensiasi Konten",
    "Feedback Konstruktif",
    "Inquiry Learning",
    "Lainnya (Tulis Manual)"
];

const LEARNING_MODELS = [
    "Problem Based Learning (PBL)",
    "Project Based Learning (PjBL)",
    "Discovery Learning",
    "Inquiry Learning",
    "Cooperative Learning",
    "Contextual Teaching and Learning (CTL)",
    "STEAM",
    "Disesuaikan otomatis oleh AI",
    "Lainnya (Tulis Manual)"
];

const DEEP_LEARNING_TYPES = [
    { value: "Mindful Learning", label: "Mindful Learning (Sadar & Fokus)", icon: Heart },
    { value: "Meaningful Learning", label: "Meaningful Learning (Bermakna)", icon: Lightbulb },
    { value: "Joyful Learning", label: "Joyful Learning (Menyenangkan)", icon: Sparkles },
    { value: "Dialogic Learning", label: "Dialogic Learning (Dialogis)", icon: Target },
    { value: "Lainnya (Tulis Manual)", label: "Lainnya (Tulis Manual)", icon: Plus }
];

export default function ModulAjarClient({ 
    classes: _classes, 
    subjects: _subjects,
    driveIntegration: _driveIntegration,
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
    const [generatedResult, setGeneratedResult] = React.useState<{ title: string, content: string, lkpdPrompt?: string } | null>(null);
    const [isDriveAuthDialogOpen, setIsDriveAuthDialogOpen] = React.useState(false);
    const [countdown, setCountdown] = React.useState(30);

    const [isErrorOpen, setIsErrorOpen] = React.useState(false);
    const [errorType, setErrorType] = React.useState<AiErrorType>(null);
    const [errorMsg, setErrorMsg] = React.useState("");

    const [customPedagogy, setCustomPedagogy] = React.useState("");
    const [customDeepLearning, setCustomDeepLearning] = React.useState("");
    const [customModel, setCustomModel] = React.useState("");

    const [form, setForm] = React.useState<ModulAjarInput>({
        kurikulumPath: 'dikbud',
        jenjang: 'SMP / MTs',
        kelas: '7',
        semester: 'Ganjil',
        subject: 'Bahasa Indonesia',
        topic: '',
        alokasiWaktu: '2 x 45 Menit',
        jumlahPertemuan: 1,
        profilPancasila: [],
        profilRahmatanLilAlamin: [],
        modelPembelajaran: 'Disesuaikan otomatis oleh AI',
        saranaPrasarana: '',
        targetSiswa: 'Peserta didik reguler',
        atp_id: 'none',
        pedagogicalPractice: 'Scaffolding (Perancah)',
        deepLearningType: 'Mindful Learning'
    });

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading && !generatedResult) {
            setCountdown(30);
            interval = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loading, !!generatedResult]);

    const handleJenjangChange = (val: string) => {
        const classOpts = getClassOptions(val);
        const mapelOpts = mapelByJenjang[val] || [];
        setForm(prev => ({ 
            ...prev, 
            jenjang: val, 
            kelas: classOpts[0] || '1', 
            subject: mapelOpts[0] || 'Bahasa Indonesia' 
        }));
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

    const handleTogglePancasila = (val: string, checked: boolean) => {
        setForm(prev => {
            const current = prev.profilPancasila;
            if (!checked) {
                return { ...prev, profilPancasila: current.filter(item => item !== val) };
            } else {
                return { ...prev, profilPancasila: [...current, val] };
            }
        });
    };

    const handleToggleRahmatan = (val: string, checked: boolean) => {
        setForm(prev => {
            const current = prev.profilRahmatanLilAlamin || [];
            if (!checked) {
                return { ...prev, profilRahmatanLilAlamin: current.filter(item => item !== val) };
            } else {
                return { ...prev, profilRahmatanLilAlamin: [...current, val] };
            }
        });
    };

    const handleCopyLkpdPrompt = () => {
        if (!generatedResult?.lkpdPrompt) return;
        
        let textToCopy = generatedResult.lkpdPrompt;
        try {
            // Beautify if it's a valid JSON string
            const parsed = JSON.parse(textToCopy);
            textToCopy = JSON.stringify(parsed, null, 2);
        } catch (e) {
            // Keep as is if not JSON
        }

        navigator.clipboard.writeText(textToCopy);
        toast({
            title: "Prompt JSON Disalin",
            description: "Format terstruktur siap digunakan.",
            icon: <ClipboardCheck className="h-5 w-5 text-emerald-500" />
        });
    }

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
            const finalPedagogy = form.pedagogicalPractice === "Lainnya (Tulis Manual)" ? customPedagogy : form.pedagogicalPractice;
            const finalDeepLearning = form.deepLearningType === "Lainnya (Tulis Manual)" ? customDeepLearning : form.deepLearningType;
            const finalModel = form.modelPembelajaran === "Lainnya (Tulis Manual)" ? customModel : form.modelPembelajaran;

            const payload = { 
                ...form,
                pedagogicalPractice: finalPedagogy || form.pedagogicalPractice,
                deepLearningType: finalDeepLearning || form.deepLearningType,
                modelPembelajaran: finalModel || form.modelPembelajaran
            };
            
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
        const result = await saveModulAjarToDrive(
            generatedResult.title, 
            generatedResult.content, 
            {
                jenjang: form.jenjang,
                class: form.kelas,
                subject: form.subject
            },
            generatedResult.lkpdPrompt
        );
        if (result.success) {
            toast({ 
                title: "Tersimpan!", 
                description: "Modul Ajar telah disimpan di Google Drive.",
                action: <Button variant="outline" size="sm" asChild><a href={result.file_url || "#"} target="_blank">Buka File</a></Button>
            });
        } else {
            if (result.error?.toLowerCase().includes('token')) setIsDriveAuthDialogOpen(true);
            else toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setSaving(false);
    };

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            <AiErrorDialog open={isErrorOpen} onOpenChange={setIsErrorOpen} errorType={errorType} errorMessage={errorMsg} onRetry={handleGenerate} />

            {loading && !generatedResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-2xl animate-in fade-in duration-700">
                    <div className="relative p-10 sm:p-14 rounded-[3.5rem] bg-white/80 border border-white/40 shadow-2xl flex flex-col items-center text-center gap-8 max-w-[90vw] overflow-hidden">
                         <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl rounded-full animate-pulse" />
                         <div className="relative">
                             <LottieAiProcess size={220} />
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
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">Modul Ajar Terintegrasi Nasional</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-4 sm:px-6 lg:px-10">
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6 space-y-4">
                            <CardTitle className="text-xl font-black flex items-center gap-2"><Settings2 className="h-5 w-5 text-indigo-600" />Konfigurasi RPP</CardTitle>
                            <Tabs 
                                value={form.kurikulumPath} 
                                onValueChange={(v: any) => setForm(prev => ({...prev, kurikulumPath: v}))}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 rounded-xl p-1 shadow-inner">
                                    <TabsTrigger value="dikbud" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest gap-2">
                                        <School className="h-3.5 w-3.5" /> Kemdikbud
                                    </TabsTrigger>
                                    <TabsTrigger value="kemenag" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest gap-2">
                                        <GraduationCap className="h-3.5 w-3.5" /> Kemenag (KBC)
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="space-y-2 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-inner">
                                <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1 flex items-center gap-2"><GitBranchPlus className="h-3 w-3" /> Gunakan Referensi ATP</Label>
                                <Select value={form.atp_id || 'none'} onValueChange={v => setForm(prev => ({...prev, atp_id: v}))}>
                                    <SelectTrigger className="rounded-xl bg-white border-0 h-11 font-bold shadow-sm"><SelectValue placeholder="Pilih ATP (Opsional)" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="none" className="font-bold text-slate-400">Tanpa Referensi (Manual)</SelectItem>
                                        {atpDocuments.filter(d => d.id).map(doc => (
                                            <SelectItem key={doc.id} value={doc.id!} className="font-bold">{doc.title} ({doc.subject})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang</Label>
                                    <Select value={form.jenjang || ""} onValueChange={handleJenjangChange}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {Object.keys(mapelByJenjang).map(j => <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.kelas || ""} onValueChange={v => setForm(prev => ({...prev, kelas: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mapel</Label>
                                    <Select value={form.subject || ""} onValueChange={v => setForm(prev => ({...prev, subject: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jumlah Pertemuan</Label>
                                    <Select value={String(form.jumlahPertemuan)} onValueChange={v => setForm(prev => ({...prev, jumlahPertemuan: Number(v)}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {[1,2,3,4,5,6].map(n => <SelectItem key={n} value={String(n)} className="font-bold">{n} Pertemuan</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pokok / Bab</Label>
                                <Input placeholder="e.g. Struktur Sel, Adab bertetangga" className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner" value={form.topic} onChange={e => setForm(prev => ({...prev, topic: e.target.value}))} required />
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Model Pembelajaran</Label>
                                <Select value={form.modelPembelajaran} onValueChange={(v) => setForm(prev => ({...prev, modelPembelajaran: v}))}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        {LEARNING_MODELS.map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {form.modelPembelajaran === "Lainnya (Tulis Manual)" && (
                                    <Input 
                                        placeholder="Tulis model pembelajaran..." 
                                        className="rounded-xl h-11 font-bold mt-2 animate-in slide-in-from-top-1" 
                                        value={customModel}
                                        onChange={(e) => setCustomModel(e.target.value)}
                                    />
                                )}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Profil Pelajar Pancasila</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {PROFIL_PANCASILA.map((dim, idx) => (
                                        <label key={dim} htmlFor={`p3-${idx}`} className={cn(
                                            "flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                                            form.profilPancasila.includes(dim) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-50 hover:bg-slate-50"
                                        )}>
                                            <Checkbox 
                                                id={`p3-${idx}`} 
                                                checked={form.profilPancasila.includes(dim)} 
                                                onCheckedChange={(checked) => handleTogglePancasila(dim, !!checked)}
                                                className="rounded-md h-5 w-5" 
                                            />
                                            <span className="text-xs font-bold text-slate-700 leading-tight">{dim}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {form.kurikulumPath === 'kemenag' && (
                                <div className="space-y-3 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest ml-1">Profil Rahmatan Lil Alamin (PPRA)</Label>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[8px]">Wajib Kemenag</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto p-2 border-2 border-emerald-50 rounded-2xl bg-emerald-50/20 custom-scrollbar">
                                        {PROFIL_RAHMATAN_LIL_ALAMIN.map((dim, idx) => (
                                            <label key={dim} htmlFor={`ppra-${idx}`} className={cn(
                                                "flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                                                form.profilRahmatanLilAlamin?.includes(dim) ? "bg-emerald-100 border-emerald-300" : "bg-white border-slate-50 hover:bg-emerald-50"
                                            )}>
                                                <Checkbox 
                                                    id={`ppra-${idx}`}
                                                    checked={form.profilRahmatanLilAlamin?.includes(dim)} 
                                                    onCheckedChange={(checked) => handleToggleRahmatan(dim, !!checked)}
                                                    className="rounded-md h-5 w-5 border-emerald-200 data-[state=checked]:bg-emerald-600" 
                                                />
                                                <span className="text-[11px] font-bold text-emerald-900 leading-tight">{dim}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1 flex items-center gap-2">
                                        <Brain className="h-3 w-3" /> Metode Deep Learning
                                    </Label>
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[8px] uppercase tracking-tighter">Terupdate</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {DEEP_LEARNING_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setForm(prev => ({...prev, deepLearningType: type.value}))}
                                            className={cn(
                                                "p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all text-center h-full",
                                                form.deepLearningType === type.value ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                                            )}
                                        >
                                            <type.icon className="h-5 w-5" />
                                            <span className="text-[9px] font-black uppercase leading-none">{type.label.split('(')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                                {form.deepLearningType === "Lainnya (Tulis Manual)" && (
                                    <Input 
                                        placeholder="Tulis kategori deep learning..." 
                                        className="rounded-xl h-11 font-bold mt-2 animate-in slide-in-from-top-1" 
                                        value={customDeepLearning}
                                        onChange={(e) => setCustomDeepLearning(e.target.value)}
                                    />
                                )}
                            </div>

                            <div className="space-y-2 pt-4 border-t border-slate-100">
                                <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Praktik Pedagogis Utama</Label>
                                <Select value={form.pedagogicalPractice || ""} onValueChange={(v) => setForm(prev => ({...prev, pedagogicalPractice: v}))}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        {PEDAGOGICAL_PRACTICES.map(p => <SelectItem key={p} value={p} className="font-bold">{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {form.pedagogicalPractice === "Lainnya (Tulis Manual)" && (
                                    <Input 
                                        placeholder="Tulis praktik pedagogis..." 
                                        className="rounded-xl h-11 font-bold mt-2 animate-in slide-in-from-top-1" 
                                        value={customPedagogy}
                                        onChange={(e) => setCustomPedagogy(e.target.value)}
                                    />
                                )}
                            </div>

                            <div className="space-y-1.5 pt-4 border-t border-slate-100">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alokasi Waktu Total</Label>
                                <Input placeholder="e.g. 2 x 45 Menit" className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm" value={form.alokasiWaktu} onChange={e => setForm(prev => ({...prev, alokasiWaktu: e.target.value}))} />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Karakteristik Siswa (Opsional)</Label>
                                <Input placeholder="e.g. Siswa Aktif, Gaya Belajar Visual" className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm" value={form.targetSiswa} onChange={e => setForm(prev => ({...prev, targetSiswa: e.target.value}))} />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sarana & Prasarana</Label>
                                <Input placeholder="e.g. Proyektor, Internet, Lab IPA" className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm" value={form.saranaPrasarana} onChange={e => setForm(prev => ({...prev, saranaPrasarana: e.target.value}))} />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-100">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}
                                Generate Modul Ajar
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col relative">
                    <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600"><FileText className="h-5 w-5" /></div>
                            <CardTitle className="text-xl font-black tracking-tight text-indigo-950">Pratinjau Modul</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            {generatedResult && <Button onClick={handleSaveToDrive} disabled={saving} className="rounded-xl h-10 bg-indigo-600 text-white font-bold gap-2 shadow-lg shadow-indigo-100">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Simpan ke Drive</Button>}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 bg-slate-50/20">
                        <div className="w-full h-full overflow-x-auto overflow-y-auto px-4 py-6 sm:px-10 sm:py-10 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {generatedResult ? (
                                    <motion.div 
                                        key="result" 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="w-full flex flex-col items-center gap-8"
                                    >
                                        {/* DOCUMENT PREVIEW */}
                                        <div 
                                            className="bg-white p-8 sm:p-12 shadow-sm border rounded-2xl shrink-0 w-full lg:w-auto" 
                                            style={{ 
                                                width: isMobile ? '100%' : '210mm', 
                                                minHeight: '297mm',
                                                fontFamily: '"Times New Roman", Times, serif'
                                            }}
                                        >
                                            <div className="prose prose-slate max-w-none text-slate-800">
                                                <h1 className="text-2xl border-b-2 border-indigo-700 pb-4 mb-8 text-indigo-700 uppercase tracking-tight font-black text-center">{generatedResult.title}</h1>
                                                <div className="modul-ajar-content text-sm leading-relaxed">
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            table: ({node, ...props}) => <table className="w-full border-collapse border-2 border-slate-300 my-6" {...props} />,
                                                            th: ({node, ...props}) => <th className="border-2 border-slate-300 bg-slate-50 p-2 font-bold text-center text-xs" {...props} />,
                                                            td: ({node, ...props}) => <td className="border-2 border-slate-300 p-2 text-xs align-top" {...props} />,
                                                            h1: ({node, ...props}) => <h2 className="text-lg font-black uppercase text-indigo-700 mt-8 mb-4 border-l-4 border-indigo-600 pl-3" {...props} />,
                                                            h2: ({node, ...props}) => <h3 className="text-md font-bold uppercase text-slate-800 mt-6 mb-3" {...props} />,
                                                            p: ({node, ...props}) => <p className="mb-4 text-justify" {...props} />,
                                                            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                                                            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />
                                                        }}
                                                    >
                                                        {generatedResult.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MODERN JSON LKPD PROMPT PREVIEW */}
                                        <Card className="w-full lg:w-[210mm] border-0 shadow-2xl rounded-3xl bg-slate-900 overflow-hidden">
                                            <CardHeader className="bg-slate-800 border-b border-white/5 p-6 flex flex-row items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                                                        <Terminal className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-black text-white tracking-tight uppercase">JSON Prompt LKPD</CardTitle>
                                                        <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ready for image generation</CardDescription>
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={handleCopyLkpdPrompt}
                                                    variant="ghost"
                                                    className="h-10 rounded-xl border border-white/10 text-indigo-400 hover:bg-indigo-500 hover:text-white font-bold gap-2"
                                                >
                                                    <Copy className="h-4 w-4" /> Salin JSON
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="relative group">
                                                    <div className="absolute top-4 right-4 text-emerald-400 font-mono text-[10px] font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1.5 animate-pulse">
                                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                                        VALID JSON
                                                    </div>
                                                    <pre className="p-8 text-[11px] sm:text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto bg-slate-900/50 custom-scrollbar-dark">
                                                        <code>
                                                            {(() => {
                                                                try {
                                                                    const parsed = JSON.parse(generatedResult.lkpdPrompt || "{}");
                                                                    return JSON.stringify(parsed, null, 2);
                                                                } catch (e) {
                                                                    return generatedResult.lkpdPrompt;
                                                                }
                                                            })()}
                                                        </code>
                                                    </pre>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="bg-slate-800/50 p-4 border-t border-white/5">
                                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mx-auto">
                                                    <Code2 className="h-3 w-3" /> Powered by LakuKelas AI Architect
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="p-16 rounded-[5rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                                            <Sparkles className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Pedagogis Siap Bekerja</h3>
                                        <p className="text-slate-400 font-bold text-sm max-w-xs mt-3">Lengkapi parameter kurikulum dan metode pengajaran di samping untuk mulai merumuskan.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDriveAuthDialogOpen} onOpenChange={setIsDriveAuthDialogOpen}>
                <DialogContent className="rounded-xl p-0 max-w-sm overflow-hidden bg-white">
                    <div className="p-8 text-center space-y-6">
                        <Database className="mx-auto h-12 w-12 text-indigo-600" />
                        <div className="space-y-2">
                            <DialogTitle className="text-xl font-bold">Koneksi Drive Diperlukan</DialogTitle>
                            <DialogDescription>Hubungkan akun Google Anda untuk menyimpan Modul Ajar secara otomatis.</DialogDescription>
                        </div>
                        <Button onClick={handleConnectDrive} className="w-full h-12 bg-indigo-600 text-white font-bold rounded-xl">Hubungkan Akun Google</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-dark::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }

                .modul-ajar-content table {
                    width: 100% !important;
                }
            `}</style>
        </div>
    );
}
