"use client";

import * as React from "react";
import { 
    GitBranchPlus, 
    Sparkles, 
    Loader2, 
    Save, 
    Database, 
    RefreshCw,
    ArrowRight,
    Wand2,
    Settings2,
    CheckCircle2,
    FileText,
    Layers
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateCpAtpAction } from "@/lib/actions/ai";
import { saveCpAtpToDrive } from "@/lib/actions/google-drive";
import type { Class, Subject, GoogleDriveIntegration } from "@/lib/types";
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

// --- Data Constants ---
const mapelByJenjang: Record<string, string[]> = {
    'SD / MI': ['Bahasa Indonesia', 'Matematika', 'IPA', 'IPS', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Budaya', 'Bahasa Inggris'],
    'SMP / MTs': ['Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'IPA', 'IPS', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Budaya', 'Informatika', 'Prakarya', 'Bahasa Arab'],
    'SMA / MA': ['Bahasa Indonesia', 'Matematika Umum', 'Matematika Tingkat Lanjut', 'Bahasa Inggris', 'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'Seni Budaya', 'TIK', 'Bahasa Arab', 'Fiqih', 'Akidah Akhlak', 'Quran Hadist'],
    'SMK / MAK': ['Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'Informatika', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Budaya', 'Dasar-dasar Kejuruan', 'Produk Kreatif & Kewirausahaan']
};

const getClassOptions = (jenjang: string) => {
    if (jenjang === 'SD / MI') return ['1', '2', '3', '4', '5', '6'];
    if (jenjang === 'SMP / MTs') return ['7', '8', '9'];
    if (jenjang === 'SMA / MA' || jenjang === 'SMK / MAK') return ['10', '11', '12'];
    return [];
};

const PHASES = [
    { value: 'A', label: 'Fase A (Kelas 1-2)' },
    { value: 'B', label: 'Fase B (Kelas 3-4)' },
    { value: 'C', label: 'Fase C (Kelas 5-6)' },
    { value: 'D', label: 'Fase D (Kelas 7-9)' },
    { value: 'E', label: 'Fase E (Kelas 10)' },
    { value: 'F', label: 'Fase F (Kelas 11-12)' }
];

export default function GenerateCpAtpClient({ 
    classes: _classes, 
    subjects: _subjects,
    driveIntegration,
    userProvider
}: { 
    classes: Class[], 
    subjects: Subject[],
    driveIntegration: GoogleDriveIntegration | null,
    userProvider?: string
}) {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [generatedResult, setGeneratedResult] = React.useState<{ title: string, content: string } | null>(null);
    const [isDriveAuthDialogOpen, setIsDriveAuthDialogOpen] = React.useState(false);

    const [form, setForm] = React.useState({
        jenjang: 'SMP / MTs',
        kelas: '7',
        phase: 'D',
        subject: 'Bahasa Indonesia',
        scope: '',
        additionalInfo: ''
    });

    const handleJenjangChange = (val: string) => {
        const classOpts = getClassOptions(val);
        const mapelOpts = mapelByJenjang[val] || [];
        
        // Auto-detect phase based on jenjang
        let defaultPhase = 'D';
        if (val === 'SD / MI') defaultPhase = 'A';
        else if (val === 'SMA / MA' || val === 'SMK / MAK') defaultPhase = 'E';

        setForm(prev => ({
            ...prev,
            jenjang: val,
            kelas: classOpts[0] || '1',
            subject: mapelOpts[0] || 'Bahasa Indonesia',
            phase: defaultPhase
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

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.scope) {
            toast({ title: "Materi Kosong", description: "Mohon isi elemen CP atau lingkup materi.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setGeneratedResult(null);

        const result = await generateCpAtpAction({
            subject: form.subject,
            phase: form.phase,
            classLevel: form.kelas,
            scope: form.scope,
            additionalInfo: form.additionalInfo
        });

        if (result.success && result.data) {
            setGeneratedResult(result.data);
            toast({ title: "Berhasil!", description: "Pemetaan CP & ATP telah dirumuskan." });
        } else {
            toast({ title: "Gagal", description: result.error || "Gagal menghubungi AI.", variant: "destructive" });
        }
        setLoading(false);
    };

    const handleSaveToDrive = async () => {
        if (!generatedResult) return;
        
        if (userProvider === 'google' && (!driveIntegration || driveIntegration.status !== 'connected')) {
            setIsDriveAuthDialogOpen(true);
            return;
        }

        setSaving(true);
        const result = await saveCpAtpToDrive(generatedResult.title, generatedResult.content, {
            phase: form.phase,
            class: form.kelas,
            subject: form.subject
        });

        if (result.success) {
            toast({ 
                title: "Tersimpan di Drive!", 
                description: "Pemetaan kurikulum telah diarsipkan.",
                action: (
                    <Button variant="outline" size="sm" asChild>
                        <a href={result.file_url || "#"} target="_blank">Buka File</a>
                    </Button>
                )
            });
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setSaving(false);
    };

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                            Generate CP & ATP
                        </h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">
                            AI Curriculum Architect
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-4 sm:px-6 lg:px-10">
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-indigo-600" />
                                Parameter Kurikulum
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang</Label>
                                    <Select value={form.jenjang} onValueChange={handleJenjangChange}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {Object.keys(mapelByJenjang).map(j => <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fase</Label>
                                    <Select value={form.phase} onValueChange={v => setForm({...form, phase: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {PHASES.map(p => <SelectItem key={p.value} value={p.value} className="font-bold">{p.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mata Pelajaran</Label>
                                    <Select value={form.subject} onValueChange={v => setForm({...form, subject: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.kelas} onValueChange={v => setForm({...form, kelas: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Elemen CP / Lingkup Materi</Label>
                                <Input 
                                    placeholder="e.g. Aljabar, Pancasila, atau Pemahaman Sains" 
                                    className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner"
                                    value={form.scope}
                                    onChange={e => setForm({...form, scope: e.target.value})}
                                    required
                                />
                                <p className="text-[9px] text-slate-400 font-medium px-1">AI akan merumuskan ATP berdasarkan lingkup ini.</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Konteks Tambahan (Opsional)</Label>
                                <Textarea 
                                    placeholder="e.g. Fokuskan pada pembelajaran berdiferensiasi atau integrasikan dengan teknologi digital." 
                                    className="rounded-2xl bg-slate-50 border-0 min-h-[100px] font-medium resize-none shadow-inner"
                                    value={form.additionalInfo}
                                    onChange={e => setForm({...form, additionalInfo: e.target.value})}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 text-lg font-black uppercase tracking-widest gap-3 transition-all active:scale-95">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}
                                Rumuskan CP & ATP
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col relative">
                    <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                                <Layers className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl font-black tracking-tight">Pratinjau Alur</CardTitle>
                        </div>
                        {generatedResult && (
                            <Button 
                                onClick={handleSaveToDrive} 
                                disabled={saving}
                                className="rounded-xl h-10 bg-indigo-600 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Simpan Arsip
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                        <ScrollArea className="h-full">
                            <AnimatePresence mode="wait">
                                {generatedResult ? (
                                    <motion.div 
                                        key="result"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-8 sm:p-10"
                                    >
                                        <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-p:font-medium text-slate-700">
                                            <h1 className="text-2xl border-b pb-4 mb-8 text-indigo-700">{generatedResult.title}</h1>
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {generatedResult.content}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="p-16 rounded-[5rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                                            <GitBranchPlus className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Curricullum Architect</h3>
                                        <p className="text-slate-400 font-bold text-sm max-w-sm mt-4 leading-relaxed">Masukkan lingkup materi di samping untuk mulai memetakan CP ke dalam ATP yang sistematis.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </ScrollArea>
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-6">
                                <LottieAiProcess size={250} />
                                <div className="text-center space-y-2">
                                    <p className="text-2xl font-black text-slate-900 tracking-tight uppercase">Merumuskan Alur...</p>
                                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Sintesis Kompetensi & Capaian</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDriveAuthDialogOpen} onOpenChange={setIsDriveAuthDialogOpen}>
                <DialogContent className="rounded-xl p-0 max-w-sm border-0 shadow-2xl overflow-hidden bg-white">
                    <div className="p-8 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Database className="h-10 w-10" /></div>
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Koneksi Drive Diperlukan</DialogTitle>
                            <DialogDescription className="text-sm font-medium text-slate-500">Hubungkan akun Google untuk menyimpan pemetaan kurikulum ini ke Drive Anda.</DialogDescription>
                        </div>
                        <Button onClick={handleConnectDrive} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                            <RefreshCw className="h-5 w-5" /> Hubungkan Akun Google
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
