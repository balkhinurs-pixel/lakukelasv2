
"use client";

import * as React from "react";
import { 
    Database, 
    Search, 
    Filter, 
    PlusCircle,
    FileText,
    Trash2,
    Edit3,
    Eye,
    ChevronDown,
    ChevronUp,
    Calendar,
    BookOpen,
    Users,
    AlertCircle,
    CheckCircle2,
    Loader2,
    CloudIcon,
    ChevronLeft,
    ChevronRight,
    Layout
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { deleteQuestionsAction } from "@/lib/actions/ai";
import { saveAiDocumentToDrive } from "@/lib/actions/google-drive";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { cn } from "@/lib/utils";

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

const ITEMS_PER_PAGE = 5;

export default function BankSoalClient({ 
    initialQuestions,
    uniqueSubjects,
    uniqueClasses,
    uniqueTopics
}: { 
    initialQuestions: any[],
    uniqueSubjects: string[],
    uniqueClasses: string[],
    uniqueTopics: string[]
}) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filterClass, setFilterClass] = React.useState("all");
    const [filterSubject, setFilterSubject] = React.useState("all");
    const [filterTopic, setFilterTopic] = React.useState("all");
    
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedQuestions, setExpandedQuestions] = React.useState<Set<string>>(new Set());
    
    const [loading, setLoading] = React.useState<string | null>(null);
    const [exporting, setExporting] = React.useState(false);

    // Reset pagination when filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterClass, filterSubject, filterTopic]);

    const filteredQuestions = React.useMemo(() => {
        return initialQuestions.filter(q => {
            const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                q.topic.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClass = filterClass === "all" || q.kelas === filterClass;
            
            // Pencocokan cerdas (case-insensitive & trim)
            const matchesSubject = filterSubject === "all" || 
                                 q.subject.trim().toLowerCase() === filterSubject.toLowerCase();
            
            const matchesTopic = filterTopic === "all" || 
                                q.topic.trim().toLowerCase() === filterTopic.toLowerCase();
            
            return matchesSearch && matchesClass && matchesSubject && matchesTopic;
        });
    }, [initialQuestions, searchTerm, filterClass, filterSubject, filterTopic]);

    const paginatedQuestions = React.useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredQuestions, currentPage]);

    const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);

    const toggleDiscussion = (id: string) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus soal ini dari Bank Soal?")) return;
        
        setLoading(id);
        const result = await deleteQuestionsAction([id]);
        if (result.success) {
            toast({ title: "Terhapus", description: "Soal berhasil dihapus dari koleksi." });
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(null);
    };

    const handleExportToDrive = async () => {
        if (filteredQuestions.length === 0) {
            toast({ title: "Tidak ada soal", description: "Silakan filter soal yang ingin diekspor.", variant: "destructive" });
            return;
        }

        setExporting(true);
        
        let content = `# BANK SOAL LAKUKELAS\n\n`;
        content += `**Mata Pelajaran:** ${filterSubject !== 'all' ? filterSubject : 'Campuran'}\n`;
        content += `**Kelas:** ${filterClass !== 'all' ? filterClass : 'Campuran'}\n`;
        content += `**Materi:** ${filterTopic !== 'all' ? filterTopic : 'Campuran'}\n`;
        content += `**Tanggal Ekspor:** ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}\n\n`;
        content += `---\n\n`;

        filteredQuestions.forEach((q, idx) => {
            content += `### Soal Nomor ${idx + 1}\n`;
            content += `${q.question_text}\n\n`;
            
            if (q.options_json) {
                Object.entries(q.options_json as Record<string, string>).sort().forEach(([key, val]) => {
                    content += `- **${key}.** ${val}\n`;
                });
                content += `\n`;
            }

            content += `> **Kunci Jawaban:** ${q.correct_answer}\n\n`;
            content += `**Pembahasan:**\n${q.explanation}\n\n`;
            content += `---\n\n`;
        });

        const title = `BankSoal_${filterSubject !== 'all' ? filterSubject : 'Mixed'}_${format(new Date(), 'yyyyMMdd')}`;

        const result = await saveAiDocumentToDrive(title, content, 'soal');

        if (result.success) {
            toast({ 
                title: "Berhasil Ekspor", 
                description: "Naskah soal telah disimpan ke folder 'Bank Soal' di Google Drive.",
                action: (
                    <Button variant="outline" size="sm" asChild>
                        <a href={result.file_url || "#"} target="_blank" rel="noopener noreferrer">Buka File</a>
                    </Button>
                )
            });
        } else {
            toast({ title: "Gagal Ekspor", description: result.error, variant: "destructive" });
        }
        setExporting(false);
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input 
                        placeholder="Cari soal atau topik..." 
                        className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline"
                        className="flex-1 md:flex-none h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-2xl gap-2 font-bold px-6 shadow-sm"
                        onClick={handleExportToDrive}
                        disabled={exporting || filteredQuestions.length === 0}
                    >
                        {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CloudIcon className="h-5 w-5" />}
                        Simpan ke Drive
                    </Button>
                    <Button className="flex-1 md:flex-none h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl gap-2 shadow-xl shadow-indigo-100 font-bold px-6" asChild>
                        <Link href="/dashboard/ai-pembelajaran/generate-soal">
                            <PlusCircle className="h-5 w-5" />
                            Generate Baru
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filter Bar Expanded */}
            <Card className="border-0 shadow-sm rounded-3xl bg-slate-50/50 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter:</span>
                    </div>
                    
                    <Select value={filterClass} onValueChange={setFilterClass}>
                        <SelectTrigger className="w-32 h-10 rounded-xl border-slate-200 bg-white font-bold text-xs">
                            <SelectValue placeholder="Kelas" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                            <SelectItem value="all">Semua Kelas</SelectItem>
                            {uniqueClasses.map(c => <SelectItem key={c} value={c} className="font-bold">Kelas {c}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-44 h-10 rounded-xl border-slate-200 bg-white font-bold text-xs">
                            <SelectValue placeholder="Mapel" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                            <SelectItem value="all">Semua Mapel</SelectItem>
                            {uniqueSubjects.map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterTopic} onValueChange={setFilterTopic}>
                        <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200 bg-white font-bold text-xs">
                            <Layout className="mr-2 h-3.5 w-3.5 text-slate-400" />
                            <SelectValue placeholder="Semua Materi" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                            <SelectItem value="all">Semua Materi</SelectItem>
                            {uniqueTopics.map(t => <SelectItem key={t} value={t} className="font-bold">{t}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Badge variant="outline" className="ml-auto bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[10px] py-1 px-3">
                        DITEMUKAN: {filteredQuestions.length} SOAL
                    </Badge>
                </div>
            </Card>

            {/* Questions List with Pagination */}
            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                    {paginatedQuestions.length > 0 ? (
                        paginatedQuestions.map((q) => {
                            const isExpanded = expandedQuestions.has(q.id);
                            return (
                                <motion.div
                                    key={q.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="border-0 shadow-md rounded-[2rem] bg-white overflow-hidden hover:shadow-xl transition-all duration-300 group border border-slate-100">
                                        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6">
                                            {/* Status & Metadata Sidebar */}
                                            <div className="md:w-48 shrink-0 space-y-4">
                                                <div className="flex flex-col gap-2">
                                                    <Badge className={cn(
                                                        "w-fit font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border-0",
                                                        q.difficulty === 'sulit' ? "bg-rose-500" : q.difficulty === 'sedang' ? "bg-blue-500" : "bg-emerald-500"
                                                    )}>
                                                        {q.difficulty}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tight">
                                                            {format(parseISO(q.created_at), 'dd MMM yyyy', { locale: id })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-2xl bg-slate-50 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-3.5 w-3.5 text-indigo-600" />
                                                        <span className="text-[10px] font-black text-slate-700">KELAS {q.kelas}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                                                        <span className="text-[10px] font-black text-slate-700 truncate uppercase">{q.subject}</span>
                                                    </div>
                                                    {q.needs_review && (
                                                        <div className="flex items-center gap-1.5 text-amber-600">
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                            <span className="text-[9px] font-black uppercase tracking-tighter">Perlu Review</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-2 flex gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                        title="Edit Soal"
                                                    >
                                                        <Edit3 className="h-5 w-5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                                        onClick={() => handleDelete(q.id)}
                                                        disabled={loading === q.id}
                                                        title="Hapus Soal"
                                                    >
                                                        {loading === q.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Question Content */}
                                            <div className="flex-1 space-y-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 font-black text-[9px] uppercase px-2 py-0.5">{q.question_type}</Badge>
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Topik: {q.topic}</span>
                                                    </div>
                                                    
                                                    {q.image_url && (
                                                        <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 mb-4 group-hover:scale-[1.01] transition-transform">
                                                            <img 
                                                                src={q.image_url} 
                                                                alt="Ilustrasi" 
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="text-slate-800 font-bold text-lg leading-relaxed">
                                                        <MathText content={q.question_text} className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')} />
                                                    </div>
                                                </div>

                                                {/* Opsi Jawaban */}
                                                {q.options_json && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {Object.entries(q.options_json as Record<string, string>).sort().map(([key, val]) => (
                                                            <div key={key} className={cn(
                                                                "p-3 rounded-2xl border flex items-center gap-3 transition-colors",
                                                                q.correct_answer === key ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"
                                                            )}>
                                                                <span className={cn(
                                                                    "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                                                                    q.correct_answer === key ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                                                                )}>{key}</span>
                                                                <div className="text-xs font-semibold text-slate-600">
                                                                    <MathText content={val} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Kunci & Pembahasan Footer */}
                                                <div className="pt-4 border-t border-slate-50 flex flex-col space-y-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 flex items-center gap-2">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Jawaban: {q.correct_answer}</span>
                                                            </div>
                                                            {q.cognitive_level && (
                                                                <Badge variant="outline" className="border-indigo-100 text-indigo-600 font-bold text-[9px] uppercase px-3 py-1.5 rounded-xl bg-indigo-50/30">
                                                                    {q.cognitive_level}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Button 
                                                            variant="link" 
                                                            onClick={() => toggleDiscussion(q.id)}
                                                            className="text-indigo-600 font-black text-[10px] uppercase tracking-widest h-auto p-0 hover:no-underline group/link"
                                                        >
                                                            {isExpanded ? 'Sembunyikan Pembahasan' : 'Lihat Pembahasan Lengkap'}
                                                            {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1 group-hover/link:translate-y-0.5 transition-transform" />}
                                                        </Button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium italic">
                                                                    <MathText content={q.explanation} />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="py-32 text-center flex flex-col items-center">
                            <div className="p-10 rounded-[3rem] bg-slate-50 shadow-inner mb-6 group hover:bg-indigo-50 transition-all duration-700">
                                <Database className="h-20 w-20 text-slate-200 group-hover:text-indigo-200 transition-all duration-700" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bank Soal Masih Kosong</h3>
                            <p className="text-slate-400 font-bold text-sm max-w-xs mt-3 leading-relaxed">
                                {searchTerm || filterClass !== 'all' || filterSubject !== 'all' || filterTopic !== 'all'
                                    ? "Tidak ada soal yang cocok dengan filter pencarian Anda." 
                                    : "Mulai buat soal pertama Anda dengan AI untuk membangun bank soal digital sekolah."}
                            </p>
                            {(searchTerm || filterClass !== 'all' || filterSubject !== 'all' || filterTopic !== 'all') && (
                                <Button variant="link" onClick={() => {setSearchTerm(""); setFilterClass("all"); setFilterSubject("all"); setFilterTopic("all");}} className="mt-4 text-indigo-600 font-bold">
                                    Bersihkan Filter
                                </Button>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-8 pb-12">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-slate-200 bg-white"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                className={cn(
                                    "w-10 h-10 rounded-xl font-bold text-xs",
                                    currentPage === page ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "border-slate-200 bg-white text-slate-600"
                                )}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-slate-200 bg-white"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
            
            <style jsx global>{`
                .math-text-render .katex-display {
                    margin: 0.5em 0;
                    overflow-x: auto;
                    overflow-y: hidden;
                }
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
            `}</style>
        </div>
    );
}
