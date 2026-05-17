"use client";

import * as React from "react";
import { 
    Sparkles, 
    Wand2, 
    FileText, 
    PlusCircle, 
    BookOpen, 
    GraduationCap, 
    Loader2, 
    Save, 
    Globe, 
    CheckCircle2,
    Database,
    Share2,
    ChevronRight,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateContentAction } from "@/lib/actions/ai";
import { saveAiDocumentToDrive } from "@/lib/actions/google-drive";
import type { Class, Subject, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LottieWelcome } from "@/components/ui/lottie-welcome";

export default function AiPembelajaranClient({ 
    classes, 
    subjects, 
    profile 
}: { 
    classes: Class[], 
    subjects: Subject[], 
    profile: Profile 
}) {
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [generatedResult, setGeneratedResult] = React.useState<{ title: string, content: string } | null>(null);

    const [form, setForm] = React.useState({
        type: 'rpp' as 'rpp' | 'soal',
        class_id: '',
        subject_id: '',
        topic: '',
        count: 10,
        additional: ''
    });

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.topic || !form.class_id || !form.subject_id) {
            toast({ title: "Data Belum Lengkap", description: "Harap isi kelas, mata pelajaran, dan materi pokok.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setGeneratedResult(null);

        const selectedClass = classes.find(c => c.id === form.class_id)?.name || "";
        const selectedSubject = subjects.find(s => s.id === form.subject_id)?.name || "";

        const result = await generateContentAction({
            type: form.type,
            classLevel: selectedClass,
            subject: selectedSubject,
            topic: form.topic,
            count: form.count,
            additionalInfo: form.additional
        });

        if (result.success && result.data) {
            setGeneratedResult(result.data);
            toast({ title: "Berhasil!", description: "Dokumen AI telah dihasilkan. Anda bisa mereview lalu menyimpannya." });
        } else {
            toast({ title: "Gagal", description: result.error || "Terjadi kesalahan saat memproses permintaan AI.", variant: "destructive" });
        }
        setLoading(false);
    };

    const handleSaveToDrive = async () => {
        if (!generatedResult) return;
        setSaving(true);
        
        const result = await saveAiDocumentToDrive(
            generatedResult.title, 
            generatedResult.content, 
            form.type
        );

        if (result.success) {
            toast({ 
                title: "Tersimpan di Drive!", 
                description: "Dokumen telah masuk ke folder LakuKelas AI di Google Drive Anda.",
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
        <div className="space-y-8 pb-20">
            {/* Header Indigo Premium */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-8 sm:p-10 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-100 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">
                            <span>✨</span>
                            <span>Asisten AI Guru</span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                                AI Pembelajaran
                            </h1>
                            <p className="text-indigo-100/80 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
                                Buat RPP, Modul Ajar, dan Bank Soal berkualitas tinggi dalam hitungan detik. Cerdas, efisien, dan tersimpan aman di Google Drive.
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:block w-48 h-48 lg:w-56 lg:h-56 shrink-0">
                         <LottieWelcome />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-1">
                {/* Form Input */}
                <Card className="lg:col-span-2 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden h-fit">
                    <form onSubmit={handleGenerate}>
                        <CardHeader className="bg-slate-50/50 border-b p-6">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Wand2 className="h-5 w-5 text-indigo-600" />
                                Konfigurasi AI
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenis Dokumen</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setForm({ ...form, type: 'rpp' })}
                                        className={cn(
                                            "p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                            form.type === 'rpp' ? "border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-inner" : "border-slate-100 text-slate-400"
                                        )}
                                    >
                                        <FileText className="h-6 w-6" />
                                        <span className="text-xs font-black uppercase tracking-tight">RPP Otomatis</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setForm({ ...form, type: 'soal' })}
                                        className={cn(
                                            "p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                            form.type === 'soal' ? "border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-inner" : "border-slate-100 text-slate-400"
                                        )}
                                    >
                                        <PlusCircle className="h-6 w-6" />
                                        <span className="text-xs font-black uppercase tracking-tight">Bank Soal AI</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.class_id} onValueChange={(val) => setForm({ ...form, class_id: val })} required>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2">
                                            <SelectValue placeholder="Pilih Kelas" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {classes.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mapel</Label>
                                    <Select value={form.subject_id} onValueChange={(val) => setForm({ ...form, subject_id: val })} required>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2">
                                            <SelectValue placeholder="Pilih Mapel" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {subjects.map(s => <SelectItem key={s.id} value={s.id} className="font-bold">{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pokok / Bab</Label>
                                <Input 
                                    placeholder="e.g. Sistem Pencernaan Manusia"
                                    className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 font-bold"
                                    value={form.topic}
                                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                                    required
                                />
                            </div>

                            {form.type === 'soal' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jumlah Soal</Label>
                                    <Input 
                                        type="number"
                                        className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 font-bold"
                                        value={form.count}
                                        onChange={(e) => setForm({ ...form, count: parseInt(e.target.value) })}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kebutuhan Khusus (Opsional)</Label>
                                <Textarea 
                                    placeholder="e.g. Tekankan pada penggunaan media digital atau fokus pada soal HOTS."
                                    className="min-h-[100px] rounded-2xl bg-slate-50 border-0 focus:ring-2 font-medium"
                                    value={form.additional}
                                    onChange={(e) => setForm({ ...form, additional: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 text-lg font-black uppercase tracking-widest gap-3"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                                Mulai Generate AI
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Preview Result */}
                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col">
                    <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl font-black tracking-tight">Preview Dokumen</CardTitle>
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
                    <CardContent className="flex-grow p-0 relative">
                        <AnimatePresence mode="wait">
                            {generatedResult ? (
                                <motion.div 
                                    key="result"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-8 h-full"
                                >
                                    <div className="prose prose-slate max-w-none dark:prose-invert">
                                        <h1 className="text-2xl font-black mb-6 border-b pb-4 text-slate-800 uppercase tracking-tight">{generatedResult.title}</h1>
                                        <div className="whitespace-pre-wrap font-medium text-slate-600 leading-relaxed text-sm">
                                            {generatedResult.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center p-12 text-center"
                                >
                                    <div className="p-10 rounded-[3rem] bg-slate-50 shadow-inner mb-8 group transition-all hover:bg-indigo-50">
                                        <Sparkles className="h-20 w-20 text-slate-200 group-hover:text-indigo-200 transition-colors" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Siap Bekerja</h3>
                                    <p className="text-slate-400 font-bold text-sm max-w-xs mt-3 leading-relaxed">
                                        Konfigurasi input di samping, lalu klik tombol Generate untuk mulai melihat keajaiban.
                                    </p>
                                    <div className="mt-8 flex items-center gap-4 opacity-30 select-none">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black">1</div>
                                            <span className="text-[9px] font-black uppercase">Input</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4" />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black">2</div>
                                            <span className="text-[9px] font-black uppercase">Preview</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4" />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-indigo-600">3</div>
                                            <span className="text-[9px] font-black uppercase">Simpan</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 relative z-10" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-black text-slate-900 tracking-tight uppercase">AI Sedang Merumuskan...</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Mohon tunggu beberapa detik</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* AI Disclaimer Section */}
            <div className="max-w-3xl mx-auto px-4">
                <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-start gap-4">
                    <Sparkles className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Tips Penggunaan AI</p>
                        <p className="text-xs text-amber-800/80 font-medium leading-relaxed">
                            Meskipun AI LakuKelas sangat cerdas, hasil yang diberikan tetap membutuhkan peninjauan ulang (human in the loop). Silakan periksa kesesuaian konten dengan konteks sekolah Anda sebelum menyimpannya ke Drive.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
