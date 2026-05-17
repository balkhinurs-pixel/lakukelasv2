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
    ArrowRight
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
                    <CardContent className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang</Label>
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
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mapel</Label>
                                <Select value={form.subject} onValueChange={(v) => setForm({...form, subject: v})}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11"><SelectValue placeholder="Mapel" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        {subjects.map(s => <SelectItem key={s.id} value={s.name} className="font-bold">{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                <Input 
                                    placeholder="e.g. 7-A" 
                                    className="rounded-xl bg-slate-50 border-0 h-11 font-bold"
                                    value={form.kelas}
                                    onChange={(e) => setForm({...form, kelas: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Bab / Topik Utama</Label>
                            <Input 
                                placeholder="Contoh: Persamaan Linear" 
                                className="rounded-xl bg-slate-50 border-0 h-11 font-bold"
                                value={form.topic}
                                onChange={(e) => setForm({...form, topic: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipe Soal</Label>
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
                                        <SelectItem value="mudah" className="font-bold">Mudah</SelectItem>
                                        <SelectItem value="sedang" className="font-bold">Sedang</SelectItem>
                                        <SelectItem value="sulit" className="font-bold">Sulit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Instruksi Guru (Opsional)</Label>
                            <Textarea 
                                placeholder="e.g. Fokus pada soal cerita atau soal tingkat tinggi (HOTS)..." 
                                className="rounded-2xl bg-slate-50 border-0 min-h-[80px] font-medium"
                                value={form.instruction}
                                onChange={(e) => setForm({...form, instruction: e.target.value})}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 p-6 border-t">
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 text-lg font-black uppercase tracking-widest gap-3"
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
                            <CardTitle className="text-xl font-black">Pratinjau Soal</CardTitle>
                        </div>
                        {questions.length > 0 && (
                            <Button className="rounded-xl h-10 bg-indigo-600 text-white font-bold gap-2">
                                <Save className="h-4 w-4" /> Simpan Draft
                            </Button>
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
                                    {questions.map((q, idx) => (
                                        <div key={idx} className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-indigo-100 transition-colors shadow-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0">
                                                    {q.sort_order}
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div className="font-bold text-slate-900 text-lg leading-relaxed">
                                                        {q.question.includes('\\(') ? (
                                                            <span>Rendering Matematika... (KaTeX)</span>
                                                        ) : q.question}
                                                    </div>

                                                    {q.type === 'multiple_choice' && q.options && (
                                                        <div className="grid grid-cols-1 gap-2 pl-2">
                                                            {Object.entries(q.options).map(([key, val]) => (
                                                                <div key={key} className={cn(
                                                                    "p-3 rounded-xl border flex items-center gap-3 transition-colors",
                                                                    q.answer === key ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
                                                                )}>
                                                                    <span className={cn(
                                                                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                                                                        q.answer === key ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                                                    )}>{key}</span>
                                                                    <span className="text-sm font-medium">{val}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 space-y-2">
                                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                                                            <Target className="h-3 w-3" /> Pembahasan
                                                        </div>
                                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{q.explanation}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                                    <div className="p-10 rounded-[3rem] bg-slate-50 mb-6">
                                        <Wand2 className="h-20 w-20 text-slate-200" />
                                    </div>
                                    <h3 className="text-2xl font-black">AI Soal Siap Membantu</h3>
                                    <p className="text-sm font-bold mt-2">Lengkapi data di samping untuk memulai.</p>
                                </div>
                            )}
                        </AnimatePresence>

                        {loading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                                <div className="text-center">
                                    <p className="text-lg font-black uppercase">Menyusun Pertanyaan...</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Menggunakan Model Gemini 2.5 Flash</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}