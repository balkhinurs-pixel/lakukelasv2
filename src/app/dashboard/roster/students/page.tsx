
"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { UserPlus } from "lucide-react";
import { classes } from "@/lib/placeholder-data";
import type { Student, Class } from "@/lib/types";

export default function StudentsPage() {
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(
    classes[0]
  );
  const [students, setStudents] = React.useState<Student[]>(
    classes[0].students
  );

  const handleClassChange = (classId: string) => {
    const newClass = classes.find((c) => c.id === classId) || null;
    setSelectedClass(newClass);
    setStudents(newClass ? newClass.students : []);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">Daftar Siswa</h1>
                <p className="text-muted-foreground">Kelola daftar siswa di setiap kelas.</p>
            </div>
        </div>
        <Card>
        <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <CardTitle>Siswa per Kelas</CardTitle>
                    <CardDescription>
                    Lihat, tambah, atau pindahkan siswa di setiap kelas.
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Select
                        onValueChange={handleClassChange}
                        defaultValue={selectedClass?.id}
                    >
                        <SelectTrigger className="w-full md:w-[220px]">
                        <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                        <SelectContent>
                        {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Tambah Siswa
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Siswa Baru</DialogTitle>
                                <DialogDescription>Masukkan detail siswa baru untuk ditambahkan ke kelas {selectedClass?.name}.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="student-id">ID Siswa (NIS)</Label>
                                    <Input id="student-id" placeholder="e.g. S011"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="student-name">Nama Lengkap Siswa</Label>
                                    <Input id="student-name" placeholder="e.g. Ahmad Fauzi"/>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button>Simpan Siswa</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[150px]">ID Siswa</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map((student) => (
                <TableRow key={student.id}>
                    <TableCell className="font-mono text-muted-foreground">
                    {student.id}
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                        Pindahkan
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}
