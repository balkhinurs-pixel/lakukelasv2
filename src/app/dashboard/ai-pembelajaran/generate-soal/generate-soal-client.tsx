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
    Bot,
    Image as ImageIcon,
    ClipboardCheck,
    FileUp,
    FileText,
    SquareChartGantt,
    Info,
    ChevronDown,
    ChevronUp,
    Plus,
    ArrowRightLeft
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

const MathText = ({ content, className }: { content: string, className?: string }) => {
  if (!content) return null;
  // Improved regex to handle $...$ and $$...$$ as well as standard LaTeX \(...\) and \[...\]
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
  
  return (
    <div className={cn("math-text-render w-full overflow-hidden", className)}>
      {parts.map((part, i) => {
        if (part.startsWith('$$')) return <div key={i} className="my-3 overflow-x-auto"><BlockMath math={part.slice(2, -2)} /></div>;
        if (part.startsWith('$')) return <InlineMath key={i} math={part.slice(1, -1)} />;
        if (part.startsWith('\\[')) return (
            <div key={i} className="my-3 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2 print:overflow-visible">
                <BlockMath math={part.slice(2, -2)} />
            </div>
        );
        if (part.startsWith('\\(')) return <InlineMath key={i} math={part.slice(2, -2)} />;
        
        return (
            <ReactMarkdown 
                key={i} 
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm">
                            <table className="w-full border-collapse text-sm text-center" {...props} />
                        </div>
                    ),
                    th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 p-3 font-black text-slate-900 uppercase tracking-tight" {...props} />,
                    td: ({node, ...props}) => <td className="border border-slate-200 p-3 font-bold text-slate-700" {...props} />,
                    tr: ({node, ...props}) => <tr className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors" {...props} />,
                    p: ({node, ...props}) => <span className="whitespace-pre-wrap leading-relaxed" {...props} />
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

    // AI Error Dialog State
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

    // Countdown Logic
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
        const MAX_FILE_SIZE = 3 * 1024 * 1024; 
        if (file.size > MAX_FILE_SIZE) {
            toast({ title: "File Terlalu Besar", description: "Maksimal ukuran file adalah 3MB.", variant: "destructive" });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
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

    const toggleExplanation = (index: number) => {
        setExpandedExplanations(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleSaveToBankSoal = async () => {
        if (questions.length === 0) return;
        setSaving(true);
        
        const finalSubject = form.subject === "Lainnya (Tulis Manual)" ? customSubject : form.subject;
        const finalConfig = { ...form, subject: finalSubject };

        const result = await saveQuestionsAction(finalConfig, questions);
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

    const getQuestionTypeLabel = (type: string) => {
        switch(type) {
            case 'multiple_choice': return 'PG';
            case 'essay': return 'Uraian';
            case 'short_answer': return 'Isian';
            case 'true_false': return 'B/S';
            case 'matching': return 'Jodohkan';
            default: return type;
        }
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
                            Generate Soal
                        </h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">
                            AI Question Engine (vStream)
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-4 sm:px-6 lg:px-10">
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                                Konfigurasi Soal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pendukung (Opsional)</Label>
                                <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf, image/*" onChange={handleFileChange} />
                                {uploadedFile ? (
                                    <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-between group animate-in zoom-in-95 duration-200 shadow-inner">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {uploadedFile.mime.includes('pdf') ? <FileText className="h-5 w-5 text-indigo-600" /> : <ImageIcon className="h-5 w-5 text-indigo-600" />}
                                            <p className="text-xs font-black text-indigo-700 truncate">{uploadedFile.name}</p>
                                        </div>
                                        <button type="button" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" onClick={() => setUploadedFile(null)}><X className="h-4 w-4" /></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-600 group">
                                        <FileUp className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Unggah PDF / Foto Buku</p>
                                        <p className="text-[9px] font-medium opacity-60">Max 3MB • AI akan membaca materi Anda</p>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang Sekolah</Label>
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
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Semester</Label>
                                    <Select value={form.semester} onValueChange={(v) => setForm(prev => ({...prev, semester: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Ganjil" className="font-bold">Ganjil</SelectItem>
                                            <SelectItem value="Genap" className="font-bold">Genap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mata Pelajaran</Label>
                                    <Select value={form.subject} onValueChange={(v) => setForm(prev => ({...prev, subject: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {(mapelByJenjang[form.jenjang] || []).map(m => (
                                                <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>
                                            ))}
                                            <SelectItem value="Lainnya (Tulis Manual)" className="font-bold text-indigo-600 flex items-center gap-2">
                                                <Plus className="h-3 w-3 mr-1 inline" /> Lainnya (Tulis Manual)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <AnimatePresence>
                                    {form.subject === "Lainnya (Tulis Manual)" && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-1.5 overflow-hidden"
                                        >
                                            <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Nama Mapel Mulok</Label>
                                            <Input 
                                                placeholder="Misal: BTQ, Bahasa Jawa..." 
                                                className="rounded-xl bg-white border-2 border-indigo-100 h-11 font-bold" 
                                                value={customSubject} 
                                                onChange={(e) => setCustomSubject(e.target.value)} 
                                                required 
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.kelas} onValueChange={(v) => setForm(prev => ({...prev, kelas: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kurikulum</Label>
                                    <Select value={form.curriculum} onValueChange={(v) => setForm(prev => ({...prev, curriculum: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Kurikulum Merdeka" className="font-bold">Kurikulum Merdeka</SelectItem>
                                            <SelectItem value="K-13" className="font-bold">K-13 (2013)</SelectItem>
                                            <SelectItem value="Kurikulum Kemenag" className="font-bold text-indigo-600">Kurikulum Kemenag</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tujuan Asesmen</Label>
                                    <Select value={form.assessment_purpose} onValueChange={(v) => setForm(prev => ({...prev, assessment_purpose: v}))}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Ulangan Harian" className="font-bold">Ulangan Harian (UH)</SelectItem>
                                            <SelectItem value="PTS" className="font-bold">PTS (Tengah Semester)</SelectItem>
                                            <SelectItem value="PAS/UAS" className="font-bold">PAS / UAS</SelectItem>
                                            <SelectItem value="Latihan" className="font-bold">Latihan Soal</SelectItem>
                                            <SelectItem value="Remedial" className="font-bold text-rose-500">Remedial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Topik / Materi Pokok</Label>
                                    <Input placeholder="Misal: Sistem Tata Surya" className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner" value={form.topic} onChange={(e) => setForm(prev => ({...prev, topic: e.target.value}))} required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sub-topik (Opsional)</Label>
                                    <Input placeholder="Misal: Karakteristik Planet" className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner" value={form.subtopic || ''} onChange={(e) => setForm(prev => ({...prev, subtopic: e.target.value}))} />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-slate-50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Level Kognitif</Label>
                                        <Select value={form.cognitive_level} onValueChange={(v) => setForm(prev => ({...prev, cognitive_level: v}))}>
                                            <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                                <SelectItem value="Variatif" className="font-bold">Variatif</SelectItem>
                                                <SelectItem value="C1-C3 (Dasar)" className="font-bold">C1-C3 (Dasar)</SelectItem>
                                                <SelectItem value="C4-C6 (HOTS)" className="font-bold text-indigo-600">C4-C6 (HOTS)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kesulitan</Label>
                                        <Select value={form.difficulty} onValueChange={(v: any) => setForm(prev => ({...prev, difficulty: v}))}>
                                            <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                                <SelectItem value="mudah" className="font-bold text-emerald-600">Mudah</SelectItem>
                                                <SelectItem value="sedang" className="font-bold text-blue-600">Sedang</SelectItem>
                                                <SelectItem value="sulit" className="font-bold text-rose-600">Sulit / HOTS</SelectItem>
                                                <SelectItem value="campuran" className="font-bold">Campuran</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenis Soal</Label>
                                        <Select value={form.question_type} onValueChange={(v: any) => setForm(prev => ({...prev, question_type: v}))}>
                                            <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                                <SelectItem value="multiple_choice" className="font-bold">Pilihan Ganda</SelectItem>
                                                <SelectItem value="essay" className="font-bold">Uraian / Esai</SelectItem>
                                                <SelectItem value="short_answer" className="font-bold text-indigo-600">Isian Singkat</SelectItem>
                                                <SelectItem value="true_false" className="font-bold">Benar / Salah</SelectItem>
                                                <SelectItem value="matching" className="font-bold text-emerald-600">Menjodohkan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jumlah Soal (Maks. 5)</Label>
                                        <Input 
                                            type="number" 
                                            min={1} 
                                            max={5} 
                                            value={form.count} 
                                            onChange={(e) => setForm(prev => ({...prev, count: Math.min(5, Math.max(1, parseInt(e.target.value) || 1))}))}
                                            className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Instruksi Khusus (Opsional)</Label>
                                    <Textarea placeholder="Misal: Berikan soal yang berbasis lingkungan..." className="rounded-2xl bg-slate-50 border-0 min-h-[80px] font-medium resize-none shadow-inner" value={form.instruction || ''} onChange={(e) => setForm(prev => ({...prev, instruction: e.target.value}))} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-100">
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
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Multi-Type Question Engine</h3>
                    <p className="text-slate-400 font-bold text-sm max-w-sm mt-4 leading-relaxed">
                        Kini mendukung variasi soal: **Pilihan Ganda, Uraian, Benar/Salah, Isian Singkat, dan Menjodohkan** dengan ilustrasi SVG otomatis.
                    </p>
                </Card>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                    <div className="flex flex-col h-[90vh] relative">
                        {loading && questions.length === 0 && (
                            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-2xl animate-in fade-in duration-700">
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
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Selesai</p>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 text-white relative shrink-0">
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">AI Streaming Preview</DialogTitle>
                                    <DialogDescription className="text-indigo-100 font-bold text-[10px] sm:text-sm uppercase tracking-[0.2em] mt-3 opacity-90">
                                        {form.subject === "Lainnya (Tulis Manual)" ? customSubject : form.subject} Kelas {form.kelas}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4 sm:p-10">
                            <div className="space-y-6 sm:space-y-12 pb-10">
                                {questions.length > 0 ? (
                                    questions.map((q, idx) => {
                                        const isMatching = q.type === 'matching';
                                        let matchingItems: string[] = [];
                                        let matchingIntro = q.question;

                                        if (isMatching) {
                                            const lines = q.question.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');
                                            if (lines.length > 1) {
                                                const hasNumberedLines = lines.slice(1).some(l => /^\d+[\.\)]/.test(l));
                                                if (hasNumberedLines) {
                                                    matchingItems = lines.filter((l: string) => /^\d+[\.\)]/.test(l));
                                                    matchingIntro = lines.filter((l: string) => !/^\d+[\.\)]/.test(l)).join('\n');
                                                } else {
                                                    matchingIntro = lines[0];
                                                    matchingItems = lines.slice(1);
                                                }
                                            }
                                        }

                                        return (
                                            <Card key={idx} className="border-0 shadow-sm rounded-xl bg-white p-6 sm:p-10 border border-slate-100/50 group hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">{q.sort_order || idx + 1}</div>
                                                    <Badge className="bg-indigo-50 text-indigo-700 border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest">{getQuestionTypeLabel(q.type)}</Badge>
                                                </div>
                                                <div className="space-y-8">
                                                    <MathText 
                                                        content={isMatching ? matchingIntro : q.question} 
                                                        className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')} 
                                                    />
                                                    
                                                    {q.visual_svg && (
                                                        <div className="my-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-3">
                                                            <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                                                <SquareChartGantt className="h-4 w-4" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Ilustrasi Geometri AI</span>
                                                            </div>
                                                            <div 
                                                                className="w-full max-w-[400px] aspect-[1/1] flex items-center justify-center overflow-hidden"
                                                                style={{ height: 'auto', maxHeight: '400px' }}
                                                                dangerouslySetInnerHTML={{ __html: q.visual_svg.replace('<svg', '<svg style="width:100%;height:100%;max-width:400px;max-height:400px;" preserveAspectRatio="xMidYMid meet"') }}
                                                            />
                                                        </div>
                                                    )}

                                                    {isMatching ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                                                            <div className="space-y-3">
                                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                                    <Info className="w-3 h-3" /> Pernyataan / Soal
                                                                </p>
                                                                <div className="space-y-2">
                                                                    {matchingItems.length > 0 ? matchingItems.map((item, i) => (
                                                                        <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 text-xs font-bold shadow-sm min-h-[44px] flex items-center">
                                                                            <MathText content={item} />
                                                                        </div>
                                                                    )) : (
                                                                        <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 text-center opacity-40">
                                                                            <p className="text-[9px] font-black uppercase">Pernyataan Kosong</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                                    <ArrowRightLeft className="w-3 h-3" /> Pilihan Jawaban
                                                                </p>
                                                                <div className="space-y-2">
                                                                    {q.options && Object.entries(q.options).sort().map(([key, val]) => (
                                                                        <div key={key} className="p-3 bg-white rounded-xl border border-slate-100 text-xs font-bold flex gap-3 shadow-sm min-h-[44px] flex items-center">
                                                                            <span className="text-emerald-600 font-black">{key}.</span>
                                                                            <div className="flex-1 overflow-hidden"><MathText content={val} /></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        q.options && (
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {Object.entries(q.options).sort().map(([key, val]) => (
                                                                    <div key={key} className={cn("p-5 rounded-xl border flex items-center gap-4 transition-colors", q.answer === key ? "bg-emerald-50 border-emerald-200" : "bg-slate-50/30 border-slate-100")}>
                                                                        <span className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0", q.answer === key ? "bg-emerald-500 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100")}>{key}</span>
                                                                        <div className="text-sm sm:text-base font-semibold flex-1 overflow-hidden"><MathText content={val} /></div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                    )}

                                                    <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3 p-3 px-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                                                                <CheckCircle2 className="h-5 w-5" />
                                                                <p className="text-sm font-black uppercase tracking-tight">Jawaban: <span className="ml-1 text-emerald-600">{q.answer}</span></p>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => toggleExplanation(idx)}
                                                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 h-10 px-4 rounded-xl hover:bg-indigo-50"
                                                            >
                                                                {expandedExplanations.has(idx) ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                                                                {expandedExplanations.has(idx) ? "Tutup Pembahasan" : "Lihat Pembahasan"}
                                                            </Button>
                                                        </div>

                                                        <AnimatePresence>
                                                            {expandedExplanations.has(idx) && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                                                                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                                                                            <Info className="h-3.5 w-3.5" />
                                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Analisis Jawaban AI</span>
                                                                        </div>
                                                                        <div className="text-sm italic text-slate-600 leading-relaxed font-medium">
                                                                            <MathText content={q.explanation} />
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })
                                ) : !loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                        <LottieAiProcess size={150} />
                                        <p className="font-black text-indigo-600 uppercase tracking-widest animate-pulse">Menunggu respon AI...</p>
                                    </div>
                                ) : null}
                            </div>
                        </ScrollArea>

                        <div className="p-6 sm:p-10 bg-white border-t flex flex-col sm:flex-row gap-4 shrink-0 pb-safe">
                            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="flex-1 h-16 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest gap-2">
                                <ArrowLeft className="h-5 w-5" /> Kembali
                            </Button>
                            <Button onClick={handleSaveToBankSoal} disabled={saving || loading || questions.length === 0} className="flex-[2] h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100">
                                {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />} Simpan ke Bank Soal
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                .math-text-render svg {
                    max-width: 100%;
                    height: auto;
                }
            `}</style>
        </div>
    );
}
