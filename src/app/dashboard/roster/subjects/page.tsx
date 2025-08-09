
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Edit } from "lucide-react";
import { subjects as initialSubjects } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";
import type { Subject } from "@/lib/types";

type NewSubjectData = {
    name: string;
    kkm: number | string;
}

export default function SubjectSettingsPage() {
    const [subjects, setSubjects] = React.useState<Subject[]>(initialSubjects);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingSubject, setEditingSubject] = React.useState<Subject | null>(null);
    const [newSubjectData, setNewSubjectData] = React.useState<NewSubjectData>({ name: "", kkm: 75 });
    const { toast } = useToast();

    const handleOpenDialog = (subject: Subject | null = null) => {
        if (subject) {
            setEditingSubject(subject);
            setNewSubjectData({ name: subject.name, kkm: subject.kkm });
        } else {
            setEditingSubject(null);
            setNewSubjectData({ name: "", kkm: 75 });
        }
        setIsDialogOpen(true);
    };

    const handleSaveSubject = (e: React.FormEvent) => {
        e.preventDefault();
        const kkmNumber = Number(newSubjectData.kkm);

        if (!newSubjectData.name || isNaN(kkmNumber) || kkmNumber < 0 || kkmNumber > 100) {
            toast({ title: "Gagal", description: "Nama mapel harus diisi dan KKM harus berupa angka antara 0-100.", variant: "destructive" });
            return;
        }

        if (editingSubject) {
            setSubjects(subjects.map(s => s.id === editingSubject.id ? { ...s, name: newSubjectData.name, kkm: kkmNumber } : s));
            toast({ title: "Sukses", description: `Mata pelajaran ${newSubjectData.name} berhasil diperbarui.` });
        } else {
            const newSubject: Subject = {
                id: `SUBJ${Date.now()}`,
                name: newSubjectData.name,
                kkm: kkmNumber,
                teacherId: 'user_placeholder'
            };
            setSubjects([...subjects, newSubject]);
            toast({ title: "Sukses", description: `Mata pelajaran ${newSubjectData.name} berhasil ditambahkan.` });
        }

        setIsDialogOpen(false);
        setEditingSubject(null);
        setNewSubjectData({ name: "", kkm: 75 });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Pengaturan Mata Pelajaran</h1>
                    <p className="text-muted-foreground">Kelola daftar mata pelajaran yang Anda ajar beserta KKM-nya.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Mapel Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSaveSubject}>
                            <DialogHeader>
                                <DialogTitle>{editingSubject ? 'Ubah' : 'Tambah'} Mapel Baru</DialogTitle>
                                <DialogDescription>
                                    {editingSubject ? 'Perbarui detail mata pelajaran ini.' : 'Tambahkan mata pelajaran baru ke dalam sistem.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject-name">Nama Mata Pelajaran</Label>
                                    <Input 
                                        id="subject-name" 
                                        placeholder="e.g. Matematika Wajib" 
                                        value={newSubjectData.name} 
                                        onChange={e => setNewSubjectData({...newSubjectData, name: e.target.value})} 
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject-kkm">KKM (0-100)</Label>
                                    <Input 
                                        id="subject-kkm" 
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="e.g. 75" 
                                        value={newSubjectData.kkm} 
                                        onChange={e => setNewSubjectData({...newSubjectData, kkm: e.target.value})} 
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Simpan Mapel</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Mata Pelajaran</CardTitle>
                    <CardDescription>Berikut adalah semua mapel yang terdaftar di sistem.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                     <div className="md:hidden space-y-4">
                        {subjects.map((s) => (
                             <div key={s.id} className="border rounded-lg p-4 space-y-3">
                                <div className="font-semibold">{s.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    <p><span className="font-medium">ID:</span> {s.id}</p>
                                    <p><span className="font-medium">KKM:</span> {s.kkm}</p>
                                </div>
                                <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenDialog(s)}>
                                    <Edit className="mr-2 h-4 w-4" /> Ubah
                                </Button>
                            </div>
                        ))}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>ID Mapel</TableHead>
                                <TableHead>Nama Mata Pelajaran</TableHead>
                                <TableHead className="text-center">KKM</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-mono text-muted-foreground">{s.id}</TableCell>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell className="text-center font-semibold">{s.kkm}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(s)}>
                                            <Edit className="mr-2 h-4 w-4" /> Ubah
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
