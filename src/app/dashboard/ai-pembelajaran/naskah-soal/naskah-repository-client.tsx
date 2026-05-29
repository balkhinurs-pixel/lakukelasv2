
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
 * MathText Component V32.0 (Optimized for Table Context)
 */
const MathText = ({ content, isPrint = false }: { content: string, isPrint?: boolean }) => {
  if (!content) return null;
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className={cn(
        "math-text-render w-full overflow-hidden", 
        isPrint ? "overflow-visible text-justify" : "custom-scrollbar pb-1"
    )}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return (
            <div key={i} className="my-2 overflow-x-auto overflow-y-hidden print:overflow-visible">
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
                        <div className="overflow-x-auto my-4 border border-black overflow-hidden shadow-sm">
                            <table className="w-full border-collapse text-xs text-center border-black" {...props} />
                        </div>
                    ),
                    th: ({node, ...props}) => <th className="border border-black bg-slate-50 p-2 font-bold" {...props} />,
                    td: ({node, ...props}) => <td className="border border-black p-2" {...props} />,
                    p: ({node, ...props}) => <span className="whitespace-pre-wrap leading-relaxed inline-block" {...props} />,
                    li: ({node, ...props}) => <li className="text-[10pt] leading-tight" {...props} />
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
 * NaskahPrintTemplate V33.0 (Smart Matching Logic)
 */
const NaskahPrintTemplate = ({ questions, docMetadata, config, schoolProfile }: any) => {
    return (
        <div 
            id={`print-target-${docMetadata.id}`} 
            className="bg-white text-slate-900 mx-auto" 
            style={{ 
                width: '210mm', 
                padding: '10mm 20mm',
                boxSizing: 'border-box',
                fontFamily: '"Times New Roman", Times, serif', 
                fontSize: '11pt', 
                lineHeight: '1.45' 
            }}
        >
            {/* Kop Surat Profesional */}
            <div className="print-header-block mb-6 pb-2 border-b-[3pt] border-double border-black">
                <div className="flex items-center gap-8">
                    <div className="w-[25mm] h-[25mm] flex items-center justify-center shrink-0">
                        {schoolProfile?.school_logo_url ? (
                            <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                            <AppLogo className="opacity-20 w-full h-full text-slate-300" />
                        )}
                    </div>
                    <div className="flex-1 text-center pr-[25mm]">
                        <h1 className="text-[14pt] font-bold uppercase leading-tight">{schoolProfile?.school_name || "PEMERINTAH KOTA / KABUPATEN"}</h1>
                        <h2 className="text-[16pt] font-black uppercase leading-tight">{schoolProfile?.school_name || "DINAS PENDIDIKAN"}</h2>
                        {schoolProfile?.npsn && <p className="text-[10pt] font-bold mt-1">NPSN: {schoolProfile.npsn}</p>}
                        <p className="text-[9pt] italic leading-tight mt-1">{schoolProfile?.school_address || "Alamat lengkap sekolah belum diatur"}</p>
                    </div>
                </div>
            </div>

            {/* Judul Naskah */}
            <div className="text-center mb-8">
                <h3 className="text-[12pt] font-bold uppercase underline leading-tight">NASKAH SOAL {docMetadata.title}</h3>
                <div className="flex justify-center gap-10 mt-2 text-[11pt] font-bold uppercase">
                    <p>Mata Pelajaran: {docMetadata.subject}</p>
                    <p>Kelas: {docMetadata.class_level}</p>
                </div>
            </div>

            {/* Aturan Tata Letak Soal */}
            <div className="questions-container">
                {questions.map((q: any, idx: number) => {
                    const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                    const isTrueFalse = q.question_type === 'true_false';
                    const isMatching = q.question_type === 'matching';
                    
                    // Logic parsing untuk Menjodohkan
                    const lines = isMatching ? q.question_text.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '') : [];
                    const matchingItems = lines.filter((l: string) => /^\d+[\.\)]/.test(l));
                    const matchingIntro = lines.filter((l: string) => !/^\d+[\.\)]/.test(l)).join('\n');
                    const rowCount = isMatching ? Math.max(matchingItems.length, options.length) : 0;

                    return (
                        <div key={q.id} className="print-question-block mb-10">
                            <div className="flex gap-4 items-start">
                                <span className="font-bold min-w-[28pt] text-left">{idx + 1}.</span>
                                <div className="flex-1">
                                    {isMatching ? (
                                        matchingIntro && <MathText content={matchingIntro} isPrint />
                                    ) : (
                                        <MathText content={q.question_text} isPrint />
                                    )}
                                    
                                    {/* Visual Diagram SVG */}
                                    {q.visual_svg && (
                                        <div className="my-6 flex justify-center">
                                            <div 
                                                className="border border-slate-100 p-2 rounded-lg"
                                                style={{ maxWidth: '50mm', width: '100%' }}
                                                dangerouslySetInnerHTML={{ 
                                                    __html: q.visual_svg.replace('<svg', '<svg style="width:100%; height:auto;" preserveAspectRatio="xMidYMid meet"') 
                                                }} 
                                            />
                                        </div>
                                    )}

                                    {/* Layout Opsi Berdasarkan Tipe */}
                                    {isTrueFalse ? (
                                        <div className="mt-4 flex gap-12 items-center">
                                            {options.map(([k, v]) => (
                                                <div key={k} className="flex gap-2 items-center">
                                                    <span className="font-bold">{k}.</span>
                                                    <div className="font-bold uppercase tracking-wide">{v}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : isMatching ? (
                                        <div className="mt-6 border border-black rounded-lg overflow-hidden">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-black">
                                                        <th className="p-2 border-r border-black font-bold text-[9pt] uppercase text-center w-10">No</th>
                                                        <th className="p-2 border-r border-black font-bold text-[9pt] uppercase text-left">Pernyataan / Soal</th>
                                                        <th className="p-2 border-r border-black font-bold text-[9pt] uppercase text-center w-14">Pilih</th>
                                                        <th className="p-2 font-bold text-[9pt] uppercase text-left">Pilihan Jawaban</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.from({ length: rowCount }).map((_, i) => (
                                                        <tr key={i} className="border-b border-black last:border-b-0">
                                                            <td className="p-2 border-r border-black text-center font-bold">{i + 1}</td>
                                                            <td className="p-2 border-r border-black text-[10pt] min-w-[70mm]">
                                                                {matchingItems[i] ? (
                                                                    <MathText content={matchingItems[i].replace(/^\d+[\.\)]\s*/, '')} isPrint />
                                                                ) : (
                                                                    <div className="h-6 italic text-slate-300">...</div>
                                                                )}
                                                            </td>
                                                            <td className="p-2 border-r border-black text-center font-bold text-slate-200">
                                                                [.....]
                                                            </td>
                                                            <td className="p-2 text-[10pt] min-w-[50mm]">
                                                                {options[i] ? (
                                                                    <div className="flex gap-2 items-start">
                                                                        <span className="font-bold min-w-[15pt]">{options[i][0]}.</span>
                                                                        <MathText content={options[i][1]} isPrint />
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-6 italic text-slate-300">...</div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        options.length > 0 && (
                                            <div className={cn(
                                                "mt-4 grid grid-cols-2 gap-x-12 items-start",
                                                options.length === 4 ? "grid-rows-2" : "grid-rows-3",
                                                "grid-flow-col"
                                            )}>
                                                {options.map(([k, v]) => (
                                                    <div key={k} className="flex gap-2 items-start py-1">
                                                        <span className="font-bold min-w-[18pt]">{k}.</span>
                                                        <div className="flex-1"><MathText content={v} isPrint /></div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {/* Kunci/Pembahasan */}
                                    {config.showDiscussion && (
                                        <div className="mt-4 p-4 border-l-[3pt] border-indigo-200 bg-slate-50 text-[10pt] italic rounded-r-lg">
                                            <p className="font-bold text-indigo-800 not-italic uppercase text-[8.5pt] mb-2 tracking-widest">Analisis Jawaban (Kunci: {q.correct_answer})</p>
                                            <MathText content={q.explanation} isPrint />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 text-center border-t border-black pt-4 italic text-[9pt]">
                <p>*** Selamat Mengerjakan & Utamakan Kejujuran ***</p>
            </div>
        </div>
    );
};

/**
 * LjkPrintTemplate V31.0 (OMR Standard)
 */
const LjkPrintTemplate = ({ docMetadata, questions, schoolProfile }: any) => {
    return (
        <div 
            id={`ljk-target-${docMetadata.id}`} 
            className="bg-white text-slate-900 relative mx-auto" 
            style={{ 
                width: '210mm', 
                minHeight: '297mm', 
                padding: '15mm', 
                boxSizing: 'border-box', 
                fontFamily: 'Arial, sans-serif' 
            }}
        >
            <div className="absolute top-6 left-6 w-6 h-6 bg-black" />
            <div className="absolute top-6 right-6 w-6 h-6 bg-black" />
            <div className="absolute bottom-6 left-6 w-6 h-6 bg-black" />
            <div className="absolute bottom-6 right-6 w-6 h-6 bg-black" />

            <div className="text-center border-b-[2pt] border-black pb-4 mb-8">
                <h1 className="text-2xl font-black uppercase tracking-tight">LEMBAR JAWAB KOMPUTER (LJK) AI</h1>
                <p className="text-sm font-bold uppercase mt-1 tracking-widest">{schoolProfile?.school_name || "SISTEM ADMINISTRASI SEKOLAH LAKUKELAS"}</p>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-10">
                <div className="space-y-6">
                    <div className="border-2 border-black p-4 rounded-xl">
                        <p className="text-[10px] font-black mb-3 uppercase text-slate-500">Data Diri Peserta</p>
                        <div className="space-y-4">
                            <div className="h-10 border-b-2 border-black/10 flex items-end pb-1 text-sm font-black text-slate-300">NAMA: ...........................................................</div>
                            <div className="h-10 border-b-2 border-black/10 flex items-end pb-1 text-sm font-black text-slate-300">KELAS: ...........................................................</div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Instruksi Penting:</p>
                        <ul className="text-[8.5pt] space-y-1.5 font-medium leading-tight">
                            <li>1. Gunakan Pensil 2B atau Bolpoin Hitam pekat.</li>
                            <li>2. Bulatkan penuh huruf jawaban yang Anda pilih.</li>
                            <li>3. Bersihkan coretan di luar area bulatan.</li>
                            <li>4. JANGAN melipat atau merobek kertas ini.</li>
                        </ul>
                    </div>
                </div>
                <div className="border-2 border-black p-4 rounded-xl">
                    <p className="text-[10px] font-black mb-4 uppercase text-center text-slate-500 tracking-widest">KOLOM NIS (5 DIGIT)</p>
                    <div className="flex justify-center gap-2">
                        {[1,2,3,4,5].map(col => (
                            <div key={col} className="space-y-1.5">
                                <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-sm" />
                                {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                    <div key={num} className="w-7 h-7 rounded-full border-[1.5pt] border-black flex items-center justify-center text-[10px] font-black">{num}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-[2.5pt] border-black p-8 rounded-3xl">
                 <p className="text-[11px] font-black mb-6 uppercase text-center bg-slate-900 text-white py-2 rounded-lg tracking-[0.3em]">Lembar Jawaban Objektif</p>
                 <div className="grid grid-cols-2 gap-x-16 gap-y-3">
                    {questions.map((q: any, idx: number) => {
                        const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                        return (
                            <div key={q.id} className="flex items-center gap-4 py-1.5 border-b border-slate-100">
                                <span className="w-8 font-black text-sm text-slate-400">{idx + 1}.</span>
                                <div className="flex gap-3">
                                    {options.map(opt => (
                                        <div key={opt} className="w-7 h-7 rounded-full border-[2pt] border-black flex items-center justify-center text-[11px] font-black">{opt}</div>
                                    ))}
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

    const handleExecuteCetak = async (docId: string, mode: 'soal' | 'kunci' | 'ljk', title: string) => {
        setDownloading(true);
        setLoadingId(docId);
        
        try {
            const result = await getNaskahDetailsAction(docId);
            if (!result.success || !result.questions || !result.doc) throw new Error(result.error);
            
            setRenderTarget({ mode, doc: result.doc as any, questions: result.questions });
            
            const elementId = mode === 'ljk' ? `ljk-target-${docId}` : `print-target-${docId}`;
            let element = null;
            for (let i = 0; i < 20; i++) {
                element = document.getElementById(elementId);
                if (element) break;
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            if (!element) throw new Error("Sistem gagal memuat area cetak.");
            await new Promise(resolve => setTimeout(resolve, 1000));

            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = 210; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const pdf = new jsPDF('p', 'mm', [imgWidth, imgHeight]);
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            const fileName = `${mode.toUpperCase()}_${title.replace(/\s+/g, '_')}.pdf`;
            pdf.save(fileName);
            
            toast({ title: "Unduh Berhasil!", description: "File siap dibuka." });

        } catch (e: any) {
            toast({ variant: "destructive", title: "Gagal", description: e.message });
        } finally {
            setLoadingId(null);
            setRenderTarget(null);
            setDownloading(false);
        }
    };

    const handleDirectPrint = async (docId: string, mode: 'soal' | 'kunci' | 'ljk') => {
        setDownloading(true);
        setLoadingId(docId);
        try {
            const result = await getNaskahDetailsAction(docId);
            if (!result.success || !result.questions || !result.doc) throw new Error(result.error);
            
            setRenderTarget({ mode, doc: result.doc as any, questions: result.questions });
            
            setTimeout(async () => {
                if (typeof document !== 'undefined' && (document as any).fonts) {
                    await (document as any).fonts.ready;
                }
                window.print();
                setLoadingId(null);
                setRenderTarget(null);
                setDownloading(false);
            }, 1000); 
            
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
            {downloading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md">
                    <Card className="p-10 rounded-[3rem] border-0 shadow-2xl flex flex-col items-center gap-6 bg-white/90">
                        <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
                        <div className="text-center">
                            <p className="text-2xl font-black text-slate-900 tracking-tight uppercase">Menyiapkan Naskah...</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem sedang merakit dokumen</p>
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
                                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-emerald-100">Smart Layout</Badge>
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
                                <Button variant="ghost" asChild className="w-full h-11 border border-dashed border-slate-200 rounded-2xl font-bold gap-2 text-xs">
                                    <a href={doc.drive_file_url || "#"} target="_blank"><ExternalLink className="h-3.5 w-3.5" /> Edit Google Doc</a>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center opacity-20 group">
                        <Network className="h-16 w-16 mb-4" />
                        <p className="font-black uppercase tracking-[0.2em] text-sm">Belum ada naskah tersimpan</p>
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .math-text-render svg { max-width: 100%; height: auto; }
            `}</style>
        </div>
    );
}
