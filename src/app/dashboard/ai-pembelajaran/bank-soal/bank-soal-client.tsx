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
    RefreshCw
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
import { cn } from "@/lib/utils";
import { saveAs } from 'file-saver';
import { useRouter } from "next/navigation";
import type { Profile, GoogleDriveIntegration } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppLogo } from "@/components/icons";
import { LottieSuccess } from "@/components/ui/lottie-success";
import { createClient } from "@/lib/supabase/client";

// --- MathText Component ---
const MathText = ({ content, className }: { content: string, className?: string }) => {
  if (!content) return null;
  const parts = content.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className={cn("math-text-render w-full overflow-hidden", className)}>
      {parts.map((part, i) => {
        if (part.startsWith('\\[')) return (
            <div key={i} className="my-2 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2 print:overflow-visible">
                <BlockMath math={part.slice(2, -2)} />
            </div>
        );
        if (part.startsWith('\\(')) return <InlineMath key={i} math={part.slice(2, -2)} />;
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
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
                left: '-9999px', 
                top: 0,
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
            <div id="print-header" style={{ padding: '15mm 16mm 10mm 16mm' }}>
                <div className="flex items-center gap-6 mb-4">
                    {/* Logo Area */}
                    <div className="w-[22mm] h-[22mm] flex items-center justify-center border border-slate-100 rounded-lg overflow-hidden shrink-0">
                        {config.logoUrl ? (
                             <img src={config.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <div className="p-2 opacity-20"><AppLogo /></div>
                        )}
                    </div>

                    <div className="flex-1 text-center pr-[22mm]">
                        <h1 className="text-[14pt] font-bold uppercase leading-tight" style={{ margin: 0 }}>
                            {config.schoolName || "SEKOLAH LAKUKELAS"}
                        </h1>
                        {config.schoolNpsn && (
                            <p className="text-[9pt] font-medium" style={{ margin: 0 }}>NPSN: {config.schoolNpsn}</p>
                        )}
                        <p className="text-[9pt] italic" style={{ margin: '2px 0' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '10pt', marginBottom: '20px', paddingLeft: '10px', paddingRight: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', gap: '2px' }}>
                        <span className="font-bold">Mata Pelajaran</span><span>:</span><span>{config.subject || "-"}</span>
                        <span className="font-bold">Kelas/Semester</span><span>:</span><span>{config.kelas || "-"} / {config.semester || 'Ganjil'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', gap: '2px' }}>
                        <span className="font-bold">Hari dan Tanggal</span><span>:</span><span>{displayDate}</span>
                        <span className="font-bold">Waktu</span><span>:</span><span>{config.duration || "90 Menit"}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="font-bold uppercase">I. PILIHAN GANDA</p>
                    <p className="text-[10pt] italic">Pilihlah salah satu jawaban yang paling tepat dengan memberi tanda silang (X) pada huruf A, B, C, D atau E!</p>
                </div>
            </div>

            {/* Container Soal */}
            <div id="questions-list">
                {questions.map((q, idx) => {
                    const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                    const isSma = options.length > 4;

                    return (
                        <div key={q.id} className="print-question-block" style={{ padding: '4px 16mm', marginBottom: '8px' }}>
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
                                        rowGap: '6px'
                                    }}
                                >
                                    {options.map(([k, v]) => (
                                        <div key={k} className="flex gap-2 items-start" style={{ minHeight: '24px' }}>
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

            <div id="print-footer" style={{ padding: '20mm 16mm', textAlign: 'center', fontSize: '9pt', fontStyle: 'italic', color: '#888' }}>
                <p>-- Selamat Mengerjakan --</p>
            </div>

            {/* Halaman Kunci Jawaban (Terpisah) */}
            {config.includeKey && (
                <div id="answer-key-section">
                    <div id="key-header" style={{ padding: '15mm 16mm 10mm 16mm', borderTop: '1px dashed #eee' }}>
                        <div style={{ borderBottom: '2.5pt double black', width: '100%', marginBottom: '10px' }} />
                        <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', textDecoration: 'underline', marginBottom: '10px' }}>
                            KUNCI JAWABAN & PEMBAHASAN
                        </h2>
                        <div style={{ fontSize: '10pt', marginBottom: '20px' }}>
                            <p>Mata Pelajaran: {config.subject}</p>
                            <p>Kelas: {config.kelas}</p>
                        </div>
                    </div>
                    {questions.map((q, idx) => (
                        <div key={`key-${q.id}`} className="print-answer-block" style={{ padding: '4px 16mm', marginBottom: '12px' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '11pt' }}>{idx + 1}. Jawaban: {q.correct_answer}</p>
                            <div style={{ fontSize: '10pt', color: '#333', marginTop: '4px', textAlign: 'justify', borderLeft: '2px solid #eee', paddingLeft: '10px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '9pt', color: '#888', display: 'block', marginBottom: '2px' }}>PEMBAHASAN:</span>
                                <MathText content={q.explanation} />
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
        date: "",
        duration: "90 Menit",
        format: "pdf" as "pdf" | "doc",
        includeKey: true,
        activeSchoolYearName: activeSchoolYearName
    });

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterClass, filterSubject, filterTopic]);

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

    const handleConnectDrive = async () => {
        if (!supabase) return;
        
        toast({ title: "Menghubungkan...", description: "Mengarahkan ke halaman izin Google Drive." });

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.href, // Kembali ke halaman bank soal ini
                scopes: "openid email profile https://www.googleapis.com/auth/drive.file",
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });

        if (error) {
            toast({ title: "Gagal", description: "Terjadi kesalahan saat memulai autentikasi.", variant: "destructive" });
        }
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
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
            
            if (yOffset + imgHeight > pageHeight - bottomMargin) {
                pdf.addPage();
                yOffset = 15; 
            }
            
            pdf.addImage(imgData, 'JPEG', 0, yOffset, pageWidth, imgHeight);
            return yOffset + imgHeight;
        };

        // Render Halaman Soal
        currentY = await renderElementToPdf(headerEl as HTMLElement, 0);
        for (let i = 0; i < questionElements.length; i++) {
            currentY = await renderElementToPdf(questionElements[i] as HTMLElement, currentY);
        }
        if (footerEl) {
            currentY = await renderElementToPdf(footerEl as HTMLElement, currentY);
        }

        // Render Halaman Kunci (Jika ada)
        if (naskahConfig.includeKey && keyHeaderEl && keyElements.length > 0) {
            pdf.addPage();
            currentY = await renderElementToPdf(keyHeaderEl as HTMLElement, 0);
            for (let i = 0; i < keyElements.length; i++) {
                currentY = await renderElementToPdf(keyElements[i] as HTMLElement, currentY);
            }
        }

        return pdf.output('datauristring').split(',')[1];
    };

    const handleCreateNaskah = async () => {
        if (selectedOrderedIds.length === 0) return;
        
        // Cek koneksi Drive sebelum memproses
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
                await new Promise(r => setTimeout(r, 1000)); // Buffer sync template
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
                setNaskahConfig(prev => ({ ...prev, title: "" }));
                router.refresh();
            } else {
                if (result.error?.toLowerCase().includes('token') || result.error?.toLowerCase().includes('google')) {
                    setIsDriveAuthDialogOpen(true);
                } else {
                    toast({ title: "Gagal", description: result.error || "Gagal memproses dokumen.", variant: "destructive" });
                }
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message || "Terjadi kesalahan sistem.", variant: "destructive" });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="relative space-y-10 pb-20 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 sm:p-14 text-white rounded-b-[4rem] shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 blur-2xl rounded-full -ml-10 -mb-10" />
                
                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                            Bank Soal AI
                        </h1>
                        <p className="text-indigo-100/80 text-sm sm:text-xl font-black uppercase tracking-[0.3em] mt-2 opacity-80">
                            Question Repository
                        </p>
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
                                <div className="hidden md:block">
                                    <div className="h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{filteredQuestions.length} SOAL</span>
                                    </div>
                                </div>
                            </div>
                            <Badge className="md:hidden w-full h-10 flex justify-center bg-indigo-50 text-indigo-700 border-indigo-100 uppercase font-black text-[9px] tracking-widest">{filteredQuestions.length} SOAL DITEMUKAN</Badge>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6 px-1">
                    {paginatedQuestions.map((q) => {
                        const selectionIdx = getSelectionIndex(q.id);
                        const isSelected = selectionIdx !== null;
                        
                        return (
                            <Card key={q.id} className={cn(
                                "border-2 rounded-xl bg-white overflow-hidden transition-all shadow-sm",
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
                                            <AnimatePresence>
                                                {isSelected && (
                                                    <motion.div 
                                                        initial={{ scale: 0 }} 
                                                        animate={{ scale: 1 }} 
                                                        exit={{ scale: 0 }}
                                                        className="absolute -top-3 -right-3 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white shadow-lg z-10"
                                                    >
                                                        {selectionIdx}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2 md:w-32">
                                            <div className="flex flex-wrap gap-1.5 justify-end md:justify-start">
                                                <Badge className={cn(
                                                    "font-black text-[9px] uppercase tracking-widest px-2 py-0.5",
                                                    q.difficulty === 'sulit' ? "bg-rose-500" : q.difficulty === 'sedang' ? "bg-amber-500" : "bg-emerald-500"
                                                )}>{q.difficulty}</Badge>
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
                                                {q.question_type === 'essay' ? 'Esai / Uraian' : 'Pilihan Ganda (PG)'}
                                            </Badge>
                                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 uppercase font-black text-[9px] tracking-widest px-2.5 py-1">
                                                <Brain className="w-3 h-3 mr-1.5 opacity-60" />
                                                {q.cognitive_level || 'C3 (Aplikasi)'}
                                            </Badge>
                                        </div>

                                        <div className="text-slate-800 font-bold text-lg leading-relaxed break-words overflow-hidden min-w-0">
                                            <MathText content={q.question_text} className={q.language_direction === 'rtl' ? 'text-right font-serif text-2xl' : ''} />
                                        </div>

                                        {q.options_json && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {Object.entries(q.options_json as Record<string, string>).sort().map(([k, v]) => (
                                                    <div key={k} className="p-4 rounded-xl border border-slate-100 bg-white text-xs font-bold flex gap-3 hover:border-indigo-200 transition-colors shadow-sm min-w-0 overflow-hidden">
                                                        <span className="text-indigo-600 font-black shrink-0">{k}.</span>
                                                        <div className="flex-1 min-w-0 overflow-hidden">
                                                            <MathText content={v} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-5 flex justify-between items-center border-t border-slate-100">
                                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">KUNCI: {q.correct_answer}</p>
                                            <Button variant="ghost" size="sm" onClick={() => toggleDiscussion(q.id)} className="text-[10px] font-black uppercase text-indigo-600 tracking-widest h-10 px-4 rounded-xl hover:bg-indigo-50">
                                                {expandedQuestions.has(q.id) ? "Tutup" : "Pembahasan"}
                                            </Button>
                                        </div>

                                        <AnimatePresence>
                                            {expandedQuestions.has(q.id) && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} 
                                                    animate={{ height: 'auto', opacity: 1 }} 
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
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
                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 text-white relative">
                            <div className="flex items-center justify-center text-center">
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight text-white uppercase">Susun Naskah</DialogTitle>
                                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">Ekspor ke Google Drive</p>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="max-h-[60vh] p-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Judul Naskah (Nama File)</Label>
                                    <Input placeholder="e.g. UAS Matematika Kelas 10" value={naskahConfig.title} onChange={e => setNaskahConfig({...naskahConfig, title: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 focus:ring-2 font-bold" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenjang</Label>
                                        <Select value={naskahConfig.jenjang} onValueChange={handleJenjangChange}>
                                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl border-0 shadow-2xl">
                                                {Object.keys(mapelByJenjang).map(j => <SelectItem key={j} value={j} className="font-bold">{j}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kelas</Label>
                                        <Select value={naskahConfig.kelas} onValueChange={v => setNaskahConfig({...naskahConfig, kelas: v})}>
                                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl border-0 shadow-2xl">
                                                {getClassOptions(naskahConfig.jenjang).map(k => <SelectItem key={k} value={k} className="font-bold">Kelas {k}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mata Pelajaran</Label>
                                    <Select value={naskahConfig.subject} onValueChange={v => setNaskahConfig({...naskahConfig, subject: v})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                            {(mapelByJenjang[naskahConfig.jenjang] || []).map(m => <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2"><Calendar className="h-3 w-3" /> Tanggal</Label>
                                        <Input type="date" value={naskahConfig.date} onChange={e => setNaskahConfig({...naskahConfig, date: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2"><Timer className="h-3 w-3" /> Durasi</Label>
                                        <Input placeholder="90 Menit" value={naskahConfig.duration} onChange={e => setNaskahConfig({...naskahConfig, duration: e.target.value})} className="h-12 rounded-xl bg-white border-slate-200 font-bold" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Jenis Asesmen</Label>
                                        <Select value={naskahConfig.examType} onValueChange={v => setNaskahConfig({...naskahConfig, examType: v})}>
                                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl border-0 shadow-2xl">
                                                <SelectItem value="Penilaian Harian" className="font-bold">Harian (UH)</SelectItem>
                                                <SelectItem value="Sumatif Akhir Semester" className="font-bold">SAS / UAS</SelectItem>
                                                <SelectItem value="Ujian Sekolah" className="font-bold">Ujian Sekolah</SelectItem>
                                                <SelectItem value="Latihan Mandiri" className="font-bold">Latihan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Format</Label>
                                        <Select value={naskahConfig.format} onValueChange={(v: any) => setNaskahConfig({...naskahConfig, format: v})}>
                                            <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl border-0 shadow-2xl">
                                                <SelectItem value="pdf" className="font-bold text-rose-600">PDF</SelectItem>
                                                <SelectItem value="doc" className="font-bold text-blue-600">Google Doc</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Kunci & Pembahasan</Label>
                                        <p className="text-[9px] text-slate-400 font-bold leading-tight">Sertakan lembar pembahasan di akhir naskah.</p>
                                    </div>
                                    <Checkbox 
                                        checked={naskahConfig.includeKey}
                                        onCheckedChange={(checked) => setNaskahConfig({...naskahConfig, includeKey: !!checked})}
                                        className="h-7 w-7 rounded-lg border-slate-200 bg-white"
                                    />
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-8 bg-white border-t">
                            <Button onClick={handleCreateNaskah} disabled={exporting || !naskahConfig.title} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                                {exporting ? <Loader2 className="h-6 w-6 animate-spin" /> : (naskahConfig.format === 'pdf' ? <Download className="h-6 w-6" /> : <CloudIcon className="h-6 w-6" />)}
                                Simpan ke Drive
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                    <DialogContent className="rounded-xl p-0 max-w-sm border-0 shadow-2xl overflow-hidden bg-white">
                        <div className="p-10 flex flex-col items-center text-center">
                            <LottieSuccess size={200} />
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Naskah Berhasil!</h3>
                            <p className="text-slate-500 font-bold text-sm mt-3 px-4 leading-relaxed">
                                Dokumen telah berhasil disusun, dikirim ke Google Drive, dan otomatis terunduh.
                            </p>
                            
                            <div className="w-full space-y-3 mt-8">
                                <Button asChild className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2">
                                    <a href={successFileUrl} target="_blank">
                                        <ExternalLink className="h-4 w-4" /> Buka di Drive
                                    </a>
                                </Button>
                                <Button variant="ghost" onClick={() => setIsSuccessDialogOpen(false)} className="w-full h-12 text-slate-400 font-bold hover:bg-slate-50">
                                    Selesai
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDriveAuthDialogOpen} onOpenChange={setIsDriveAuthDialogOpen}>
                    <DialogContent className="rounded-xl p-0 max-w-sm border-0 shadow-2xl overflow-hidden bg-white">
                        <div className="p-8 text-center space-y-6">
                            <div className="mx-auto w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Database className="h-10 w-10" />
                            </div>
                            <div className="space-y-2">
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Koneksi Drive Terputus</DialogTitle>
                                <DialogDescription className="text-sm font-medium text-slate-500">
                                    Sesi izin Google Drive Anda telah habis atau belum terhubung. Silakan hubungkan ulang untuk menyimpan naskah secara otomatis.
                                </DialogDescription>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3 text-left">
                                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                                    Klik tombol di bawah untuk memberikan izin akses folder "LakuKelas AI" di Drive Anda.
                                </p>
                            </div>
                            <Button 
                                onClick={handleConnectDrive} 
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                            >
                                <RefreshCw className="h-5 w-5" />
                                Hubungkan Google Drive
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsDriveAuthDialogOpen(false)} 
                                className="w-full h-10 text-slate-400 font-bold"
                            >
                                Batalkan
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-6">
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-xl h-10 w-10"><ChevronLeft className="h-4 w-4" /></Button>
                        <div className="flex items-center px-4 font-black text-sm text-slate-400 bg-slate-100 rounded-xl">{currentPage} / {totalPages}</div>
                        <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="rounded-xl h-10 w-10"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                )}
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .math-text-render .katex-display { 
                    margin: 0.5em 0; 
                    overflow-x: auto; 
                    overflow-y: hidden;
                    padding-bottom: 0.5em;
                }
                @media print {
                    .math-text-render .katex-display {
                        overflow-x: visible !important;
                    }
                }
                .math-text-render .katex {
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
}