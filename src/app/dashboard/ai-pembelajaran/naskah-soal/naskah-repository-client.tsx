"use client";

import * as React from "react";
import { 
    Search, 
    BookOpen, 
    Users,
    Trash2,
    Edit,
    ExternalLink,
    Download,
    Loader2,
    Printer,
    CheckCircle2,
    ScanQrCode
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { deleteAiDocumentAction } from "@/lib/actions/google-drive";
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
import type { AiDocument, Profile } from "@/lib/types";
import { FileCard } from "@/components/ui/file-card-collections";

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

    const filteredDocs = React.useMemo(() => {
        return initialDocuments.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (doc.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            const matchesClass = filterClass === "all" || doc.class_level === filterClass;
            const matchesSubject = filterSubject === "all" || doc.subject === filterSubject;
            return matchesSearch && matchesClass && matchesSubject;
        });
    }, [initialDocuments, searchTerm, filterClass, filterSubject]);

    const uniqueClasses = Array.from(new Set(initialDocuments.map(d => d.class_level).filter(Boolean))).sort();
    const uniqueSubjects = Array.from(new Set(initialDocuments.map(d => d.subject).filter(Boolean))).sort();

    const handlePrintNav = (id: string, mode: 'soal' | 'kunci' | 'ljk') => {
        // PERUBAHAN: Navigasi ke rute terisolasi total di luar dashboard
        const url = `/print-naskah/${id}?mode=${mode}`;
        window.open(url, '_blank');
    };

    const handleDelete = async (id: string) => {
        setLoadingId(id);
        const result = await deleteAiDocumentAction(id);
        if (result.success) {
            toast({ title: "Dihapus", description: "Naskah berhasil dihapus." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoadingId(null);
    };

    return (
        <div className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
                {filteredDocs.map((doc) => (
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
                                            <AlertDialogDescription className="font-medium">Dokumen akan dihapus permanen dari sistem.</AlertDialogDescription>
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
                            <div className="grid grid-cols-1 gap-2 w-full">
                                <Button 
                                    onClick={() => handlePrintNav(doc.id, 'soal')} 
                                    className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2 shadow-xl"
                                >
                                    <Printer className="h-4 w-4" /> Cetak Naskah Soal
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button 
                                    variant="outline"
                                    onClick={() => handlePrintNav(doc.id, 'kunci')}
                                    className="h-11 border-amber-100 text-amber-700 bg-amber-50/20 hover:bg-amber-100 rounded-2xl font-bold gap-2 text-[10px] uppercase tracking-tighter"
                                >
                                    <CheckCircle2 className="h-4 w-4" /> Kunci Jawaban
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => handlePrintNav(doc.id, 'ljk')}
                                    className="h-11 border-emerald-100 text-emerald-700 bg-emerald-50/20 hover:bg-emerald-100 rounded-2xl font-bold gap-2 text-[10px] uppercase tracking-tighter"
                                >
                                    <ScanQrCode className="h-4 w-4" /> Cetak LJK AI
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
