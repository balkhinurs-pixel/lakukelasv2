
"use client";

import * as React from "react";
import { 
    Sparkles, 
    Loader2, 
    Save, 
    RefreshCw,
    Wand2,
    Settings2,
    BookOpen,
    FileText,
    FileUp,
    ImageIcon,
    X,
    School,
    Tag,
    TrendingUp,
    Users,
    ZoomIn,
    ZoomOut,
    Smartphone,
    Layout,
    ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { streamMaterialAction, saveMaterialToDriveAction } from "@/lib/actions/ai";
import type { Class, Subject, GoogleDriveIntegration, MaterialGenerationInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LottieAiProcess } from "@/components/ui/lottie-ai-process";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { AiErrorDialog, type AiErrorType } from "@/components/ui/ai-error-dialog";
import { readStreamableValue } from 'ai/rsc';
import { useRouter } from "next/navigation";
import { RefinedFormField } from "@/components/ui/refined-form-field";

/**
 * Robust MathText Component V128 (Enhanced for Dual-Mode Preview)
 */
const MathText = ({ content, isMobile }: { content: string, isMobile?: boolean }) => {
  if (!content) return null;
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className={cn("math-text-render w-full", isMobile ? "text-left" : "text-justify")}>
      {parts.map((part, i) => {
        if (!part) return null;
        
        if (part.startsWith('$$') || part.startsWith('\\[')) {
          const isDoubleDollar = part.startsWith('$$');
          const math = isDoubleDollar ? part.slice(2, -2) : part.slice(2, -2);
          return (
            <div key={i} className="my-4 overflow-x-auto custom-scrollbar pb-2">
                <div className="min-w-min">
                    <BlockMath math={math} />
                </div>
            </div>
          );
        }
        
        if (part.startsWith('$') || part.startsWith('\\(')) {
          const isDollar = part.startsWith('$');
          const math = isDollar ? part.slice(1, -1) : part.slice(2, -2);
          return (
            <span key={i} className="inline-block max-w-full overflow-x-auto custom-scrollbar align-middle py-0.5">
               <InlineMath math={math} />
            </span>
          );
        }
        
        return (
            <ReactMarkdown 
                key={i} 
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm custom-scrollbar">
                            <table className="w-full border-collapse text-sm text-center" {...props} />
                        </div>
                    ),
                    th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 p-3 font-black text-slate-900 uppercase tracking-tight" {...props} />,
                    td: ({node, ...props}) => <td className="border border-slate-200 p-3 font-bold text-slate-700" {...props} />,
                    tr: ({node, ...props}) => <tr className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors" {...props} />,
                    h1: ({node, ...props}) => <h1 className={cn("font-black uppercase text-indigo-700 mt-8 mb-4 border-b-2 border-indigo-100 pb-2", isMobile ? "text-xl" : "text-2xl")} {...props} />,
                    h2: ({node, ...props}) => <h2 className={cn("font-bold text-slate-800 mt-6 mb-3", isMobile ? "text-lg" : "text-xl")} {...props} />,
                    p: ({node, ...props}) => {
                        const hasJavanese = /[\uA980-\uA9DF]/.test(String(props.children || ''));
                        return <p className={cn("mb-4 leading-relaxed text-slate-600 break-words", hasJavanese && "aksara-jawa")} {...props} />;
                    }
                }}
            >
                {part}
            </ReactMarkdown>
        );
      })}
    </div>
  );
};

