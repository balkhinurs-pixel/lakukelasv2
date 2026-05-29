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
    ArrowRightLeft
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
import { deleteQuestionsAction, createNaskahUjianAction } from "@/lib/actions/ai";
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
import type { Profile, GoogleDriveIntegration } from "@/lib/types";
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
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className={cn("math-text-render w-full max-w-full overflow-hidden", className)}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return (
            <div key={i} className="my-3 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
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
                    p: ({node, ...props}) => <span className="whitespace-pre-wrap" {...props} />
                }}
            >
                {part}
            </ReactMarkdown>
        );
      })}
    </div>
  );
};

const ITEMS_PER_PAGE = 8; 

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

const examTypes = [
    "Penilaian Harian",
    "Tugas Mandiri",
    "Sumatif Tengah Semester (STS)",
    "Sumatif Akhir Semester (SAS)",
    "Ujian Sekolah",
    "Try Out",
    "Latihan Soal"
];

export default function BankSoalClient({ 
    initialQuestions,
    uniqueSubjects,
    uniqueClasses,
    uniqueTopics,
    schoolProfile,
    activeSchoolYearName,
    driveIntegration,
    userProvider
}: { 
    initialQuestions: any[],
    uniqueSubjects: string[],
    uniqueClasses: string[],
    uniqueTopics: string[],
    schoolProfile: Profile | null,
    activeSchoolYearName: string,
    driveIntegration: GoogleDriveIntegration | null,
    userProvider?: string
}) {
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filterClass, setFilterClass] = React.useState("all");
    const [filterSubject, setFilterSubject] = React.useState("all");
    const [filterTopic, setFilterTopic] = React.useState("all");
    
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedQuestions, setExpandedQuestions] = React.useState<Set<string>>(new Set());
    const [selectedOrderedIds, setSelectedOrderedIds] = React.useState<string[]>([]);
    
    const [exporting, setExporting] = React.useState(false);
    const [countdown, setCountdown] = React.useState(30);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = React.useState(false);
    const [isDriveAuthDialogOpen, setIsDriveAuthDialogOpen] = React.useState(false);
    const [successFileUrl, setSuccessFileUrl] = React.useState("");
    
    const [naskahConfig, setNaskahConfig] = React.useState({
        title: "",
        schoolName: schoolProfile?.school_name || "",
        jenjang: 'SMP / MTs',
        kelas: '7',
        subject: 'Bahasa Indonesia',
        examType: "Penilaian Harian"
    });

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterClass, filterSubject, filterTopic]);

    // Countdown Logic
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (exporting) {
            setCountdown(30);
            interval = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [exporting]);

    const handleJenjangChange = (val: string) => {
        const classOpts = getClassOptions(val);
        const mapelOpts = mapelByJenjang[val] || [];
        setNaskahConfig(prev => ({
            ...prev,
            jenjang: val,
            kelas: classOpts[0] || '1',
            subject: mapelOpts[0] || 'Bahasa Indonesia'
        }));
    };

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
        setSelectedOrderedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
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

    const handleDeleteSingle = async (id: string) => {
        setDeletingId(id);
        const result = await deleteQuestionsAction([id]);
        if (result.success) {
            toast({ title: "Berhasil", description: "Soal telah dihapus." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setDeletingId(null);
    };

    const handleConnectDrive = async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.href,
                scopes: "openid email profile https://www.googleapis.com/auth/drive.file",
                queryParams: { access_type: "offline", prompt: "consent" },
            },
        });
        if (error) toast({ title: "Gagal", description: "Kesalahan OAuth.", variant: "destructive" });
    };

    const handleCreateNaskah = async () => {
        if (selectedOrderedIds.length === 0) return;
        
        if (userProvider === 'google' && (!driveIntegration || driveIntegration.status !== 'connected')) {
            setIsDriveAuthDialogOpen(true);
            return;
        }

        if (!naskahConfig.title) {
            toast({ title: "Judul Wajib", description: "Harap masukkan nama naskah.", variant: "destructive" });
            return;
        }

        setExporting(true);
        
        try {
            const metadata = {
                jenjang: naskahConfig.jenjang,
                class: naskahConfig.kelas,
                subject: naskahConfig.subject,
                schoolName: naskahConfig.schoolName || "Sekolah LakuKelas",
                examType: naskahConfig.examType
            };

            const result = await createNaskahUjianAction(
                naskahConfig.title, 
                selectedOrderedIds, 
                metadata
            );

            if (result.success) {
                setSuccessFileUrl(result.file_url || "#");
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

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            {/* Loading Overlay */}
            {exporting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-2xl">
                    <div className="p-10 sm:p-14 rounded-[3.5rem] bg-white/80 border border-white/40 shadow-2xl flex flex-col items-center text-center gap-8">
                         <LottieAiProcess size={220} />
                         <div className="space-y-2">
                            <p className="text-3xl font-black text-slate-900 tracking-tight uppercase">Menyusun Naskah...</p>
                            <p className="text-xl font-mono font-black text-indigo-600">{countdown}s</p>
                         </div>
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
                        <Input 
                            placeholder="Cari materi..." 
                            className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm font-bold" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <AnimatePresence>
                            {selectedOrderedIds.length > 0 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                    <Button 
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-black uppercase tracking-widest px-6 shadow-lg shadow-emerald-100 h-12"
                                        onClick={() => setIsExportDialogOpen(true)}
                                    >
                                        Susun Naskah ({selectedOrderedIds.length})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Button className="flex-1 sm:flex-none h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-black uppercase tracking-widest px-6 shadow-lg shadow-indigo-100" asChild>
                            <Link href="/dashboard/ai-pembelajaran/generate-soal">
                                <PlusCircle className="h-5 w-5" />
                                Generate
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="border-0 shadow-lg rounded-xl bg-white overflow-hidden mx-1">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <Filter className="h-5 w-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Saring Soal</span>
                                </div>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-0 font-black text-[10px]">
                                    Total: {filteredQuestions.length} Soal
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                                <Select value={filterClass} onValueChange={setFilterClass}>
                                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-0 font-bold text-xs"><SelectValue placeholder="Kelas" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="all" className="font-bold">Semua Kelas</SelectItem>
                                        {uniqueClasses.map(c => <SelectItem key={c} value={c} className="font-bold">Kelas {c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterSubject} onValueChange={setFilterSubject}>
                                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-0 font-bold text-xs"><SelectValue placeholder="Mapel" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="all" className="font-bold">Semua Mapel</SelectItem>
                                        {uniqueSubjects.map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterTopic} onValueChange={setFilterTopic}>
                                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-0 font-bold text-xs">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Layers className="h-3 w-3 shrink-0" />
                                            <SelectValue placeholder="Materi/Bab" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="all" className="font-bold">Semua Materi</SelectItem>
                                        {uniqueTopics.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6 px-1">
                    {paginatedQuestions.map((q) => {
                        const selectionIdx = getSelectionIndex(q.id);
                        const isSelected = selectionIdx !== null;
                        
                        // Logic parsing khusus untuk tipe Menjodohkan (Matching) - V37.0 Smart Heuristic
                        const isMatching = q.question_type === 'matching';
                        let matchingItems: string[] = [];
                        let matchingIntro = q.question_text;

                        if (isMatching) {
                            const lines = q.question_text.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');
                            if (lines.length > 1) {
                                // Cari baris yang dimulai dengan angka
                                constNumberedLines = lines.slice(1).some(l => /^\d+[\.\)]/.test(l));
                                
                                if (constNumberedLines) {
                                    matchingItems = lines.filter((l: string) => /^\d+[\.\)]/.test(l));
                                    matchingIntro = lines.filter((l: string) => !/^\d+[\.\)]/.test(l)).join('\n');
                                } else {
                                    // Heuristik: Anggap baris pertama intro, sisanya item
                                    matchingIntro = lines[0];
                                    matchingItems = lines.slice(1);
                                }
                            } else {
                                matchingIntro = q.question_text;
                                matchingItems = [];
                            }
                        }

                        return (
                            <Card key={q.id} className={cn(
                                "relative border-2 rounded-xl bg-white overflow-hidden transition-all shadow-sm",
                                isSelected ? "border-indigo-600 bg-indigo-50/20 shadow-md" : "border-transparent"
                            )}>
                                <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8">
                                    <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-4 shrink-0">
                                        <div className="relative">
                                            <Checkbox 
                                                checked={isSelected} 
                                                onCheckedChange={() => toggleSelect(q.id)}
                                                className="h-9 w-9 rounded-xl border-slate-200 data-[state=checked]:bg-indigo-600"
                                            />
                                            {isSelected && (
                                                <div className="absolute -top-3 -right-3 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white shadow-lg z-10">
                                                    {selectionIdx}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end md:items-start gap-2 md:w-32">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl font-bold">Hapus Soal ini?</AlertDialogTitle>
                                                        <AlertDialogDescription className="font-medium">Soal ini akan dihapus permanen.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="flex flex-row gap-2 mt-4">
                                                        <AlertDialogCancel className="flex-1 rounded-xl h-11 border-slate-200 font-bold">Batal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteSingle(q.id)} className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 font-bold">
                                                            {deletingId === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                            <div className="flex flex-wrap gap-1.5 justify-end md:justify-start">
                                                <Badge className={cn("font-black text-[9px] uppercase tracking-widest px-2 py-0.5", q.difficulty === 'sulit' ? "bg-rose-500" : q.difficulty === 'sedang' ? "bg-amber-500" : "bg-emerald-500")}>{q.difficulty}</Badge>
                                                <Badge variant="outline" className="font-black text-[9px] uppercase border-slate-200 text-slate-400">Kelas {q.kelas}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-5 min-w-0">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase font-black text-[9px] tracking-widest px-2.5 py-1">
                                                <BookOpen className="w-3 h-3 mr-1.5 opacity-60" />
                                                {q.subject}
                                            </Badge>
                                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 uppercase font-black text-[9px] tracking-widest px-2.5 py-1">
                                                <Tag className="w-3 h-3 mr-1.5 opacity-60" />
                                                {q.topic}
                                            </Badge>
                                            {q.cognitive_level && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase font-black text-[9px] tracking-widest px-2.5 py-1">
                                                    <BrainCircuit className="w-3 h-3 mr-1.5 opacity-60" />
                                                    Level {q.cognitive_level}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="text-slate-800 font-bold text-lg leading-relaxed break-words overflow-hidden min-w-0">
                                            <MathText content={matchingIntro} className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')} />
                                        </div>

                                        {q.visual_svg && (
                                            <div className="my-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-3">
                                                <div 
                                                    className="w-full max-w-[400px] aspect-[1/1] flex items-center justify-center overflow-hidden"
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
                                                        {q.options_json && Object.entries(q.options_json as Record<string, string>).sort().map(([k, v]) => (
                                                            <div key={k} className="p-3 bg-white rounded-xl border border-slate-100 text-xs font-bold flex gap-3 shadow-sm min-h-[44px] flex items-center">
                                                                <span className="text-emerald-600 font-black">{k}.</span>
                                                                <div className="flex-1 overflow-hidden"><MathText content={v} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            q.options_json && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {Object.entries(q.options_json as Record<string, string>).sort().map(([k, v]) => (
                                                        <div key={k} className="p-4 rounded-xl border border-slate-100 bg-white text-xs font-bold flex gap-3 hover:border-indigo-200 transition-colors shadow-sm min-w-0 overflow-hidden">
                                                            <span className="text-indigo-600 font-black shrink-0">{k}.</span>
                                                            <div className="flex-1 min-w-0 overflow-hidden"><MathText content={v} /></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}

                                        <div className="pt-5 flex flex-wrap justify-between items-center gap-4 border-t border-slate-100">
                                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">KUNCI: {q.correct_answer}</p>
                                            <Button variant="ghost" size="sm" onClick={() => toggleDiscussion(q.id)} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest h-10 px-4 rounded-xl hover:bg-indigo-50">
                                                {expandedQuestions.has(q.id) ? "Tutup Pembahasan" : "Lihat Pembahasan"}
                                            </Button>
                                        </div>

                                        <AnimatePresence>
                                            {expandedQuestions.has(q.id) && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="p-6 rounded-xl bg-slate-50 text-sm italic text-slate-600 border border-slate-100 leading-relaxed shadow-inner">
                                                        <MathText content={q.explanation} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex justify-center mt-10">
                    {totalPages > 1 && (
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="rounded-xl font-bold h-10 w-10 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center px-6 bg-white rounded-xl border text-sm font-black shadow-sm">
                                {currentPage} / {totalPages}
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="rounded-xl font-bold h-10 w-10 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* simplified Naskah Config Dialog */}
                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                    <DialogContent className="rounded-xl p-0 max-w-lg border-0 shadow-2xl overflow-hidden bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 text-white text-center">
                            <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">Susun Naskah Baru</DialogTitle>
                            <DialogDescription className="text-indigo-100 font-bold mt-1 uppercase text-[10px] tracking-widest">Sistem otomatis mengelompokkan jenis soal</DialogDescription>
                        </div>

                        <ScrollArea className="max-h-[55vh] p-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Judul Naskah</Label>
                                    <Input placeholder="e.g. UAS Matematika Ganjil" value={naskahConfig.title} onChange={e => setNaskahConfig({...naskahConfig, title: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 font-bold shadow-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Jenjang</Label>
                                        <Select value={naskahConfig.jenjang} onValueChange={handleJenjangChange}>
                                            <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl">{Object.keys(mapelByJenjang).map(j => <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Kelas</Label>
                                        <Select value={naskahConfig.kelas} onValueChange={v => setNaskahConfig({...naskahConfig, kelas: v})}>
                                            <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl">{getClassOptions(naskahConfig.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Mata Pelajaran</Label>
                                    <Select value={naskahConfig.subject} onValueChange={v => setNaskahConfig({...naskahConfig, subject: v})}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{(mapelByJenjang[naskahConfig.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Jenis Ujian</Label>
                                    <Select value={naskahConfig.examType} onValueChange={v => setNaskahConfig({...naskahConfig, examType: v})}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">{examTypes.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-8 bg-white border-t">
                            <Button onClick={handleCreateNaskah} disabled={exporting || !naskahConfig.title} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest gap-3 shadow-xl transition-all">
                                {exporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Database className="h-6 w-6" />}
                                Daftarkan ke Naskah Soal
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Dialog */}
                <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                    <DialogContent className="rounded-xl p-0 max-w-sm border-0 shadow-2xl overflow-hidden bg-white">
                        <div className="p-10 flex flex-col items-center text-center">
                            <LottieSuccess size={200} />
                            <h3 className="text-2xl font-black text-slate-900 mt-2">Berhasil Disusun!</h3>
                            <p className="text-sm text-slate-500 mt-2 font-medium">Soal telah diurutkan otomatis berdasarkan jenisnya. Anda dapat mengunduh PDF, LJK, dan Kisi-kisi di menu Naskah Soal.</p>
                            <Button asChild className="w-full h-12 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2">
                                <Link href="/dashboard/ai-pembelajaran/naskah-soal">
                                    Buka Daftar Naskah
                                </Link>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
