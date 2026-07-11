
"use client";

import * as React from "react";
import { 
    Search, 
    Filter, 
    PlusCircle,
    Trash2,
    Calendar,
    BookOpen,
    Users,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Download,
    X,
    Database,
    Layers,
    SquareChartGantt,
    Info,
    ChevronDown,
    ChevronUp,
    Plus,
    BrainCircuit,
    Tag,
    ArrowUp,
    ArrowRightLeft,
    Cpu,
    Zap,
    TrendingUp,
    ImageIcon,
    Sparkles,
    Image as ImageIconSize,
    Save,
    AlertCircle,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { deleteQuestionsAction, createNaskahUjianAction, generateQuestionImageAction, updateQuestionVisualAction } from "@/lib/actions/ai";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Profile, GoogleDriveIntegration, Class } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LottieSuccess } from "@/components/ui/lottie-success";
import { LottieAiProcess } from "@/components/ui/lottie-ai-process";
import { createClient } from "@/lib/supabase/client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MathText = ({ content, className }: { content: string, className?: string }) => {
  if (!content) return null;
  let processedContent = content;
  const rawMathRegex = /[\\^_]|\{[^}]*\}|[\u2200-\u22FF]/;
  if (rawMathRegex.test(content) && !content.includes('$') && !content.includes('\\(')) {
    processedContent = `\\( ${content} \\)`;
  }
  const parts = processedContent.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
  return (
    <div className={cn("math-text-render w-full overflow-hidden", className)}>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('$$') || part.startsWith('\\[')) {
          const math = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
          return (
            <div key={i} className="my-3 overflow-x-auto custom-scrollbar pb-2">
                <div className="min-w-min"><BlockMath math={math} /></div>
            </div>
          );
        }
        if (part.startsWith('$') || part.startsWith('\\(')) {
          const math = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
          return (
            <span key={i} className="inline-block max-w-full overflow-x-auto custom-scrollbar align-middle py-0.5">
               <InlineMath math={math} />
            </span>
          );
        }
        return (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}
                components={{
                    table: ({node, ...props}) => (<div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm custom-scrollbar"><table className="w-full border-collapse text-sm text-center" {...props} /></div>),
                    th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 p-3 font-black text-slate-900 uppercase tracking-tight" {...props} />,
                    td: ({node, ...props}) => <td className="border border-slate-200 p-3 font-bold text-slate-700" {...props} />,
                    tr: ({node, ...props}) => <tr className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors" {...props} />,
                    p: ({node, ...props}) => {
                        const hasJavanese = /[\uA980-\uA9DF]/.test(String(props.children || ''));
                        return <span className={cn("whitespace-pre-wrap leading-relaxed break-words", hasJavanese && "aksara-jawa")} {...props} />;
                    }
                }}
            >{part}</ReactMarkdown>
        );
      })}
    </div>
  );
};

const ITEMS_PER_PAGE = 8; 
const examTypes = ["Penilaian Harian", "Tugas Mandiri", "Sumatif Tengah Semester (STS)", "Sumatif Akhir Semester (SAS)", "Ujian Sekolah", "Try Out", "Latihan Soal"];

