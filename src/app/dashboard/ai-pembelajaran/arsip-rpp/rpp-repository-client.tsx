"use client";

import * as React from "react";
import { 
    FileText, 
    ExternalLink, 
    Calendar, 
    Search, 
    BookOpen, 
    Users,
    ArrowRight,
    Filter,
    Trash2,
    Download,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { AiDocument } from "@/lib/types";
import { FileCard } from "@/components/ui/file-card-collections";
import { AppLogo } from "@/components/icons";
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

export default function RppRepositoryClient({ initialDocuments }: { initialDocuments: AiDocument[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [loadingId, setLoadingId] = React.useState<string | null>(null);

    const filteredDocs = initialDocuments.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        setLoadingId(id);
        const result = await deleteAiDocumentAction(id);
        if (result.success) {
            toast({ title: "Berhasil", description: "Dokumen berhasil dihapus dari daftar." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoadingId(null);
    };

    const handleDownload = (doc: AiDocument) => {
        // RPP umumnya disimpan sebagai Google Doc, maka arahkan ke link ekspor PDF
        const exportUrl = `https://docs.google.com/document/d/${doc.drive_file_id}/export?format=pdf`;
        window.open(exportUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="relative max-w-md group px-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600" />
                <Input 
                    placeholder="Cari materi atau judul RPP..." 
                    className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm font-bold" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                                                <AlertDialogTitle className="text-xl font-bold">Hapus RPP?</AlertDialogTitle>
                                                <AlertDialogDescription className="font-medium">
                                                    Dokumen "<span className="font-bold text-slate-900">{doc.title}</span>" akan dihapus dari aplikasi. File di Google Drive tetap ada.
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
                                    <div className="flex flex-col items-end gap-2 pr-8">
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border-blue-100">
                                            Editable Doc
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
                            <CardFooter className="pt-0 flex gap-2">
                                <Button asChild className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2 shadow-lg shadow-indigo-100 group/btn">
                                    <a href={doc.drive_file_url || "#"} target="_blank">
                                        <ExternalLink className="h-4 w-4" />
                                        Drive
                                        <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover/btn:opacity-100 transition-all group-hover/btn:translate-x-1" />
                                    </a>
                                </Button>
                                <Button variant="outline" onClick={() => handleDownload(doc)} className="flex-1 h-12 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold gap-2 shadow-sm">
                                    <Download className="h-4 w-4" />
                                    PDF
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center opacity-20 group">
                        <div className="p-10 rounded-[3rem] bg-slate-50 mb-6 group-hover:bg-indigo-50 transition-colors">
                            <FileText className="h-16 w-16" />
                        </div>
                        <p className="font-black uppercase tracking-[0.2em] text-sm">Belum ada RPP tersimpan</p>
                    </div>
                )}
            </div>
        </div>
    );
}
