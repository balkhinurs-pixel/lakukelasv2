
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
import { PlusCircle } from "lucide-react";
import { subjects as initialSubjects } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";
import type { Subject } from "@/lib/types";

export default function SubjectSettingsPage() {
    const [subjects, setSubjects] = React.useState<Subject[]>(initialSubjects);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [newSubjectName, setNewSubjectName] = React.useState("");
    const { toast } = useToast();

    const handleSaveSubject = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newSubjectName) {
            toast({ title: "Gagal", description: "Nama mata pelajaran tidak boleh kosong.", variant: "destructive" });
            return;
        }

        const newSubject: Subject = {
            id: `SUBJ${Date.now()}`,
            name: newSubjectName,
        };

        setSubjects([...subjects, newSubject]);
        toast({ title: "Sukses", description: `Mata pelajaran ${newSubjectName} berhasil ditambahkan.` });
        setNewSubjectName("");
        setIsDialogOpen(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Pengaturan Mata Pelajaran</h1>
                    <p className="text-muted-foreground">Kelola daftar mata pelajaran yang Anda ajar.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Mapel Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSaveSubject}>
                            <DialogHeader>
                                <DialogTitle>Tambah Mapel Baru</DialogTitle>
                                <DialogDescription>Tambahkan mata pelajaran baru ke dalam sistem.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject-name">Nama Mata Pelajaran</Label>
                                    <Input id="subject-name" placeholder="e.g. Matematika Wajib" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} required/>
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
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>ID Mapel</TableHead>
                            <TableHead>Nama Mata Pelajaran</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell className="font-mono text-muted-foreground">{s.id}</TableCell>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Ubah</Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
