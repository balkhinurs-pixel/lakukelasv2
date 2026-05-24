"use client";

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
    Download,
    MoveHorizontal
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { streamCpAtpAction } from "@/lib/actions/ai";
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
import { readStreamableValue } from 'ai/rsc';

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
    driveIntegration: _driveIntegration,
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
    const [countdown, setCountdown] = React.useState(30);

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

    const sanitizeContent = (text: string) => {
        if (!text) return "";
        return text
            .replace(/\\n/gi, '\n')
            .replace(/\\r/gi, '') 
            .replace(/\n{3,}/g, '\n\n');
    };

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
        setCountdown(30);

        try {
            const { output } = await streamCpAtpAction({
                subject: form.subject,
                phase: form.phase,
                classLevel: form.kelas,
                scope: form.scope,
                additionalInfo: form.additionalInfo
            });

            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    const sanitized = {
                        title: delta.title,
                        content: sanitizeContent(delta.content)
                    };
                    setGeneratedResult(sanitized as any);
                }
            }

            toast({ title: "Berhasil!", description: "Pemetaan CP & ATP telah dirumuskan." });
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

    const parseMarkdownTables = (markdown: string) => {
        const lines = markdown.split('\n');
        const content: any[] = [];
        let currentText = "";
        let inTable = false;
        let tableLines: string[] = [];

        lines.forEach(line => {
            if (line.trim().startsWith('|')) {
                if (!inTable) {
                    if (currentText.trim()) content.push({ type: 'text', value: currentText.trim() });
                    currentText = "";
                    inTable = true;
                }
                tableLines.push(line);
            } else {
                if (inTable) {
                    content.push({ type: 'table', value: tableLines });
                    tableLines = [];
                    inTable = false;
                }
                currentText += line + "\n";
            }
        });

        if (inTable) content.push({ type: 'table', value: tableLines });
        else if (currentText.trim()) content.push({ type: 'text', value: currentText.trim() });

        return content;
    };

    const handleDownloadPdf = async () => {
        if (!generatedResult) return;
        setPrinting(true);

        try {
            const doc = new jsPDF('p', 'mm', 'a4') as any;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let currentY = margin;

            // 1. Render Header (Kop Surat)
            const schoolName = (schoolProfile?.school_name || "SEKOLAH LAKUKELAS").toUpperCase();
            const npsn = schoolProfile?.npsn ? `NPSN: ${schoolProfile.npsn}` : "";
            const address = schoolProfile?.school_address || "Alamat belum diatur";

            doc.setFont('times', 'bold');
            doc.setFontSize(14);
            doc.text(schoolName, pageWidth / 2 + 10, currentY + 8, { align: 'center' });
            
            doc.setFont('times', 'normal');
            doc.setFontSize(10);
            if (npsn) doc.text(npsn, pageWidth / 2 + 10, currentY + 14, { align: 'center' });
            doc.setFont('times', 'italic');
            doc.text(address, pageWidth / 2 + 10, currentY + (npsn ? 20 : 16), { align: 'center' });

            // Logo
            if (schoolProfile?.school_logo_url) {
                try {
                    const img = new Image();
                    img.src = schoolProfile.school_logo_url;
                    img.crossOrigin = "Anonymous";
                    await new Promise((resolve) => {
                        img.onload = () => {
                            doc.addImage(img, 'PNG', margin, currentY, 25, 25);
                            resolve(true);
                        };
                        img.onerror = () => resolve(false);
                    });
                } catch (e) { console.error("Logo fail", e); }
            }

            currentY += 30;
            doc.setLineWidth(0.8);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            doc.setLineWidth(0.2);
            doc.line(margin, currentY + 1, pageWidth - margin, currentY + 1);

            // 2. Title & Metadata
            currentY += 15;
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text("ALUR TUJUAN PEMBELAJARAN (ATP)", pageWidth / 2, currentY, { align: 'center' });
            doc.text("PEMETAAN KURIKULUM MERDEKA", pageWidth / 2, currentY + 6, { align: 'center' });

            currentY += 15;
            doc.setFontSize(10);
            doc.text("Mata Pelajaran", margin, currentY);
            doc.text(":", margin + 30, currentY);
            doc.setFont('times', 'normal');
            doc.text(form.subject, margin + 35, currentY);

            doc.setFont('times', 'bold');
            doc.text("Jenjang / Fase", margin, currentY + 6);
            doc.text(":", margin + 30, currentY + 6);
            doc.setFont('times', 'normal');
            doc.text(`${form.jenjang} / ${form.phase}`, margin + 35, currentY + 6);

            doc.setFont('times', 'bold');
            doc.text("Kelas", margin, currentY + 12);
            doc.text(":", margin + 30, currentY + 12);
            doc.setFont('times', 'normal');
            doc.text(form.kelas, margin + 35, currentY + 12);

            currentY += 22;

            // 3. Render Content (Text & Tables)
            const parsedContent = parseMarkdownTables(generatedResult.content);

            for (const block of parsedContent) {
                if (block.type === 'text') {
                    doc.setFont('times', 'normal');
                    doc.setFontSize(10);
                    const splitText = doc.splitTextToSize(block.value, pageWidth - (margin * 2));
                    
                    // Check for page overflow
                    if (currentY + (splitText.length * 5) > pageHeight - 40) {
                        doc.addPage();
                        currentY = margin + 10;
                    }

                    doc.text(splitText, margin, currentY);
                    currentY += (splitText.length * 5) + 10;
                } else if (block.type === 'table') {
                    // Extract data from Markdown Table
                    const rows = block.value.map((line: string) => 
                        line.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim())
                    ).filter((row: any[]) => row.length > 0 && !row[0].startsWith('---'));

                    if (rows.length > 1) {
                        const head = [rows[0]];
                        const body = rows.slice(1);

                        doc.autoTable({
                            startY: currentY,
                            head: head,
                            body: body,
                            margin: { left: margin, right: margin },
                            theme: 'grid',
                            styles: { font: 'times', fontSize: 9, cellPadding: 2 },
                            headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
                            didDrawPage: (data: any) => {
                                currentY = data.cursor.y;
                            }
                        });
                        currentY = (doc as any).lastAutoTable.finalY + 10;
                    }
                }
            }

            // 4. Signatures
            if (currentY > pageHeight - 50) {
                doc.addPage();
                currentY = margin + 20;
            }

            const today = format(new Date(), 'dd MMMM yyyy', { locale: id });
            
            doc.setFont('times', 'normal');
            doc.text("Mengetahui,", margin + 15, currentY);
            doc.text("Kepala Sekolah", margin + 15, currentY + 6);
            
            doc.text("Dicetak Pada,", pageWidth - margin - 55, currentY);
            doc.text(today, pageWidth - margin - 55, currentY + 6);

            currentY += 25;
            doc.setFont('times', 'bold');
            doc.text(schoolProfile?.headmaster_name || "..................................", margin + 15, currentY);
            doc.text(schoolProfile?.full_name || "..................................", pageWidth - margin - 55, currentY);
            
            doc.setFont('times', 'normal');
            doc.text(`NIP. ${schoolProfile?.headmaster_nip || "..........................."}`, margin + 15, currentY + 5);
            doc.text(`NIP. ${schoolProfile?.nip || "..........................."}`, pageWidth - margin - 55, currentY + 5);

            doc.save(`${generatedResult.title.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Berhasil", description: "PDF kurikulum telah diunduh." });
        } catch (error) {
            console.error(error);
            toast({ title: "Gagal", description: "Gagal memproses dokumen PDF.", variant: "destructive" });
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
                title: "Tersimpan!", 
                description: "Pemetaan kurikulum telah diarsipkan.",
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

            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight">Generate CP & ATP</h1>
                    <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">AI Curriculum Architect</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-4 sm:px-6 lg:px-10">
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2"><Settings2 className="h-5 w-5 text-indigo-600" />Parameter Kurikulum</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Jenjang</Label><Select value={form.jenjang} onValueChange={handleJenjangChange}><SelectTrigger className="rounded-xl h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl">{Object.keys(mapelByJenjang).map(j => <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Fase</Label><Select value={form.phase} onValueChange={v => setForm({...form, phase: v})}><SelectTrigger className="rounded-xl h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl">{PHASES.map(p => <SelectItem key={p.value} value={p.value} className="font-bold">{p.label}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Mapel</Label><Select value={form.subject} onValueChange={v => setForm({...form, subject: v})}><SelectTrigger className="rounded-xl h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl">{(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Kelas</Label><Select value={form.kelas} onValueChange={v => setForm(prev => ({...prev, kelas: v}))}><SelectTrigger className="rounded-xl h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl">{getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Elemen CP / Lingkup Materi</Label><Input placeholder="e.g. Aljabar, Pancasila" className="rounded-xl h-11 font-bold" value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} required /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Konteks (Opsional)</Label><Textarea placeholder="e.g. Pembelajaran berdiferensiasi..." className="rounded-2xl min-h-[100px] font-medium resize-none shadow-inner" value={form.additionalInfo} onChange={e => setForm({...form, additionalInfo: e.target.value})} /></div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t"><Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}Rumuskan CP & ATP</Button></CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col relative">
                    <CardHeader className="bg-slate-50/50 border-b p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-xl font-black tracking-tight text-indigo-950">Pratinjau Alur</CardTitle>
                            </div>
                            {generatedResult && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleDownloadPdf} 
                                    disabled={printing}
                                    className="rounded-xl font-bold bg-white text-indigo-600 border-indigo-200"
                                >
                                    {printing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                                    Cetak PDF (Anti-Cut)
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 bg-slate-50/20 overflow-x-auto custom-scrollbar">
                        <ScrollArea className="h-full">
                            <AnimatePresence mode="wait">
                                {generatedResult ? (
                                    <motion.div 
                                        key="result" 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="p-4 sm:p-10 w-fit min-w-full"
                                    >
                                        <div id="printable-cp-atp-area" className="bg-white p-6 sm:p-12 shadow-sm border rounded-2xl mx-auto" style={{ width: '210mm', minHeight: '297mm', fontFamily: '"Times New Roman", Times, serif' }}>
                                            <div className="flex items-center gap-6 mb-4 pb-4 border-b-2 border-black">
                                                <div className="w-20 h-20 flex items-center justify-center shrink-0">{schoolProfile?.school_logo_url ? <img src={schoolProfile.school_logo_url} alt="Logo" className="w-full h-full object-contain" /> : <div className="p-2 opacity-20"><AppLogo /></div>}</div>
                                                <div className="flex-1 text-center pr-20">
                                                    <h2 className="text-xl font-bold uppercase leading-tight">{schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}</h2>
                                                    {schoolProfile?.npsn && <p className="text-xs font-bold">NPSN: {schoolProfile.npsn}</p>}
                                                    <p className="text-xs italic">{schoolProfile?.school_address || "Alamat sekolah belum diatur"}</p>
                                                </div>
                                            </div>
                                            <div className="text-center mb-8">
                                                <h1 className="text-lg font-bold uppercase underline">ALUR TUJUAN PEMBELAJARAN (ATP)</h1>
                                                <p className="text-sm font-bold uppercase mt-1">PEMETAAN KURIKULUM MERDEKA</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-xs mb-8">
                                                <div className="space-y-1"><div className="grid grid-cols-[100px_10px_1fr]"><span>Mata Pelajaran</span><span>:</span><span className="font-bold">{form.subject}</span></div><div className="grid grid-cols-[100px_10px_1fr]"><span>Jenjang / Fase</span><span>:</span><span className="font-bold">{form.jenjang} / {form.phase}</span></div></div>
                                                <div className="space-y-1"><div className="grid grid-cols-[100px_10px_1fr]"><span>Kelas</span><span>:</span><span className="font-bold">{form.kelas}</span></div><div className="grid grid-cols-[100px_10px_1fr]"><span>Penyusun</span><span>:</span><span className="font-bold">{schoolProfile?.full_name || 'GURU PENGAMPU'}</span></div></div>
                                            </div>
                                            <div className="prose prose-slate max-w-none prose-sm leading-relaxed text-slate-900">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]} 
                                                    components={{
                                                        table: ({node, ...props}) => <table className="w-full border-collapse border-2 border-black my-4" style={{ breakInside: 'auto' }} {...props} />,
                                                        th: ({node, ...props}) => <th className="border-2 border-black bg-slate-50 p-2 font-bold text-center text-[10px]" {...props} />,
                                                        td: ({node, ...props}) => <td className="border-2 border-black p-2 text-[10px] align-top" {...props} />,
                                                        h1: ({node, ...props}) => <h3 className="text-sm font-bold uppercase mt-6 mb-2" style={{ breakInside: 'avoid', breakAfter: 'avoid' }} {...props} />,
                                                        p: ({node, ...props}) => <p className="text-xs mb-3 text-justify" style={{ breakInside: 'avoid' }} {...props} />,
                                                        li: ({node, ...props}) => <li className="text-xs mb-1" style={{ breakInside: 'avoid' }} {...props} />,
                                                        tr: ({node, ...props}) => <tr style={{ breakInside: 'avoid' }} {...props} />
                                                    }}
                                                >
                                                    {generatedResult.content}
                                                </ReactMarkdown>
                                            </div>
                                            <div className="mt-12 flex justify-between text-xs px-10" style={{ breakInside: 'avoid' }}>
                                                <div className="text-center"><p>Mengetahui,</p><p className="mb-20">Kepala Sekolah</p><p className="font-bold underline">{schoolProfile?.headmaster_name || ".................................."}</p><p>NIP. {schoolProfile?.headmaster_nip || "..........................."}</p></div>
                                                <div className="text-center"><p>Dicetak Pada,</p><p className="mb-20">{format(new Date(), 'dd MMMM yyyy', { locale: id })}</p><p className="font-bold underline">{schoolProfile?.full_name || ".................................."}</p><p>NIP. {schoolProfile?.nip || "..........................."}</p></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30"><GitBranchPlus className="h-24 w-24 mb-4" /><h3 className="text-3xl font-black">AI Curriculum Architect</h3></div>
                                )}
                            </AnimatePresence>
                        </ScrollArea>
                    </CardContent>
                    <AnimatePresence>
                        {generatedResult && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                            >
                                <CardFooter className="bg-white border-t p-6">
                                    <Button 
                                        onClick={handleSaveToDrive} 
                                        disabled={saving} 
                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                    >
                                        {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                                        Simpan ke Arsip & Google Drive
                                    </Button>
                                </CardFooter>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>

            <Dialog open={isDriveAuthDialogOpen} onOpenChange={setIsDriveAuthDialogOpen}>
                <DialogContent className="rounded-xl p-0 max-w-sm overflow-hidden bg-white"><div className="p-8 text-center space-y-6"><Database className="mx-auto h-12 w-12 text-indigo-600" /><DialogTitle className="text-xl font-bold">Koneksi Drive Diperlukan</DialogTitle><Button onClick={handleConnectDrive} className="w-full h-12 bg-indigo-600 text-white font-bold">Hubungkan Akun Google</Button></div></DialogContent>
            </Dialog>
        </div>
    );
}
