"use client";

import * as React from "react";
import { 
    Wand2, 
    Sparkles, 
    Loader2, 
    BrainCircuit, 
    CheckCircle2, 
    Save, 
    ArrowLeft,
    X,
    FileUp,
    FileText,
    SquareChartGantt,
    Info,
    ChevronDown,
    ChevronUp,
    Plus,
    ArrowRightLeft,
    School,
    CalendarDays,
    BookOpen,
    Layers,
    Tag,
    Zap,
    Cpu,
    Users,
    TrendingUp,
    ArrowRight,
    ImageIcon,
    Copy,
    ClipboardCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { streamQuestionsAction, saveQuestionsAction } from "@/lib/actions/ai";
import type { Class, Subject, GeneratedQuestion, QuestionGenerationInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LottieAiProcess } from "@/components/ui/lottie-ai-process";
import { AiErrorDialog, type AiErrorType } from "@/components/ui/ai-error-dialog";
import { readStreamableValue } from 'ai/rsc';
import { RefinedFormField } from "@/components/ui/refined-form-field";

/**
 * Robust MathText Component V123 (Aksara Jawa Support)
 * Merender LaTeX, Markdown, dan Aksara Jawa dengan deteksi otomatis.
 */
const MathText = ({ content, className }: { content: string, className?: string }) => {
  if (!content) return null;
  
  // Standardized regex for all LaTeX formats
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
  
  return (
    <div className={cn("math-text-render w-full overflow-hidden", className)}>
      {parts.map((part, i) => {
        if (!part) return null;
        
        // Block Math Rendering (with horizontal scroll)
        if (part.startsWith('$$') || part.startsWith('\\[')) {
          const isDoubleDollar = part.startsWith('$$');
          const math = isDoubleDollar ? part.slice(2, -2) : part.slice(2, -2);
          return (
            <div key={i} className="my-3 overflow-x-auto custom-scrollbar pb-2">
              <div className="min-w-min">
                <BlockMath math={math} />
              </div>
            </div>
          );
        }
        
        // Inline Math Rendering
        if (part.startsWith('$') || part.startsWith('\\(')) {
          const isDollar = part.startsWith('$');
          const math = isDollar ? part.slice(1, -1) : part.slice(2, -2);
          return (
            <span key={i} className="inline-block max-w-full overflow-x-auto custom-scrollbar align-middle py-0.5">
               <InlineMath math={math} />
            </span>
          );
        }
        
        // Regular Text (Supports Aksara Jawa auto-styling via CSS)
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
                    p: ({node, ...props}) => {
                        // Check if text contains Javanese characters to apply Aksara Jawa class
                        const hasJavanese = /[\uA980-\uA9DF]/.test(String(props.children || ''));
                        return <span className={cn("whitespace-pre-wrap leading-relaxed break-words", hasJavanese && "aksara-jawa")} {...props} />;
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
    'SD / MI': ['Bahasa Indonesia', 'Matematika', 'IPA', 'IPS', 'Pendidikan Pancasila', 'PAI & Budi Pekerti', 'Bahasa Jawa', 'Bahasa Inggris'],
    'SMP / MTs': ['Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'IPA', 'IPS', 'Pendidikan Pancasila', 'Bahasa Jawa', 'Informatika', 'Prakarya', 'Bahasa Arab'],
    'SMA / MA': ['Bahasa Indonesia', 'Matematika Umum', 'Bahasa Inggris', 'Fisika', 'Kimia', 'Biologi', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi', 'Bahasa Jawa', 'Pendidikan Pancasila', 'Bahasa Arab'],
    'SMK / MAK': ['Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'Informatika', 'Bahasa Jawa', 'Produk Kreatif & Kewirausahaan']
};

export default function GenerateSoalClient({ 
    classes: _classes, 
    subjects: _subjects 
}: { 
    classes: Class[], 
    subjects: Subject[] 
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [questions, setQuestions] = React.useState<GeneratedQuestion[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [countdown, setCountdown] = React.useState(30);
    const [expandedExplanations, setExpandedExplanations] = React.useState<Set<number>>(new Set());

    const [isErrorOpen, setIsErrorOpen] = React.useState(false);
    const [errorType, setErrorType] = React.useState<AiErrorType>(null);
    const [errorMsg, setErrorMsg] = React.useState("");
    
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = React.useState<{ name: string, uri: string, mime: string } | null>(null);
    const [customSubject, setCustomSubject] = React.useState("");

    const [form, setForm] = React.useState<QuestionGenerationInput>({
        jenjang: 'SMP / MTs',
        kelas: '7',
        semester: 'Ganjil',
        subject: 'Bahasa Indonesia',
        curriculum: 'Kurikulum Merdeka',
        assessment_purpose: 'Ulangan Harian',
        topic: '',
        subtopic: '',
        cognitive_level: 'Variatif',
        mode: 'Reguler',
        instruction: '',
        question_type: 'multiple_choice',
        count: 5, 
        difficulty: 'sedang'
    });

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading && questions.length === 0) {
            setCountdown(30);
            interval = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loading, questions.length]);

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
            toast({ title: "Materi Terunggah", description: `${file.name} siap diproses.` });
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const finalSubject = form.subject === "Lainnya (Tulis Manual)" ? customSubject : form.subject;
        if (!form.topic || !finalSubject || !form.kelas) {
            toast({ title: "Data Belum Lengkap", description: "Mohon isi Topik, Mapel, dan Kelas.", variant: "destructive" });
            return;
        }
        setLoading(true);
        setQuestions([]); 
        setCountdown(30);
        setExpandedExplanations(new Set());
        setIsPreviewOpen(true); 
        try {
            const { output } = await streamQuestionsAction({ 
                ...form, 
                subject: finalSubject,
                mediaDataUri: uploadedFile?.uri, 
                mediaMimeType: uploadedFile?.mime 
            });
            for await (const delta of readStreamableValue(output)) {
                if (delta && (delta as any).questions) {
                    setQuestions((delta as any).questions);
                }
            }
            toast({ title: "Berhasil", description: `${questions.length || form.count} butir soal telah dihasilkan.` });
        } catch (err: any) {
            setIsPreviewOpen(false);
            const errStr = err.message || "";
            let type: AiErrorType = 'generic';
            if (errStr.includes('429')) type = 'quota';
            else if (errStr.includes('503')) type = 'overloaded';
            setErrorType(type);
            setErrorMsg(errStr);
            setIsErrorOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToBankSoal = async () => {
        if (questions.length === 0) return;
        setSaving(true);
        const finalSubject = form.subject === "Lainnya (Tulis Manual)" ? customSubject : form.subject;
        const result = await saveQuestionsAction({ ...form, subject: finalSubject }, questions);
        if (result.success) {
            toast({ title: "Berhasil Disimpan", description: "Soal-soal telah masuk ke Bank Soal Anda." });
            setQuestions([]);
            setIsPreviewOpen(false);
            router.push('/dashboard/ai-pembelajaran/bank-soal');
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setSaving(false);
    };

    const toggleExplanation = (idx: number) => {
        setExpandedExplanations(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            <AiErrorDialog open={isErrorOpen} onOpenChange={setIsErrorOpen} errorType={errorType} errorMessage={errorMsg} onRetry={handleGenerate} />

            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">Generate Soal</h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">AI Question Engine (vStream)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-4 sm:px-6 lg:px-10">
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-[#4B7EFC]" />Konfigurasi Soal</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="space-y-3">
                                <Label className="text-[14px] sm:text-[15px] font-semibold text-gray-700 px-1 flex items-center gap-2"><FileUp className="h-4 w-4 text-[#4B7EFC]" /> Materi Pendukung (Opsional)</Label>
                                <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf, image/*" onChange={handleFileChange} />
                                {uploadedFile ? (
                                    <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-between group shadow-inner">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {uploadedFile.mime.includes('pdf') ? <FileText className="h-5 w-5 text-indigo-600" /> : <ImageIcon className="h-5 w-5 text-indigo-600" />}
                                            <p className="text-xs font-black text-indigo-700 truncate">{uploadedFile.name}</p>
                                        </div>
                                        <button type="button" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" onClick={() => setUploadedFile(null)}><X className="h-4 w-4" /></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-600 group">
                                        <FileUp className="h-8 w-8 opacity-40 group-hover:opacity-100" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Unggah PDF / Foto Buku</p>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <RefinedFormField label="Jenjang" icon={<School className="h-4 w-4" />}>
                                    <Select value={form.jenjang} onValueChange={handleJenjangChange}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">{Object.keys(mapelByJenjang).map(j => <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>)}</SelectContent>
                                    </Select>
                                </RefinedFormField>
                                <RefinedFormField label="Kelas" icon={<Users className="h-4 w-4" />}>
                                    <Select value={form.kelas} onValueChange={(v) => setForm(prev => ({...prev, kelas: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">{getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}</SelectContent>
                                    </Select>
                                </RefinedFormField>
                            </div>

                            <RefinedFormField label="Mata Pelajaran" icon={<BookOpen className="h-4 w-4" />}>
                                <Select value={form.subject} onValueChange={(v) => setForm(prev => ({...prev, subject: v}))}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                        <SelectItem value="Lainnya (Tulis Manual)" className="font-bold text-indigo-600"><Plus className="h-3 w-3 mr-1 inline" /> Lainnya (Tulis Manual)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </RefinedFormField>
                            
                            <AnimatePresence>
                                {form.subject === "Lainnya (Tulis Manual)" && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <RefinedFormField label="Nama Mapel Mulok" icon={<Tag className="h-4 w-4" />}>
                                            <Input placeholder="Misal: Bahasa Jawa, BTQ..." value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} required />
                                        </RefinedFormField>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <RefinedFormField label="Topik / Materi Pokok" icon={<Tag className="h-4 w-4" />}>
                                <Input placeholder="Misal: Sistem Tata Surya, Aksara Jawa" value={form.topic} onChange={(e) => setForm(prev => ({...prev, topic: e.target.value}))} required />
                            </RefinedFormField>

                            <div className="grid grid-cols-2 gap-4">
                                <RefinedFormField label="Level Kognitif" icon={<Cpu className="h-4 w-4" />}>
                                    <Select value={form.cognitive_level} onValueChange={(v) => setForm(prev => ({...prev, cognitive_level: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="Variatif" className="font-bold">Variatif</SelectItem>
                                            <SelectItem value="C1-C3 (Dasar)" className="font-bold">C1-C3 (Dasar)</SelectItem>
                                            <SelectItem value="C4-C6 (HOTS)" className="font-bold text-indigo-600">C4-C6 (HOTS)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </RefinedFormField>
                                <RefinedFormField label="Kesulitan" icon={<TrendingUp className="h-4 w-4" />}>
                                    <Select value={form.difficulty} onValueChange={(v: any) => setForm(prev => ({...prev, difficulty: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="mudah" className="font-bold text-emerald-600">Mudah</SelectItem>
                                            <SelectItem value="sedang" className="font-bold text-blue-600">Sedang</SelectItem>
                                            <SelectItem value="sulit" className="font-bold text-rose-600">Sulit / HOTS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </RefinedFormField>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <RefinedFormField label="Jenis Soal" icon={<Zap className="h-4 w-4" />}>
                                    <Select value={form.question_type} onValueChange={(v: any) => setForm(prev => ({...prev, question_type: v}))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            <SelectItem value="multiple_choice" className="font-bold">Pilihan Ganda</SelectItem>
                                            <SelectItem value="essay" className="font-bold">Uraian / Esai</SelectItem>
                                            <SelectItem value="short_answer" className="font-bold text-indigo-600">Isian Singkat</SelectItem>
                                            <SelectItem value="true_false" className="font-bold">Benar / Salah</SelectItem>
                                            <SelectItem value="matching" className="font-bold text-emerald-600">Menjodohkan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </RefinedFormField>
                                <RefinedFormField label="Jumlah (Maks 5)" icon={<Plus className="h-4 w-4" />}>
                                    <Input type="number" min={1} max={5} value={form.count} onChange={(e) => setForm(prev => ({...prev, count: Math.min(5, Math.max(1, parseInt(e.target.value) || 1))}))} className="font-bold" />
                                </RefinedFormField>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}
                                Generate Sekarang
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col items-center justify-center text-center px-10">
                    <div className="p-16 rounded-[5rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                        <Sparkles className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">AI Soal Engine</h3>
                    <p className="text-slate-400 font-bold text-sm max-w-sm mt-4 leading-relaxed italic">Atur parameter di samping dan saksikan AI merumuskan butir soal terbaik (termasuk Aksara Jawa) untuk siswa Anda.</p>
                </Card>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                    <div className="flex flex-col h-[90vh] relative">
                        {loading && questions.length === 0 && (
                            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-2xl animate-in fade-in duration-700">
                                <div className="relative p-10 sm:p-14 rounded-[3.5rem] bg-white/80 border border-white/40 shadow-2xl flex flex-col items-center text-center gap-8 max-w-[90vw] overflow-hidden">
                                     <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl rounded-full animate-pulse" />
                                     <div className="relative">
                                         <LottieAiProcess size={220} />
                                     </div>
                                     <div className="space-y-6">
                                         <div className="space-y-2">
                                            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">Merumuskan<br/>Soal Terbaik</p>
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
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )}
                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-8 text-white relative shrink-0">
                            <div className="relative z-10 flex flex-col items-center text-center"><DialogHeader><DialogTitle className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">AI Streaming Preview</DialogTitle></DialogHeader></div>
                        </div>
                        <ScrollArea className="flex-1 p-4 sm:p-10">
                            <div className="space-y-6 sm:space-y-12 pb-10">
                                {questions.map((q, idx) => (
                                    <Card key={idx} className="border-0 shadow-sm rounded-xl bg-white p-5 sm:p-10 border border-slate-100/50 group hover:shadow-md transition-all">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shrink-0">{idx + 1}</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Badge className={cn("font-black text-[9px] uppercase tracking-widest px-2 py-0.5", q.difficulty === 'sulit' ? "bg-rose-500" : q.difficulty === 'sedang' ? "bg-amber-500" : "bg-emerald-500")}>
                                                        {q.difficulty}
                                                    </Badge>
                                                    {q.cognitive_level && (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase font-black text-[9px] tracking-widest px-2 py-0.5">
                                                            <BrainCircuit className="w-3 h-3 mr-1 opacity-60" />
                                                            {q.cognitive_level}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge className="w-fit bg-indigo-50 text-indigo-700 border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest">{getQuestionTypeLabel(q.type)}</Badge>
                                        </div>
                                        
                                        <div className="text-lg font-bold text-slate-800 leading-relaxed mb-6">
                                            <MathText content={q.question} className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')} />
                                        </div>

                                        {q.options && (
                                            <div className="grid grid-cols-1 gap-3 mt-8">
                                                {Object.entries(q.options).sort().map(([k, v]) => (
                                                    <div key={k} className="p-4 sm:p-5 rounded-xl border border-slate-50 bg-slate-50/30 flex gap-4">
                                                        <span className="font-black text-indigo-600">{k}.</span>
                                                        <div className="flex-1 overflow-hidden"><MathText content={v} /></div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-6 mt-8 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">KUNCI: {q.answer}</p>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => toggleExplanation(idx)} 
                                                className="text-[10px] font-black uppercase text-indigo-600 tracking-widest h-10 px-4 rounded-xl hover:bg-indigo-50"
                                            >
                                                {expandedExplanations.has(idx) ? "Tutup Pembahasan" : "Lihat Pembahasan"}
                                            </Button>
                                        </div>

                                        <AnimatePresence>
                                            {expandedExplanations.has(idx) && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                                                    <div className="p-6 rounded-xl bg-slate-50 text-sm italic text-slate-600 border border-slate-100 leading-relaxed shadow-inner">
                                                        <MathText content={q.explanation} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-4 sm:p-10 bg-white border-t flex flex-col sm:flex-row gap-3 shrink-0 pb-safe">
                            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="flex-1 h-14 sm:h-16 rounded-2xl font-black uppercase tracking-widest"><ArrowLeft className="h-5 w-5" /> Kembali</Button>
                            <Button onClick={handleSaveToBankSoal} disabled={saving || loading || questions.length === 0} className="flex-[2] h-14 sm:h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95">{saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />} Simpan ke Bank Soal</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}

function getClassOptions(jenjang: string) {
    if (jenjang === 'SD / MI') return ['1', '2', '3', '4', '5', '6'];
    if (jenjang === 'SMP / MTs') return ['7', '8', '9'];
    if (jenjang === 'SMA / MA' || jenjang === 'SMK / MAK') return ['10', '11', '12'];
    return [];
}
