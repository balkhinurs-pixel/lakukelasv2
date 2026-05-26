"use client";

import * as React from "react";
import { 
    Sparkles, 
    Loader2, 
    Save, 
    Database, 
    RefreshCw,
    ArrowRight,
    Wand2,
    Settings2,
    CheckCircle2,
    BookOpen,
    FileText,
    FileUp,
    ImageIcon,
    X,
    Cpu,
    ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
    DialogDescription,
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

const MathText = ({ content, className }: { content: string, className?: string }) => {
  if (!content) return null;
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
  
  return (
    <div className={cn("math-text-render w-full overflow-hidden", className)}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return <div key={i} className="my-4 overflow-x-auto"><BlockMath math={part.slice(2, -2)} /></div>;
        if (part.startsWith('\\(')) return <InlineMath key={i} math={part.slice(2, -2)} />;
        
        return (
            <ReactMarkdown 
                key={i} 
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="w-full border-collapse border border-slate-200 text-sm" {...props} /></div>,
                    th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 p-2 font-bold" {...props} />,
                    td: ({node, ...props}) => <td className="border border-slate-200 p-2" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-xl font-black uppercase text-indigo-700 mt-8 mb-4 border-b pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-600" {...props} />
                }}
            >
                {part}
            </ReactMarkdown>
        );
      })}
    </div>
  );
};

export default function GenerateMateriClient({ 
    classes, 
    subjects,
    driveIntegration,
    userProvider
}: { 
    classes: Class[], 
    subjects: Subject[],
    driveIntegration: GoogleDriveIntegration | null,
    userProvider?: string
}) {
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [generatedResult, setGeneratedResult] = React.useState<{ title: string, content: string } | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [countdown, setCountdown] = React.useState(30);

    const [isErrorOpen, setIsErrorOpen] = React.useState(false);
    const [errorType, setErrorType] = React.useState<AiErrorType>(null);
    const [errorMsg, setErrorMsg] = React.useState("");
    
    const fileInputRef = React.useRef<HTMLInputElement>(null);
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

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!form.topic) {
            toast({ title: "Topik Kosong", description: "Mohon isi materi pokok atau bab.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setGeneratedResult(null);
        setCountdown(30);
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
            router.push('/dashboard/materials');
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
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Sumber (Opsional)</Label>
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
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                    <Select value={form.kelas} onValueChange={v => setForm({...form, kelas: v})}>
                                        <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {getClassOptions(form.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mata Pelajaran</Label>
                                <Select value={form.subject} onValueChange={v => setForm({...form, subject: v})}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {(mapelByJenjang[form.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Materi Pokok / Bab</Label>
                                <Input placeholder="e.g. Hukum Newton, Tajwid" className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-inner" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} required />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tingkat Kedalaman</Label>
                                <Select value={form.depth} onValueChange={(v: any) => setForm({...form, depth: v})}>
                                    <SelectTrigger className="rounded-xl bg-slate-50 border-0 h-11 font-bold shadow-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="dasar" className="font-bold">Dasar (Pengenalan)</SelectItem>
                                        <SelectItem value="menengah" className="font-bold">Menengah (Standar)</SelectItem>
                                        <SelectItem value="mendalam" className="font-bold">Mendalam (Analisis)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Instruksi Khusus (Opsional)</Label>
                                <Textarea placeholder="e.g. Fokus pada rumus percepatan..." className="rounded-2xl bg-slate-50 border-0 min-h-[100px] font-medium resize-none shadow-inner" value={form.instruction} onChange={e => setForm({...form, instruction: e.target.value})} />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 p-6 border-t">
                            <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}
                                Generate Materi
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card className="lg:col-span-3 border-0 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden min-h-[600px] flex flex-col items-center justify-center text-center px-10">
                    <div className="p-16 rounded-[5rem] bg-slate-100 mb-8 shadow-inner group hover:bg-indigo-50 transition-all duration-700">
                        <BookOpen className="h-24 w-24 text-slate-200 group-hover:text-indigo-200 transition-all duration-700 group-hover:rotate-12" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">AI Content Summarizer</h3>
                    <p className="text-slate-400 font-bold text-sm max-w-sm mt-4 leading-relaxed">
                        Konfigurasi bab materi di samping, atau unggah file PDF/Foto buku paket Anda. AI akan merangkumnya secara sistematis untuk bahan ajar siswa.
                    </p>
                </Card>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-white dialog-content-mobile mobile-safe-area">
                    <div className="flex flex-col h-[90vh] relative">
                        {loading && !generatedResult && (
                            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-2xl animate-in fade-in duration-700">
                                <div className="relative p-10 sm:p-14 rounded-[3.5rem] bg-white/80 border border-white/40 shadow-2xl flex flex-col items-center text-center gap-8">
                                     <LottieAiProcess size={220} />
                                     <div className="space-y-2">
                                        <p className="text-3xl font-black text-slate-900 tracking-tight uppercase">Menyusun Materi...</p>
                                        <p className="text-xl font-mono font-black text-indigo-600">{countdown}s</p>
                                     </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 text-white shrink-0">
                            <div className="flex flex-col items-center text-center">
                                <DialogHeader><DialogTitle className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">Pratinjau Materi AI</DialogTitle></DialogHeader>
                                <p className="text-indigo-100 font-bold text-xs uppercase tracking-[0.2em] mt-3">{form.subject} • {form.topic}</p>
                            </div>
                        </div>

                        {/* Mobile Swipeable Preview Container */}
                        <div className="flex-1 overflow-x-auto overflow-y-auto px-4 py-6 sm:px-10 sm:py-10 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {generatedResult ? (
                                    <motion.div 
                                        key="result"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-full flex justify-start lg:justify-center"
                                    >
                                        <div 
                                            className="bg-white p-8 sm:p-12 shadow-sm border rounded-2xl shrink-0" 
                                            style={{ 
                                                width: '210mm', 
                                                minHeight: '297mm',
                                                fontFamily: '"Times New Roman", Times, serif'
                                            }}
                                        >
                                            <h1 className="text-3xl font-black border-b-4 border-indigo-600 pb-4 mb-8 text-indigo-700 uppercase tracking-tight text-center">{generatedResult.title}</h1>
                                            <MathText content={generatedResult.content} />
                                        </div>
                                    </motion.div>
                                ) : !loading ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-30 w-full">
                                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                                    </div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        <div className="p-6 sm:p-10 bg-slate-50 border-t flex flex-col sm:flex-row gap-4 shrink-0 pb-safe">
                            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="flex-1 h-16 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest gap-2">
                                <ArrowLeft className="h-5 w-5" /> Kembali
                            </Button>
                            <Button onClick={handleSaveToDrive} disabled={saving || loading || !generatedResult} className="flex-[2] h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-emerald-200">
                                {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />} Simpan ke Google Drive
                            </Button>
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
