"use client";

import * as React from "react";
import { 
    Wand2, 
    Sparkles, 
    Layers, 
    Loader2, 
    BrainCircuit, 
    CheckCircle2, 
    Save, 
    FileText,
    Target,
    Zap,
    BookOpen,
    GraduationCap,
    ArrowRight,
    Search,
    ChevronDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateQuestionsAction } from "@/lib/actions/ai";
import type { Class, Subject, GeneratedQuestion, QuestionGenerationInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export default function GenerateSoalClient({ 
    classes, 
    subjects 
}: { 
    classes: Class[], 
    subjects: Subject[] 
}) {
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [questions, setQuestions] = React.useState<GeneratedQuestion[]>([]);

    const [form, setForm] = React.useState<QuestionGenerationInput>({
        jenjang: 'SMP/MTs',
        kelas: '',
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
            toast({ title: "Soal Berhasil Dibuat", description: `${result.data.questions.length} soal baru telah dihasilkan.` });
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    };

    return (
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
                        {/* Row 1: Jenjang & Kurikulum */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang Pendidikan</Label>
                                <Select value={form.jenjang} onValueChange={(v) => setForm({...form, jenjang: v})}>
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
                                        <SelectItem value="K-13" className="font-bold">K-13</SelectItem>
                                        <SelectItem value="Kurikulum Kemenag" className="font-bold">Kemenag</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 2: Mapel & Kelas */}
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
                                <Input 
                                    placeholder="e.g. 7, 8, 9, atau 10-A" 
                                    className="rounded-xl bg-slate-50 border-0 h-11 font-bold"
                                    value={form.kelas}
                                    onChange={(e) => setForm({...form, kelas: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Row 3: Semester & Tujuan */}
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

                        {/* Row 4: Topik & Sub-topik */}
                        <div className="space-y-4 pt-2 border-t border-slate-50">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pokok / Bab</Label>
                                <Input 
                                    placeholder="Contoh: Persamaan Linear Satu Variabel" 
                                    className="rounded-xl bg-slate-50 border-0 h-11 font-bold"
                                    value={form.topic}
                                    onChange={(e) => setForm({...form, topic: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sub-topik / Spesifik (Opsional)</Label>
                                <Input 
                                    placeholder="Contoh: Metode Eliminasi" 
                                    className="rounded-xl bg-slate-50 border-0 h-11 font-bold"
                                    value={form.subtopic}
                                    onChange={(e) => setForm({...form, subtopic: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Row 5: Kognitif & Mode */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Level Kognitif</Label>
                                <Select value={form.cognitive_level} onValueChange={(v) => setForm({...form, cognitive_level: v})}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="Variatif" className="font-bold">Campuran</SelectItem>
                                        <SelectItem value="C1 - Mengingat" className="font-bold">C1 - Mengingat</SelectItem>
                                        <SelectItem value="C2 - Memahami" className="font-bold">C2 - Memahami</SelectItem>
                                        <SelectItem value="C3 - Menerapkan" className="font-bold">C3 - Menerapkan</SelectItem>
                                        <SelectItem value="C4 - Menganalisis" className="font-bold">C4 - Menganalisis</SelectItem>
                                        <SelectItem value="C5 - Mengevaluasi" className="font-bold">C5 - Mengevaluasi</SelectItem>
                                        <SelectItem value="C6 - Mencipta" className="font-bold">C6 - Mencipta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mode Soal</Label>
                                <Select value={form.mode} onValueChange={(v) => setForm({...form, mode: v})}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="Reguler" className="font-bold">Reguler</SelectItem>
                                        <SelectItem value="HOTS" className="font-bold">HOTS (Berpikir Kritis)</SelectItem>
                                        <SelectItem value="Remedial" className="font-bold">Sederhana (Remedial)</SelectItem>
                                        <SelectItem value="Pengayaan" className="font-bold">Pengayaan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Row 6: Jenis & Kesulitan */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenis Soal</Label>
                                <Select value={form.question_type} onValueChange={(v: any) => setForm({...form, question_type: v})}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="multiple_choice" className="font-bold">Pilihan Ganda</SelectItem>
                                        <SelectItem value="essay" className="font-bold">Esai / Uraian</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tingkat Kesulitan</Label>
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
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ringkasan Materi / Instruksi Khusus</Label>
                            <Textarea 
                                placeholder="Masukkan ringkasan materi atau instruksi khusus untuk AI (maks 2.000 karakter)..." 
                                className="rounded-2xl bg-slate-50 border-0 min-h-[100px] font-medium resize-none focus:ring-2 focus:ring-indigo-500/20"
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

            {/* Preview Section */}
            <div className="lg:col-span-3 space-y-6">
                <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col">
                    <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black">Pratinjau Hasil</CardTitle>
                                {questions.length > 0 && (
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Dihasilkan dalam format terstruktur</p>
                                )}
                            </div>
                        </div>
                        {questions.length > 0 && (
                            <div className="flex gap-2">
                                <Button className="rounded-xl h-10 bg-indigo-600 text-white font-bold gap-2 shadow-lg shadow-indigo-100">
                                    <Save className="h-4 w-4" /> Simpan ke Bank Soal
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow p-6 relative">
                        <AnimatePresence mode="wait">
                            {questions.length > 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-4">
                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                                            <AlertTriangle className="h-3 w-3" /> Status: Perlu Review
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1 font-medium">Hasil AI wajib diperiksa guru sebelum disimpan ke Bank Soal.</p>
                                    </div>

                                    {questions.map((q, idx) => (
                                        <div key={idx} className="p-8 rounded-[2rem] border border-slate-100 bg-white hover:border-indigo-100 transition-all shadow-sm group">
                                            <div className="flex items-start gap-5">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    {q.sort_order}
                                                </div>
                                                <div className="flex-1 space-y-6">
                                                    <div className="font-bold text-slate-900 text-xl leading-relaxed">
                                                        {q.question.includes('\\(') || q.question.includes('\\[') ? (
                                                            <div className="math-container">
                                                                {q.question.split(/(\\\[.*?\\\]|\\\(.*?\\\))/g).map((part, i) => {
                                                                    if (part.startsWith('\\[')) return <BlockMath key={i} math={part.slice(2, -2)} />;
                                                                    if (part.startsWith('\\(')) return <InlineMath key={i} math={part.slice(2, -2)} />;
                                                                    return <span key={i}>{part}</span>;
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')}>{q.question}</p>
                                                        )}
                                                    </div>

                                                    {q.type === 'multiple_choice' && q.options && (
                                                        <div className="grid grid-cols-1 gap-3 pl-2">
                                                            {Object.entries(q.options).sort().map(([key, val]) => (
                                                                <div key={key} className={cn(
                                                                    "p-4 rounded-2xl border flex items-center gap-4 transition-all",
                                                                    q.answer === key ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
                                                                )}>
                                                                    <span className={cn(
                                                                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm",
                                                                        q.answer === key ? "bg-emerald-500 text-white" : "bg-white text-slate-400 border border-slate-100"
                                                                    )}>{key}</span>
                                                                    <span className="text-base font-semibold text-slate-700">
                                                                        {val.includes('\\(') ? <InlineMath math={val.replace(/\\\(|\\\)/g, '')} /> : val}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="mt-8 space-y-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="outline" className="rounded-lg bg-indigo-50 text-indigo-700 border-indigo-100 font-bold uppercase text-[9px] tracking-widest">{q.cognitive_level}</Badge>
                                                            <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-600 border-slate-100 font-bold uppercase text-[9px] tracking-widest">{q.difficulty}</Badge>
                                                        </div>
                                                        
                                                        <div className="p-6 rounded-[1.5rem] bg-indigo-50/30 border border-indigo-100/50 space-y-3">
                                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">
                                                                <Target className="h-3.5 w-3.5" /> Kunci & Pembahasan
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-sm font-black text-indigo-700">Kunci Jawaban: {q.answer}</p>
                                                                <p className="text-sm text-slate-600 font-medium leading-relaxed italic">{q.explanation}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-10 flex justify-center">
                                         <Button variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest border-slate-200" onClick={handleGenerate}>
                                             <Sparkles className="mr-2 h-4 w-4 text-indigo-600" />
                                             Generate 5 Soal Lagi
                                         </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-24 px-10">
                                    <div className="p-12 rounded-[4rem] bg-slate-50 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-500">
                                        <Wand2 className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 group-hover:scale-110 transition-all duration-500" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Siap Menyusun Soal</h3>
                                    <p className="text-base font-bold text-slate-400 mt-3 max-w-sm leading-relaxed">
                                        Lengkapi parameter di samping untuk membuat soal otomatis sesuai standar Kurikulum Merdeka.
                                    </p>
                                    <div className="mt-12 flex items-center gap-6 opacity-30 select-none grayscale">
                                         <div className="flex flex-col items-center gap-3">
                                             <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black">1</div>
                                             <span className="text-[10px] font-black uppercase tracking-widest">Konfigurasi</span>
                                         </div>
                                         <ArrowRight className="h-5 w-5" />
                                         <div className="flex flex-col items-center gap-3">
                                             <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black">2</div>
                                             <span className="text-[10px] font-black uppercase tracking-widest">Review AI</span>
                                         </div>
                                         <ArrowRight className="h-5 w-5" />
                                         <div className="flex flex-col items-center gap-3">
                                             <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">3</div>
                                             <span className="text-[10px] font-black uppercase tracking-widest">Bank Soal</span>
                                         </div>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>

                        {loading && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-6 p-10 text-center animate-in fade-in duration-300">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                                    <Loader2 className="h-16 w-16 animate-spin text-indigo-600 relative z-10" />
                                </div>
                                <div className="space-y-2 relative z-10">
                                    <p className="text-2xl font-black uppercase tracking-tight text-slate-900">Menyusun Pertanyaan...</p>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em]">Menggunakan Model Gemini 2.5 Flash</p>
                                    <p className="text-xs text-indigo-600/70 font-medium italic mt-4">“Tunggu sejenak, asisten AI sedang memproses parameter kurikulum Anda.”</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
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
                .math-container {
                    line-height: 1.8;
                }
                .math-container .katex-display {
                    margin: 1em 0;
                    padding: 1em;
                    background: #f8fafc;
                    border-radius: 1rem;
                    overflow-x: auto;
                    overflow-y: hidden;
                }
            `}</style>
        </div>
    );
}
