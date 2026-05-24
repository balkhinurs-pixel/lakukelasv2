"use client";

import * as React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { 
    Network, 
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
    Filter,
    Layers,
    Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { CpAtpDocument, Profile } from "@/lib/types";
import { FileCard } from "@/components/ui/file-card-collections";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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

export default function CpAtpRepositoryClient({ 
    initialDocuments,
    schoolProfile
}: { 
    initialDocuments: CpAtpDocument[],
    schoolProfile: Profile | null
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filterPhase, setFilterPhase] = React.useState("all");
    const [filterSubject, setFilterSubject] = React.useState("all");

    const [loadingId, setLoadingId] = React.useState<string | null>(null);

    const sanitizeContent = (text: string) => {
        if (!text) return "";
        return text
            .replace(/\\n/gi, '\n')
            .replace(/\\r/gi, '')
            .replace(/\n{3,}/g, '\n\n');
    };

    const parseMarkdownTables = (markdown: string) => {
        const lines = markdown.split('\n');
        const content: any[] = [];
        let currentText = "";
        let inTable = false;
        let tableLines: string[] = [];

        lines.forEach(line => {
            if (line.trim().startsWith('|')) {
                if (!inTable) {
                    if (currentText.trim()) content.push({ type: 'text', value: currentText.trim() });
                    currentText = "";
                    inTable = true;
                }
                tableLines.push(line);
            } else {
                if (inTable) {
                    content.push({ type: 'table', value: tableLines });
                    tableLines = [];
                    inTable = false;
                }
                currentText += line + "\n";
            }
        });

        if (inTable) content.push({ type: 'table', value: tableLines });
        else if (currentText.trim()) content.push({ type: 'text', value: currentText.trim() });

        return content;
    };

    const filteredDocs = React.useMemo(() => {
        return initialDocuments.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                doc.subject?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPhase = filterPhase === "all" || doc.phase === filterPhase;
            const matchesSubject = filterSubject === "all" || doc.subject === filterSubject;
            
            return matchesSearch && matchesPhase && matchesSubject;
        });
    }, [initialDocuments, searchTerm, filterPhase, filterSubject]);

    const phases = Array.from(new Set(initialDocuments.map(d => d.phase).filter(Boolean))).sort();
    const uniqueSubjects = Array.from(new Set(initialDocuments.map(d => d.subject).filter(Boolean))).sort();

    const handleDelete = async (id: string) => {
        setLoadingId(id);
        const supabase = (await import('@/lib/supabase/client')).createClient();
        if(!supabase) return;

        const { error } = await supabase.from('cp_atp').delete().eq('id', id);
        
        if (!error) {
            toast({ title: "Berhasil", description: "Dokumen kurikulum telah dihapus." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: "Gagal menghapus data.", variant: "destructive" });
        }
        setLoadingId(null);
    };

    const handleDownloadPdf = async (docData: CpAtpDocument) => {
        if (!docData.content) {
            toast({ title: "Konten Kosong", description: "Dokumen ini tidak memiliki data untuk dicetak.", variant: "destructive" });
            return;
        }
        
        setLoadingId(docData.id);
        
        try {
            const doc = new jsPDF('p', 'mm', 'a4') as any;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let currentY = margin;

            // 1. Render Header (Kop Surat)
            const schoolName = (schoolProfile?.school_name || "SEKOLAH LAKUKELAS").toUpperCase();
            const npsn = schoolProfile?.npsn ? `NPSN: ${schoolProfile.npsn}` : "";
            const address = schoolProfile?.school_address || "Alamat belum diatur";

            doc.setFont('times', 'bold');
            doc.setFontSize(14);
            doc.text(schoolName, pageWidth / 2 + 10, currentY + 8, { align: 'center' });
            
            doc.setFont('times', 'normal');
            doc.setFontSize(10);
            if (npsn) doc.text(npsn, pageWidth / 2 + 10, currentY + 14, { align: 'center' });
            doc.setFont('times', 'italic');
            doc.text(address, pageWidth / 2 + 10, currentY + (npsn ? 20 : 16), { align: 'center' });

            // Logo
            if (schoolProfile?.school_logo_url) {
                try {
                    const img = new Image();
                    img.src = schoolProfile.school_logo_url;
                    img.crossOrigin = "Anonymous";
                    await new Promise((resolve) => {
                        img.onload = () => {
                            doc.addImage(img, 'PNG', margin, currentY, 25, 25);
                            resolve(true);
                        };
                        img.onerror = () => resolve(false);
                    });
                } catch (e) { console.error("Logo fail", e); }
            }

            currentY += 30;
            doc.setLineWidth(0.8);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            doc.setLineWidth(0.2);
            doc.line(margin, currentY + 1, pageWidth - margin, currentY + 1);

            // 2. Title & Metadata
            currentY += 15;
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.text("ALUR TUJUAN PEMBELAJARAN (ATP)", pageWidth / 2, currentY, { align: 'center' });
            doc.text("PEMETAAN KURIKULUM MERDEKA", pageWidth / 2, currentY + 6, { align: 'center' });

            currentY += 15;
            doc.setFontSize(10);
            doc.text("Mata Pelajaran", margin, currentY);
            doc.text(":", margin + 30, currentY);
            doc.setFont('times', 'normal');
            doc.text(docData.subject, margin + 35, currentY);

            doc.setFont('times', 'bold');
            doc.text("Jenjang / Fase", margin, currentY + 6);
            doc.text(":", margin + 30, currentY + 6);
            doc.setFont('times', 'normal');
            doc.text(`${docData.class_level} / ${docData.phase}`, margin + 35, currentY + 6);

            doc.setFont('times', 'bold');
            doc.text("Penyusun", margin, currentY + 12);
            doc.text(":", margin + 30, currentY + 12);
            doc.setFont('times', 'normal');
            doc.text(schoolProfile?.full_name || "GURU PENGAMPU", margin + 35, currentY + 12);

            currentY += 22;

            // 3. Render Content (Text & Tables)
            const sanitized = sanitizeContent(docData.content);
            const parsedContent = parseMarkdownTables(sanitized);

            for (const block of parsedContent) {
                if (block.type === 'text') {
                    doc.setFont('times', 'normal');
                    doc.setFontSize(10);
                    const splitText = doc.splitTextToSize(block.value, pageWidth - (margin * 2));
                    
                    if (currentY + (splitText.length * 5) > pageHeight - 40) {
                        doc.addPage();
                        currentY = margin + 10;
                    }

                    doc.text(splitText, margin, currentY);
                    currentY += (splitText.length * 5) + 10;
                } else if (block.type === 'table') {
                    const rows = block.value.map((line: string) => 
                        line.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim())
                    ).filter((row: any[]) => row.length > 0 && !row[0].startsWith('---'));

                    if (rows.length > 1) {
                        const head = [rows[0]];
                        const body = rows.slice(1);

                        doc.autoTable({
                            startY: currentY,
                            head: head,
                            body: body,
                            margin: { left: margin, right: margin },
                            theme: 'grid',
                            styles: { font: 'times', fontSize: 9, cellPadding: 2, textColor: 0 },
                            headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
                            didDrawPage: (data: any) => {
                                currentY = data.cursor.y;
                            }
                        });
                        currentY = (doc as any).lastAutoTable.finalY + 10;
                    }
                }
            }

            // 4. Signatures
            if (currentY > pageHeight - 50) {
                doc.addPage();
                currentY = margin + 20;
            }

            const today = format(new Date(), 'dd MMMM yyyy', { locale: id });
            
            doc.setFont('times', 'normal');
            doc.text("Mengetahui,", margin + 15, currentY);
            doc.text("Kepala Sekolah", margin + 15, currentY + 6);
            
            doc.text("Dicetak Pada,", pageWidth - margin - 55, currentY);
            doc.text(today, pageWidth - margin - 55, currentY + 6);

            currentY += 25;
            doc.setFont('times', 'bold');
            doc.text(schoolProfile?.headmaster_name || "..................................", margin + 15, currentY);
            doc.text(schoolProfile?.full_name || "..................................", pageWidth - margin - 55, currentY);
            
            doc.setFont('times', 'normal');
            doc.text(`NIP. ${schoolProfile?.headmaster_nip || "..........................."}`, margin + 15, currentY + 5);
            doc.text(`NIP. ${schoolProfile?.nip || "..........................."}`, pageWidth - margin - 55, currentY + 5);

            doc.save(`${docData.title.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Berhasil", description: "PDF kurikulum telah diunduh." });
        } catch (error) {
            console.error(error);
            toast({ title: "Gagal", description: "Gagal memproses dokumen PDF.", variant: "destructive" });
        } finally {
            setLoadingId(null);
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setFilterPhase("all");
        setFilterSubject("all");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600" />
                    <Input 
                        placeholder="Cari CP/ATP..." 
                        className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm font-bold" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-none">
                    <Select value={filterPhase} onValueChange={setFilterPhase}>
                        <SelectTrigger className="h-12 min-w-[140px] rounded-xl bg-white border-slate-200 font-bold text-xs shadow-sm">
                            <div className="flex items-center gap-2">
                                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                                <SelectValue placeholder="Semua Fase" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl">
                            <SelectItem value="all" className="font-bold">Semua Fase</SelectItem>
                            {phases.map(p => <SelectItem key={p} value={p!} className="font-bold">Fase {p}</SelectItem>)}
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

                    {(filterPhase !== 'all' || filterSubject !== 'all' || searchTerm) && (
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
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl font-bold">Hapus Pemetaan?</AlertDialogTitle>
                                                <AlertDialogDescription className="font-medium">
                                                    Dokumen "<span className="font-bold text-slate-900">{doc.title}</span>" akan dihapus permanen.
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
                                        <FileCard formatFile="doc" className="scale-90" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2 pr-12">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border-blue-100">
                                            Fase {doc.phase}
                                        </Badge>
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-black text-slate-900 mt-4 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {doc.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 p-2 px-3 rounded-xl bg-slate-50 text-slate-500">
                                        <Layers className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-black uppercase">Fase {doc.phase} / Kelas {doc.class_level}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 p-2 px-3 rounded-xl bg-slate-50 text-slate-500 flex-1 min-w-0">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-black uppercase truncate">{doc.subject}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 pl-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">
                                        {format(parseISO(doc.created_at), 'dd MMM yyyy', { locale: id })}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex gap-2">
                                <Button asChild className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2 shadow-lg shadow-indigo-100 group/btn">
                                    <a href={doc.drive_file_url || "#"} target="_blank">
                                        <ExternalLink className="h-4 w-4" />
                                        Drive
                                        <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover/btn:opacity-100 transition-all group-hover/btn:translate-x-1" />
                                    </a>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => handleDownloadPdf(doc)}
                                    disabled={loadingId === doc.id}
                                    className="flex-1 h-12 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold gap-2 shadow-sm"
                                >
                                    {loadingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    PDF
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center opacity-20 group">
                        <div className="p-10 rounded-[3rem] bg-slate-50 mb-6 group-hover:bg-indigo-50 transition-colors">
                            <Network className="h-16 w-16" />
                        </div>
                        <p className="font-black uppercase tracking-[0.2em] text-sm">
                            {initialDocuments.length === 0 ? "Belum ada pemetaan CP/ATP" : "Dokumen tidak ditemukan"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
