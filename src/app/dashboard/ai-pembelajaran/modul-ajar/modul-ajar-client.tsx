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
    Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { generateModulAjarAction } from "@/lib/actions/ai";
import { saveModulAjarToDrive } from "@/lib/actions/google-drive";
import type { Class, Subject, ModulAjarInput, GoogleDriveIntegration } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LottieAiProcess } from "@/components/ui/lottie-ai-process";
import { LottieWelcome } from "@/components/ui/lottie-welcome";
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

const PANCASILA_DIMENSIONS = [
    "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia",
    "Berkebinekaan Global",
    "Gotong Royong",
    "Mandiri",
    "Bernalar Kritis",
    "Kreatif"
];

const LEARNING_MODELS = [
    "Problem Based Learning (PBL)",
    "Project Based Learning (PjBL)",
    "Discovery Learning",
    "Inquiry Learning",
    "Contextual Teaching and Learning",
    "Ceramah & Diskusi",
    "Flipped Classroom"
];

export default function ModulAjarClient({ 
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

    const [form, setForm] = React.useState<ModulAjarInput>({
        jenjang: 'SMP / MTs',
        kelas: '7',
        subject: 'Bahasa Indonesia',
        topic: '',
        alokasiWaktu: '2 x 45 Menit',
        profilPancasila: [],
        modelPembelajaran: 'Problem Based Learning (PBL)',
        saranaPrasarana: '',
        targetSiswa: 'Peserta didik reguler'
    });

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

    const togglePancasila = (dim: string) => {
        setForm(prev => ({
            ...prev,
            profilPancasila: prev.profilPancasila.includes(dim)
                ? prev.profilPancasila.filter(item => item !== dim)
                : [...prev.profilPancasila, dim]
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
        if (!form.topic) {
            toast({ title: "Topik Kosong", description: "Mohon isi materi pokok atau bab.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setGeneratedResult(null);

        const result = await generateModulAjarAction(form);

        if (result.success && result.data) {
            setGeneratedResult(result.data);
            toast({ title: "Berhasil!", description: "Modul Ajar telah dirumuskan oleh AI." });
        } else {
            toast({ title: "Gagal", description: result.error || "Gagal menghasilkan modul.", variant: "destructive" });
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
        const result = await saveModulAjarToDrive(generatedResult.title, generatedResult.content, {
            jenjang: form.jenjang,
            class: form.kelas,
            subject: form.subject
        });

        if (result.success) {
            toast({ 
                title: "Tersimpan di Drive!", 
                description: "Modul Ajar telah disimpan di folder LakuKelas AI.",
                action: (
                    <Button variant="outline" size="sm" asChild>
                        <a href={result.file_url || "#"} target="_blank" rel="noopener noreferrer">Buka File</a>
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
            {/* Header Premium Indigo */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 blur-2xl rounded-full -ml-10 -mb-10" />
                
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                            Generate RPP
                        </h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">
                            Modul Ajar Kurikulum Merdeka
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-4 sm:px-6 lg:px-10">
                {/* Form Input Area */}
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-indigo-600" />
                                Konfigurasi RPP
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang</Label>
                                    <Select value={form.jenjang} onValueChange={handleJenjangChange}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm">
                                            <SelectValue placeholder="Pilih Jenjang" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {Object.keys(mapelByJenjang).map(j => (
                                                <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.kelas} onValueChange={v => setForm(prev => ({...prev, kelas: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm">
                                            <SelectValue placeholder="Pilih Kelas" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-0 shadow-2xl">
                                            {getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mata Pelajaran</Label>
                                <Select value={form.subject} onValueChange={v => setForm(prev => ({...prev, subject: v}))}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm">
                                        <SelectValue placeholder="Pilih Mapel" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-0 shadow-2xl">
                                        {(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pokok / Bab</Label>
                                <Input 
                                    placeholder="e.g. Struktur Sel Hewan dan Tumbuhan" 
                                    className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner"
                                    value={form.topic}
                                    onChange={e => setForm(prev => ({...prev, topic: e.target.value}))}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alokasi Waktu</Label>
                                <Input 
                                    placeholder="e.g. 2 x 45 Menit" 
                                    className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner"
                                    value={form.alokasiWaktu}
                                    onChange={e => setForm(prev => ({...prev, alokasiWaktu: e.target.value}))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Model Pembelajaran</Label>
                                <Select value={form.modelPembelajaran} onValueChange={v => setForm(prev => ({...prev, modelPembelajaran: v}))}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-0 shadow-2xl">
                                        {LEARNING_MODELS.map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Profil Pelajar Pancasila</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {PANCASILA_DIMENSIONS.map(dim => (
                                        <div key={dim} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <Checkbox 
                                                id={dim} 
                                                checked={form.profilPancasila.includes(dim)}
                                                onCheckedChange={() => togglePancasila(dim)}
                                                className="h-5 w-5 rounded-md border-slate-300"
                                            />
                                            <label htmlFor={dim} className="text-xs font-bold text-slate-600 cursor-pointer">{dim}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sarana & Prasarana</Label>
                                <Textarea 
                                    placeholder="e.g. Proyektor, Internet, Lab Biologi..." 
                                    className="rounded-2xl bg-slate-50 border-0 min-h-[80px] font-medium resize-none shadow-inner"
                                    value={form.saranaPrasarana}
                                    onChange={e => setForm(prev => ({...prev, saranaPrasarana: e.target.value}))}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 text-lg font-black uppercase tracking-widest gap-3 transition-all active:scale-95">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}
                                Generate Modul AI
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Preview Area Placeholder / Result */}
                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col relative">
                    <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl font-black tracking-tight">Pratinjau Modul</CardTitle>
                        </div>
                        {generatedResult && (
                            <Button 
                                onClick={handleSaveToDrive} 
                                disabled={saving}
                                className="rounded-xl h-10 bg-indigo-600 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Simpan ke Drive
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
                                        <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:font-medium prose-p:leading-relaxed text-slate-700">
                                            <h1 className="text-2xl border-b pb-4 mb-8 text-indigo-700">{generatedResult.title}</h1>
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {generatedResult.content}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="p-16 rounded-[5rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                                            <Sparkles className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Pedagogis Siap Bekerja</h3>
                                        <p className="text-slate-400 font-bold text-sm max-w-sm mt-4 leading-relaxed">Lengkapi parameter RPP di samping untuk mulai menyusun modul ajar profesional.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </ScrollArea>
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-6">
                                <LottieAiProcess size={250} />
                                <div className="text-center space-y-2">
                                    <p className="text-2xl font-black text-slate-900 tracking-tight uppercase">Menyusun Modul Ajar...</p>
                                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Analisis Kurikulum Merdeka</p>
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
                            <DialogDescription className="text-sm font-medium text-slate-500">Hubungkan akun Google untuk menyimpan modul ini ke Drive Anda.</DialogDescription>
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