export default function BankSoalClient({ 
    initialQuestions,
    uniqueSubjects,
    uniqueClasses,
    uniqueTopics,
    schoolProfile,
    teacherClasses = []
}: { 
    initialQuestions: any[],
    uniqueSubjects: string[],
    uniqueClasses: string[],
    uniqueTopics: string[],
    schoolProfile: Profile | null,
    activeSchoolYearName: string,
    driveIntegration: GoogleDriveIntegration | null,
    teacherClasses: Class[]
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filterClass, setFilterClass] = React.useState("all");
    const [filterSubject, setFilterSubject] = React.useState("all");
    const [filterTopic, setFilterTopic] = React.useState("all");
    
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedQuestions, setExpandedQuestions] = React.useState<Set<string>>(new Set());
    const [selectedOrderedIds, setSelectedOrderedIds] = React.useState<string[]>([]);
    
    const [exporting, setExporting] = React.useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = React.useState(false);
    
    // Image Generation States
    const [generatingImageId, setGeneratingImageId] = React.useState<string | null>(null);
    const [tempImages, setTempImages] = React.useState<Record<string, string>>({});
    const [savingVisualId, setSavingVisualId] = React.useState<string | null>(null);

    const [naskahConfig, setNaskahConfig] = React.useState({
        title: "",
        schoolName: schoolProfile?.school_name || "",
        classId: "", 
        subject: "",
        examType: "Penilaian Harian",
        examDate: format(new Date(), 'yyyy-MM-dd'),
        examTime: "90 Menit"
    });

    React.useEffect(() => {
        if (teacherClasses.length > 0 && !naskahConfig.classId) {
            setNaskahConfig(prev => ({ ...prev, classId: teacherClasses[0].id }));
        }
    }, [teacherClasses, naskahConfig.classId]);

    const filteredQuestions = React.useMemo(() => {
        return initialQuestions.filter(q => {
            const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                q.topic.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClass = filterClass === "all" || q.kelas === filterClass;
            const matchesSubject = filterSubject === "all" || q.subject.trim().toLowerCase() === filterSubject.toLowerCase();
            const matchesTopic = filterTopic === "all" || q.topic.trim().toLowerCase() === filterTopic.toLowerCase();
            return matchesSearch && matchesClass && matchesSubject && matchesTopic;
        });
    }, [initialQuestions, searchTerm, filterClass, filterSubject, filterTopic]);

    const paginatedQuestions = React.useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredQuestions, currentPage]);

    const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);

    const toggleSelect = (id: string) => {
        setSelectedOrderedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const getSelectionIndex = (id: string) => {
        const index = selectedOrderedIds.indexOf(id);
        return index !== -1 ? index + 1 : null;
    };

    const toggleDiscussion = (id: string) => {
        setExpandedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleGenerateImage = async (question: any) => {
        setGeneratingImageId(question.id);
        const result = await generateQuestionImageAction(question.id, question.question_text, question.subject);
        
        if (result.success && result.imageUrl) {
            setTempImages(prev => ({ ...prev, [question.id]: result.imageUrl! }));
            toast({ title: "Gambar Dihasilkan!", description: "Klik tombol simpan untuk memasukkannya ke database." });
        } else {
            // Tangani error kuota (429) dengan pesan yang lebih baik
            if (result.error?.toLowerCase().includes('quota') || result.error?.includes('429')) {
                toast({ 
                    variant: "destructive",
                    title: "AI Sedang Istirahat", 
                    description: "Batas permintaan gratis tercapai. Mohon tunggu 1 menit sebelum mencoba lagi.",
                    icon: <Clock className="h-5 w-5" />
                });
            } else {
                toast({ title: "Gagal", description: result.error || "Gagal membuat gambar.", variant: "destructive" });
            }
        }
        setGeneratingImageId(null);
    };

    const handleSaveVisual = async (questionId: string) => {
        const visualData = tempImages[questionId];
        if (!visualData) return;

        setSavingVisualId(questionId);
        const result = await updateQuestionVisualAction(questionId, visualData);
        if (result.success) {
            toast({ title: "Visual Disimpan", description: "Gambar sekarang menjadi bagian permanen dari soal ini." });
            setTempImages(prev => {
                const next = { ...prev };
                delete next[questionId];
                return next;
            });
            router.refresh();
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setSavingVisualId(null);
    };

    const handleCreateNaskah = async () => {
        if (selectedOrderedIds.length === 0 || !naskahConfig.title || !naskahConfig.classId) {
            toast({ title: "Data Tidak Lengkap", description: "Harap isi judul dan pilih kelas.", variant: "destructive" });
            return;
        }

        setExporting(true);
        try {
            const selectedClass = teacherClasses.find(c => c.id === naskahConfig.classId);
            const metadata = {
                jenjang: "Umum", 
                class: selectedClass?.id || naskahConfig.classId,
                subject: naskahConfig.subject || uniqueSubjects[0] || "Umum",
                schoolName: naskahConfig.schoolName || "Sekolah LakuKelas",
                examType: naskahConfig.examType,
                examDate: naskahConfig.examDate,
                examTime: naskahConfig.examTime
            };
            const result = await createNaskahUjianAction(naskahConfig.title, selectedOrderedIds, metadata);
            if (result.success) {
                setIsExportDialogOpen(false);
                setIsSuccessDialogOpen(true);
                setSelectedOrderedIds([]);
                router.refresh();
            } else {
                toast({ title: "Gagal", description: result.error, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            {exporting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-2xl">
                    <div className="p-10 sm:p-14 rounded-[3.5rem] bg-white/80 border border-white/40 shadow-2xl flex flex-col items-center text-center gap-8">
                         <LottieAiProcess size={220} />
                         <p className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">Menyusun Naskah...</p>
                    </div>
                </div>
            )}

            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">Bank Soal AI</h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">Question Repository</p>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-10 space-y-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
                    <div className="relative flex-1 w-full max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600" />
                        <Input placeholder="Cari materi..." className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <AnimatePresence>
                            {selectedOrderedIds.length > 0 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-black uppercase tracking-widest px-6 shadow-lg shadow-emerald-100 h-12" onClick={() => setIsExportDialogOpen(true)}>
                                        Susun Naskah ({selectedOrderedIds.length})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Button className="flex-1 sm:flex-none h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-black uppercase tracking-widest px-6 shadow-lg shadow-indigo-100" asChild>
                            <Link href="/dashboard/ai-pembelajaran/generate-soal"><PlusCircle className="h-5 w-5" /> Generate</Link>
                        </Button>
                    </div>
                </div>

                <div className="space-y-6 px-1">
                    {paginatedQuestions.map((q) => {
                        const selectionIdx = getSelectionIndex(q.id);
                        const isSelected = selectionIdx !== null;
                        const hasImage = q.visual_svg || tempImages[q.id];
                        const isGenerating = generatingImageId === q.id;

                        return (
                            <Card key={q.id} className={cn("relative border-2 rounded-xl bg-white overflow-hidden transition-all shadow-sm", isSelected ? "border-indigo-600 bg-indigo-50/20 shadow-md" : "border-transparent")}>
                                <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8">
                                    <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-4 shrink-0">
                                        <div className="relative">
                                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(q.id)} className="h-9 w-9 rounded-xl border-slate-200 data-[state=checked]:bg-indigo-600" />
                                            {isSelected && <div className="absolute -top-3 -right-3 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white shadow-lg z-10">{selectionIdx}</div>}
                                        </div>
                                        <div className="flex flex-col items-end md:items-start gap-2 md:w-32">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl"><AlertDialogHeader><AlertDialogTitle className="text-xl font-bold">Hapus Soal ini?</AlertDialogTitle><AlertDialogDescription className="font-medium">Soal ini akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="flex flex-row gap-2 mt-4"><AlertDialogCancel className="flex-1 rounded-xl h-11 border-slate-200 font-bold">Batal</AlertDialogCancel><AlertDialogAction onClick={() => deleteQuestionsAction([q.id])} className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 font-bold">Ya, Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                            </AlertDialog>
                                            <div className="flex flex-wrap gap-1.5 justify-end md:justify-start">
                                                <Badge className={cn("font-black text-[9px] uppercase tracking-widest px-2 py-0.5", q.difficulty === 'sulit' ? "bg-rose-500" : q.difficulty === 'sedang' ? "bg-amber-500" : q.difficulty === 'campuran' ? "bg-indigo-500" : "bg-emerald-500")}>{q.difficulty}</Badge>
                                                <Badge variant="outline" className="font-black text-[9px] uppercase border-slate-200 text-slate-400">Kelas {q.kelas}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-5 min-w-0">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase font-black text-[9px] tracking-widest px-2.5 py-1"><BookOpen className="w-3 h-3 mr-1.5 opacity-60" />{q.subject}</Badge>
                                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 uppercase font-black text-[9px] tracking-widest px-2.5 py-1"><Tag className="w-3 h-3 mr-1.5 opacity-60" />{q.topic}</Badge>
                                        </div>
                                        <div className="text-slate-800 font-bold text-lg leading-relaxed break-words overflow-hidden min-w-0">
                                            <MathText content={q.question_text} className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')} />
                                        </div>

                                        {/* Visual Section: Generate Gambar / SVG */}
                                        <div className="visual-area mt-4">
                                            {hasImage ? (
                                                <div className="relative group">
                                                    <div className="my-6 p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-3 overflow-hidden shadow-inner">
                                                        <div className="w-full max-w-[400px] flex items-center justify-center">
                                                            { (q.visual_svg || tempImages[q.id]).startsWith('<svg') ? (
                                                                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: (q.visual_svg || tempImages[q.id]).replace('<svg', '<svg style="width:100%;height:auto;max-width:400px;" preserveAspectRatio="xMidYMid meet"') }} />
                                                            ) : (
                                                                <img src={q.visual_svg || tempImages[q.id]} alt="Visual Soal" className="w-full h-auto max-w-[400px] rounded-lg shadow-lg border border-white" />
                                                            )}
                                                        </div>
                                                        
                                                        {tempImages[q.id] && (
                                                            <div className="flex gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2">
                                                                <Button 
                                                                    onClick={() => handleSaveVisual(q.id)} 
                                                                    disabled={savingVisualId === q.id}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-6 gap-2"
                                                                >
                                                                    {savingVisualId === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                                    Simpan Visual
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    onClick={() => setTempImages(prev => { const n = {...prev}; delete n[q.id]; return n; })}
                                                                    className="text-slate-400 hover:text-rose-500 rounded-xl"
                                                                >
                                                                    Batalkan
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 py-6 border-y border-slate-50">
                                                    <Button 
                                                        variant="outline" 
                                                        disabled={isGenerating}
                                                        onClick={() => handleGenerateImage(q)}
                                                        className="rounded-2xl border-dashed border-2 border-slate-200 h-14 px-6 flex-1 hover:border-indigo-400 hover:bg-indigo-50/30 group transition-all"
                                                    >
                                                        {isGenerating ? (
                                                            <>
                                                                <Loader2 className="h-5 w-5 animate-spin mr-3 text-indigo-600" />
                                                                <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-widest">Memvisualisasikan...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="h-5 w-5 mr-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                                                                <span className="font-black text-slate-400 group-hover:text-indigo-700 uppercase text-[10px] tracking-widest">Generate Ilustrasi AI</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {q.options_json && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {Object.entries(q.options_json as Record<string, string>).sort().map(([k, v]) => (
                                                    <div key={k} className="p-4 rounded-xl border border-slate-100 bg-white text-xs font-bold flex gap-3 hover:border-indigo-200 transition-colors shadow-sm min-w-0 overflow-hidden">
                                                        <span className="text-indigo-600 font-black shrink-0">{k}.</span>
                                                        <div className="flex-1 min-w-0 overflow-hidden"><MathText content={v} /></div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="pt-5 flex flex-wrap justify-between items-center gap-4 border-t border-slate-100">
                                            <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                                <span>KUNCI:</span>
                                                <MathText content={q.correct_answer} />
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => toggleDiscussion(q.id)} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest h-10 px-4 rounded-xl hover:bg-indigo-50">{expandedQuestions.has(q.id) ? "Tutup Pembahasan" : "Lihat Pembahasan"}</Button>
                                        </div>
                                        <AnimatePresence>{expandedQuestions.has(q.id) && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="p-6 rounded-xl bg-slate-50 text-sm italic text-slate-600 border border-slate-100 leading-relaxed shadow-inner"><MathText content={q.explanation} /></div></motion.div>)}</AnimatePresence>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex justify-center mt-10">
                    {totalPages > 1 && (<div className="flex gap-2"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="rounded-xl font-bold h-10 w-10 p-0"><ChevronLeft className="h-4 w-4" /></Button><div className="flex items-center px-6 bg-white rounded-xl border text-sm font-black shadow-sm">{currentPage} / {totalPages}</div><Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="rounded-xl font-bold h-10 w-10 p-0"><ChevronRight className="h-4 w-4" /></Button></div>)}
                </div>

                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                    <DialogContent className="rounded-xl p-0 max-w-lg border-0 shadow-2xl overflow-hidden bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 text-white text-center">
                            <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">Susun Naskah Baru</DialogTitle>
                            <DialogDescription className="text-indigo-100 font-bold mt-1 uppercase text-[10px] tracking-widest">Pilih kelas spesifik untuk sinkronisasi QR Code siswa</DialogDescription>
                        </div>

                        <ScrollArea className="max-h-[55vh] p-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Judul Naskah</Label>
                                    <Input placeholder="e.g. UAS Matematika Ganjil" value={naskahConfig.title} onChange={e => setNaskahConfig({...naskahConfig, title: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 font-bold shadow-sm" />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Pilih Kelas Ujian (Wajib)</Label>
                                    <Select value={naskahConfig.classId} onValueChange={v => setNaskahConfig({...naskahConfig, classId: v})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold text-sm shadow-sm"><SelectValue placeholder="Pilih kelas..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {teacherClasses.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Mata Pelajaran</Label>
                                    <Select value={naskahConfig.subject} onValueChange={v => setNaskahConfig({...naskahConfig, subject: v})}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue placeholder="Pilih mapel..." /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{uniqueSubjects.map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Jenis Ujian</Label>
                                    <Select value={naskahConfig.examType} onValueChange={v => setNaskahConfig({...naskahConfig, examType: v})}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{examTypes.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Tanggal</Label>
                                        <Input type="date" value={naskahConfig.examDate} onChange={e => setNaskahConfig({...naskahConfig, examDate: e.target.value})} className="h-11 rounded-xl bg-white border-slate-200 font-bold shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Durasi</Label>
                                        <Input placeholder="90 Menit" value={naskahConfig.examTime} onChange={e => setNaskahConfig({...naskahConfig, examTime: e.target.value})} className="h-11 rounded-xl bg-white border-slate-200 font-bold shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-8 bg-white border-t">
                            <Button onClick={handleCreateNaskah} disabled={exporting || !naskahConfig.title || !naskahConfig.classId} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest gap-3 shadow-xl transition-all">
                                {exporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Database className="h-6 w-6" />}
                                Daftarkan ke Naskah Soal
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                    <DialogContent className="rounded-xl p-0 max-w-sm border-0 shadow-2xl overflow-hidden bg-white"><div className="p-10 flex flex-col items-center text-center"><LottieSuccess size={200} /><h3 className="text-2xl font-black text-slate-900 mt-2">Berhasil Disusun!</h3><p className="text-sm text-slate-500 mt-2 font-medium">Data siswa kelas {teacherClasses.find(c=>c.id === naskahConfig.classId)?.name} telah disinkronkan ke LJK.</p><Button asChild className="w-full h-12 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2"><Link href="/dashboard/ai-pembelajaran/naskah-soal">Buka Daftar Naskah</Link></Button></div></DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
