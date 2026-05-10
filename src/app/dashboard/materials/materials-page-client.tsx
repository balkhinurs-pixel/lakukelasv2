"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, ExternalLink, Link2, BookOpen, Filter, Search, Loader2, FileText, Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Material, Class, Subject } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { saveMaterial, deleteMaterial } from "@/lib/actions";

export default function MaterialsPageClient({
    initialMaterials,
    classes,
    subjects,
}: {
    initialMaterials: Material[];
    classes: Class[];
    subjects: Subject[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingMaterial, setEditingMaterial] = React.useState<Material | null>(null);
    const [filterClass, setFilterClass] = React.useState<string>("all");
    const [filterSubject, setFilterSubject] = React.useState<string>("all");
    const [searchTerm, setSearchTerm] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const [formState, setFormState] = React.useState({
        id: "",
        class_id: "",
        subject_id: "",
        title: "",
        description: "",
        link_url: "",
    });

    const handleOpenAddDialog = () => {
        setEditingMaterial(null);
        setFormState({ id: "", class_id: "", subject_id: "", title: "", description: "", link_url: "" });
        setIsDialogOpen(true);
    };

    const handleOpenEditDialog = (material: Material) => {
        setEditingMaterial(material);
        setFormState({
            id: material.id,
            class_id: material.class_id,
            subject_id: material.subject_id,
            title: material.title,
            description: material.description || "",
            link_url: material.link_url,
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        if (formState.id) formData.append('id', formState.id);
        formData.append('class_id', formState.class_id);
        formData.append('subject_id', formState.subject_id);
        formData.append('title', formState.title);
        formData.append('description', formState.description);
        formData.append('link_url', formState.link_url);

        const result = await saveMaterial(formData);

        if (result.success) {
            toast({ title: "Berhasil", description: `Materi berhasil ${editingMaterial ? 'diperbarui' : 'ditambahkan'}.` });
            setIsDialogOpen(false);
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const result = await deleteMaterial(id);
        if (result.success) {
            toast({ title: "Berhasil", description: "Materi berhasil dihapus." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    };

    const filteredMaterials = React.useMemo(() => {
        return initialMaterials.filter(m => {
            const matchesClass = filterClass === "all" || m.class_id === filterClass;
            const matchesSubject = filterSubject === "all" || m.subject_id === filterSubject;
            const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (m.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            return matchesClass && matchesSubject && matchesSearch;
        });
    }, [initialMaterials, filterClass, filterSubject, searchTerm]);

    return (
        <div className="space-y-6 p-1">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                        <Link2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-headline text-slate-900">Materi Pembelajaran</h1>
                        <p className="text-slate-600 mt-1">Kelola tautan sumber belajar untuk setiap kelas dan mata pelajaran.</p>
                    </div>
                </div>
                <Button onClick={handleOpenAddDialog} className="bg-primary hover:bg-primary/90 shadow-md">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Materi
                </Button>
            </div>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 lg:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Cari materi..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger>
                                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Semua Kelas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kelas</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterSubject} onValueChange={setFilterSubject}>
                            <SelectTrigger>
                                <BookOpen className="mr-2 h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Semua Mapel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Mapel</SelectItem>
                                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {filteredMaterials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMaterials.map((material) => (
                                <Card key={material.id} className="group border-slate-200 hover:border-primary/30 transition-all duration-200 hover:shadow-md bg-white">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-bold text-slate-900 truncate" title={material.title}>
                                                    {material.title}
                                                </CardTitle>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                                        {material.className}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-primary border-primary/20">
                                                        {material.subjectName}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 hover:text-slate-900">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(material)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Ubah
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Hapus Materi?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Materi "{material.title}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(material.id)} className="bg-red-600 hover:bg-red-700">
                                                                    Ya, Hapus
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3 flex-grow">
                                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                                            {material.description || "Tidak ada deskripsi."}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button asChild className="w-full bg-slate-50 hover:bg-primary hover:text-white text-primary border-primary/20" variant="outline">
                                            <a href={material.link_url} target="_blank" rel="noopener noreferrer">
                                                <Globe className="mr-2 h-4 w-4" />
                                                Buka Materi
                                                <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                                            </a>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <div className="flex flex-col items-center gap-3">
                                <Link2 className="h-12 w-12 text-slate-300" />
                                <div>
                                    <p className="text-lg font-semibold text-slate-600">Belum ada materi</p>
                                    <p className="text-sm text-slate-400">Klik "Tambah Materi" untuk mulai membagikan tautan belajar.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>{editingMaterial ? 'Ubah Materi' : 'Tambah Materi Baru'}</DialogTitle>
                            <DialogDescription>
                                Masukkan detail materi dan tautkan ke link sumber belajar (Drive, YouTube, dll).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="class_id">Kelas</Label>
                                    <Select 
                                        value={formState.class_id} 
                                        onValueChange={(val) => setFormState({ ...formState, class_id: val })}
                                        required
                                    >
                                        <SelectTrigger id="class_id">
                                            <SelectValue placeholder="Pilih kelas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject_id">Mata Pelajaran</Label>
                                    <Select 
                                        value={formState.subject_id} 
                                        onValueChange={(val) => setFormState({ ...formState, subject_id: val })}
                                        required
                                    >
                                        <SelectTrigger id="subject_id">
                                            <SelectValue placeholder="Pilih mapel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Judul Materi</Label>
                                <Input 
                                    id="title" 
                                    placeholder="e.g. Modul Bab 1: Aljabar" 
                                    value={formState.title}
                                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="link_url">Tautan Materi (URL)</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        id="link_url" 
                                        type="url"
                                        placeholder="https://drive.google.com/..." 
                                        className="pl-10"
                                        value={formState.link_url}
                                        onChange={(e) => setFormState({ ...formState, link_url: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi Singkat (Opsional)</Label>
                                <Textarea 
                                    id="description" 
                                    placeholder="Berikan gambaran isi materi ini..." 
                                    className="min-h-[80px]"
                                    value={formState.description}
                                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingMaterial ? 'Simpan Perubahan' : 'Simpan Materi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
