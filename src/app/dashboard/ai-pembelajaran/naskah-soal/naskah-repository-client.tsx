
"use client";

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { 
    FileText, 
    ExternalLink, 
    Calendar, 
    Search, 
    BookOpen, 
    Users,
    Trash2,
    Edit,
    ArrowRight,
    Download,
    Loader2,
    X,
    Network,
    Printer,
    CheckCircle2,
    Settings2,
    SquareChartGantt,
    AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { AiDocument, Profile } from "@/lib/types";
import { FileCard } from "@/components/ui/file-card-collections";
import { AppLogo } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { deleteAiDocumentAction, renameAiDocumentAction } from "@/lib/actions/google-drive";
import { generateKisiKisiAction, getNaskahDetailsAction } from "@/lib/actions/ai";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";

// --- MathText Component for Professional Rendering ---
const MathText = ({ content, isPrint = false }: { content: string, isPrint?: boolean }) => {
  if (!content) return null;
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className={cn("math-text-render w-full overflow-hidden", isPrint && "overflow-visible")}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return (
            <div key={i} className="my-3 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2 print:overflow-visible">
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
                        <div className="overflow-x-auto my-4 border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full border-collapse text-xs text-center" {...props} />
                        </div>
                    ),
                    th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 p-2 font-bold" {...props} />,
                    td: ({node, ...props}) => <td className="border border-slate-200 p-2" {...props} />,
                    p: ({node, ...props}) => <span className="whitespace-pre-wrap leading-relaxed" {...props} />
                }}
            >
                {part}
            </ReactMarkdown>
        );
      })}
    </div>
  );
};

