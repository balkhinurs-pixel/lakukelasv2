
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
import { UserPlus, Download, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { classes as initialClasses, students as initialStudents } from "@/lib/placeholder-data";
import type { Student, Class } from "@/lib/types";

export default function StudentsPage() {
  const [classes, setClasses] = React.useState<Class[]>(initialClasses);
  const [students, setStudents] = React.useState<Student[]>(initialStudents);
  const [selectedClassId, setSelectedClassId] = React.useState<string>(classes[0].id);

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newStudent, setNewStudent] = React.useState({ name: "", nis: "", nisn: "", gender: "" as Student['gender'] });

  const { toast } = useToast();

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
  };
  
  const getStudentsInClass = () => {
    return students.filter(s => {
        const studentClass = classes.find(c => c.students.some(cs => cs.id === s.id));
        return studentClass?.id === selectedClassId;
    });
  }

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.nis || !newStudent.nisn || !newStudent.gender) {
        toast({ title: "Gagal", description: "Semua kolom harus diisi.", variant: "destructive" });
        return;
    }

    const newStudentData: Student = {
        id: `S${Date.now()}`,
        ...newStudent
    };
    
    // Add student to general student list
    const updatedStudents = [...students, newStudentData];
    setStudents(updatedStudents);

    // Add student to the selected class
    const updatedClasses = classes.map(c => {
        if (c.id === selectedClassId) {
            // This is a simplified placeholder data update. In a real app, you'd just update relations.
            const classStudent = updatedStudents.find(s => s.id === newStudentData.id);
            if(classStudent) {
              return { ...c, students: [...c.students, classStudent]};
            }
        }
        return c;
    });
    setClasses(updatedClasses);
    
    toast({ title: "Sukses", description: "Siswa baru berhasil ditambahkan." });
    setNewStudent({ name: "", nis: "", nisn: "", gender: "" as Student['gender'] });
    setIsAddDialogOpen(false);
  };


  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsInClass = selectedClass ? selectedClass.students : [];


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">Daftar Siswa</h1>
                <p className="text-muted-foreground">Kelola data induk siswa di setiap kelas.</p>
            </div>
             <div className="flex gap-2">
                <Button variant="outline"><FileText /> Unduh Template</Button>
                <Button variant="outline"><Upload /> Impor Siswa</Button>
                <Button variant="outline"><Download /> Ekspor Siswa</Button>
            </div>
        </div>
        <Card>
        <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <CardTitle>Siswa Kelas {selectedClass?.name}</CardTitle>
                    <CardDescription>
                    Lihat, tambah, atau kelola data siswa di kelas ini.
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Select
                        onValueChange={handleClassChange}
                        defaultValue={selectedClassId}
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
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus />
                                Tambah Siswa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <form onSubmit={handleAddStudent}>
                                <DialogHeader>
                                    <DialogTitle>Tambah Siswa Baru</DialogTitle>
                                    <DialogDescription>Masukkan detail siswa baru untuk ditambahkan ke kelas {selectedClass?.name}.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="student-name">Nama Lengkap Siswa</Label>
                                        <Input id="student-name" placeholder="e.g. Ahmad Fauzi" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="student-nis">NIS</Label>
                                            <Input id="student-nis" placeholder="e.g. 23241001" value={newStudent.nis} onChange={e => setNewStudent({...newStudent, nis: e.target.value})} required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="student-nisn">NISN</Label>
                                            <Input id="student-nisn" placeholder="e.g. 0012345678" value={newStudent.nisn} onChange={e => setNewStudent({...newStudent, nisn: e.target.value})} required/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Jenis Kelamin</Label>
                                        <Select value={newStudent.gender} onValueChange={(value: Student['gender']) => setNewStudent({...newStudent, gender: value})} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih jenis kelamin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                                <SelectItem value="Perempuan">Perempuan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Simpan Siswa</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>Jenis Kelamin</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {studentsInClass.map((student) => (
                <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.nis}</TableCell>
                    <TableCell>{student.nisn}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                          Ubah
                      </Button>
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
