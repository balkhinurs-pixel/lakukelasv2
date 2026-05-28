"use client";

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { 
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
    Printer,
    FileText,
    Download,
    X,
    Timer,
    ExternalLink,
    ArrowRight,
    Brain,
    Layers,
    Database,
    ShieldAlert,
    RefreshCw,
    Copy,
    ImageIcon,
    SquareChartGantt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { saveAs } from 'file-saver';
import { useRouter } from "next/navigation";
import type { Profile, GoogleDriveIntegration } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppLogo } from "@/components/icons";
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

// --- MathText Component for LaTeX, Markdown Tables, & Arabic Rendering ---
const MathText = ({ content, className, isPrint = false }: { content: string, className?: string, isPrint?: boolean }) => {
  if (!content) return null;
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className={cn("math-text-render w-full max-w-full", !isPrint && "overflow-hidden", className)}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return (
            <div key={i} className={cn(
                "my-3 w-full",
                !isPrint ? "overflow-x-auto overflow-y-hidden custom-scrollbar pb-2" : "overflow-visible"
            )}>
                <div className="min-w-fit">
                    <BlockMath math={part.slice(2, -2)} />
                </div>
            </div>
        );
        if (part.startsWith('\\(')) return <InlineMath key={i} math={part.slice(2, -2)} />;
        
        return (
            <ReactMarkdown 
                key={i} 
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({node, ...props}) => (
                        <div className={cn("my-6 rounded-xl border border-slate-200 shadow-sm", !isPrint ? "overflow-x-auto" : "overflow-visible")}>
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

// --- Komponen Template Print ---
const NaskahPrintTemplate = ({ 
    questions, 
    config 
}: { 
    questions: any[], 
    config: any 
}) => {
    const displayDate = config.date ? format(new Date(config.date), 'EEEE, d MMMM yyyy', { locale: id }) : format(new Date(), 'EEEE, d MMMM yyyy', { locale: id });

    return (
        <div 
            id="naskah-print-container" 
            className="bg-white text-slate-900" 
            style={{ 
                position: 'fixed', 
                left: '-9999px',  top: 0,
                width: '210mm',
                padding: '0',
                boxSizing: 'border-box',
                fontFamily: '"Times New Roman", Times, serif',
                lineHeight: '1.45',
                fontSize: '11pt',
                color: '#111'
            }}
        >
            {/* Header Naskah - Professional Standard */}
            <div id="print-header" style={{ padding: '15mm 16mm 8mm 16mm', width: '210mm', boxSizing: 'border-box' }}>
                <div className="flex items-center gap-6 mb-4">
                    <div className="w-[20mm] h-[20mm] flex items-center justify-center border border-slate-100 rounded-lg overflow-hidden shrink-0">
                        {config.logoUrl ? (
                             <img src={config.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <div className="p-2 opacity-20"><AppLogo /></div>
                        )}
                    </div>

                    <div className="flex-1 text-center pr-[20mm]">
                        <h1 className="text-[14pt] font-bold uppercase leading-tight" style={{ margin: 0 }}>
                            {config.schoolName || "SEKOLAH LAKUKELAS"}
                        </h1>
                        {config.schoolNpsn && (
                            <p className="text-[9pt] font-medium" style={{ margin: '1px 0' }}>NPSN: {config.schoolNpsn}</p>
                        )}
                        <p className="text-[9pt] italic" style={{ margin: '1px 0' }}>
                            {config.schoolAddress || "Alamat belum diatur"}
                        </p>
                        <p className="text-[9pt] italic" style={{ margin: 0 }}>
                            {config.schoolEmail ? `Email: ${config.schoolEmail}` : ''} 
                            {config.schoolWebsite ? ` | Website: ${config.schoolWebsite}` : ''}
                        </p>
                    </div>
                </div>
                <div style={{ borderBottom: '2.5pt double black', width: '100%', marginBottom: '6px' }} />

                <div className="text-center mb-6">
                    <h2 className="text-[12pt] font-bold uppercase underline" style={{ margin: 0 }}>
                        {config.examType || "PENILAIAN HARIAN"} TAHUN PELAJARAN {config.activeSchoolYearName || '2024/2025'}
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15mm', fontSize: '10pt', marginBottom: '15px', paddingLeft: '5mm', paddingRight: '5mm' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '35mm 4mm 1fr', gap: '0px' }}>
                        <span className="font-bold">Mata Pelajaran</span><span>:</span><span>{config.subject || "-"}</span>
                        <span className="font-bold">Kelas/Semester</span><span>:</span><span>{config.kelas || "-"} / {config.semester || 'Ganjil'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '35mm 4mm 1fr', gap: '0px' }}>
                        <span className="font-bold">Hari dan Tanggal</span><span>:</span><span>{displayDate}</span>
                        <span className="font-bold">Waktu</span><span>:</span><span>{config.duration || "90 Menit"}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="font-bold uppercase" style={{ fontSize: '11pt', marginBottom: '2px' }}>DATA SOAL UJIAN</p>
                    <p className="text-[10pt] italic">Kerjakan soal-soal berikut dengan teliti dan jujur!</p>
                </div>
            </div>

            {/* Container Soal - Lebar Terkunci untuk Mencegah Rumus Terpotong */}
            <div id="questions-list" style={{ width: '210mm', boxSizing: 'border-box' }}>
                {questions.map((q, idx) => {
                    const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];

                    return (
                        <div key={q.id} className="print-question-block" style={{ padding: '4px 16mm', marginBottom: '6px', boxSizing: 'border-box', breakInside: 'avoid' }}>
                            <div className="flex gap-3 mb-2">
                                <span className="font-bold min-w-[22px]">{idx + 1}.</span>
                                <div className={cn("flex-1 text-justify", q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')}>
                                    <MathText content={q.question_text} isPrint />
                                    
                                    {q.visual_svg && (
                                        <div 
                                            className="my-3 flex justify-center"
                                            style={{ maxWidth: '100%', height: 'auto' }}
                                            dangerouslySetInnerHTML={{ __html: q.visual_svg.replace('<svg', '<svg style="max-width:120mm;height:auto;max-height:55mm;" preserveAspectRatio="xMidYMid meet"') }}
                                        />
                                    )}
                                </div>
                            </div>
                            
                            {options.length > 0 && (
                                <div 
                                    className="ml-[28px]"
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: q.question_type === 'true_false' ? '1fr' : '1fr 1fr',
                                        columnGap: '20px',
                                        rowGap: '4px'
                                    }}
                                >
                                    {options.map(([k, v]) => (
                                        <div key={k} className="flex gap-2 items-start" style={{ minHeight: '22px' }}>
                                            <span className="font-bold min-w-[18px]">{k}.</span>
                                            <div className="flex-1 leading-normal" style={{ overflow: 'visible' }}>
                                                <MathText content={v} isPrint />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div id="print-footer" style={{ padding: '15mm 16mm', textAlign: 'center', fontSize: '9pt', fontStyle: 'italic', color: '#666', width: '210mm', boxSizing: 'border-box' }}>
                <p>-- Selamat Mengerjakan --</p>
            </div>

            {/* Halaman Kunci Jawaban (Terpisah) */}
            {config.includeKey && (
                <div id="answer-key-section" style={{ width: '210mm', boxSizing: 'border-box', borderTop: '1px dashed #ccc' }}>
                    <div id="key-header" style={{ padding: '15mm 16mm 5mm 16mm' }}>
                        <div style={{ borderBottom: '2pt double black', width: '100%', marginBottom: '10px' }} />
                        <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', textDecoration: 'underline', marginBottom: '5px' }}>
                            KUNCI JAWABAN & PEMBAHASAN
                        </h2>
                        <div style={{ fontSize: '10pt', marginBottom: '15px' }}>
                            <p>Mata Pelajaran: {config.subject} | Kelas: {config.kelas}</p>
                        </div>
                    </div>
                    {questions.map((q, idx) => (
                        <div key={`key-${q.id}`} className="print-answer-block" style={{ padding: '3px 16mm', marginBottom: '8px', boxSizing: 'border-box', breakInside: 'avoid' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '11pt' }}>{idx + 1}. Jawaban: {q.correct_answer}</p>
                            <div style={{ fontSize: '10pt', color: '#333', marginTop: '3px', textAlign: 'justify', borderLeft: '2px solid #ddd', paddingLeft: '8px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '8.5pt', color: '#777', display: 'block', marginBottom: '1px' }}>PEMBAHASAN:</span>
                                <MathText content={q.explanation} isPrint />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ITEMS_PER_PAGE = 5; 

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
        schoolNpsn: schoolProfile?.npsn || "",
        schoolAddress: schoolProfile?.school_address || "",
        schoolEmail: schoolProfile?.school_email || "",
        schoolWebsite: schoolProfile?.school_website || "",
        logoUrl: schoolProfile?.school_logo_url || "",
        jenjang: 'SMP / MTs',
        kelas: '7',
        semester: 'Ganjil',
        subject: 'Bahasa Indonesia',
        examType: "Penilaian Harian",
        date: format(new Date(), 'yyyy-MM-dd'),
        duration: "90 Menit",
        format: "pdf" as "pdf" | "doc",
        includeKey: true,
        activeSchoolYearName: activeSchoolYearName
    });

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterClass, filterSubject, filterTopic]);

    // Countdown Logic for Exporting
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

    const handleDeleteSingle = async (id: string) => {
        setDeletingId(id);
        const result = await deleteQuestionsAction([id]);
        if (result.success) {
            toast({ title: "Berhasil", description: "Soal telah dihapus dari Bank Soal." });
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

    const generateHighQualityPdf = async (): Promise<string> => {
        const headerEl = document.getElementById('print-header');
        const footerEl = document.getElementById('print-footer');
        const questionElements = document.querySelectorAll('.print-question-block');
        const keyHeaderEl = document.getElementById('key-header');
        const keyElements = document.querySelectorAll('.print-answer-block');

        if (!headerEl || questionElements.length === 0) throw new Error("Renderer area not found");

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const bottomMargin = 18;
        
        let currentY = 0;

        const renderElementToPdf = async (el: HTMLElement, yOffset: number) => {
            const canvas = await html2canvas(el, {
                scale: 3, 
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                imageTimeout: 0,
                removeContainer: true
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
            
            if (yOffset + imgHeight > pageHeight - bottomMargin) {
                pdf.addPage();
                yOffset = 15; 
            }
            
            pdf.addImage(imgData, 'JPEG', 0, yOffset, pageWidth, imgHeight);
            return yOffset + imgHeight;
        };

        currentY = await renderElementToPdf(headerEl as HTMLElement, 0);
        
        for (let i = 0; i < questionElements.length; i++) {
            currentY = await renderElementToPdf(questionElements[i] as HTMLElement, currentY);
            await new Promise(r => setTimeout(r, 50));
        }

        if (footerEl) {
            currentY = await renderElementToPdf(footerEl as HTMLElement, currentY);
        }

        if (naskahConfig.includeKey && keyHeaderEl && keyElements.length > 0) {
            pdf.addPage();
            currentY = await renderElementToPdf(keyHeaderEl as HTMLElement, 0);
            for (let i = 0; i < keyElements.length; i++) {
                currentY = await renderElementToPdf(keyElements[i] as HTMLElement, currentY);
                await new Promise(r => setTimeout(r, 50));
            }
        }

        return pdf.output('datauristring').split(',')[1];
    };

    const handleCreateNaskah = async () => {
        if (selectedOrderedIds.length === 0) return;
        
        if (userProvider === 'google' && (!driveIntegration || driveIntegration.status !== 'connected')) {
            setIsDriveAuthDialogOpen(true);
            return;
        }

        if (!naskahConfig.title) {
            toast({ title: "Judul Wajib Diisi", description: "Harap masukkan nama file naskah Anda.", variant: "destructive" });
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

            let binaryPdf: string | undefined;
            if (naskahConfig.format === 'pdf') {
                await new Promise(r => setTimeout(r, 1000)); 
                binaryPdf = await generateHighQualityPdf();
            }

            const result = await createNaskahUjianAction(
                naskahConfig.title, 
                selectedOrderedIds, 
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

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Loading Overlay for Exporting */}
            {exporting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-2xl animate-in fade-in duration-700">
                    <div className="relative p-10 sm:p-14 rounded-[3.5rem] bg-white/80 border border-white/40 shadow-2xl flex flex-col items-center text-center gap-8 max-w-[90vw] overflow-hidden">
                         <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl rounded-full animate-pulse" />
                         <div className="relative">
                             <LottieAiProcess size={220} />
                         </div>
                         <div className="space-y-6">
                             <div className="space-y-2">
                                <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">Menyusun<br/>Naskah Ujian</p>
                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] animate-pulse">Sistem Sedang Memproses Dokumen</p>
                             </div>
                             <div className="flex flex-col items-center gap-3">
                                <div className="relative w-20 h-20 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="40" cy="40" r="36" className="stroke-slate-100 fill-none" strokeWidth="6" />
                                        <motion.circle 
                                            cx="40" cy="40" r="36" 
                                            className="stroke-indigo-600 fill-none" 
                                            strokeWidth="6" 
                                            strokeLinecap="round"
                                            strokeDasharray="226"
                                            initial={{ strokeDashoffset: 226 }}
                                            animate={{ strokeDashoffset: 226 - (226 * (30 - countdown) / 30) }}
                                            transition={{ duration: 1, ease: "linear" }}
                                        />
                                    </svg>
                                    <span className="absolute font-mono font-black text-indigo-600 text-xl">{countdown}s</span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Selesai</p>
                             </div>
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
                {isExportDialogOpen && (
                    <NaskahPrintTemplate 
                        questions={selectedOrderedIds.map(id => initialQuestions.find(q => q.id === id)).filter(Boolean)} 
                        config={naskahConfig} 
                    />
                )}

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
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 sm:flex-none">
                                    <Button 
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-black uppercase tracking-widest px-6 shadow-lg shadow-emerald-100 h-12"
                                        onClick={() => setIsExportDialogOpen(true)}
                                    >
                                        <Printer className="h-5 w-5" />
                                        Cetak ({selectedOrderedIds.length})
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
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Filter className="h-5 w-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Saring Soal</span>
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
                                            {/* Button Hapus */}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl font-bold">Hapus Soal ini?</AlertDialogTitle>
                                                        <AlertDialogDescription className="font-medium">
                                                            Soal ini akan dihapus permanen dari Bank Soal Anda. Tindakan ini tidak dapat dibatalkan.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="flex flex-row gap-2 mt-4">
                                                        <AlertDialogCancel className="flex-1 rounded-xl h-11 border-slate-200 font-bold">Batal</AlertDialogCancel>
                                                        <AlertDialogAction 
                                                            onClick={() => handleDeleteSingle(q.id)} 
                                                            className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 font-bold"
                                                        >
                                                            {deletingId === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                            <div className="flex flex-wrap gap-1.5 justify-end md:justify-start">
                                                <Badge className={cn("font-black text-[9px] uppercase tracking-widest px-2 py-0.5", q.difficulty === 'sulit' ? "bg-rose-500" : q.difficulty === 'sedang' ? "bg-amber-500" : q.difficulty === 'mudah' ? "bg-emerald-500" : "bg-slate-500")}>{q.difficulty}</Badge>
                                                <Badge variant="outline" className="font-black text-[9px] uppercase border-slate-200 text-slate-400">Kelas {q.kelas}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-5 min-w-0">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 uppercase font-black text-[9px] tracking-widest px-2.5 py-1">
                                                <BookOpen className="w-3 h-3 mr-1.5 opacity-60" />
                                                {q.subject}
                                            </Badge>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 uppercase font-black text-[9px] tracking-widest px-2.5 py-1">
                                                <FileText className="w-3 h-3 mr-1.5 opacity-60" />
                                                {getQuestionTypeLabel(q.question_type)}
                                            </Badge>
                                        </div>

                                        <div className="text-slate-800 font-bold text-lg leading-relaxed break-words overflow-hidden min-w-0">
                                            <MathText content={q.question_text} className={cn(q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : '')} />
                                        </div>

                                        {/* Visual SVG Rendering Area */}
                                        {q.visual_svg && (
                                            <div className="my-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-3">
                                                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                                    <SquareChartGantt className="h-4 w-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Visualisasi Matematika AI</span>
                                                </div>
                                                <div 
                                                    className="w-full max-w-[400px] aspect-[1/1] flex items-center justify-center overflow-hidden"
                                                    style={{ height: 'auto', maxHeight: '400px' }}
                                                    dangerouslySetInnerHTML={{ __html: q.visual_svg.replace('<svg', '<svg style="width:100%;height:100%;max-width:400px;max-height:400px;" preserveAspectRatio="xMidYMid meet"') }}
                                                />
                                            </div>
                                        )}

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
                                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">KUNCI: {q.correct_answer}</p>
                                            <Button variant="ghost" size="sm" onClick={() => toggleDiscussion(q.id)} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest h-10 px-4 rounded-xl hover:bg-indigo-50">
                                                {expandedQuestions.has(q.id) ? "Tutup" : "Pembahasan"}
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

                <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                    <DialogContent className="rounded-xl p-0 max-w-lg border-0 shadow-2xl overflow-hidden bg-[#F8FAFF] dialog-content-mobile mobile-safe-area">
                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 text-white">
                            <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase text-center">Susun Naskah</DialogTitle>
                        </div>

                        <ScrollArea className="max-h-[60vh] p-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Judul Naskah</Label>
                                    <Input placeholder="e.g. UAS Matematika Semester Genap" value={naskahConfig.title} onChange={e => setNaskahConfig({...naskahConfig, title: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 font-bold" />
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Tanggal Pelaksanaan</Label>
                                        <Input type="date" value={naskahConfig.date} onChange={e => setNaskahConfig({...naskahConfig, date: e.target.value})} className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Alokasi Waktu</Label>
                                        <Input placeholder="e.g. 90 Menit" value={naskahConfig.duration} onChange={e => setNaskahConfig({...naskahConfig, duration: e.target.value})} className="h-11 rounded-xl bg-white border-slate-200 font-bold text-xs" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Format Ekspor</Label>
                                    <Select value={naskahConfig.format} onValueChange={(v: any) => setNaskahConfig({...naskahConfig, format: v})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="pdf" className="font-bold text-rose-600">PDF (High Quality Diagram)</SelectItem>
                                            <SelectItem value="doc" className="font-bold text-blue-600">Google Doc (Hanya Teks)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                    <Checkbox 
                                        id="include-key" 
                                        checked={naskahConfig.includeKey} 
                                        onCheckedChange={(v) => setNaskahConfig({...naskahConfig, includeKey: !!v})}
                                        className="h-5 w-5 rounded-md"
                                    />
                                    <Label htmlFor="include-key" className="text-xs font-bold text-slate-700 cursor-pointer">Sertakan Kunci Jawaban & Pembahasan</Label>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-8 bg-white border-t">
                            <Button onClick={handleCreateNaskah} disabled={exporting || !naskahConfig.title} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest gap-3 shadow-xl transition-all">
                                {exporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                                Simpan ke Google Drive
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                    <DialogContent className="rounded-xl p-0 max-w-sm border-0 shadow-2xl overflow-hidden bg-white">
                        <div className="p-10 flex flex-col items-center text-center">
                            <LottieSuccess size={200} />
                            <h3 className="text-2xl font-black text-slate-900 mt-2">Naskah Berhasil!</h3>
                            <Button asChild className="w-full h-12 mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2">
                                <a href={successFileUrl} target="_blank">
                                    <ExternalLink className="h-4 w-4" /> Buka di Drive
                                </a>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .math-text-render svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
            `}</style>
        </div>
    );
}