// --- NaskahPrintTemplate for High Quality Client-Side PDF ---
const NaskahPrintTemplate = ({ questions, docMetadata, config, schoolProfile }: any) => {
    return (
        <div 
            id={`print-target-${docMetadata.id}`} 
            className="bg-white text-slate-900 p-0" 
            style={{ 
                width: '210mm', 
                fontFamily: '"Times New Roman", Times, serif', 
                fontSize: '11pt', 
                lineHeight: '1.45' 
            }}
        >
            {/* Header / Kop - Wrapped for slicing */}
            <div className="print-header-block p-[10mm_20mm_5mm_20mm]">
                <div className="flex items-center gap-6 mb-4 pb-4 border-b-[2.5pt] border-double border-black">
                    <div className="w-[20mm] h-[20mm] flex items-center justify-center shrink-0">
                        {schoolProfile?.school_logo_url ? (
                            <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" />
                        ) : (
                            <AppLogo className="opacity-20 w-full h-full" />
                        )}
                    </div>
                    <div className="flex-1 text-center pr-[20mm]">
                        <h1 className="text-[14pt] font-bold uppercase leading-tight">{schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}</h1>
                        {schoolProfile?.npsn && <p className="text-[9pt] font-bold">NPSN: {schoolProfile.npsn}</p>}
                        <p className="text-[9pt] italic leading-tight">{schoolProfile?.school_address || "Alamat sekolah belum diatur"}</p>
                        <p className="text-[9pt] italic leading-tight">
                            {schoolProfile?.school_email && `Email: ${schoolProfile.school_email}`} 
                            {schoolProfile?.school_website && ` | Web: ${schoolProfile.school_website}`}
                        </p>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-[12pt] font-bold uppercase underline leading-tight">NASKAH SOAL {docMetadata.title}</h2>
                    <p className="text-[10pt] font-bold uppercase mt-1">Mata Pelajaran: {docMetadata.subject}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10pt] mb-6 border border-black p-3 rounded-lg">
                    <div className="flex"><span className="w-[30mm] font-bold">Kelas</span><span>: {docMetadata.class_level}</span></div>
                    <div className="flex"><span className="w-[30mm] font-bold">Waktu</span><span>: 90 Menit</span></div>
                    <div className="flex"><span className="w-[30mm] font-bold">Tgl Cetak</span><span>: {format(new Date(), 'dd/MM/yyyy')}</span></div>
                    <div className="flex"><span className="w-[30mm] font-bold">Semester</span><span>: Ganjil</span></div>
                </div>
            </div>

            {/* Questions List */}
            <div className="questions-container px-[20mm]">
                {questions.map((q: any, idx: number) => {
                    const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                    const isLongOptions = options.some(([, v]) => v.length > 50);
                    
                    return (
                        <div key={q.id} id={`q-row-${idx}`} className="print-item-block mb-6" style={{ breakInside: 'avoid' }}>
                            <div className="flex gap-3">
                                <span className="font-bold min-w-[20px]">{idx + 1}.</span>
                                <div className="flex-1 text-justify">
                                    <MathText content={q.question_text} isPrint />
                                    {q.visual_svg && (
                                        <div className="my-3 flex justify-center overflow-hidden">
                                            <div 
                                                style={{ maxWidth: '50mm', maxHeight: '40mm' }}
                                                dangerouslySetInnerHTML={{ 
                                                    __html: q.visual_svg.replace('<svg', '<svg style="width:100%; height:auto; max-height:40mm;"') 
                                                }} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {options.length > 0 && (
                                <div 
                                    className={cn(
                                        "ml-[32px] mt-2",
                                        isLongOptions ? "flex flex-col gap-1" : "grid grid-cols-2 gap-x-12 gap-y-1"
                                    )}
                                >
                                    {options.map(([k, v]) => (
                                        <div key={k} className="flex gap-2 items-start py-0.5">
                                            <span className="font-bold min-w-[15px]">{k}.</span>
                                            <div className="flex-1"><MathText content={v} isPrint /></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {config.showDiscussion && (
                                <div className="ml-[32px] mt-3 p-3 border-l-2 border-slate-300 bg-slate-50/50 text-[10pt] italic">
                                    <p className="font-bold text-indigo-700 not-italic uppercase text-[8pt] mb-1">Pembahasan (Kunci: {q.correct_answer}):</p>
                                    <MathText content={q.explanation} isPrint />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="print-footer-block text-center italic text-slate-400 text-[9pt] py-6">
                <p>-- Selamat Mengerjakan --</p>
            </div>
        </div>
    );
};

// --- Professional LJK Template ---
const LjkPrintTemplate = ({ questions, docMetadata, schoolProfile }: any) => {
    return (
        <div 
            id={`ljk-target-${docMetadata.id}`} 
            className="bg-white text-slate-900 p-[15mm_15mm]" 
            style={{ 
                width: '210mm', 
                minHeight: '297mm',
                fontFamily: 'Helvetica, Arial, sans-serif'
            }}
        >
            <div className="flex items-center gap-6 mb-6 border-b-2 border-black pb-4">
                <div className="w-[18mm] h-[18mm]">{schoolProfile?.school_logo_url ? <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" /> : <AppLogo />}</div>
                <div className="flex-1 text-center pr-[18mm]">
                    <h1 className="text-[12pt] font-black uppercase">LEMBAR JAWAB KOMPUTER (LJK) AI</h1>
                    <h2 className="text-[10pt] font-bold uppercase">{schoolProfile?.school_name}</h2>
                    <p className="text-[8pt] italic">{schoolProfile?.school_address}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border-2 border-black p-4 rounded-xl space-y-4">
                    <h3 className="font-black text-[9pt] uppercase tracking-widest border-b border-black pb-2 mb-2 text-center">IDENTITAS PESERTA</h3>
                    <div className="space-y-3">
                        <div><Label className="text-[8pt] font-bold uppercase">Nama Lengkap</Label><div className="h-8 border-b border-black flex items-end font-mono text-xl">.................................................</div></div>
                        <div><Label className="text-[8pt] font-bold uppercase">Kelas / Mata Pelajaran</Label><div className="h-8 border-b border-black flex items-end font-mono text-xl">{docMetadata.class_level} / {docMetadata.subject}</div></div>
                        <div><Label className="text-[8pt] font-bold uppercase">Hari & Tanggal</Label><div className="h-8 border-b border-black flex items-end font-mono text-xl">.................................................</div></div>
                    </div>
                </div>
                <div className="border-2 border-black p-4 rounded-xl">
                    <h3 className="font-black text-[9pt] uppercase tracking-widest border-b border-black pb-2 mb-4 text-center">KOLOM NIS (5 DIGIT)</h3>
                    <div className="flex justify-center gap-2">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="flex flex-col gap-1 items-center">
                                <div className="w-7 h-7 border border-black mb-1" />
                                {[0,1,2,3,4,5,6,7,8,9].map(n => (
                                    <div key={n} className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[7px] font-bold">{n}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative border-4 border-black p-8 rounded-3xl min-h-[140mm]">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-black" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-black" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-black" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black" />

                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                    {questions.map((q: any, idx: number) => {
                        const optionCount = q.options_json ? Object.keys(q.options_json).length : 5;
                        return (
                            <div key={q.id} className="flex items-center gap-3">
                                <span className="w-6 font-bold text-[10pt] text-right">{idx + 1}.</span>
                                <div className="flex gap-2">
                                    {q.question_type === 'true_false' ? (
                                        ['B', 'S'].map(opt => (
                                            <div key={opt} className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-black text-[10pt]">{opt}</div>
                                        ))
                                    ) : (
                                        ['A', 'B', 'C', 'D', 'E'].slice(0, optionCount).map(opt => (
                                            <div key={opt} className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-black text-[10pt]">{opt}</div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default function NaskahRepositoryClient({ 
    initialDocuments,
    schoolProfile 
}: { 
    initialDocuments: AiDocument[],
    schoolProfile: Profile | null
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filterClass, setFilterClass] = React.useState("all");
    const [filterSubject, setFilterSubject] = React.useState("all");
    const [loadingId, setLoadingId] = React.useState<string | null>(null);
    const [downloading, setDownloading] = React.useState(false);

    // Rendering State
    const [renderTarget, setRenderTarget] = React.useState<{ mode: 'soal' | 'kunci' | 'ljk', doc: AiDocument, questions: any[] } | null>(null);

    const filteredDocs = React.useMemo(() => {
        return initialDocuments.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                doc.subject?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClass = filterClass === "all" || doc.class_level === filterClass;
            const matchesSubject = filterSubject === "all" || doc.subject === filterSubject;
            return matchesSearch && matchesClass && matchesSubject;
        });
    }, [initialDocuments, searchTerm, filterClass, filterSubject]);

    const uniqueClasses = Array.from(new Set(initialDocuments.map(d => d.class_level).filter(Boolean))).sort();
    const uniqueSubjects = Array.from(new Set(initialDocuments.map(d => d.subject).filter(Boolean))).sort();

    const handlePrepareRender = async (docId: string, mode: 'soal' | 'kunci' | 'ljk') => {
        setDownloading(true);
        setLoadingId(docId);
        try {
            const result = await getNaskahDetailsAction(docId);
            if (result.success && result.questions && result.doc) {
                setRenderTarget({ mode, doc: result.doc as any, questions: result.questions });
                
                // Beri waktu agar DOM ter-render di hidden area
                setTimeout(() => handleExecuteCetak(result.doc.id, mode), 1200);
            } else {
                toast({ variant: "destructive", title: "Gagal Memuat Soal", description: result.error });
                setLoadingId(null);
                setDownloading(false);
            }
        } catch (e) {
            setLoadingId(null);
            setDownloading(false);
        }
    };

    const handleExecuteCetak = async (id: string, mode: string) => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageHeight = 297;
            const marginY = 15;
            let currentY = marginY;

            if (mode === 'ljk') {
                const element = document.getElementById(`ljk-target-${id}`);
                if (!element) throw new Error("Renderer not found");
                const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
            } else {
                // --- Smart Element Assembly Logic ---
                // 1. Render Header & Meta
                const header = document.querySelector(`#print-target-${id} .print-header-block`) as HTMLElement;
                if (header) {
                    const canvas = await html2canvas(header, { scale: 2, useCORS: true });
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const hHeight = (canvas.height * 210) / canvas.width;
                    pdf.addImage(imgData, 'JPEG', 0, currentY, 210, hHeight);
                    currentY += hHeight + 5;
                }

                // 2. Render Questions Individually to prevent cuts
                const qRows = document.querySelectorAll(`#print-target-${id} .print-item-block`);
                for (let i = 0; i < qRows.length; i++) {
                    const row = qRows[i] as HTMLElement;
                    const canvas = await html2canvas(row, { scale: 2, useCORS: true });
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const rHeight = (canvas.height * 210) / canvas.width;

                    // Check if row fits in current page
                    if (currentY + rHeight > pageHeight - marginY) {
                        pdf.addPage();
                        currentY = marginY;
                    }

                    pdf.addImage(imgData, 'JPEG', 0, currentY, 210, rHeight);
                    currentY += rHeight;
                }

                // 3. Render Footer
                const footer = document.querySelector(`#print-target-${id} .print-footer-block`) as HTMLElement;
                if (footer) {
                    if (currentY + 20 > pageHeight - marginY) { pdf.addPage(); currentY = marginY; }
                    const canvas = await html2canvas(footer, { scale: 2, useCORS: true });
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const fHeight = (canvas.height * 210) / canvas.width;
                    pdf.addImage(imgData, 'JPEG', 0, currentY, 210, fHeight);
                }
            }

            const fileName = `${mode.toUpperCase()}_${renderTarget?.doc.title.replace(/\s+/g, '_')}.pdf`;
            pdf.save(fileName);
            
            toast({ 
                title: "Berhasil!", 
                description: `File ${mode.toUpperCase()} telah berhasil diunduh.`,
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            });

        } catch (e: any) {
            console.error(e);
            toast({ variant: "destructive", title: "Gagal Cetak", description: e.message || "Terjadi kesalahan sistem saat merakit PDF." });
        } finally {
            setLoadingId(null);
            setRenderTarget(null);
            setDownloading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setLoadingId(id);
        const result = await deleteAiDocumentAction(id);
        if (result.success) {
            toast({ title: "Dihapus", description: "Naskah berhasil dihapus dari sistem." });
            router.refresh();
        }
        setLoadingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Loading Overlay */}
            {downloading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="p-10 rounded-[3rem] border-0 shadow-2xl flex flex-col items-center gap-6 bg-white/90">
                        <div className="relative">
                            <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
                            <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-2xl font-black text-slate-900 tracking-tight uppercase">Merakit Dokumen...</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Menghindari Pemotongan Konten</p>
                        </div>
                    </Card>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600" />
                    <Input 
                        placeholder="Cari naskah..." 
                        className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm font-bold" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-none">
                    <Select value={filterClass} onValueChange={setFilterClass}>
                        <SelectTrigger className="h-12 min-w-[140px] rounded-xl bg-white border-slate-200 font-bold text-xs shadow-sm">
                            <SelectValue placeholder="Semua Kelas" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all" className="font-bold">Semua Kelas</SelectItem>
                            {uniqueClasses.map(c => <SelectItem key={c} value={c!} className="font-bold">Kelas {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="h-12 min-w-[160px] rounded-xl bg-white border-slate-200 font-bold text-xs shadow-sm">
                            <SelectValue placeholder="Semua Mapel" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all" className="font-bold">Semua Mapel</SelectItem>
                            {uniqueSubjects.map(s => <SelectItem key={s} value={s!} className="font-bold">{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Hidden Rendering Area */}
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                {renderTarget && (
                    renderTarget.mode === 'ljk' ? (
                        <LjkPrintTemplate 
                            questions={renderTarget.questions} 
                            docMetadata={renderTarget.doc} 
                            schoolProfile={schoolProfile} 
                        />
                    ) : (
                        <NaskahPrintTemplate 
                            questions={renderTarget.questions} 
                            docMetadata={renderTarget.doc} 
                            config={{ showDiscussion: renderTarget.mode === 'kunci' }}
                            schoolProfile={schoolProfile}
                        />
                    )
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
                {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                        <Card key={doc.id} className="border-0 shadow-md rounded-[2.5rem] bg-white hover:shadow-xl transition-all duration-300 group overflow-hidden border border-slate-100">
                            <CardHeader className="pb-3 relative">
                                <div className="absolute top-4 right-4 z-10 flex gap-1">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl font-bold">Hapus Naskah?</AlertDialogTitle>
                                                <AlertDialogDescription className="font-medium">Dokumen akan dihapus dari sistem.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex flex-row gap-2 mt-4">
                                                <AlertDialogCancel className="flex-1 rounded-xl h-11 border-slate-200 font-bold">Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(doc.id)} className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 font-bold">
                                                    Ya, Hapus
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                                        <FileCard formatFile="doc" className="scale-90" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1 pr-10">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-emerald-100">Pro Ready</Badge>
                                        <div className="p-1 rounded-lg opacity-30"><AppLogo className="w-5 h-5" /></div>
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-black text-slate-900 mt-4 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {doc.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 p-2 px-3 rounded-xl bg-slate-50 text-slate-500">
                                        <Users className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-black uppercase">Kelas {doc.class_level || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 p-2 px-3 rounded-xl bg-slate-50 text-slate-500 flex-1 min-w-0">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-black uppercase truncate">{doc.subject || 'Umum'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 pl-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">
                                        {format(parseISO(doc.created_at), 'dd MMM yyyy', { locale: id })}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button 
                                        onClick={() => handlePrepareRender(doc.id, 'soal')} 
                                        disabled={loadingId === doc.id}
                                        className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2 shadow-xl shadow-indigo-100"
                                    >
                                        {loadingId === doc.id && renderTarget?.mode === 'soal' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                        Cetak Soal
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={() => handlePrepareRender(doc.id, 'kunci')}
                                        disabled={loadingId === doc.id}
                                        className="h-11 border-slate-200 hover:bg-indigo-50 text-indigo-700 rounded-2xl font-bold gap-2 shadow-sm"
                                    >
                                        {loadingId === doc.id && renderTarget?.mode === 'kunci' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                        Kunci/Pembahasan
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button 
                                        variant="outline"
                                        onClick={() => handlePrepareRender(doc.id, 'ljk')}
                                        disabled={loadingId === doc.id}
                                        className="h-11 border-indigo-100 text-indigo-600 bg-indigo-50/20 hover:bg-indigo-100 rounded-2xl font-bold gap-2 text-xs"
                                    >
                                        {loadingId === doc.id && renderTarget?.mode === 'ljk' ? <Loader2 className="h-3 w-3 animate-spin" /> : <SquareChartGantt className="h-3 w-3" />}
                                        LJK AI
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        asChild
                                        className="h-11 border border-dashed border-slate-200 rounded-2xl font-bold gap-2 text-xs"
                                    >
                                        <a href={doc.drive_file_url || "#"} target="_blank">
                                            <ExternalLink className="h-3 w-3" /> Edit Word
                                        </a>
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center opacity-20">
                        <FileText className="h-16 w-16 mb-4" />
                        <p className="font-black uppercase tracking-[0.2em] text-sm">Belum ada naskah tersusun</p>
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                .math-text-render svg {
                    max-width: 100%;
                    height: auto;
                }
            `}</style>
        </div>
    );
}
