
"use client";

import * as React from "react";
import { 
    Wand2, 
    Sparkles, 
    Loader2, 
    BrainCircuit, 
    CheckCircle2, 
    Save, 
    Target, 
    Zap, 
    ArrowLeft,
    AlertTriangle,
    Eye,
    X,
    Trash2,
    Edit3,
    Bot,
    Image as ImageIcon,
    ClipboardCheck,
    HelpCircle,
    Lightbulb,
    FileImage,
    PencilLine
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateQuestionsAction, saveQuestionsAction, generateQuestionImageAction } from "@/lib/actions/ai";
import type { Class, Subject, GeneratedQuestion, QuestionGenerationInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Komponen pembantu untuk merender teks yang bercampur dengan LaTeX
 */
const MathText = ({ content, className }: { content: string, className?: string }) => {
  if (!content) return null;

  // Regex untuk memisahkan teks biasa dengan blok LaTeX \( ... \) atau \[ ... \]
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className={cn("math-text-render", className)}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) {
          return <BlockMath key={i} math={part.slice(2, -2)} />;
        }
        if (part.startsWith('\\(')) {
          return <InlineMath key={i} math={part.slice(2, -2)} />;
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </div>
  );
};

export default function GenerateSoalClient({ 
    classes, 
    subjects 
}: { 
    classes: Class[], 
    subjects: Subject[] 
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [imageLoadingIdx, setImageLoadingIdx] = React.useState<number | null>(null);
    const [questions, setQuestions] = React.useState<GeneratedQuestion[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

    const [form, setForm] = React.useState<QuestionGenerationInput>({
        jenjang: 'SMP/MTs',
        kelas: '7',
        semester: 'Ganjil',
        subject: '',
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

    const getClassOptions = (jenjang: string) => {
        if (jenjang === 'SD/MI') return ['1', '2', '3', '4', '5', '6'];
        if (jenjang === 'SMP/MTs') return ['7', '8', '9'];
        if (jenjang === 'SMA/MA' || jenjang === 'SMK/MAK') return ['10', '11', '12'];
        return [];
    };

    const handleJenjangChange = (val: string) => {
        const options = getClassOptions(val);
        setForm({
            ...form,
            jenjang: val,
            kelas: options[0] || ''
        });
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.topic || !form.subject || !form.kelas) {
            toast({ title: "Data Belum Lengkap", description: "Mohon lengkapi parameter soal.", variant: "destructive" });
            return;
        }

        setLoading(true);
        const result = await generateQuestionsAction(form);

        if (result.success && result.data) {
            setQuestions(result.data.questions);
            setIsPreviewOpen(true);
            toast({ title: "Soal Berhasil Dibuat", description: `${result.data.questions.length} soal baru telah dihasilkan.` });
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    };

    const handleGenerateImage = async (idx: number, prompt: string) => {
        if (!prompt) {
            toast({ title: "Prompt Kosong", description: "Silakan masukkan deskripsi gambar terlebih dahulu.", variant: "destructive" });
            return;
        }
        setImageLoadingIdx(idx);
        
        const result = await generateQuestionImageAction(prompt);
        
        if (result.success && result.url) {
            const updatedQuestions = [...questions];
            updatedQuestions[idx].image_url = result.url;
            setQuestions(updatedQuestions);
            toast({ title: "Ilustrasi Terpasang", description: "Link ilustrasi AI berhasil ditambahkan ke soal." });
        } else {
            toast({ title: "Gagal Menghubungkan Ilustrasi", description: result.error, variant: "destructive" });
        }
        setImageLoadingIdx(null);
    };

    const handleUpdatePrompt = (idx: number, newPrompt: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[idx].image_prompt = newPrompt;
        setQuestions(updatedQuestions);
    };

    const handleSaveToBankSoal = async () => {
        if (questions.length === 0) return;
        
        setSaving(true);
        const result = await saveQuestionsAction(form, questions);
        
        if (result.success) {
            toast({ title: "Tersimpan!", description: "Soal-soal telah berhasil disimpan ke Bank Soal." });
            setQuestions([]);
            setIsPreviewOpen(false);
            router.push('/dashboard/ai-pembelajaran/bank-soal');
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setSaving(false);
    };

    return (
        <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-1">
                {/* Sidebar Form Config */}
                <Card className="lg:col-span-2 border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                                Parameter Soal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang</Label>
                                    <Select value={form.jenjang} onValueChange={handleJenjangChange}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="SD/MI" className="font-bold">SD / MI</SelectItem>
                                            <SelectItem value="SMP/MTs" className="font-bold">SMP / MTs</SelectItem>
                                            <SelectItem value="SMA/MA" className="font-bold">SMA / MA</SelectItem>
                                            <SelectItem value="SMK/MAK" className="font-bold">SMK / MAK</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kurikulum</Label>
                                    <Select value={form.curriculum} onValueChange={(v) => setForm({...form, curriculum: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Kurikulum Merdeka" className="font-bold">Merdeka</SelectItem>
                                            <SelectItem value="Kurikulum Merdeka (KBC)" className="font-bold text-indigo-600">Kemenag (KBC)</SelectItem>
                                            <SelectItem value="K-13" className="font-bold">K-13</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mata Pelajaran</Label>
                                    <Select value={form.subject} onValueChange={(v) => setForm({...form, subject: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {subjects.map(s => <SelectItem key={s.id} value={s.name} className="font-bold">{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.kelas} onValueChange={(v) => setForm({...form, kelas: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {getClassOptions(form.jenjang).map(k => (
                                                <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Semester</Label>
                                    <Select value={form.semester} onValueChange={(v) => setForm({...form, semester: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Ganjil" className="font-bold">Ganjil</SelectItem>
                                            <SelectItem value="Genap" className="font-bold">Genap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tujuan Soal</Label>
                                    <Select value={form.assessment_purpose} onValueChange={(v) => setForm({...form, assessment_purpose: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Latihan / PR" className="font-bold">Latihan / PR</SelectItem>
                                            <SelectItem value="Ulangan Harian" className="font-bold">Ulangan Harian</SelectItem>
                                            <SelectItem value="PTS / STS" className="font-bold">PTS / STS</SelectItem>
                                            <SelectItem value="PAS / SAS" className="font-bold">PAS / SAS</SelectItem>
                                            <SelectItem value="Remedial" className="font-bold">Remedial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pokok / Bab</Label>
                                    <Input 
                                        placeholder="Contoh: Persamaan Linear" 
                                        className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner"
                                        value={form.topic}
                                        onChange={(e) => setForm({...form, topic: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sub-topik (Opsional)</Label>
                                    <Input 
                                        placeholder="Contoh: Metode Eliminasi" 
                                        className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner"
                                        value={form.subtopic}
                                        onChange={(e) => setForm({...form, subtopic: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Level Kognitif</Label>
                                    <Select value={form.cognitive_level} onValueChange={(v) => setForm({...form, cognitive_level: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Variatif" className="font-bold">Campuran</SelectItem>
                                            <SelectItem value="C1 - Mengingat" className="font-bold">C1</SelectItem>
                                            <SelectItem value="C2 - Memahami" className="font-bold">C2</SelectItem>
                                            <SelectItem value="C3 - Menerapkan" className="font-bold">C3</SelectItem>
                                            <SelectItem value="C4 - Menganalisis" className="font-bold">C4</SelectItem>
                                            <SelectItem value="C5 - Mengevaluasi" className="font-bold">C5</SelectItem>
                                            <SelectItem value="C6 - Mencipta" className="font-bold">C6</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mode Soal</Label>
                                    <Select value={form.mode} onValueChange={(v) => setForm({...form, mode: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Reguler" className="font-bold">Reguler</SelectItem>
                                            <SelectItem value="HOTS" className="font-bold">HOTS</SelectItem>
                                            <SelectItem value="Remedial" className="font-bold">Remedial</SelectItem>
                                            <SelectItem value="Pengayaan" className="font-bold">Pengayaan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenis</Label>
                                    <Select value={form.question_type} onValueChange={(v: any) => setForm({...form, question_type: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="multiple_choice" className="font-bold">Pilihan Ganda</SelectItem>
                                            <SelectItem value="essay" className="font-bold">Esai</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kesulitan</Label>
                                    <Select value={form.difficulty} onValueChange={(v: any) => setForm({...form, difficulty: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="mudah" className="font-bold text-emerald-600">Mudah</SelectItem>
                                            <SelectItem value="sedang" className="font-bold text-blue-600">Sedang</SelectItem>
                                            <SelectItem value="sulit" className="font-bold text-rose-600">Sulit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Instruksi Khusus (Opsional)</Label>
                                <Textarea 
                                    placeholder="Misal: Buat soal dengan teks Bahasa Arab..." 
                                    className="rounded-2xl bg-slate-50 border-0 min-h-[80px] font-medium resize-none shadow-inner"
                                    value={form.instruction}
                                    onChange={(e) => setForm({...form, instruction: e.target.value})}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 text-lg font-black uppercase tracking-widest gap-3 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Zap className="h-6 w-6" />}
                                Generate 5 Soal
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Empty State / Initial View */}
                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col items-center justify-center text-center px-10">
                    <div className="p-16 rounded-[5rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                        <Wand2 className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Generate Soal Otomatis</h3>
                    <p className="text-slate-400 font-bold text-sm max-w-sm mt-4 leading-relaxed">
                        Lengkapi parameter kurikulum di samping, lalu AI akan menyusun soal-soal berkualitas tinggi untuk Anda tinjau.
                    </p>
                </Card>
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-10"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse scale-150" />
                            <div className="relative z-10 p-10 rounded-[3rem] bg-white shadow-2xl border border-indigo-50">
                                <Loader2 className="h-20 w-20 animate-spin text-indigo-600 mx-auto" />
                                <div className="mt-8 space-y-2">
                                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Merumuskan Soal...</p>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Artificial Intelligence Power</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dialog Preview Soal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-[#F8FAFF]">
                    <div className="flex flex-col h-[90vh]">
                        {/* Header Indigo Gradient */}
                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white relative">
                            <button 
                                onClick={() => setIsPreviewOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <div className="flex items-center gap-5">
                                <div className="p-4 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/20 shadow-xl">
                                    <Eye className="h-8 w-8" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight">Preview Soal</DialogTitle>
                                    <DialogDescription className="text-indigo-100 font-bold text-sm sm:text-base mt-1">
                                        {form.subject} — Kelas {form.kelas} — {form.difficulty.charAt(0).toUpperCase() + form.difficulty.slice(1)}
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        {/* Badges Summary */}
                        <div className="p-6 pb-2 flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 px-4 py-2 rounded-2xl font-bold gap-2 shadow-sm">
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                {questions.length} soal total
                            </Badge>
                            <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl font-bold gap-2 shadow-sm">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {questions.length} akan disimpan
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-700 px-4 py-2 rounded-2xl font-bold gap-2 shadow-sm">
                                <Bot className="h-3.5 w-3.5" />
                                via POLLINATIONS AI
                            </Badge>
                        </div>

                        {/* Content Scrollable */}
                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-8">
                                {questions.map((q, idx) => (
                                    <Card key={idx} className="border-0 shadow-sm rounded-[2rem] bg-white p-6 sm:p-8 hover:shadow-md transition-all border border-slate-100/50 relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-100">
                                                    {q.sort_order}
                                                </div>
                                                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                                                    {q.type === 'multiple_choice' ? 'pilgan' : 'esai'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" className="h-9 rounded-xl text-blue-600 font-bold gap-2 hover:bg-blue-50">
                                                    <Edit3 className="h-4 w-4" /> Edit
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-9 rounded-xl text-rose-500 font-bold gap-2 hover:bg-rose-50">
                                                    <Trash2 className="h-4 w-4" /> Hapus
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Gambar Ilustrasi - Muncul Otomatis jika URL tersedia */}
                                            {q.image_url && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-inner border border-slate-100 mb-4 bg-slate-50"
                                                >
                                                    <Image 
                                                        src={q.image_url} 
                                                        alt="Ilustrasi Soal" 
                                                        fill 
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                </motion.div>
                                            )}

                                            <div className="text-slate-800 font-bold text-lg sm:text-xl leading-relaxed">
                                                <MathText content={q.question} className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')} />
                                            </div>

                                            {/* Media & Ilustrasi Section */}
                                            <div className="p-5 rounded-3xl bg-indigo-50/40 border border-indigo-100/50 space-y-4">
                                                <div className="flex items-center gap-2 text-indigo-900 font-black text-[10px] uppercase tracking-widest">
                                                    <FileImage className="h-4 w-4" />
                                                    <span>Media & Ilustrasi (Free & Unlimited)</span>
                                                </div>
                                                
                                                <div className="flex flex-col gap-3">
                                                    <div className="relative">
                                                        <PencilLine className="absolute left-3 top-3 h-4 w-4 text-indigo-300" />
                                                        <Textarea 
                                                            placeholder="Deskripsikan gambar yang diinginkan..."
                                                            className="pl-10 rounded-2xl bg-white border-indigo-100 text-xs font-medium min-h-[60px] resize-none focus:ring-indigo-500/20 shadow-sm"
                                                            value={q.image_prompt || ""}
                                                            onChange={(e) => handleUpdatePrompt(idx, e.target.value)}
                                                        />
                                                    </div>
                                                    
                                                    <Button 
                                                        onClick={() => handleGenerateImage(idx, q.image_prompt || "")}
                                                        disabled={imageLoadingIdx === idx || (!q.image_prompt)}
                                                        className="w-full rounded-2xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
                                                    >
                                                        {imageLoadingIdx === idx ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="h-4 w-4" />
                                                        )}
                                                        {q.image_url ? "Ganti Gambar (Seed Baru)" : "Generate Ilustrasi AI"}
                                                    </Button>
                                                </div>
                                            </div>

                                            {q.type === 'multiple_choice' && q.options && (
                                                <div className="grid grid-cols-1 gap-3 pl-2">
                                                    {Object.entries(q.options).sort().map(([key, val]) => (
                                                        <div key={key} className={cn(
                                                            "p-4 rounded-2xl border transition-all flex items-center gap-4 group",
                                                            q.answer === key 
                                                                ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10 shadow-sm" 
                                                                : "bg-slate-50/30 border-slate-100 hover:border-indigo-100"
                                                        )}>
                                                            <span className={cn(
                                                                "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm shrink-0",
                                                                q.answer === key ? "bg-emerald-500 text-white" : "bg-white text-slate-400 border border-slate-100 group-hover:border-indigo-200 group-hover:text-indigo-600"
                                                            )}>{key}</span>
                                                            <div className={cn(
                                                                "text-sm sm:text-base font-semibold",
                                                                q.answer === key ? "text-emerald-800" : "text-slate-600"
                                                            )}>
                                                                <MathText content={val} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-8 space-y-4">
                                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                                                    <div className="p-1.5 rounded-full bg-emerald-500 text-white shadow-sm">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    </div>
                                                    <p className="text-sm font-black text-emerald-800 uppercase tracking-tight">Jawaban: <span className="ml-1 text-emerald-600">{q.answer}</span></p>
                                                </div>
                                                
                                                <div className="relative p-6 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden group/pembahasan">
                                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/pembahasan:opacity-20 transition-opacity">
                                                        <Lightbulb className="h-12 w-12 text-indigo-600" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">Pembahasan</Badge>
                                                    </div>
                                                    <div className="text-sm text-slate-600 font-medium leading-relaxed italic relative z-10">
                                                        <MathText content={q.explanation} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Footer Buttons */}
                        <div className="p-6 bg-white border-t shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.05)] space-y-4">
                            <p className="text-center font-bold text-slate-500 text-sm">
                                <span className="text-indigo-600">{questions.length}</span> soal akan disimpan ke Bank Soal
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest gap-2 shadow-sm"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Kembali
                                </Button>
                                <Button 
                                    onClick={handleSaveToBankSoal} 
                                    disabled={saving}
                                    className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    Simpan ke Bank Soal
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .math-container .katex-display {
                    margin: 0.5em 0;
                    overflow-x: auto;
                    overflow-y: hidden;
                }
                .math-text-render .katex-display {
                    margin: 0.5em 0;
                    overflow-x: auto;
                    overflow-y: hidden;
                }
            `}</style>
        </div>
    );
}
