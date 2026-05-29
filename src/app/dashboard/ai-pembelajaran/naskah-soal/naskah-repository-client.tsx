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
    AlertCircle,
    ScanQrCode
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

/**
 * MathText Component V29.0
 */
const MathText = ({ content, isPrint = false }: { content: string, isPrint?: boolean }) => {
  if (!content) return null;
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className={cn(
        "math-text-render w-full overflow-hidden", 
        isPrint ? "overflow-visible" : "custom-scrollbar pb-1"
    )}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return (
            <div key={i} className="my-3 overflow-x-auto overflow-y-hidden print:overflow-visible">
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

/**
 * NaskahPrintTemplate V29.0
 */
const NaskahPrintTemplate = ({ questions, docMetadata, config, schoolProfile }: any) => {
    return (
        <div 
            id={`print-target-${docMetadata.id}`} 
            className="bg-white text-slate-900 mx-auto" 
            style={{ 
                width: '210mm', 
                padding: '20mm',
                boxSizing: 'border-box',
                fontFamily: '"Times New Roman", Times, serif', 
                fontSize: '11pt', 
                lineHeight: '1.45' 
            }}
        >
            <div className="print-header-block mb-4 pb-4 border-b-[2.5pt] border-double border-black">
                <div className="flex items-center gap-6">
                    <div className="w-[22mm] h-[22mm] flex items-center justify-center shrink-0">
                        {schoolProfile?.school_logo_url ? (
                            <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                            <AppLogo className="opacity-20 w-full h-full" />
                        )}
                    </div>
                    <div className="flex-1 text-center pr-[22mm]">
                        <h1 className="text-[14pt] font-bold uppercase leading-tight">{schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}</h1>
                        {schoolProfile?.npsn && <p className="text-[10pt] font-bold">NPSN: {schoolProfile.npsn}</p>}
                        <p className="text-[9pt] italic leading-tight">{schoolProfile?.school_address || "Alamat sekolah belum diatur"}</p>
                    </div>
                </div>
            </div>

            <div className="text-center mb-6">
                <h2 className="text-[12pt] font-bold uppercase underline leading-tight">NASKAH SOAL {docMetadata.title}</h2>
                <p className="text-[11pt] font-bold uppercase mt-1">Mata Pelajaran: {docMetadata.subject}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10.5pt] mb-8 border border-black p-4 rounded-lg">
                <div className="flex justify-between border-b border-black/10 pb-1"><span className="font-bold">Kelas / Semester</span><span>: {docMetadata.class_level} / Ganjil</span></div>
                <div className="flex justify-between border-b border-black/10 pb-1"><span className="font-bold">Waktu Pengerjaan</span><span>: 90 Menit</span></div>
                <div className="flex justify-between pt-1"><span className="font-bold">Hari / Tanggal</span><span>: {format(new Date(), 'eeee, dd MMMM yyyy', { locale: id })}</span></div>
                <div className="flex justify-between pt-1"><span className="font-bold">Tahun Pelajaran</span><span>: 2024/2025</span></div>
            </div>

            <div className="questions-container">
                {questions.map((q: any, idx: number) => {
                    const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                    const isLongOptions = options.some(([, v]) => v.length > 50);
                    
                    return (
                        <div key={q.id} className="mb-6" style={{ breakInside: 'avoid' }}>
                            <div className="flex gap-4">
                                <span className="font-bold min-w-[20px]">{idx + 1}.</span>
                                <div className="flex-1 text-justify">
                                    <MathText content={q.question_text} isPrint />
                                    {q.visual_svg && (
                                        <div className="my-4 flex justify-center">
                                            <div 
                                                style={{ maxWidth: '50mm' }}
                                                dangerouslySetInnerHTML={{ 
                                                    __html: q.visual_svg.replace('<svg', '<svg style="width:100%; height:auto;" preserveAspectRatio="xMidYMid meet"') 
                                                }} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {options.length > 0 && (
                                <div className={cn(
                                    "ml-[36px] mt-2",
                                    isLongOptions ? "flex flex-col gap-1" : "grid grid-cols-2 gap-x-16 gap-y-1"
                                )}>
                                    {options.map(([k, v]) => (
                                        <div key={k} className="flex gap-2 items-start py-0.5">
                                            <span className="font-bold min-w-[15px]">{k}.</span>
                                            <div className="flex-1"><MathText content={v} isPrint /></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {config.showDiscussion && (
                                <div className="ml-[36px] mt-4 p-4 border-l-4 border-indigo-200 bg-slate-50 text-[10.5pt] italic rounded-r-lg">
                                    <p className="font-bold text-indigo-700 not-italic uppercase text-[9pt] mb-1">Kunci: {q.correct_answer}</p>
                                    <MathText content={q.explanation} isPrint />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * LjkPrintTemplate V29.0
 */
const LjkPrintTemplate = ({ docMetadata, questions, schoolProfile }: any) => {
    return (
        <div 
            id={`ljk-target-${docMetadata.id}`} 
            className="bg-white text-slate-900 relative mx-auto" 
            style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}
        >
            {/* Anchor Points for Scanner */}
            <div className="absolute top-4 left-4 w-5 h-5 bg-black" />
            <div className="absolute top-4 right-4 w-5 h-5 bg-black" />
            <div className="absolute bottom-4 left-4 w-5 h-5 bg-black" />
            <div className="absolute bottom-4 right-4 w-5 h-5 bg-black" />

            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-xl font-bold uppercase">LEMBAR JAWAB KOMPUTER (LJK) AI</h1>
                <p className="text-sm font-bold uppercase">{schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}</p>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-8">
                <div className="space-y-4">
                    <div className="border-2 border-black p-3 rounded-lg">
                        <p className="text-[10px] font-bold mb-2 uppercase">KOLOM IDENTITAS SISWA</p>
                        <div className="h-10 border-b border-black/20 flex items-end pb-1 text-sm font-bold italic text-slate-300 uppercase">Nama: ...........................................................</div>
                    </div>
                </div>
                <div className="border-2 border-black p-3 rounded-lg">
                    <p className="text-[10px] font-bold mb-2 uppercase text-center">KOLOM NIS (5 DIGIT)</p>
                    <div className="flex justify-center gap-1.5">
                        {[1,2,3,4,5].map(col => (
                            <div key={col} className="space-y-1">
                                <div className="w-8 h-8 border border-black flex items-center justify-center font-bold text-xs" />
                                {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                    <div key={num} className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-[9px] font-bold">{num}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-2 border-black p-6 rounded-xl">
                 <p className="text-[10px] font-bold mb-4 uppercase text-center bg-slate-100 py-1">KOLOM JAWABAN (PILIHAN GANDA / BENAR-SALAH)</p>
                 <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                    {questions.map((q: any, idx: number) => {
                        const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                        return (
                            <div key={q.id} className="flex items-center gap-3 py-1 border-b border-slate-50">
                                <span className="w-6 font-bold text-xs">{idx + 1}.</span>
                                <div className="flex gap-2.5">
                                    {options.map(opt => (
                                        <div key={opt} className="w-6 h-6 rounded-full border-[1.5pt] border-black flex items-center justify-center text-[10px] font-black">{opt}</div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Petunjuk Pengisian:</p>
                <p className="text-[9px] text-slate-500 italic leading-tight">1. Gunakan Pensil 2B atau Bolpoin Hitam yang pekat. 2. Bulatkan secara penuh di dalam lingkaran huruf. 3. Jangan melipat atau merobek kertas ini.</p>
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

    /**
     * Logika Ekspor PDF (V29.0)
     * Solusi untuk Blank PDF
     */
    const handleExecuteCetak = async (docId: string, mode: 'soal' | 'kunci' | 'ljk', title: string) => {
        setDownloading(true);
        setLoadingId(docId);
        
        try {
            const result = await getNaskahDetailsAction(docId);
            if (!result.success || !result.questions || !result.doc) throw new Error(result.error);
            
            // 1. Render elemen ke area khusus cetak di root
            setRenderTarget({ mode, doc: result.doc as any, questions: result.questions });
            
            // 2. Polling DOM sampai konten muncul
            const elementId = mode === 'ljk' ? `ljk-target-${docId}` : `print-target-${docId}`;
            let element = null;
            for (let i = 0; i < 20; i++) {
                element = document.getElementById(elementId);
                if (element) break;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            if (!element) throw new Error("Sistem gagal memuat area cetak. Silakan muat ulang halaman.");

            // Jeda tambahan untuk KaTeX rendering
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 3. Capture Snapshot
            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1000
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = 210; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const pdf = new jsPDF('p', 'mm', [imgWidth, imgHeight]);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            const fileName = `${mode.toUpperCase()}_${title.replace(/\s+/g, '_')}.pdf`;
            pdf.save(fileName);
            
            toast({ 
                title: "Unduh Berhasil!", 
                description: `File ${mode.toUpperCase()} siap dibuka.`,
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            });

        } catch (e: any) {
            toast({ variant: "destructive", title: "Gagal", description: e.message || "Terjadi kesalahan sistem." });
        } finally {
            setLoadingId(null);
            setRenderTarget(null);
            setDownloading(false);
        }
    };

    /**
     * Logika Cetak Langsung (Direct Print)
     * Solusi untuk hasil blank putih di pratinjau sistem
     */
    const handleDirectPrint = async (docId: string, mode: 'soal' | 'kunci' | 'ljk') => {
        setDownloading(true);
        setLoadingId(docId);
        try {
            const result = await getNaskahDetailsAction(docId);
            if (!result.success || !result.questions || !result.doc) throw new Error(result.error);
            
            // Set target render untuk memunculkan portal cetak
            setRenderTarget({ mode, doc: result.doc as any, questions: result.questions });
            
            // Tunggu ekstra lama (1.5 detik) agar mesin cetak browser menangkap elemen
            setTimeout(() => {
                window.print();
                
                // Cleanup setelah dialog cetak ditutup
                setLoadingId(null);
                setRenderTarget(null);
                setDownloading(false);
            }, 1500);
        } catch (e: any) {
            toast({ variant: "destructive", title: "Gagal", description: e.message });
            setLoadingId(null);
            setDownloading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setLoadingId(id);
        const result = await deleteAiDocumentAction(id);
        if (result.success) {
            toast({ title: "Dihapus", description: "Naskah berhasil dihapus." });
            router.refresh();
        }
        setLoadingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Loading Overlay Premium */}
            {downloading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="p-10 rounded-[3rem] border-0 shadow-2xl flex flex-col items-center gap-6 bg-white/90">
                        <div className="relative">
                            <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-slate-900 tracking-tight uppercase">Menyiapkan Naskah...</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Optimalisasi Vektor & Tata Letak</p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filter Toolbar */}
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

            {/* Area Render Khusus Cetak V29.0 (Portal Root) */}
            <div id="print-area" className={cn("print-container-root", renderTarget && "rendering")}>
                {renderTarget && (
                    renderTarget.mode === 'ljk' ? (
                        <LjkPrintTemplate docMetadata={renderTarget.doc} questions={renderTarget.questions} schoolProfile={schoolProfile} />
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

            {/* Kartu Naskah */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
                {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                        <Card key={doc.id} className="border-0 shadow-md rounded-[2.5rem] bg-white hover:shadow-xl transition-all duration-300 group overflow-hidden border border-slate-100">
                            <CardHeader className="pb-3 relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl font-bold">Hapus Naskah?</AlertDialogTitle>
                                                <AlertDialogDescription className="font-medium">Dokumen akan dihapus permanen.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex flex-row gap-2 mt-4">
                                                <AlertDialogCancel className="flex-1 rounded-xl h-11 border-slate-200 font-bold">Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(doc.id)} className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 font-bold">Ya, Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                                        <FileCard formatFile="pdf" className="scale-90" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1 pr-10">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-emerald-100">Vektor Ready</Badge>
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
                            </CardContent>
                            <CardFooter className="pt-0 flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button 
                                        onClick={() => handleDirectPrint(doc.id, 'soal')} 
                                        disabled={loadingId === doc.id}
                                        className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2 shadow-xl"
                                    >
                                        <Printer className="h-4 w-4" /> Cetak Soal
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleExecuteCetak(doc.id, 'soal', doc.title)}
                                        disabled={loadingId === doc.id}
                                        className="h-11 border-slate-200 hover:bg-indigo-50 text-indigo-700 rounded-2xl font-bold gap-2 shadow-sm"
                                    >
                                        <Download className="h-4 w-4" /> Unduh PDF
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleDirectPrint(doc.id, 'kunci')}
                                        className="h-11 border-amber-100 text-amber-700 bg-amber-50/20 hover:bg-amber-100 rounded-2xl font-bold gap-2 text-[10px] uppercase tracking-tighter"
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Kunci & Pembahasan
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleDirectPrint(doc.id, 'ljk')}
                                        className="h-11 border-emerald-100 text-emerald-700 bg-emerald-50/20 hover:bg-emerald-100 rounded-2xl font-bold gap-2 text-[10px] uppercase tracking-tighter"
                                    >
                                        <ScanQrCode className="h-4 w-4" /> Cetak LJK AI
                                    </Button>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    asChild
                                    className="w-full h-11 border border-dashed border-slate-200 rounded-2xl font-bold gap-2 text-xs"
                                >
                                    <a href={doc.drive_file_url || "#"} target="_blank">
                                        <ExternalLink className="h-3.5 w-3.5" /> Edit Google Doc
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center opacity-20">
                        <div className="p-10 rounded-[3rem] bg-slate-50 mb-4"><FileText className="h-16 w-16" /></div>
                        <p className="font-black uppercase tracking-[0.2em] text-sm">Belum ada naskah tersimpan</p>
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                .math-text-render svg {
                    max-width: 100%;
                    height: auto;
                }
            `}</style>
        </div>
    );
}
