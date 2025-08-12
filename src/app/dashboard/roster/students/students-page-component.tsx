
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { saveAs } from "file-saver";
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
import { saveStudent, importStudents, updateStudent, moveStudent } from "@/lib/actions";

// --- Extracted and Memoized Add/Edit Dialog Component ---
interface AddEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    editingStudent: Student | null;
    selectedClass: Class | undefined;
    handleSaveStudent: (e: React.FormEvent, formState: FormState) => void;
    loading: boolean;
}

interface FormState {
    id: string;
    name: string;
    nis: string;
    gender: Student['gender'] | '';
}

const AddEditDialog = React.memo(function AddEditDialog({
    open,
    onOpenChange,
    isEditing,
    editingStudent,
    selectedClass,
    handleSaveStudent,
    loading
}: AddEditDialogProps) {
    const [formState, setFormState] = React.useState<FormState>({
        id: "",
        name: "",
        nis: "",
        gender: "",
    });

    React.useEffect(() => {
        if (open) {
            if (isEditing && editingStudent) {
                setFormState({
                    id: editingStudent.id,
                    name: editingStudent.name,
                    nis: editingStudent.nis,
                    gender: editingStudent.gender,
                });
            } else {
                setFormState({ id: "", name: "", nis: "", gender: "" });
            }
        }
    }, [open, isEditing, editingStudent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSaveStudent(e, formState);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md dialog-content-mobile mobile-safe-area">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? `Perbarui detail untuk ${editingStudent?.name}.` : `Masukkan detail siswa baru untuk ditambahkan ke kelas ${selectedClass?.name}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="student-name">Nama Lengkap Siswa</Label>
                            <Input id="student-name" placeholder="e.g. Ahmad Fauzi" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="student-nis">NIS</Label>
                            <Input id="student-nis" placeholder="e.g. 23241001" value={formState.nis} onChange={e => setFormState({ ...formState, nis: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Jenis Kelamin</Label>
                            <Select value={formState.gender} onValueChange={(value: Student['gender']) => setFormState({ ...formState, gender: value })} required>
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
                            {isEditing ? 'Simpan Perubahan' : 'Simpan Siswa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
});


export default function StudentsPageComponent({
    initialClasses,
    initialStudents,
}: {
    initialClasses: Class[];
    initialStudents: Student[];
}) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [classes] = React.useState<Class[]>(initialClasses);
  const [students, setStudents] = React.useState<Student[]>(initialStudents);
  const [selectedClassId, setSelectedClassId] = React.useState<string>(initialClasses.length > 0 ? initialClasses[0].id : "");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [studentToMove, setStudentToMove] = React.useState<Student | null>(null);
  const [newClassIdForMove, setNewClassIdForMove] = React.useState("");
  
  const [loading, setLoading] = React.useState(false);
  
  const { toast } = useToast();
  const { limits, isPro } = useActivation();
  
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsInClass = students.filter(s => s.class_id === selectedClassId);
  const canAddStudent = isPro || (selectedClass ? studentsInClass.length < limits.studentsPerClass : false);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleOpenAddDialog = () => {
    setEditingStudent(null);
    setIsAddDialogOpen(true);
  };
  
  const handleOpenEditDialog = (student: Student) => {
    setEditingStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleOpenMoveDialog = (student: Student) => {
      setStudentToMove(student);
      setNewClassIdForMove("");
      setIsMoveDialogOpen(true);
  }

  const handleSaveStudent = async (e: React.FormEvent, formState: FormState) => {
    e.preventDefault();
    setLoading(true);

    if (!canAddStudent && !editingStudent) {
        toast({ title: "Batas Siswa Tercapai", description: `Akun gratis hanya bisa menampung ${limits.studentsPerClass} siswa per kelas.`, variant: "destructive" });
        setLoading(false);
        return;
    }
    if (!formState.name || !formState.nis || !formState.gender) {
        toast({ title: "Gagal", description: "Semua kolom harus diisi.", variant: "destructive" });
        setLoading(false);
        return;
    }

    const formData = new FormData();
    if(editingStudent) {
        formData.append('id', editingStudent.id);
    }
    formData.append('class_id', selectedClassId);
    formData.append('name', formState.name);
    formData.append('nis', formState.nis);
    formData.append('gender', formState.gender);

    const result = editingStudent ? await updateStudent(formData) : await saveStudent(formData);
    
    setLoading(false);
    if (result.success) {
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      toast({ title: "Sukses", description: `Data siswa berhasil ${editingStudent ? 'diperbarui' : 'ditambahkan'}.` });
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error, variant: "destructive" });
    }
  };

  const handleMoveStudent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!studentToMove || !newClassIdForMove) {
          toast({ title: "Gagal", description: "Siswa atau kelas tujuan tidak dipilih.", variant: "destructive" });
          return;
      }
      setLoading(true);
      const result = await moveStudent(studentToMove.id, newClassIdForMove);
      
      setLoading(false);
      if (result.success) {
          setIsMoveDialogOpen(false);
          setStudentToMove(null);
          toast({ title: "Sukses", description: `${studentToMove.name} berhasil dipindahkan.` });
          router.refresh();
      } else {
          toast({ title: "Gagal", description: result.error, variant: "destructive" });
      }
  }

  const handleDownloadTemplate = () => {
    const csvData = "name,nis,gender";
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "template_siswa.csv");
  };

  const handleExportCSV = () => {
      const dataToExport = studentsInClass.map(({ name, nis, gender }) => ({ name, nis, gender }));
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const className = selectedClass?.name.replace(/\s+/g, '_') || "export";
      saveAs(blob, `daftar_siswa_${className}.csv`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
          toast({ title: "Gagal", description: "Tidak ada file yang dipilih.", variant: "destructive" });
          return;
      }
      setLoading(true);

      Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
              const parsedData = results.data as any[];
              
              const studentsToImport = parsedData.map(row => ({
                  name: row.name,
                  nis: row.nis,
                  gender: row.gender
              })).filter(s => s.name && s.nis && s.gender);

              if (studentsToImport.length === 0) {
                  toast({ title: "Gagal Impor", description: "File CSV tidak valid atau tidak berisi data yang benar.", variant: "destructive" });
                  setLoading(false);
                  return;
              }

              const result = await importStudents(selectedClassId, studentsToImport);
              
              setLoading(false);
              if (result.success) {
                  toast({ title: "Impor Berhasil", description: `${studentsToImport.length} siswa berhasil diimpor.` });
                  router.refresh();
              } else {
                  toast({ title: "Gagal Impor", description: result.error, variant: "destructive" });
              }
          },
          error: (error) => {
              setLoading(false);
              toast({ title: "Gagal Membaca File", description: error.message, variant: "destructive" });
          }
      });
      event.target.value = '';
  };
  
  return (
    <div className="space-y-6">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSV}
            accept=".csv"
            className="hidden"
        />
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-2xl font-bold font-headline">Daftar Siswa</h1>
                <p className="text-muted-foreground">Kelola data induk siswa di setiap kelas.</p>
            </div>
             <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={handleDownloadTemplate} disabled={!isPro || loading}><FileText /> Unduh Template</Button>
                <Button variant="outline" onClick={handleImportClick} disabled={!isPro || loading}><Upload /> Impor Siswa</Button>
                <Button variant="outline" onClick={handleExportCSV} disabled={!isPro || loading || studentsInClass.length === 0}><Download /> Ekspor Siswa</Button>
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
                    <Button onClick={handleOpenAddDialog} disabled={!canAddStudent || !selectedClassId || loading}>
                        <UserPlus />
                        Tambah Siswa
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {studentsInClass.map((student, index) => (
                <div key={student.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="font-semibold"><span className="font-normal text-muted-foreground mr-2">{index + 1}.</span>{student.name}</div>
                    <div className="text-sm text-muted-foreground space-y-1 border-t pt-3 mt-3">
                        <p><span className="font-medium">NIS:</span> {student.nis}</p>
                        <p><span className="font-medium">Gender:</span> {student.gender}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenEditDialog(student)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Ubah
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => handleOpenMoveDialog(student)}>
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
                    <TableHead className="w-[50px]">No.</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {studentsInClass.map((student, index) => (
                    <TableRow key={student.id}>
                        <TableCell className="font-medium text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.nis}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(student)}>
                            <Edit className="mr-2 h-3.5 w-3.5"/>
                            Ubah
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenMoveDialog(student)}>
                            <UserRoundCog className="mr-2 h-3.5 w-3.5"/>
                            Pindahkan
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            
            {loading && (
                 <div className="text-center text-muted-foreground py-12">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="mt-2">Memproses data...</p>
                </div>
            )}

            {!loading && studentsInClass.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Belum ada siswa di kelas ini.</p>
                <p className="text-sm">Silakan tambahkan siswa baru atau impor dari file CSV.</p>
              </div>
            )}
        </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <AddEditDialog 
            open={isAddDialogOpen} 
            onOpenChange={setIsAddDialogOpen} 
            isEditing={false}
            editingStudent={null}
            selectedClass={selectedClass}
            handleSaveStudent={handleSaveStudent}
            loading={loading}
        />
        <AddEditDialog 
            open={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen} 
            isEditing={true}
            editingStudent={editingStudent}
            selectedClass={selectedClass}
            handleSaveStudent={handleSaveStudent}
            loading={loading}
        />

        {/* Move Student Dialog */}
        <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
            <DialogContent className="dialog-content-mobile mobile-safe-area">
                <form onSubmit={handleMoveStudent}>
                    <DialogHeader>
                        <DialogTitle>Pindahkan Siswa</DialogTitle>
                        <DialogDescription>
                            Pindahkan <span className="font-semibold">{studentToMove?.name}</span> ke kelas lain.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="new-class">Kelas Tujuan Baru</Label>
                        <Select value={newClassIdForMove} onValueChange={setNewClassIdForMove} required>
                            <SelectTrigger id="new-class">
                                <SelectValue placeholder="Pilih kelas tujuan" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.filter(c => c.id !== studentToMove?.class_id).map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsMoveDialogOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Pindahkan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
