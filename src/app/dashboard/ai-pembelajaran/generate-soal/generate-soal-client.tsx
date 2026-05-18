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
    X,
    Trash2,
    Edit3,
    Bot,
    Image as ImageIcon,
    ClipboardCheck,
    FileImage,
    FileText,
    FileUp,
    Settings2,
    Layers,
    ChevronDown,
    Eye
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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- MathText Component for LaTeX & Arabic Rendering ---
const MathText = ({ content, className }: { content: string, className?: string }) => {
  if (!content) return null;
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
  return (
    <div className={cn("math-text-render", className)}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return <BlockMath key={i} math={part.slice(2, -2)} />;
        if (part.startsWith('\\(')) return <InlineMath key={i} math={part.slice(2, -2)} />;
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </div>
  );
};

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
    
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = React.useState<{ name: string, uri: string, mime: string } | null>(null);

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
        count: 5, // Locked to 5 for stability
        difficulty: 'sedang'
    });

    const handleJenjangChange = (val: string) => {
        const classOpts = getClassOptions(val);
        const mapelOpts = mapelByJenjang[val] || [];
        
        setForm(prev => ({
            ...prev,
            jenjang: val,
            kelas: classOpts[0] || prev.kelas,
            subject: mapelOpts[0] || prev.subject
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // 3MB Limit for Vercel Free Tier stability (Base64 adds overhead)
        const MAX_FILE_SIZE = 3 * 1024 * 1024; 
        if (file.size > MAX_FILE_SIZE) {
            toast({ 
                title: "File Terlalu Besar", 
                description: "Maksimal ukuran file adalah 3MB agar proses generate tetap stabil.", 
                variant: "destructive" 
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedFile({ 
                name: file.name, 
                uri: event.target?.result as string, 
                mime: file.type 
            });
            toast({ title: "Materi Terunggah", description: `${file.name} siap diproses oleh AI.` });
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.topic || !form.subject || !form.kelas) {
            toast({ title: "Data Belum Lengkap", description: "Mohon isi Topik, Mapel, dan Kelas.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            // Force count to 5 regardless of any previous state
            const result = await generateQuestionsAction({ 
                ...form, 
                count: 5,
                mediaDataUri: uploadedFile?.uri, 
                mediaMimeType: uploadedFile?.mime 
            });
            
            if (result.success && result.data) {
                setQuestions(result.data.questions);
                setIsPreviewOpen(true);
                toast({ title: "Berhasil", description: `5 butir soal telah dihasilkan.` });
            } else {
                toast({ title: "Gagal Generate", description: result.error, variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Error", description: "Terjadi kesalahan sistem.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateImage = async (idx: number, prompt: string) => {
        if (!prompt) {
            toast({ title: "Prompt Kosong", description: "Tuliskan deskripsi gambar yang ingin dibuat.", variant: "destructive" });
            return;
        }
        setImageLoadingIdx(idx);
        const result = await generateQuestionImageAction(prompt);
        if (result.success && result.url) {
            const updatedQuestions = [...questions];
            updatedQuestions[idx].image_url = result.url;
            setQuestions(updatedQuestions);
            toast({ title: "Gambar Siap", description: "Ilustrasi AI telah ditambahkan." });
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
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
            toast({ title: "Berhasil Disimpan", description: "Soal-soal telah masuk ke Bank Soal Anda." });
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
                {/* 1. Sidebar Konfigurasi */}
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                                Konfigurasi Soal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar pr-4">
                            
                            {/* Opsi: Materi Sendiri (Multimodal) */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pendukung (Opsional)</Label>
                                <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf, image/*" onChange={handleFileChange} />
                                {uploadedFile ? (
                                    <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-between group animate-in zoom-in-95 duration-200 shadow-inner">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {uploadedFile.mime.includes('pdf') ? <FileText className="h-5 w-5 text-indigo-600" /> : <ImageIcon className="h-5 w-5 text-indigo-600" />}
                                            <p className="text-xs font-black text-indigo-700 truncate">{uploadedFile.name}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50" onClick={() => setUploadedFile(null)}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-6 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-600 group">
                                        <FileUp className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Unggah PDF / Foto Buku</p>
                                        <p className="text-[9px] font-medium opacity-60">Max 3MB • AI akan membaca materi Anda</p>
                                    </button>
                                )}
                            </div>

                            {/* Section: Jenjang & Semester */}
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
                                    <Select value={form.semester} onValueChange={(v) => setForm({...form, semester: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            <SelectItem value="Ganjil" className="font-bold">Ganjil</SelectItem>
                                            <SelectItem value="Genap" className="font-bold">Genap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Section: Mapel & Kelas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mata Pelajaran</Label>
                                    <Select value={form.subject} onValueChange={(v) => setForm({...form, subject: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue placeholder="Pilih Mapel" /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.kelas} onValueChange={(v) => setForm({...form, kelas: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Section: Kurikulum & Tujuan */}
                            <div className="space-y-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kurikulum</Label>
                                    <Select value={form.curriculum} onValueChange={(v) => setForm({...form, curriculum: v})}>
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
                                    <Select value={form.assessment_purpose} onValueChange={(v) => setForm({...form, assessment_purpose: v})}>
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

                            {/* Section: Materi Pokok */}
                            <div className="space-y-4 pt-2 border-t border-slate-50">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Topik / Materi Pokok</Label>
                                    <Input 
                                        placeholder="Misal: Sistem Tata Surya" 
                                        className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner" 
                                        value={form.topic} 
                                        onChange={(e) => setForm({...form, topic: e.target.value})} 
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sub-topik (Opsional)</Label>
                                    <Input 
                                        placeholder="Misal: Karakteristik Planet" 
                                        className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner" 
                                        value={form.subtopic} 
                                        onChange={(e) => setForm({...form, subtopic: e.target.value})} 
                                    />
                                </div>
                            </div>

                            {/* Section: Konfigurasi AI Lanjut */}
                            <div className="space-y-4 pt-2 border-t border-slate-50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Level Kognitif</Label>
                                        <Select value={form.cognitive_level} onValueChange={(v) => setForm({...form, cognitive_level: v})}>
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
                                        <Select value={form.difficulty} onValueChange={(v: any) => setForm({...form, difficulty: v})}>
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
                                        <Select value={form.question_type} onValueChange={(v: any) => setForm({...form, question_type: v})}>
                                            <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                                <SelectItem value="multiple_choice" className="font-bold">Pilihan Ganda</SelectItem>
                                                <SelectItem value="essay" className="font-bold">Esai / Uraian</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jumlah Soal</Label>
                                        <div className="h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200">
                                            5 Butir (Locked)
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Instruksi Khusus (Opsional)</Label>
                                    <Textarea 
                                        placeholder="Misal: Berikan soal yang berbasis lingkungan, gunakan bahasa santun..." 
                                        className="rounded-2xl bg-slate-50 border-0 min-h-[80px] font-medium resize-none shadow-inner" 
                                        value={form.instruction} 
                                        onChange={(e) => setForm({...form, instruction: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 text-lg font-black uppercase tracking-widest gap-3 transition-all active:scale-95">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Zap className="h-6 w-6" />}
                                Generate Sekarang
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* 2. Placeholder Content / Tampilan Utama */}
                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col items-center justify-center text-center px-10">
                    <div className="p-16 rounded-[5rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                        <Wand2 className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Asisten AI Siap Membantu</h3>
                    <p className="text-slate-400 font-bold text-sm max-w-sm mt-4 leading-relaxed">
                        Pilih jenis soal dan topik di samping. AI akan merumuskan 5 butir soal berkualitas tinggi dalam hitungan detik.
                    </p>
                    <div className="mt-10 flex gap-4">
                        <Badge variant="outline" className="px-4 py-2 rounded-xl border-slate-100 text-slate-400 font-bold">
                            <ClipboardCheck className="w-3 h-3 mr-2" /> Mandiri
                        </Badge>
                        <Badge variant="outline" className="px-4 py-2 rounded-xl border-indigo-100 text-indigo-400 font-bold">
                            <Bot className="w-3 h-3 mr-2" /> AI Intelligence
                        </Badge>
                    </div>
                </Card>
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse scale-150" />
                            <div className="relative z-10 p-10 rounded-[3rem] bg-white shadow-2xl border border-indigo-50">
                                <Loader2 className="h-20 w-20 animate-spin text-indigo-600 mx-auto" />
                                <div className="mt-8 space-y-2">
                                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Merumuskan 5 Butir Soal...</p>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{form.subject} — Kelas {form.kelas}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-[#F8FAFF]">
                    <div className="flex flex-col h-[90vh]">
                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white relative shrink-0">
                            <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"><X className="h-5 w-5" /></button>
                            <div className="flex items-center gap-5">
                                <div className="p-4 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/20 shadow-xl"><Eye className="h-8 w-8" /></div>
                                <div>
                                    <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight">Review Hasil AI</DialogTitle>
                                    <p className="text-indigo-100 font-bold text-sm sm:text-base mt-1">{form.assessment_purpose} — {form.subject} Kelas {form.kelas}</p>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-8 pb-10">
                                {questions.map((q, idx) => (
                                    <Card key={idx} className="border-0 shadow-sm rounded-[2rem] bg-white p-6 sm:p-8 hover:shadow-md transition-all border border-slate-100/50">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-100">{q.sort_order}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge className="bg-indigo-50 text-indigo-700 border-0 px-3 py-1 font-black text-[10px] uppercase tracking-widest">{q.type === 'multiple_choice' ? 'PG' : 'Esai'}</Badge>
                                                    <Badge variant="outline" className="border-slate-100 text-slate-400 font-bold text-[9px] uppercase">{q.cognitive_level || 'Kognitif'}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {q.image_url && (
                                                <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-inner border border-slate-100 mb-4 bg-slate-50">
                                                    <Image src={q.image_url} alt="Ilustrasi" fill className="object-contain" unoptimized />
                                                </div>
                                            )}

                                            <div className="text-slate-800 font-bold text-lg sm:text-xl leading-relaxed">
                                                <MathText content={q.question} className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')} />
                                            </div>

                                            {q.type === 'multiple_choice' && q.options && (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {Object.entries(q.options).sort().map(([key, val]) => (
                                                        <div key={key} className={cn("p-4 rounded-2xl border flex items-center gap-4 group", q.answer === key ? "bg-emerald-50 border-emerald-200" : "bg-slate-50/30 border-slate-100")}>
                                                            <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black", q.answer === key ? "bg-emerald-500 text-white" : "bg-white text-slate-400")}>{key}</span>
                                                            <div className="text-sm font-semibold"><MathText content={val} /></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-8 space-y-4">
                                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    <p className="text-sm font-black text-emerald-800 uppercase tracking-tight">Kunci: <span className="ml-1 text-emerald-600">{q.answer}</span></p>
                                                </div>
                                                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-sm text-slate-600 font-medium italic"><MathText content={q.explanation} /></div>
                                            </div>

                                            <div className="p-5 rounded-3xl bg-indigo-50/40 border border-indigo-100/50 space-y-4">
                                                <div className="flex items-center gap-2 text-indigo-900 font-black text-[10px] uppercase tracking-widest"><FileImage className="h-4 w-4" /><span>Kebutuhan Media</span></div>
                                                <div className="flex flex-col gap-3">
                                                    <Textarea 
                                                        placeholder="Deskripsikan gambar pendukung yang ingin dibuat oleh AI..." 
                                                        className="rounded-2xl bg-white border-indigo-100 text-xs font-medium min-h-[60px] resize-none focus:ring-2 focus:ring-indigo-500/20" 
                                                        value={q.image_prompt || ""} 
                                                        onChange={(e) => handleUpdatePrompt(idx, e.target.value)} 
                                                    />
                                                    <Button 
                                                        onClick={() => handleGenerateImage(idx, q.image_prompt || "")} 
                                                        disabled={imageLoadingIdx === idx || (!q.image_prompt)} 
                                                        className="w-full rounded-2xl h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-indigo-100"
                                                    >
                                                        {imageLoadingIdx === idx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} 
                                                        Generate Gambar AI
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-white border-t flex flex-col sm:flex-row gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest gap-2"><ArrowLeft className="h-4 w-4" /> Edit Parameter</Button>
                            <Button onClick={handleSaveToBankSoal} disabled={saving} className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl shadow-emerald-100">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />} Konfirmasi & Simpan ke Bank Soal
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .math-text-render .katex-display { margin: 0.5em 0; overflow-x: auto; overflow-y: hidden; }
            `}</style>
        </div>
    );
}
