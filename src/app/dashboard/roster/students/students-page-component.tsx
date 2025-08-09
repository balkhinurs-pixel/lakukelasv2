
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserPlus, Download, Upload, FileText, Sparkles, Edit, UserRoundCog, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivation } from "@/hooks/use-activation";
import type { Student, Class } from "@/lib/types";
import Link from "next/link";
import { saveStudent } from "@/lib/actions";

export default function StudentsPageComponent({
    initialClasses,
    initialStudents,
}: {
    initialClasses: Class[];
    initialStudents: Student[];
}) {
  const router = useRouter();
  const [classes, setClasses] = React.useState<Class[]>(initialClasses);
  const [students, setStudents] = React.useState<Student[]>(initialStudents);
  const [selectedClassId, setSelectedClassId] = React.useState<string>(classes.length > 0 ? classes[0].id : "");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newStudent, setNewStudent] = React.useState({ name: "", nis: "", nisn: "", gender: "" as Student['gender'] });
  const [loading, setLoading] = React.useState(false);
  
  const { toast } = useToast();
  const { limits, isPro } = useActivation();
  
  React.useEffect(() => {
    setClasses(initialClasses);
    setStudents(initialStudents);
    if (!selectedClassId && initialClasses.length > 0) {
        setSelectedClassId(initialClasses[0].id);
    }
  }, [initialClasses, initialStudents, selectedClassId]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsInClass = students.filter(s => s.class_id === selectedClassId);
  const canAddStudent = isPro || (selectedClass ? studentsInClass.length < limits.studentsPerClass : false);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!canAddStudent) {
        toast({ title: "Batas Siswa Tercapai", description: `Akun gratis hanya bisa menampung ${limits.studentsPerClass} siswa per kelas.`, variant: "destructive" });
        setLoading(false);
        return;
    }
    if (!newStudent.name || !newStudent.nis || !newStudent.nisn || !newStudent.gender) {
        toast({ title: "Gagal", description: "Semua kolom harus diisi.", variant: "destructive" });
        setLoading(false);
        return;
    }

    const formData = new FormData();
    formData.append('class_id', selectedClassId);
    formData.append('name', newStudent.name);
    formData.append('nis', newStudent.nis);
    formData.append('nisn', newStudent.nisn);
    formData.append('gender', newStudent.gender);

    const result = await saveStudent(formData);
    
    if (result.success) {
      toast({ title: "Sukses", description: "Siswa baru berhasil ditambahkan." });
      setNewStudent({ name: "", nis: "", nisn: "", gender: "" as Student['gender'] });
      setIsAddDialogOpen(false);
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-2xl font-bold font-headline">Daftar Siswa</h1>
                <p className="text-muted-foreground">Kelola data induk siswa di setiap kelas.</p>
            </div>
             <div className="flex gap-2 flex-wrap">
                <Button variant="outline" disabled={!isPro}><FileText /> Unduh Template</Button>
                <Button variant="outline" disabled={!isPro}><Upload /> Impor Siswa</Button>
                <Button variant="outline" disabled={!isPro}><Download /> Ekspor Siswa</Button>
            </div>
        </div>
        
        {!isPro && (
            <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Fitur Akun Pro</AlertTitle>
                <AlertDescription>
                    Impor, ekspor, dan unduh template siswa adalah fitur Pro. Batas siswa per kelas juga lebih banyak.
                    <Button variant="link" className="p-0 h-auto ml-1" asChild>
                        <Link href="/dashboard/activation">Aktivasi sekarang</Link>
                    </Button> untuk mengelola data siswa dengan lebih efisien.
                </AlertDescription>
            </Alert>
        )}

        <Card>
        <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <CardTitle>Siswa di Kelas {selectedClass?.name || '...'}</CardTitle>
                    <CardDescription>
                    Lihat, tambah, atau kelola data siswa di kelas ini. ({studentsInClass.length}/{isPro ? '∞' : limits.studentsPerClass} siswa)
                    </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Select
                        onValueChange={handleClassChange}
                        value={selectedClassId}
                    >
                        <SelectTrigger className="w-full sm:w-[220px]">
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
                            <Button disabled={!canAddStudent || !selectedClassId}>
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
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan Siswa
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {studentsInClass.map((student) => (
                <div key={student.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="font-semibold">{student.name}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p><span className="font-medium">NIS:</span> {student.nis}</p>
                        <p><span className="font-medium">NISN:</span> {student.nisn}</p>
                        <p><span className="font-medium">Gender:</span> {student.gender}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="w-full" disabled>
                          <Edit className="mr-2 h-4 w-4" />
                          Ubah
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full" disabled>
                          <UserRoundCog className="mr-2 h-4 w-4" />
                          Pindahkan
                      </Button>
                    </div>
                </div>
              ))}
            </div>
            
            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
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
                        <Button variant="ghost" size="sm" disabled>
                            <Edit className="mr-2 h-3.5 w-3.5"/>
                            Ubah
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                            <UserRoundCog className="mr-2 h-3.5 w-3.5"/>
                            Pindahkan
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            
            {studentsInClass.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Belum ada siswa di kelas ini.</p>
                <p className="text-sm">Silakan tambahkan siswa baru.</p>
              </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}

    