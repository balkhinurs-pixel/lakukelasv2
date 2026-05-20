"use client";

import * as React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
    Layers,
    Printer,
    Download
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
import type { Class, Subject, GoogleDriveIntegration, Profile } from "@/lib/types";
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppLogo } from "@/components/icons";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AiErrorDialog, type AiErrorType } from "@/components/ui/ai-error-dialog";

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
    userProvider,
    schoolProfile
}: { 
    classes: Class[], 
    subjects: Subject[],
    driveIntegration: GoogleDriveIntegration | null,
    userProvider?: string,
    schoolProfile: Profile | null
}) {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [printing, setPrinting] = React.useState(false);
    const [generatedResult, setGeneratedResult] = React.useState<{ title: string, content: string } | null>(null);
    const [isDriveAuthDialogOpen, setIsDriveAuthDialogOpen] = React.useState(false);

    // AI Error Dialog State
    const [isErrorOpen, setIsErrorOpen] = React.useState(false);
    const [errorType, setErrorType] = React.useState<AiErrorType>(null);
    const [errorMsg, setErrorMsg] = React.useState("");

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

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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
            const err = result.error || "";
            let type: AiErrorType = 'generic';
            
            if (err.includes('429') || err.toLowerCase().includes('quota')) type = 'quota';
            else if (err.includes('503') || err.toLowerCase().includes('overloaded')) type = 'overloaded';
            else if (err.toLowerCase().includes('api key')) type = 'api_key';

            setErrorType(type);
            setErrorMsg(err);
            setIsErrorOpen(true);
        }
        setLoading(false);
    };

    const handleDownloadPdf = async () => {
        if (!generatedResult) return;
        setPrinting(true);

        try {
            const printableArea = document.getElementById('printable-cp-atp-area');
            if (!printableArea) throw new Error("Preview area not found");

            const canvas = await html2canvas(printableArea, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                windowWidth: 794,
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${generatedResult.title.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "PDF Siap", description: "Dokumen kurikulum telah diunduh." });
        } catch (error) {
            console.error(error);
            toast({ title: "Gagal Cetak", description: "Terjadi kesalahan saat memproses PDF.", variant: "destructive" });
        } finally {
            setPrinting(false);
        }
    };

    const handleSaveToDrive = async () => {
        if (!generatedResult) return;
        
        if (userProvider !== 'google') {
            toast({ title: "Login Google Diperlukan", description: "Fitur simpan Drive hanya untuk pengguna akun Google.", variant: "destructive" });
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
                        <a href={result.file_url || "#"} target="_blank" rel="noopener noreferrer">Buka File</a>
                    </Button>
                )
            });
        } else {
            if (result.error?.toLowerCase().includes('token') || result.error?.toLowerCase().includes('sesi')) {
                setIsDriveAuthDialogOpen(true);
            } else {
                toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
            }
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
                            <CardTitle className="text-xl font-black flex items-center gap-2 text-indigo-950">
                                <Settings2 className="h-5 w-5 text-indigo-600" />
                                Parameter Kurikulum
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
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
                                    <Select value={form.kelas} onValueChange={v => setForm(prev => ({...prev, kelas: v}))}>
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
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Konteks Tambahan (Opsional)</Label>
                                <Textarea 
                                    placeholder="e.g. Fokuskan pada pembelajaran berdiferensiasi..." 
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
                            <CardTitle className="text-xl font-black tracking-tight text-indigo-950">Pratinjau Alur</CardTitle>
                        </div>
                        {generatedResult && (
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={handleDownloadPdf} 
                                    disabled={printing}
                                    variant="outline"
                                    className="rounded-xl h-10 border-indigo-200 text-indigo-600 font-bold gap-2 hover:bg-indigo-50"
                                >
                                    {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                    PDF
                                </Button>
                                <Button 
                                    onClick={handleSaveToDrive} 
                                    disabled={saving}
                                    className="rounded-xl h-10 bg-indigo-600 text-white font-bold gap-2 shadow-lg shadow-indigo-100"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Simpan Arsip
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow p-0 bg-slate-50/20 max-h-[70vh]">
                        <ScrollArea className="h-full">
                            <AnimatePresence mode="wait">
                                {generatedResult ? (
                                    <motion.div 
                                        key="result"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 sm:p-10"
                                    >
                                        <div id="printable-cp-atp-area" className="bg-white p-10 shadow-sm border border-slate-100 rounded-2xl mx-auto" style={{ width: '210mm', minHeight: '297mm', fontFamily: '"Times New Roman", Times, serif' }}>
                                            <div className="flex items-center gap-6 mb-4 pb-4 border-b-2 border-slate-900">
                                                <div className="w-20 h-20 flex items-center justify-center shrink-0 border border-slate-100 rounded-lg overflow-hidden">
                                                    {schoolProfile?.school_logo_url ? (
                                                        <img src={schoolProfile.school_logo_url} alt="Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="p-2 opacity-20"><AppLogo /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 text-center pr-20">
                                                    <h2 className="text-xl font-bold uppercase leading-tight">{schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}</h2>
                                                    {schoolProfile?.npsn && <p className="text-xs font-medium">NPSN: {schoolProfile.npsn}</p>}
                                                    <p className="text-xs italic">{schoolProfile?.school_address || "Alamat sekolah belum diatur"}</p>
                                                </div>
                                            </div>

                                            <div className="text-center mb-8">
                                                <h1 className="text-lg font-bold uppercase underline">ALUR TUJUAN PEMBELAJARAN (ATP)</h1>
                                                <p className="text-sm font-bold uppercase mt-1">PEMETAAN KURIKULUM MERDEKA</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-xs mb-8">
                                                <div className="space-y-1">
                                                    <div className="grid grid-cols-[100px_10px_1fr]">
                                                        <span>Mata Pelajaran</span><span>:</span><span className="font-bold">{form.subject}</span>
                                                    </div>
                                                    <div className="grid grid-cols-[100px_10px_1fr]">
                                                        <span>Jenjang / Fase</span><span>:</span><span className="font-bold">{form.jenjang} / {form.phase}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="grid grid-cols-[100px_10px_1fr]">
                                                        <span>Kelas</span><span>:</span><span className="font-bold">{form.kelas}</span>
                                                    </div>
                                                    <div className="grid grid-cols-[100px_10px_1fr]">
                                                        <span>Penyusun</span><span>:</span><span className="font-bold">{schoolProfile?.full_name || 'GURU PENGAMPU'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="prose prose-slate max-w-none prose-sm leading-relaxed text-slate-900 print:text-black">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        table: ({node, ...props}) => <table className="w-full border-collapse border border-slate-300 my-4" {...props} />,
                                                        th: ({node, ...props}) => <th className="border border-slate-300 bg-slate-50 p-2 font-bold text-center text-[10px]" {...props} />,
                                                        td: ({node, ...props}) => <td className="border border-slate-300 p-2 text-[10px]" {...props} />,
                                                        h1: ({node, ...props}) => <h3 className="text-sm font-bold uppercase mt-6 mb-2" {...props} />,
                                                        h2: ({node, ...props}) => <h4 className="text-xs font-bold uppercase mt-4 mb-2" {...props} />,
                                                        p: ({node, ...props}) => <p className="text-xs mb-3 text-justify" style={{ breakInside: 'avoid' }} {...props} />,
                                                        li: ({node, ...props}) => <li className="text-xs mb-1" style={{ breakInside: 'avoid' }} {...props} />,
                                                        tr: ({node, ...props}) => <tr style={{ breakInside: 'avoid' }} {...props} />
                                                    }}
                                                >
                                                    {generatedResult.content}
                                                </ReactMarkdown>
                                            </div>

                                            <div className="mt-12 flex justify-between text-xs px-10" style={{ breakInside: 'avoid' }}>
                                                <div className="text-center">
                                                    <p>Mengetahui,</p>
                                                    <p className="mb-20">Kepala Sekolah</p>
                                                    <p className="font-bold underline">{schoolProfile?.headmaster_name || ".................................."}</p>
                                                    <p>NIP. {schoolProfile?.headmaster_nip || "..........................."}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p>Dicetak Pada,</p>
                                                    <p className="mb-20">{format(new Date(), 'dd MMMM yyyy', { locale: id })}</p>
                                                    <p className="font-bold underline">{schoolProfile?.full_name || ".................................."}</p>
                                                    <p>NIP. {schoolProfile?.nip || "..........................."}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                        <div className="p-16 rounded-[5rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                                            <GitBranchPlus className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" />
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