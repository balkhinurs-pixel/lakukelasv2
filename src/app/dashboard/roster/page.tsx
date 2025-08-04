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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  ArrowRightLeft,
  ChevronsUp,
  PlusCircle,
  FolderCog,
  CalendarDays,
} from "lucide-react";
import { classes } from "@/lib/placeholder-data";
import type { Student, Class } from "@/lib/types";

function StudentListTab() {
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <CardTitle>Daftar Siswa Per Kelas</CardTitle>
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
  );
}

function ClassSettingsTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pengaturan Kelas</CardTitle>
                <CardDescription>Kelola daftar kelas yang Anda ajar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-end">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Buat Kelas Baru
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Buat Kelas Baru</DialogTitle>
                                <DialogDescription>Tambahkan kelas baru ke dalam sistem.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="class-name">Nama Kelas</Label>
                                    <Input id="class-name" placeholder="e.g. Kelas 12-A"/>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button>Simpan Kelas</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
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
    )
}

function SchoolYearTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tahun Ajaran</CardTitle>
                <CardDescription>Atur tahun ajaran yang sedang aktif untuk seluruh aplikasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
                 <div className="space-y-2">
                    <Label>Tahun Ajaran Aktif</Label>
                     <Select defaultValue="2023/2024">
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih tahun ajaran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2023/2024">2023/2024 - Semester Genap</SelectItem>
                            <SelectItem value="2024/2025">2024/2025 - Semester Ganjil</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Tahun ajaran aktif akan mempengaruhi pencatatan data baru.</p>
                 </div>
                 <Button>Simpan Pengaturan</Button>
            </CardContent>
        </Card>
    )
}


function PromotionTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Promosi & Mutasi Siswa</CardTitle>
                <CardDescription>Pindahkan siswa secara kolektif untuk kenaikan kelas atau kelulusan di akhir tahun ajaran.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Kenaikan Kelas</h3>
                    <p className="text-sm text-muted-foreground mb-4">Pindahkan semua siswa dari satu kelas ke kelas lainnya. Contoh: Semua siswa Kelas 10-A naik ke Kelas 11-A.</p>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                            <Label>Dari Kelas</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas asal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <ArrowRightLeft className="mt-6 text-muted-foreground"/>
                         <div className="flex-1 space-y-1">
                            <Label>Ke Kelas</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas tujuan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="mt-6">Proses</Button>
                    </div>
                </div>
                 <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Luluskan Siswa</h3>
                    <p className="text-sm text-muted-foreground mb-4">Tandai semua siswa di kelas tertentu sebagai lulus. Data mereka akan diarsipkan.</p>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                            <Label>Kelas yang Lulus</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="mt-6" variant="destructive">Luluskan</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function RosterPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">Manajemen Kelas & Siswa</h1>
          <p className="text-muted-foreground">
            Pusat data untuk mengelola siswa, kelas, dan tahun ajaran.
          </p>
        </div>
      </div>
      <Tabs defaultValue="students">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="students"><Users className="mr-2"/>Daftar Siswa</TabsTrigger>
          <TabsTrigger value="classes"><FolderCog className="mr-2"/>Pengaturan Kelas</TabsTrigger>
          <TabsTrigger value="year"><CalendarDays className="mr-2"/>Tahun Ajaran</TabsTrigger>
          <TabsTrigger value="promotion"><ChevronsUp className="mr-2"/>Promosi & Mutasi</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-6">
            <StudentListTab />
        </TabsContent>
         <TabsContent value="classes" className="mt-6">
            <ClassSettingsTab />
        </TabsContent>
         <TabsContent value="year" className="mt-6">
            <SchoolYearTab />
        </TabsContent>
         <TabsContent value="promotion" className="mt-6">
            <PromotionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
