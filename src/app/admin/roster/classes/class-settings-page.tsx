
"use client"
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Loader2, Users, School, User, MoreHorizontal, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Class, Profile, Student } from "@/lib/types";
import { saveClass, deleteClass } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";

export function ClassSettingsPageComponent({ 
    initialClasses,
    teachers,
    students,
}: { 
    initialClasses: (Class & { teacher_name?: string | null })[],
    teachers: Profile[],
    students: Student[],
}) {
    const router = useRouter();
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingClass, setEditingClass] = React.useState<Class | null>(null);
    const [classToDelete, setClassToDelete] = React.useState<Class | null>(null);

    const [className, setClassName] = React.useState("");
    const [teacherId, setTeacherId] = React.useState<string | undefined>(undefined);
    
    const [loading, setLoading] = React.useState(false);

    const studentCounts = React.useMemo(() => {
        return initialClasses.reduce((acc, c) => {
            acc[c.id] = students.filter(s => s.class_id === c.id).length;
            return acc;
        }, {} as Record<string, number>);
    }, [initialClasses, students]);

    const handleOpenDialog = (cls: Class | null) => {
        if (cls) {
            setEditingClass(cls);
            setClassName(cls.name);
            setTeacherId(cls.teacher_id || undefined);
        } else {
            setEditingClass(null);
            setClassName("");
            setTeacherId(undefined);
        }
        setIsDialogOpen(true);
    };

    const handleSaveClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!className) {
            toast({ title: "Gagal", description: "Nama kelas tidak boleh kosong.", variant: "destructive" });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        if(editingClass?.id) formData.append('id', editingClass.id);
        formData.append('name', className);
        if(teacherId) formData.append('teacher_id', teacherId);
        
        const result = await saveClass(formData);

        if (result.success) {
            toast({ title: "Sukses", description: `Kelas ${className} berhasil disimpan.` });
            setIsDialogOpen(false);
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    const handleDelete = async () => {
        if (!classToDelete) return;
        setLoading(true);

        const result = await deleteClass(classToDelete.id);

        if (result.success) {
            toast({ title: "Sukses", description: `Kelas ${classToDelete.name} berhasil dihapus.` });
            setClassToDelete(null);
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                        <School className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">Pengaturan Kelas</h1>
                        <p className="text-muted-foreground">Kelola semua rombongan belajar dan wali kelasnya.</p>
                    </div>
                </div>
                <Button onClick={() => handleOpenDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Buat Kelas Baru
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveClass}>
                        <DialogHeader>
                            <DialogTitle>{editingClass ? "Ubah Kelas" : "Buat Kelas Baru"}</DialogTitle>
                            <DialogDescription>
                                {editingClass ? `Perbarui detail untuk kelas ${editingClass.name}.` : "Tambahkan kelas baru ke dalam sistem dan tentukan wali kelasnya."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="class-name">Nama Kelas</Label>
                                <Input id="class-name" placeholder="e.g. Kelas 12-A" value={className} onChange={e => setClassName(e.target.value)} required/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="teacher_id">Wali Kelas (Opsional)</Label>
                                <Select value={teacherId} onValueChange={setTeacherId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih wali kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(teacher => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                                {teacher.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingClass ? "Simpan Perubahan" : "Simpan Kelas"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin ingin menghapus kelas ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Menghapus kelas <span className="font-bold">{classToDelete?.name}</span> akan membuat siswa di dalamnya tidak memiliki kelas. Pastikan Anda telah memindahkan siswa terlebih dahulu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kelas</CardTitle>
                    <CardDescription>Total kelas terdaftar: {initialClasses.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {initialClasses.map((c) => (
                             <div key={c.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-base">{c.name}</p>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenDialog(c)}>
                                                <Edit className="mr-2 h-4 w-4"/> Ubah
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setClassToDelete(c)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                <Trash2 className="mr-2 h-4 w-4"/> Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                 <div className="text-sm text-muted-foreground space-y-2 border-t pt-3 mt-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary"/>
                                        <span>Wali Kelas: {c.teacher_name || 'Belum diatur'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary"/>
                                        <span>{studentCounts[c.id] || 0} Siswa</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Nama Kelas</TableHead>
                                <TableHead>Wali Kelas</TableHead>
                                <TableHead className="text-center">Jumlah Siswa</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialClasses.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{c.teacher_name || '-'}</TableCell>
                                    <TableCell className="text-center">{studentCounts[c.id] || 0}</TableCell>
                                    <TableCell className="text-right">
                                       <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenDialog(c)}>
                                                    <Edit className="mr-2 h-4 w-4"/> Ubah
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setClassToDelete(c)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-4 w-4"/> Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     {initialClasses.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            <School className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium">Belum Ada Kelas</h3>
                            <p className="mt-1 text-sm text-gray-500">Buat kelas baru untuk memulai mengelola data.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