const mapelByJenjang: Record<string, string[]> = {
    'SD / MI': ['Bahasa Indonesia', 'Matematika', 'IPA', 'IPS', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Budaya', 'Bahasa Inggris', 'Bahasa Jawa'],
    'SMP / MTs': ['Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'IPA', 'IPS', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Budaya', 'Informatika', 'Prakarya', 'Bahasa Arab', 'Bahasa Jawa'],
    'SMA / MA': ['Bahasa Indonesia', 'Matematika Umum', 'Matematika Tingkat Lanjut', 'Bahasa Inggris', 'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'Seni Budaya', 'TIK', 'Bahasa Arab', 'Fiqih', 'Akidah Akhlak', 'Quran Hadist', 'Bahasa Jawa'],
    'SMK / MAK': ['Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'Informatika', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'PJOK', 'Seni Culture', 'Dasar-dasar Kejuruan', 'Produk Kreatif & Kewirausahaan', 'Bahasa Jawa']
};

const getClassOptions = (jenjang: string) => {
    if (jenjang === 'SD / MI') return ['1', '2', '3', '4', '5', '6'];
    if (jenjang === 'SMP / MTs') return ['7', '8', '9'];
    if (jenjang === 'SMA / MA' || jenjang === 'SMK / MAK') return ['10', '11', '12'];
    return [];
};

const PAPER_WIDTH_PX = 794;
const PAPER_HEIGHT_PX = 1123;

export default function GenerateMateriClient({ 
    classes, 
    subjects,
    driveIntegration: _driveIntegration,
    userProvider: _userProvider
}: { 
    classes: Class[], 
    subjects: Subject[],
    driveIntegration: GoogleDriveIntegration | null,
    userProvider?: string
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [generatedResult, setGeneratedResult] = React.useState<{ title: string, content: string } | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [previewMode, setPreviewMode] = React.useState<'mobile' | 'a4'>('mobile');
    const [zoom, setZoom] = React.useState(60);
    const [countdown, setCountdown] = React.useState(30);

    const [isErrorOpen, setIsErrorOpen] = React.useState(false);
    const [errorType, setErrorType] = React.useState<AiErrorType>(null);
    const [errorMsg, setErrorMsg] = React.useState("");
    
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const paperScrollRef = React.useRef<HTMLDivElement>(null);
    const [uploadedFile, setUploadedFile] = React.useState<{ name: string, uri: string, mime: string } | null>(null);

    const [form, setForm] = React.useState<MaterialGenerationInput>({
        jenjang: 'SMP / MTs',
        kelas: '7',
        semester: 'Ganjil',
        subject: 'Bahasa Indonesia',
        topic: '',
        subtopic: '',
        depth: 'menengah',
        instruction: ''
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
        setForm(prev => ({ ...prev, jenjang: val, kelas: classOpts[0] || '1', subject: mapelOpts[0] || 'Bahasa Indonesia' }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedFile({ name: file.name, uri: event.target?.result as string, mime: file.type });
            toast({ title: "Materi Terunggah", description: `${file.name} siap dirangkum.` });
        };
        reader.readAsDataURL(file);
    };

    const fitPaperToScreen = React.useCallback(() => {
        if (paperScrollRef.current && previewMode === 'a4') {
            const availableWidth = paperScrollRef.current.clientWidth - 28;
            const scale = Math.min(availableWidth / PAPER_WIDTH_PX, 1);
            setZoom(Math.max(35, Math.round(scale * 100)));
        }
    }, [previewMode]);

    React.useEffect(() => {
        if (previewMode === 'a4') {
            fitPaperToScreen();
            window.addEventListener('resize', fitPaperToScreen);
        }
        return () => window.removeEventListener('resize', fitPaperToScreen);
    }, [previewMode, fitPaperToScreen]);

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!form.topic) {
            toast({ title: "Topik Kosong", description: "Mohon isi materi pokok atau bab.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setGeneratedResult(null);
        setCountdown(30);
        setPreviewMode('mobile');
        setIsPreviewOpen(true);

        try {
            const { output } = await streamMaterialAction({
                ...form,
                mediaDataUri: uploadedFile?.uri,
                mediaMimeType: uploadedFile?.mime
            });

            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    setGeneratedResult(delta as any);
                }
            }

            toast({ title: "Berhasil!", description: "Materi ajar telah dirangkum." });
        } catch (error: any) {
            setIsPreviewOpen(false);
            const err = error.message || "";
            let type: AiErrorType = 'generic';
            if (err.includes('429')) type = 'quota';
            else if (err.includes('503')) type = 'overloaded';
            setErrorType(type);
            setErrorMsg(err);
            setIsErrorOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToDrive = async () => {
        if (!generatedResult) return;
        setSaving(true);
        const result = await saveMaterialToDriveAction(generatedResult.title, generatedResult.content, {
            jenjang: form.jenjang,
            class: form.kelas,
            subject: form.subject
        });
        if (result.success) {
            toast({ 
                title: "Tersimpan!", 
                description: "Materi telah disimpan di Google Drive.",
                action: <Button variant="outline" size="sm" asChild><a href={result.file_url || "#"} target="_blank">Buka File</a></Button>
            });
            setIsPreviewOpen(false);
            router.push('/dashboard/ai-pembelajaran/arsip-rpp'); 
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setSaving(false);
    };

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            <AiErrorDialog open={isErrorOpen} onOpenChange={setIsErrorOpen} errorType={errorType} errorMessage={errorMsg} onRetry={handleGenerate} />

            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                            Generate Materi
                        </h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">
                            AI Content Summary
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
                                Parameter Materi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="space-y-3">
                                <Label className="text-[14px] sm:text-[15px] font-semibold text-gray-700 px-1 flex items-center gap-2">
                                    <FileUp className="h-4 w-4 text-indigo-600" /> Materi Sumber (Opsional)
                                </Label>
                                <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf, image/*" onChange={handleFileChange} />
                                {uploadedFile ? (
                                    <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-between shadow-inner">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {uploadedFile.mime.includes('pdf') ? <FileText className="h-5 w-5 text-indigo-600" /> : <ImageIcon className="h-5 w-5 text-indigo-600" />}
                                            <p className="text-xs font-black text-indigo-700 truncate">{uploadedFile.name}</p>
                                        </div>
                                        <button type="button" className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg" onClick={() => setUploadedFile(null)}><X className="h-4 w-4" /></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all group">
                                        <FileUp className="h-8 w-8 opacity-40 group-hover:opacity-100" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Unggah PDF / Foto Buku</p>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <RefinedFormField label="Jenjang" icon={<School className="h-4 w-4" />}>
                                    <Select value={form.jenjang} onValueChange={handleJenjangChange}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {Object.keys(mapelByJenjang).map(j => <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </RefinedFormField>
                                <RefinedFormField label="Kelas" icon={<Users className="h-4 w-4" />}>
                                    <Select value={form.kelas} onValueChange={v => setForm({...form, kelas: v})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </RefinedFormField>
                            </div>

                            <RefinedFormField label="Mata Pelajaran" icon={<BookOpen className="h-4 w-4" />}>
                                <Select value={form.subject} onValueChange={v => setForm({...form, subject: v})}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </RefinedFormField>

                            <RefinedFormField label="Materi Pokok / Bab" icon={<Tag className="h-4 w-4" />}>
                                <Input placeholder="e.g. Hukum Newton, Tajwid" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} required />
                            </RefinedFormField>

                            <RefinedFormField label="Tingkat Kedalaman" icon={<TrendingUp className="h-4 w-4" />}>
                                <Select value={form.depth} onValueChange={(v: any) => setForm({...form, depth: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="dasar" className="font-bold">Dasar (Pengenalan)</SelectItem>
                                        <SelectItem value="menengah" className="font-bold">Menengah (Standar)</SelectItem>
                                        <SelectItem value="mendalam" className="font-bold text-indigo-600">Mendalam (Analisis)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </RefinedFormField>

                            <RefinedFormField label="Instruksi Khusus (Opsional)" icon={<Wand2 className="h-4 w-4" />}>
                                <Textarea placeholder="e.g. Fokus pada rumus percepatan..." className="rounded-2xl bg-slate-50 border-0 min-h-[100px] font-medium resize-none shadow-inner" value={form.instruction} onChange={e => setForm({...form, instruction: e.target.value})} />
                            </RefinedFormField>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}
                                Generate Materi
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center text-center p-6 sm:px-10">
                    <div className="p-10 sm:p-16 rounded-[3rem] sm:rounded-[5rem] bg-slate-100 mb-6 sm:mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                        <BookOpen className="h-16 w-16 sm:h-24 sm:w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" />
                    </div>
                    <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">AI Content Summarizer</h3>
                    <p className="text-slate-400 font-bold text-xs sm:text-sm max-w-sm mt-3 sm:mt-4 leading-relaxed italic">
                        Konfigurasi bab materi di samping, atau unggah file PDF/Foto buku paket Anda. AI akan merangkumnya secara sistematis untuk bahan ajar siswa.
                    </p>
                </Card>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[98vw] sm:max-w-5xl p-0 overflow-hidden rounded-[26px] border border-white/12 shadow-2xl bg-[#0f172a] dialog-content-mobile mobile-safe-area flex flex-col h-[94vh]">
                    {/* Header Premium */}
                    <header className="flex-none flex items-center justify-between p-4 sm:p-6 bg-[#111827] text-white">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                                <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight truncate">Pratinjau Materi AI</h2>
                                <p className="text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase text-indigo-300 mt-1 truncate">
                                    {form.subject} • {form.topic}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsPreviewOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            <X className="h-8 w-8" />
                        </button>
                    </header>

                    {/* Toolbar Controls */}
                    <section className="flex-none flex flex-col gap-3 p-3 sm:p-4 bg-[#111827] border-y border-white/10">
                        <div className="grid grid-cols-2 gap-2 w-full max-w-sm mx-auto">
                            <button 
                                onClick={() => setPreviewMode('mobile')}
                                className={cn(
                                    "h-10 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    previewMode === 'mobile' ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg" : "bg-[#1f2937] text-slate-400 hover:text-white"
                                )}
                            >
                                <Smartphone className="h-4 w-4" /> Mobile
                            </button>
                            <button 
                                onClick={() => setPreviewMode('a4')}
                                className={cn(
                                    "h-10 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    previewMode === 'a4' ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg" : "bg-[#1f2937] text-slate-400 hover:text-white"
                                )}
                            >
                                <Layout className="h-4 w-4" /> A4 Preview
                            </button>
                        </div>

                        {previewMode === 'a4' && (
                            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 w-full max-w-md mx-auto animate-in slide-in-from-top-2">
                                <button onClick={() => setZoom(prev => Math.max(35, prev - 10))} className="w-8 h-8 rounded-full bg-[#1f2937] text-white flex items-center justify-center font-bold">
                                    <ZoomOut className="h-4 w-4" />
                                </button>
                                <Slider 
                                    value={[zoom]} 
                                    onValueChange={(val) => setZoom(val[0])} 
                                    min={35} 
                                    max={120} 
                                    step={5} 
                                    className="flex-1"
                                />
                                <button onClick={() => setZoom(prev => Math.min(120, prev + 10))} className="w-8 h-8 rounded-full bg-[#1f2937] text-white flex items-center justify-center font-bold">
                                    <ZoomIn className="h-4 w-4" />
                                </button>
                                <span className="text-[11px] font-black text-slate-300 w-10 text-right">{zoom}%</span>
                            </div>
                        )}
                    </section>

                    {/* Main Content Viewport */}
                    <main className="flex-1 overflow-hidden bg-[#e5e7eb] relative">
                        {loading && !generatedResult && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-xl">
                                <div className="flex flex-col items-center text-center gap-6 p-10 bg-white/80 rounded-[3rem] shadow-2xl">
                                     <LottieAiProcess size={160} />
                                     <div className="space-y-2">
                                        <p className="text-2xl font-black text-slate-900 uppercase">Menyusun Materi...</p>
                                        <p className="text-lg font-mono font-black text-indigo-600">{countdown}s</p>
                                     </div>
                                </div>
                            </div>
                        )}

                        <div ref={paperScrollRef} className="h-full w-full overflow-auto p-4 sm:p-10 custom-scrollbar flex justify-start sm:justify-center items-start">
                            <AnimatePresence mode="wait">
                                {generatedResult ? (
                                    <motion.div 
                                        key={previewMode}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "shrink-0 origin-top bg-white transition-all duration-300",
                                            previewMode === 'mobile' ? "w-full max-w-xl rounded-3xl p-6 sm:p-10 shadow-lg" : "w-[794px] min-h-[1123px] p-[72px_70px] shadow-2xl"
                                        )}
                                        style={previewMode === 'a4' ? { 
                                            transform: `scale(${zoom / 100})`,
                                            fontFamily: '"Times New Roman", Times, serif',
                                            marginBottom: `${(1123 * (zoom/100)) - 1123}px`
                                        } : {
                                            fontFamily: 'var(--font-sans), sans-serif'
                                        }}
                                    >
                                        <article className={cn("text-slate-900", previewMode === 'mobile' ? "text-base" : "text-[20px]")}>
                                            <h1 className={cn(
                                                "font-black uppercase tracking-tight text-center text-indigo-700 leading-tight",
                                                previewMode === 'mobile' ? "text-xl mb-6 text-left" : "text-[31px] mb-[38px]"
                                            )}>
                                                {generatedResult.title}
                                            </h1>
                                            
                                            <div className={cn(
                                                "bg-indigo-600 rounded-full",
                                                previewMode === 'mobile' ? "h-1 mb-8" : "h-1.5 mb-[54px]"
                                            )} />

                                            <div className="content-area leading-relaxed">
                                                <MathText content={generatedResult.content} isMobile={previewMode === 'mobile'} />
                                            </div>
                                        </article>
                                    </motion.div>
                                ) : !loading ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20 w-full text-indigo-950">
                                        <Loader2 className="h-12 w-12 animate-spin" />
                                    </div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    </main>

                    {/* Footer Actions */}
                    <footer className="flex-none flex flex-row gap-3 p-4 sm:p-6 bg-slate-50 border-t border-slate-200">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsPreviewOpen(false)}
                            className="flex-1 h-14 rounded-2xl border-indigo-100 bg-indigo-50 text-indigo-900 font-black uppercase tracking-widest text-sm"
                        >
                            Kembali
                        </Button>
                        <Button 
                            onClick={handleSaveToDrive} 
                            disabled={saving || loading || !generatedResult}
                            className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-200 gap-3"
                        >
                            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                            Simpan ke Drive
                        </Button>
                    </footer>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                
                .content-area table { width: 100% !important; border-collapse: collapse; margin: 20px 0; }
                .content-area td, .content-area th { border: 1px solid #cbd5e1; padding: 10px; vertical-align: top; }
                .content-area th { background: #eef2ff; font-weight: 800; }
                
                @media (max-width: 640px) {
                    .content-area table {
                        font-size: 14px;
                        display: block;
                        overflow-x: auto;
                        white-space: nowrap;
                    }
                }
            `}</style>
        </div>
    );
}

