
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
import { classes as initialClasses } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";
import type { Class } from "@/lib/types";

export default function ClassSettingsPage() {
    const [classes, setClasses] = React.useState<Class[]>(initialClasses);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [newClassName, setNewClassName] = React.useState("");
    const { toast } = useToast();

    const handleSaveClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName) {
            toast({ title: "Gagal", description: "Nama kelas tidak boleh kosong.", variant: "destructive" });
            return;
        }

        const newClass: Class = {
            id: `C${Date.now()}`,
            name: newClassName,
            students: []
        };

        setClasses([...classes, newClass]);
        toast({ title: "Sukses", description: `Kelas ${newClassName} berhasil dibuat.` });
        setNewClassName("");
        setIsDialogOpen(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Pengaturan Kelas</h1>
                    <p className="text-muted-foreground">Kelola daftar kelas yang Anda ajar.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Buat Kelas Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSaveClass}>
                            <DialogHeader>
                                <DialogTitle>Buat Kelas Baru</DialogTitle>
                                <DialogDescription>Tambahkan kelas baru ke dalam sistem.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="class-name">Nama Kelas</Label>
                                    <Input id="class-name" placeholder="e.g. Kelas 12-A" value={newClassName} onChange={e => setNewClassName(e.target.value)} required/>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Simpan Kelas</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kelas</CardTitle>
                    <CardDescription>Berikut adalah semua kelas yang terdaftar di sistem.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>ID Kelas</TableHead>
                            <TableHead>Nama Kelas</TableHead>
                            <TableHead className="text-center">Jumlah Siswa</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-mono text-muted-foreground">{c.id}</TableCell>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell className="text-center">{c.students.length}</TableCell>
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
