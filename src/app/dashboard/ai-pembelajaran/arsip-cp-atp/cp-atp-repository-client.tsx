"use client";

import * as React from "react";
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
    Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { CpAtpDocument } from "@/lib/types";
import { FileCard } from "@/components/ui/file-card-collections";
import { AppLogo } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { deleteAiDocumentAction, renameAiDocumentAction } from "@/lib/actions/google-drive";
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

export default function CpAtpRepositoryClient({ initialDocuments }: { initialDocuments: CpAtpDocument[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filterPhase, setFilterPhase] = React.useState("all");
    const [filterSubject, setFilterSubject] = React.useState("all");

    const [loadingId, setLoadingId] = React.useState<string | null>(null);
    const [renamingDoc, setRenamingDoc] = React.useState<CpAtpDocument | null>(null);
    const [newTitle, setNewTitle] = React.useState("");

    // --- Filter Logic ---
    const phases = Array.from(new Set(initialDocuments.map(d => d.phase).filter(Boolean))).sort();
    const uniqueSubjects = Array.from(new Set(initialDocuments.map(d => d.subject).filter(Boolean))).sort();

    const filteredDocs = React.useMemo(() => {
        return initialDocuments.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                doc.subject?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPhase = filterPhase === "all" || doc.phase === filterPhase;
            const matchesSubject = filterSubject === "all" || doc.subject === filterSubject;
            
            return matchesSearch && matchesPhase && matchesSubject;
        });
    }, [initialDocuments, searchTerm, filterPhase, filterSubject]);

    const handleDelete = async (id: string) => {
        setLoadingId(id);
        // Kita gunakan action generik dokumen AI karena tabelnya berbeda tapi flow hapus Drive-nya mirip
        // Untuk TAHAP 1 kita hanya akan memicu hapus di database jika integrasi Drive belum aktif penuh untuk tabel baru
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

    const resetFilters = () => {
        setSearchTerm("");
        setFilterPhase("all");
        setFilterSubject("all");
    };

    return (
        <div className="space-y-6">
            {/* Filter Toolbar */}
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
                                <Button asChild className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2 shadow-lg shadow-indigo-100 group/btn">
                                    <a href={doc.drive_file_url || "#"} target="_blank">
                                        <ExternalLink className="h-4 w-4" />
                                        Buka di Drive
                                        <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover/btn:opacity-100 transition-all group-hover/btn:translate-x-1" />
                                    </a>
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