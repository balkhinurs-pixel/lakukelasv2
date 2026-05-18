"use client";

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { 
    Database, 
    Search, 
    Filter, 
    PlusCircle,
    Trash2,
    Edit3,
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
    Layout,
    Printer,
    FileText,
    School,
    Download,
    Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { saveAs } from 'file-saver';
import { useRouter } from "next/navigation";

// --- MathText Component with Automatic Spacing for LaTeX ---
const MathText = ({ content, className }: { content: string, className?: string }) => {
  if (!content) return null;
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);
  const hasMath = content.includes('\\(') || content.includes('\\[');

  return (
    <div className={cn(
        "math-text-render inline-block w-full", 
        hasMath ? "py-1.5" : "", // Beri ruang jika ada rumus agar tidak menumpuk
        className
    )}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return <BlockMath key={i} math={part.slice(2, -2)} />;
        if (part.startsWith('\\(')) return <InlineMath key={i} math={part.slice(2, -2)} />;
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </div>
  );
};

// --- Komponen Template Print Sesuai Referensi Gambar User ---
const NaskahPrintTemplate = ({ 
    questions, 
    config 
}: { 
    questions: any[], 
    config: any 
}) => {
    return (
        <div 
            id="naskah-print-container" 
            className="bg-white text-slate-900" 
            style={{ 
                position: 'fixed', 
                left: '-9999px', 
                top: 0,
                width: '210mm',
                padding: '20mm 16mm', // Padding kuat di atas dan bawah (2cm)
                boxSizing: 'border-box',
                fontFamily: '"Times New Roman", Times, serif',
                lineHeight: '1.45',
                fontSize: '11pt',
                color: '#111',
                minHeight: '297mm'
            }}
        >
            {/* Header Naskah Formal */}
            <div className="text-center mb-6">
                <h1 className="text-[13pt] font-bold uppercase leading-tight" style={{ margin: 0 }}>
                    {config.schoolName || "SEKOLAH LAKUKELAS"}
                </h1>
                <h2 className="text-[12pt] font-bold uppercase leading-tight" style={{ borderBottom: '1.5pt solid black', paddingBottom: '4px', display: 'inline-block', width: '100%' }}>
                    {config.examType || "PENILAIAN HARIAN"} TAHUN PELAJARAN 2024/2025
                </h2>
            </div>

            {/* Grid Metadata Persis Gambar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '10pt', marginBottom: '20px', paddingLeft: '40px', paddingRight: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', gap: '2px' }}>
                    <span className="font-bold">Mata Pelajaran</span><span>:</span><span>{questions[0]?.subject || "-"}</span>
                    <span className="font-bold">Kelas/Semester</span><span>:</span><span>{questions[0]?.kelas || "-"} / Ganjil</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', gap: '2px' }}>
                    <span className="font-bold">Hari dan Tanggal</span><span>:</span><span>{format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}</span>
                    <span className="font-bold">Waktu</span><span>:</span><span>07.30 - 09.30 WIB</span>
                </div>
            </div>

            {/* Instruction Title */}
            <div className="mb-4">
                <p className="font-bold uppercase">I. PILIHAN GANDA</p>
                <p className="text-[10pt] italic">Pilihlah salah satu jawaban yang paling tepat dengan memberi tanda silang (X) pada huruf A, B, C, atau D!</p>
            </div>

            {/* Daftar Soal */}
            <div className="space-y-6">
                {questions.map((q, idx) => {
                    const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                    const isSma = options.length > 4;

                    return (
                        <div key={q.id} className="question-block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <div className="flex gap-2 mb-2">
                                <span className="font-bold min-w-[22px]">{idx + 1}.</span>
                                <div className={cn("flex-1 text-justify", q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')}>
                                    <MathText content={q.question_text} />
                                </div>
                            </div>
                            
                            {options.length > 0 && (
                                <div 
                                    className="ml-[22px]"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gridAutoFlow: 'column',
                                        gridTemplateRows: isSma ? 'repeat(3, auto)' : 'repeat(2, auto)',
                                        columnGap: '40px',
                                        rowGap: '8px'
                                    }}
                                >
                                    {options.map(([k, v]) => (
                                        <div key={k} className="flex gap-2 items-start" style={{ minHeight: '26px' }}>
                                            <span className="font-bold min-w-[18px]">{k}.</span>
                                            <div className="flex-1 leading-normal overflow-wrap-break-word">
                                                <MathText content={v} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Catatan: Tanda tangan dihilangkan untuk naskah soal */}
            <div className="mt-12 text-center text-[9pt] italic text-slate-400" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <p>-- Selamat Mengerjakan --</p>
            </div>
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
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filterClass, setFilterClass] = React.useState("all");
    const [filterSubject, setFilterSubject] = React.useState("all");
    const [filterTopic, setFilterTopic] = React.useState("all");
    
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedQuestions, setExpandedQuestions] = React.useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    
    const [exporting, setExporting] = React.useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
    
    const [naskahConfig, setNaskahConfig] = React.useState({
        title: "",
        schoolName: "",
        examType: "Penilaian Harian",
        format: "pdf" as "pdf" | "doc"
    });

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterClass, filterSubject, filterTopic]);

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
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleDiscussion = (id: string) => {
        setExpandedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    /**
     * Algoritma Rendering PDF "Anti-Duplikasi" V23.8
     * Membagi canvas panjang menjadi potongan A4 presisi tanpa overlap.
     */
    const generateHighQualityPdf = async (): Promise<string> => {
        const element = document.getElementById('naskah-print-container');
        if (!element) throw new Error("Renderer area not found");

        const canvas = await html2canvas(element, {
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: element.offsetWidth,
            height: element.scrollHeight,
            windowWidth: element.offsetWidth,
            windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeightInPdf = (imgProps.height * pageWidth) / imgProps.width;

        let heightLeft = imgHeightInPdf;
        let position = 0; // Top position relative to current page

        // Halaman Pertama
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeightInPdf);
        heightLeft -= pageHeight;

        // Halaman Berikutnya (Slicing tanpa duplikasi)
        while (heightLeft > 0) {
            position -= pageHeight; // Geser tepat satu tinggi halaman penuh
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeightInPdf);
            heightLeft -= pageHeight;
        }

        return pdf.output('datauristring').split(',')[1];
    };

    const handleCreateNaskah = async () => {
        if (selectedIds.size === 0) return;
        if (!naskahConfig.title) {
            toast({ title: "Judul Wajib Diisi", description: "Harap masukkan nama file naskah Anda.", variant: "destructive" });
            return;
        }

        setExporting(true);
        
        try {
            const selectedQuestionsData = initialQuestions.filter(q => selectedIds.has(q.id));
            const sampleQ = selectedQuestionsData[0];
            const metadata = {
                class: sampleQ?.kelas || "X",
                subject: sampleQ?.subject || "Umum",
                schoolName: naskahConfig.schoolName || "Sekolah LakuKelas",
                examType: naskahConfig.examType
            };

            let binaryPdf: string | undefined;
            if (naskahConfig.format === 'pdf') {
                // Beri waktu sejenak agar KaTeX selesai merender di DOM sebelum capture
                await new Promise(r => setTimeout(r, 1500)); 
                binaryPdf = await generateHighQualityPdf();
            }

            const result = await createNaskahUjianAction(
                naskahConfig.title, 
                Array.from(selectedIds), 
                metadata, 
                naskahConfig.format,
                binaryPdf
            );

            if (result.success) {
                if (naskahConfig.format === 'pdf' && binaryPdf) {
                    const byteCharacters = atob(binaryPdf);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    saveAs(blob, `${naskahConfig.title}.pdf`);
                } else if (result.markdown) {
                    const blob = new Blob([result.markdown], { type: 'application/msword;charset=utf-8' });
                    saveAs(blob, `${naskahConfig.title}.doc`);
                }

                toast({ 
                    title: "Naskah Berhasil!", 
                    description: "File dikirim ke Drive & otomatis terunduh.",
                    action: (
                        <Button variant="outline" size="sm" asChild>
                            <a href={result.file_url || "#"} target="_blank">Cek Drive</a>
                        </Button>
                    )
                });
                
                setIsExportDialogOpen(false);
                setSelectedIds(new Set());
                setNaskahConfig(prev => ({ ...prev, title: "" }));
                router.refresh();
            } else {
                toast({ title: "Gagal", description: result.error || "Gagal memproses dokumen.", variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message || "Terjadi kesalahan sistem.", variant: "destructive" });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {isExportDialogOpen && (
                <NaskahPrintTemplate 
                    questions={initialQuestions.filter(q => selectedIds.has(q.id))} 
                    config={naskahConfig} 
                />
            )}

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600" />
                    <Input 
                        placeholder="Cari materi..." 
                        className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <AnimatePresence>
                        {selectedIds.size > 0 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <Button 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2 font-bold px-6 shadow-lg shadow-emerald-100 h-12"
                                    onClick={() => setIsExportDialogOpen(true)}
                                >
                                    <Printer className="h-5 w-5" />
                                    Susun Naskah ({selectedIds.size})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Button className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl gap-2 font-bold px-6 shadow-lg shadow-indigo-100" asChild>
                        <Link href="/dashboard/ai-pembelajaran/generate-soal">
                            <PlusCircle className="h-5 w-5" />
                            Generate Baru
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-3xl bg-slate-50/50 p-4">
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Filter className="h-4 w-4" />
                    <Select value={filterClass} onValueChange={setFilterClass}>
                        <SelectTrigger className="w-32 h-10 rounded-xl bg-white"><SelectValue placeholder="Kelas" /></SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                            <SelectItem value="all">Semua Kelas</SelectItem>
                            {uniqueClasses.map(c => <SelectItem key={c} value={c}>Kelas {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-44 h-10 rounded-xl bg-white"><SelectValue placeholder="Mapel" /></SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                            <SelectItem value="all">Semua Mapel</SelectItem>
                            {uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Badge className="ml-auto bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm">{filteredQuestions.length} SOAL TERSEDIA</Badge>
                </div>
            </Card>

            <div className="space-y-4">
                {paginatedQuestions.map((q) => (
                    <Card key={q.id} className={cn(
                        "border-0 shadow-sm rounded-[2rem] bg-white overflow-hidden transition-all border-2",
                        selectedIds.has(q.id) ? "border-indigo-500 bg-indigo-50/30" : "border-transparent"
                    )}>
                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex items-start gap-4 shrink-0">
                                <Checkbox 
                                    checked={selectedIds.has(q.id)} 
                                    onCheckedChange={() => toggleSelect(q.id)}
                                    className="h-6 w-6 rounded-lg mt-1"
                                />
                                <div className="space-y-3 md:w-32">
                                    <Badge className={cn(
                                        "font-black text-[9px] uppercase tracking-widest",
                                        q.difficulty === 'sulit' ? "bg-rose-500" : "bg-emerald-500"
                                    )}>{q.difficulty}</Badge>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kelas {q.kelas}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="text-slate-800 font-bold leading-relaxed">
                                    <MathText content={q.question_text} className={q.language_direction === 'rtl' ? 'text-right font-serif text-xl' : ''} />
                                </div>
                                {q.options_json && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {Object.entries(q.options_json as Record<string, string>).sort().map(([k, v]) => (
                                            <div key={k} className="p-3 rounded-2xl border border-slate-100 bg-white text-xs font-semibold flex gap-2 hover:border-indigo-200 transition-colors">
                                                <span className="text-indigo-600 font-black">{k}.</span>
                                                <MathText content={v} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="pt-4 flex justify-between items-center border-t border-slate-50">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">KUNCI: {q.correct_answer}</p>
                                    <Button variant="ghost" size="sm" onClick={() => toggleDiscussion(q.id)} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                                        {expandedQuestions.has(q.id) ? "Tutup Pembahasan" : "Lihat Pembahasan"}
                                    </Button>
                                </div>
                                {expandedQuestions.has(q.id) && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-5 rounded-2xl bg-slate-50 text-xs italic text-slate-600 border border-slate-100 leading-relaxed">
                                        <MathText content={q.explanation} />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 max-w-md border-0 shadow-2xl">
                    <DialogHeader>
                        <div className="mx-auto p-4 bg-indigo-50 text-indigo-600 rounded-3xl mb-4 shadow-inner"><Printer className="h-8 w-8" /></div>
                        <DialogTitle className="text-2xl font-black text-center tracking-tight">Susun Naskah Ujian</DialogTitle>
                        <DialogDescription className="text-center font-medium">Lengkapi detail naskah sebelum dikirim ke Drive.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Judul Naskah (Nama File)</Label>
                            <Input placeholder="e.g. UAS Matematika Kelas 10" value={naskahConfig.title} onChange={e => setNaskahConfig({...naskahConfig, title: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Instansi</Label>
                            <Input placeholder="e.g. SMAN 1 Jakarta" value={naskahConfig.schoolName} onChange={e => setNaskahConfig({...naskahConfig, schoolName: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-0 focus:ring-2 font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenis Asesmen</Label>
                                <Select value={naskahConfig.examType} onValueChange={v => setNaskahConfig({...naskahConfig, examType: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0 shadow-sm font-bold text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="Penilaian Harian" className="font-bold">Harian (UH)</SelectItem>
                                        <SelectItem value="Sumatif Akhir Semester" className="font-bold">SAS / UAS</SelectItem>
                                        <SelectItem value="Ujian Sekolah" className="font-bold">Ujian Sekolah</SelectItem>
                                        <SelectItem value="Latihan Mandiri" className="font-bold">Latihan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Format File</Label>
                                <Select value={naskahConfig.format} onValueChange={(v: any) => setNaskahConfig({...naskahConfig, format: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-0 shadow-sm font-bold text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        <SelectItem value="pdf" className="font-bold text-rose-600">PDF Document</SelectItem>
                                        <SelectItem value="doc" className="font-bold text-blue-600">Google Doc</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateNaskah} disabled={exporting || !naskahConfig.title} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                            {exporting ? <Loader2 className="h-6 w-6 animate-spin" /> : (naskahConfig.format === 'pdf' ? <Download className="h-6 w-6" /> : <CloudIcon className="h-6 w-6" />)}
                            Generate & Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-6">
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-xl h-10 w-10"><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex items-center px-4 font-black text-sm text-slate-400 bg-slate-100 rounded-xl">{currentPage} / {totalPages}</div>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="rounded-xl h-10 w-10"><ChevronRight className="h-4 w-4" /></Button>
                </div>
            )}
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .math-text-render .katex-display { margin: 0.5em 0; overflow-x: auto; overflow-y: hidden; }
            `}</style>
        </div>
    );
}
