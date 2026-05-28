"use client";

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
    FileText, 
    ExternalLink, 
    Calendar, 
    Search, 
    BookOpen, 
    Users,
    Trash2,
    Edit,
    Clock,
    ArrowRight,
    Download,
    Loader2,
    X,
    Filter,
    Network,
    Printer,
    Save,
    ScanLine,
    LayoutGrid
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { deleteAiDocumentAction, renameAiDocumentAction, saveGenericDocumentToDrive } from "@/lib/actions/google-drive";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LottieAiProcess } from "@/components/ui/lottie-ai-process";
import { motion, AnimatePresence } from "framer-motion";

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
    const [renamingDoc, setRenamingDoc] = React.useState<AiDocument | null>(null);
    const [newTitle, setNewTitle] = React.useState("");

    // Kisi-kisi State
    const [generatedKisi, setGeneratedKisi] = React.useState<{ title: string, content: string } | null>(null);
    const [selectedDocForKisi, setSelectedDocForKisi] = React.useState<AiDocument | null>(null);
    const [isKisiLoading, setIsKisiLoading] = React.useState(false);
    const [savingKisi, setSavingKisi] = React.useState(false);

    // LJK State
    const [selectedDocForLjk, setSelectedDocForLjk] = React.useState<AiDocument | null>(null);
    const [isLjkLoading, setIsLjkLoading] = React.useState(false);

    // --- Filter Logic ---
    const uniqueClasses = Array.from(new Set(initialDocuments.map(d => d.class_level).filter(Boolean))).sort();
    const uniqueSubjects = Array.from(new Set(initialDocuments.map(d => d.subject).filter(Boolean))).sort();

    const filteredDocs = React.useMemo(() => {
        return initialDocuments.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                doc.subject?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClass = filterClass === "all" || doc.class_level === filterClass;
            const matchesSubject = filterSubject === "all" || doc.subject === filterSubject;
            
            return matchesSearch && matchesClass && matchesSubject;
        });
    }, [initialDocuments, searchTerm, filterClass, filterSubject]);

    const handleDelete = async (id: string) => {
        setLoadingId(id);
        const result = await deleteAiDocumentAction(id);
        if (result.success) {
            toast({ title: "Berhasil", description: "Naskah telah dihapus dari sistem dan Google Drive." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoadingId(null);
    };

    const handleRename = async () => {
        if (!renamingDoc || !newTitle.trim()) return;
        setLoadingId(renamingDoc.id);
        const result = await renameAiDocumentAction(renamingDoc.id, newTitle.trim());
        if (result.success) {
            toast({ title: "Berhasil", description: "Judul naskah telah diperbarui." });
            setRenamingDoc(null);
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoadingId(null);
    };

    const handleGenerateKisi = async (doc: AiDocument) => {
        setSelectedDocForKisi(doc);
        setIsKisiLoading(true);
        setGeneratedKisi(null);

        const result = await generateKisiKisiAction(doc.id);
        
        if (result.success && result.data) {
            setGeneratedKisi(result.data);
            toast({ title: "Kisi-kisi Selesai", description: "Matriks soal telah dirumuskan oleh AI." });
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
            setSelectedDocForKisi(null);
        }
        setIsKisiLoading(false);
    };

    const handleDownloadLjk = async (docData: AiDocument) => {
        setIsLjkLoading(true);
        setSelectedDocForLjk(docData);
        
        try {
            // Ambil detail butir soal asli dari database untuk menentukan tipe bulatan
            const result = await getNaskahDetailsAction(docData.id);
            if (!result.success || !result.questions) {
                throw new Error(result.error || "Gagal memuat detail naskah.");
            }

            const doc = new jsPDF('p', 'mm', 'a4') as any;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            
            // --- DRAW LJK DESIGN (REVISED: NIS 5 DIGIT, MAPEL MANUAL) ---
            
            // 1. Header Area (Sinkron dengan Data Sekolah)
            const headerY = margin;
            doc.setDrawColor(0).setLineWidth(0.5);
            doc.rect(margin, headerY, 90, 25); // Left Header Box
            doc.rect(margin + 90, headerY, pageWidth - (margin * 2) - 90, 25); // Right Header Box (Instructions)
            
            // Identitas Sekolah di Header
            doc.setFont('helvetica', 'bold').setFontSize(10);
            doc.text("ASESMEN MADRASAH / SEKOLAH", margin + 25, headerY + 8);
            doc.text(schoolProfile?.school_name?.toUpperCase() || "NAMA SEKOLAH ANDA", margin + 25, headerY + 14);
            doc.setFontSize(8).setFont('helvetica', 'normal');
            doc.text(schoolProfile?.school_address || "Alamat belum diatur di Pengaturan", margin + 25, headerY + 20);

            // Instructions Box (Right)
            doc.setFont('helvetica', 'bold').setFontSize(9);
            const midX = margin + 90 + ((pageWidth - (margin * 2) - 90) / 2);
            doc.setFillColor(80, 80, 80).rect(margin + 90, headerY, pageWidth - (margin * 2) - 90, 5, 'F');
            doc.setTextColor(255).text("PETUNJUK UMUM", midX, headerY + 3.5, { align: 'center' });
            doc.setTextColor(0).setFontSize(7).setFont('helvetica', 'normal');
            doc.text("1. Lembar Jawaban tidak boleh kotor, basah, robek, atau terlipat.", margin + 93, headerY + 10);
            doc.text("2. Tulislah nama, kelas, serta semua data lainnya dengan benar.", margin + 93, headerY + 15);
            doc.text("3. Hitamkan bulatan pada pilihan jawaban yang dianggap benar.", margin + 93, headerY + 20);

            // Logo Sekolah (Jika ada)
            if (schoolProfile?.school_logo_url) {
                try {
                    doc.addImage(schoolProfile.school_logo_url, 'PNG', margin + 2, headerY + 2, 20, 20);
                } catch(e) { console.error("Logo gagal dimuat ke LJK"); }
            }

            // 2. Exam Type Banner
            doc.setFillColor(80, 80, 80).rect(margin, headerY + 25, 90, 6, 'F');
            doc.setTextColor(255).setFontSize(8).setFont('helvetica', 'bold');
            doc.text("LEMBAR JAWAB PENILAIAN SISWA", margin + 45, headerY + 29, { align: 'center' });

            // 3. Identity Area
            const identityY = headerY + 31;
            doc.setDrawColor(0).setLineWidth(0.3);
            doc.rect(margin + 90, identityY, pageWidth - (margin * 2) - 90, 25);
            doc.setFillColor(80, 80, 80).rect(margin + 90, identityY, pageWidth - (margin * 2) - 90, 5, 'F');
            doc.setTextColor(255).text("IDENTITAS DIRI", midX, identityY + 3.5, { align: 'center' });
            doc.setTextColor(0).setFontSize(9).setFont('helvetica', 'normal');
            doc.text("Nama Lengkap : .....................................................................", margin + 93, identityY + 12);
            doc.text("Kelas              : .....................................................................", margin + 93, identityY + 18);
            doc.text("Hari/Tanggal : .....................................................................", margin + 93, identityY + 24);

            // 4. Instructions Drawing
            doc.setFontSize(8).setFont('helvetica', 'bold');
            doc.text("Cara menjawab pada lembar jawaban :", margin + 10, headerY + 38);
            doc.circle(margin + 15, headerY + 44, 1.8, 'F'); doc.text("Benar", margin + 35, headerY + 44.5);
            doc.circle(margin + 15, headerY + 50, 1.8, 'S'); doc.text("Salah", margin + 35, headerY + 50.5);
            doc.circle(margin + 50, headerY + 44, 1.8, 'S'); doc.text("Salah", margin + 70, headerY + 44.5);
            doc.circle(margin + 50, headerY + 50, 1.8, 'S'); doc.text("Salah", margin + 70, headerY + 50.5);

            // 5. Subject Writing Area (REVISED: MANUAL)
            const subjectY = identityY + 30;
            doc.setFillColor(80, 80, 80).rect(margin, subjectY, pageWidth - (margin * 2), 6, 'F');
            doc.setTextColor(255).text("MATA PELAJARAN", pageWidth / 2, subjectY + 4.5, { align: 'center' });
            doc.setDrawColor(0).rect(margin, subjectY + 6, pageWidth - (margin * 2), 12);
            doc.setTextColor(0).setFontSize(10).setFont('helvetica', 'bold');
            doc.text("Mata Pelajaran : .........................................................................................................................................", margin + 5, subjectY + 14);

            // 6. Main Answer Area
            const mainY = subjectY + 25;
            doc.setFillColor(80, 80, 80).rect(margin, mainY - 6, pageWidth - (margin * 2), 6, 'F');
            doc.setTextColor(255).setFontSize(9).setFont('helvetica', 'bold').text("LEMBAR JAWAB", pageWidth / 2, mainY - 1.5, { align: 'center' });

            // 6a. NIS Block (REVISED: 5 DIGIT)
            doc.setTextColor(0).setFontSize(8);
            doc.setFillColor(80, 80, 80).rect(margin + 5, mainY + 2, 40, 5, 'F');
            doc.setTextColor(255).text("No. Ujian / NIS", margin + 25, mainY + 5.5, { align: 'center' });
            doc.setTextColor(0);
            for(let i=0; i<5; i++) doc.rect(margin + 8 + (i * 7.5), mainY + 8, 7, 6);
            for(let row=0; row<10; row++) {
                doc.text(String(row), margin + 4, mainY + 18.5 + (row * 5));
                for(let col=0; col<5; col++) {
                    doc.circle(margin + 11.5 + (col * 7.5), mainY + 17.5 + (row * 5), 1.8, 'S');
                }
            }

            // 6b. Questions Grid (Dinamis Berdasarkan Data Database)
            const questions = result.questions;
            const colWidth = 35;
            const startX = margin + 55;
            
            const renderBubbles = (q: any, idx: number, x: number, y: number) => {
                doc.setFontSize(7).text(String(idx + 1), x - 6, y + 0.5);
                
                if (q.question_type === 'multiple_choice') {
                    // Ambil jumlah opsi dari data JSON di database
                    const optCount = q.options_json ? Object.keys(q.options_json).length : 4;
                    const opts = ['A', 'B', 'C', 'D', 'E'];
                    for(let i=0; i<optCount; i++) {
                        doc.circle(x + (i * 6), y - 0.5, 1.8, 'S');
                        doc.setFontSize(5).text(opts[i], x + (i * 6) - 0.8, y + 0.2);
                    }
                } else if (q.question_type === 'true_false') {
                    const opts = ['B', 'S'];
                    for(let i=0; i<2; i++) {
                        doc.circle(x + (i * 6), y - 0.5, 1.8, 'S');
                        doc.setFontSize(5).text(opts[i], x + (i * 6) - 0.8, y + 0.2);
                    }
                } else {
                    doc.line(x, y + 0.5, x + 20, y + 0.5); 
                }
            };

            // Question Grid Header
            for(let c=0; colWidth*c < (pageWidth - startX - margin); c++) {
                const x = startX + (c * colWidth) + 6;
                doc.setFillColor(80, 80, 80).rect(x - 2, mainY + 2, colWidth - 8, 5, 'F');
                doc.setTextColor(255).setFontSize(7).text("A  B  C  D  (E)", x + 3, mainY + 5.5);
                doc.setTextColor(0);
            }

            questions.slice(0, 40).forEach((q: any, idx: number) => {
                const col = Math.floor(idx / 10);
                const row = idx % 10;
                const x = startX + (col * colWidth) + 6;
                const y = mainY + 12 + (row * 6.5);
                renderBubbles(q, idx, x, y);
            });

            // 7. Essay Section (Otomatis Muncul jika ada soal uraian di database)
            const hasEssay = questions.some((q: any) => q.question_type === 'essay');
            if (hasEssay) {
                const essayY = mainY + 85;
                doc.setFillColor(80, 80, 80).rect(margin, essayY, pageWidth - (margin * 2), 6, 'F');
                doc.setTextColor(255).setFontSize(9).setFont('helvetica', 'bold').text("ESSAY / URAIAN", pageWidth / 2, essayY + 4.5, { align: 'center' });
                doc.setDrawColor(0).rect(margin, essayY + 6, pageWidth - (margin * 2), 50);
            }

            // 8. OMR Anchor Points (Kotak Hitam untuk Akurasi Scan)
            doc.setFillColor(0).rect(margin, mainY + 2, 4, 4, 'F'); // Top Left
            doc.rect(pageWidth - margin - 4, mainY + 2, 4, 4, 'F'); // Top Right
            doc.rect(margin, mainY + 80, 4, 4, 'F'); // Bottom Left
            doc.rect(pageWidth - margin - 4, mainY + 80, 4, 4, 'F'); // Bottom Right

            doc.save(`LJK_${docData.title.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "LJK Berhasil Dibuat", description: "Format telah disinkronkan dengan data sekolah dan soal." });
        } catch (error: any) {
            toast({ title: "Gagal", description: error.message, variant: "destructive" });
        } finally {
            setIsLjkLoading(false);
            setSelectedDocForLjk(null);
        }
    };

    const handleSaveKisiToDrive = async () => {
        if (!generatedKisi || !selectedDocForKisi) return;
        setSavingKisi(true);
        
        const metadata = {
            jenjang: "Umum",
            class: selectedDocForKisi.class_level || "Umum",
            subject: selectedDocForKisi.subject || "Umum"
        };

        const result = await saveGenericDocumentToDrive(
            generatedKisi.title,
            generatedKisi.content,
            metadata,
            'Bank Soal', 
            'doc'
        );

        if (result.success) {
            toast({ 
                title: "Tersimpan!", 
                description: "Kisi-kisi telah disimpan ke Drive.",
                action: <Button variant="outline" size="sm" asChild><a href={result.file_url || "#"} target="_blank">Buka File</a></Button>
            });
            setGeneratedKisi(null);
            setSelectedDocForKisi(null);
            router.refresh();
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setSavingKisi(false);
    };

    const handleDownloadPdf = (doc: AiDocument) => {
        if (doc.mime_type?.includes('google-apps.document')) {
            const exportUrl = `https://docs.google.com/document/d/${doc.drive_file_id}/export?format=pdf`;
            window.open(exportUrl, '_blank');
        } else {
            window.open(doc.drive_file_url || "#", '_blank');
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setFilterClass("all");
        setFilterSubject("all");
    };

    return (
        <div className="space-y-6">
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
                            <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-indigo-600" />
                                <SelectValue placeholder="Semua Kelas" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                            <SelectItem value="all" className="font-bold">Semua Kelas</SelectItem>
                            {uniqueClasses.map(c => <SelectItem key={c} value={c!} className="font-bold">Kelas {c}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="h-12 min-w-[160px] rounded-xl bg-white border-slate-200 font-bold text-xs shadow-sm">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                                <SelectValue placeholder="Semua Mapel" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                            <SelectItem value="all" className="font-bold">Semua Mapel</SelectItem>
                            {uniqueSubjects.map(s => <SelectItem key={s} value={s!} className="font-bold">{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    {(filterClass !== 'all' || filterSubject !== 'all' || searchTerm) && (
                        <Button variant="ghost" size="icon" onClick={resetFilters} className="h-12 w-12 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
                {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                        <Card key={doc.id} className="border-0 shadow-md rounded-[2.5rem] bg-white hover:shadow-xl transition-all duration-300 group overflow-hidden border border-slate-100">
                            <CardHeader className="pb-3 relative">
                                <div className="absolute top-4 right-4 z-10 flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-9 w-9 rounded-full text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => { setRenamingDoc(doc); setNewTitle(doc.title); }}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl font-bold">Hapus Naskah?</AlertDialogTitle>
                                                <AlertDialogDescription className="font-medium">
                                                    Dokumen "<span className="font-bold text-slate-900">{doc.title}</span>" akan dihapus permanen dari sistem dan Google Drive.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex flex-row gap-2 mt-4">
                                                <AlertDialogCancel className="flex-1 rounded-xl h-11 border-slate-200 font-bold">Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(doc.id)} className="flex-1 rounded-xl h-11 bg-rose-600 hover:bg-rose-700 font-bold">
                                                    {loadingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                                        <FileCard formatFile={doc.mime_type?.includes('pdf') ? 'pdf' : 'doc'} className="scale-90" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2 pr-12">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-100">
                                            {doc.mime_type?.includes('pdf') ? 'Original PDF' : 'Editable Doc'}
                                        </Badge>
                                        <div className="p-1.5 rounded-lg bg-indigo-50/50">
                                            <div className="w-5 h-5 opacity-40"><AppLogo /></div>
                                        </div>
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
                                <div className="flex gap-2 w-full">
                                    <Button asChild className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2 shadow-lg shadow-indigo-100 group/btn">
                                        <a href={doc.drive_file_url || "#"} target="_blank">
                                            <ExternalLink className="h-4 w-4" />
                                            Buka
                                            <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover/btn:opacity-100 transition-all group-hover/btn:translate-x-1" />
                                        </a>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => handleGenerateKisi(doc)}
                                        disabled={isKisiLoading && selectedDocForKisi?.id === doc.id}
                                        className="flex-1 h-12 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-2xl font-bold gap-2 shadow-sm"
                                    >
                                        {isKisiLoading && selectedDocForKisi?.id === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                                        Kisi-kisi
                                    </Button>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleDownloadLjk(doc)}
                                        disabled={isLjkLoading && selectedDocForLjk?.id === doc.id}
                                        className="flex-1 h-11 border-indigo-100 text-indigo-600 bg-indigo-50/30 hover:bg-indigo-100 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2"
                                    >
                                        {isLjkLoading && selectedDocForLjk?.id === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
                                        Cetak LJK AI
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => handleDownloadPdf(doc)}
                                        className="flex-1 h-11 border border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2"
                                    >
                                        <Download className="h-3.5 w-3.5" /> PDF
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center opacity-20 group">
                        <div className="p-10 rounded-[3rem] bg-slate-50 mb-6 group-hover:bg-indigo-50 transition-colors">
                            <FileText className="h-16 w-16" />
                        </div>
                        <p className="font-black uppercase tracking-[0.2em] text-sm">
                            {initialDocuments.length === 0 ? "Belum ada naskah tersimpan" : "Naskah tidak ditemukan"}
                        </p>
                    </div>
                )}
            </div>

            {/* Rename Dialog */}
            <Dialog open={!!renamingDoc} onOpenChange={(open) => !open && setRenamingDoc(null)}>
                <DialogContent className="rounded-3xl border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Ubah Judul Naskah</DialogTitle>
                        <DialogDescription>Masukkan nama baru untuk file naskah soal ini.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Baru</Label>
                        <Input 
                            value={newTitle} 
                            onChange={(e) => setNewTitle(e.target.value)} 
                            placeholder="Judul Naskah..." 
                            className="h-12 rounded-xl font-bold"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setRenamingDoc(null)} className="flex-1 rounded-xl">Batal</Button>
                        <Button onClick={handleRename} disabled={loadingId === renamingDoc?.id} className="flex-1 rounded-xl bg-indigo-600 font-bold">
                            {loadingId === renamingDoc?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Judul"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Kisi-kisi Preview Dialog */}
            <Dialog open={!!selectedDocForKisi} onOpenChange={(open) => { if(!open && !isKisiLoading) { setSelectedDocForKisi(null); setGeneratedKisi(null); } }}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-0 shadow-2xl bg-white dialog-content-mobile mobile-safe-area">
                    <div className="flex flex-col h-[90vh] relative">
                        {isKisiLoading && (
                            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-2xl animate-in fade-in duration-700">
                                <div className="relative p-10 sm:p-14 rounded-[3.5rem] bg-white/80 border border-white/40 shadow-2xl flex flex-col items-center text-center gap-8 max-w-[90vw]">
                                     <div className="relative"><LottieAiProcess size={220} /></div>
                                     <div className="space-y-2">
                                        <p className="text-3xl font-black text-slate-900 tracking-tight uppercase">Merangkum Kisi-kisi...</p>
                                        <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] animate-pulse">AI Pedagogis Sedang Memetakan Soal</p>
                                     </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-8 text-white shrink-0">
                            <div className="flex flex-col items-center text-center">
                                <DialogHeader><DialogTitle className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">Pratinjau Kisi-kisi</DialogTitle></DialogHeader>
                                <p className="text-indigo-100 font-bold text-xs uppercase tracking-[0.2em] mt-3">Matriks Kurikulum • {selectedDocForKisi?.title}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto overflow-y-auto px-4 py-6 sm:px-10 sm:py-10 custom-scrollbar bg-slate-50/50">
                            <AnimatePresence mode="wait">
                                {generatedKisi ? (
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
                                            <div className="flex items-center gap-6 mb-4 pb-4 border-b-2 border-black">
                                                <div className="w-20 h-20 flex items-center justify-center shrink-0">
                                                    {schoolProfile?.school_logo_url ? <img src={schoolProfile.school_logo_url} alt="Logo" className="w-full h-full object-contain" /> : <div className="p-2 opacity-20"><AppLogo /></div>}
                                                </div>
                                                <div className="flex-1 text-center pr-20">
                                                    <h2 className="text-xl font-bold uppercase leading-tight">{schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}</h2>
                                                    {schoolProfile?.npsn && <p className="text-xs font-bold">NPSN: {schoolProfile.npsn}</p>}
                                                    <p className="text-xs italic">{schoolProfile?.school_address || "Alamat sekolah belum diatur"}</p>
                                                </div>
                                            </div>

                                            <div className="text-center mb-8">
                                                <h1 className="text-lg font-bold uppercase underline">KISI-KISI PENULISAN SOAL</h1>
                                                <p className="text-sm font-bold uppercase mt-1">TAHUN PELAJARAN 2024/2025</p>
                                            </div>

                                            <div className="prose prose-slate max-w-none text-slate-800">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]} 
                                                    components={{
                                                        table: ({node, ...props}) => <table className="w-full border-collapse border-2 border-black my-6 text-[10px]" {...props} />,
                                                        th: ({node, ...props}) => <th className="border-2 border-black bg-slate-50 p-2 font-bold text-center" {...props} />,
                                                        td: ({node, ...props}) => <td className="border-2 border-black p-2 align-top" {...props} />,
                                                        h1: ({node, ...props}) => <h2 className="text-base font-black uppercase text-indigo-700 mt-8 mb-4 border-l-4 border-indigo-600 pl-3" {...props} />,
                                                        p: ({node, ...props}) => <p className="mb-4 text-justify text-xs" {...props} />,
                                                    }}
                                                >
                                                    {generatedKisi.content}
                                                </ReactMarkdown>
                                            </div>

                                            <div className="mt-12 flex justify-between text-xs px-10">
                                                <div className="text-center">
                                                    <p>Mengetahui,</p>
                                                    <p className="mb-20">Kepala Sekolah</p>
                                                    <p className="font-bold underline">{schoolProfile?.headmaster_name || ".................................."}</p>
                                                    <p>NIP. {schoolProfile?.headmaster_nip || "..........................."}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p>Penyusun,</p>
                                                    <p className="mb-20">Guru Mata Pelajaran</p>
                                                    <p className="font-bold underline">{schoolProfile?.full_name || ".................................."}</p>
                                                    <p>NIP. {schoolProfile?.nip || "..........................."}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : !isKisiLoading ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                                        <Network className="h-16 w-16" />
                                        <p className="font-bold mt-4">Gagal memuat pratinjau</p>
                                    </div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        <div className="p-6 sm:p-10 bg-white border-t flex flex-col sm:flex-row gap-4 shrink-0 pb-safe">
                            <Button 
                                variant="outline" 
                                onClick={() => { setSelectedDocForKisi(null); setGeneratedKisi(null); }} 
                                className="flex-1 h-16 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest gap-2"
                            >
                                Tutup
                            </Button>
                            <Button 
                                onClick={handleSaveKisiToDrive} 
                                disabled={savingKisi || !generatedKisi} 
                                className="flex-[2] h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl shadow-emerald-200"
                            >
                                {savingKisi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan ke Google Drive
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
