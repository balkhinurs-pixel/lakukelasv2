
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserPlus, Download, Upload, FileText, Sparkles, Edit, UserRoundCog, Loader2, CheckCircle, XCircle, School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, Class } from "@/lib/types";
import Link from "next/link";
import { saveStudent, updateStudent, importStudents } from "@/lib/actions";

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
    status: Student['status'];
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
        status: "active",
    });

    React.useEffect(() => {
        if (open) {
            if (isEditing && editingStudent) {
                setFormState({
                    id: editingStudent.id,
                    name: editingStudent.name,
                    nis: editingStudent.nis,
                    gender: editingStudent.gender,
                    status: editingStudent.status,
                });
            } else {
                setFormState({ id: "", name: "", nis: "", gender: "", status: "active" });
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
                        {isEditing && (
                             <div className="space-y-2">
                                <Label>Status Siswa</Label>
                                <Select value={formState.status} onValueChange={(value: Student['status']) => setFormState({ ...formState, status: value })} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status siswa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Aktif</SelectItem>
                                        <SelectItem value="graduated">Lulus</SelectItem>
                                        <SelectItem value="dropout">Pindah/Keluar</SelectItem>
                                        <SelectItem value="inactive">Tidak Aktif Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Mengubah status selain 'Aktif' akan memindahkan siswa ke daftar Alumni.</p>
                            </div>
                        )}
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
AddEditDialog.displayName = 'AddEditDialog';

type ImportReport = {
    total: number;
    successCount: number;
    failureCount: number;
    successes: { name: string; nis: string }[];
    failures: { name: string; nis: string; reason: string }[];
};

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
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [importReport, setImportReport] = React.useState<ImportReport | null>(null);
  
  const [loading, setLoading] = React.useState(false);
  
  const { toast } = useToast();
  
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentsInClass = students.filter(s => s.class_id === selectedClassId && s.status === 'active');

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

  const handleSaveStudent = async (e: React.FormEvent, formState: FormState) => {
    e.preventDefault();
    setLoading(true);

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
    formData.append('status', formState.status);

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

  const handleDownloadTemplate = () => {
    const csvData = "nis,name,gender\n12345678,Contoh Siswa,L";
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "template_impor_siswa.csv");
  };

  const handleExportCSV = () => {
      const dataToExport = studentsInClass.map(({ nis, name, gender }) => ({
        nis,
        name,
        gender: gender === 'Laki-laki' ? 'L' : 'P'
      }));
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
          return;
      }
      setLoading(true);

      Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
              const parsedData = results.data as any[];
              
              const studentsToImport = parsedData.map(row => {
                  const genderRaw = (row.gender || '').toUpperCase();
                  const gender = genderRaw === 'L' ? 'Laki-laki' : genderRaw === 'P' ? 'Perempuan' : null;
                  return {
                      name: row.name,
                      nis: row.nis,
                      gender: gender
                  };
              }).filter(s => s.name && s.nis && s.gender);

              if (studentsToImport.length === 0) {
                  toast({ title: "Gagal Impor", description: "File CSV tidak valid atau tidak berisi data yang benar. Pastikan kolom adalah nis, name, gender (L/P).", variant: "destructive" });
                  setLoading(false);
                  return;
              }

              const result = await importStudents(selectedClassId, studentsToImport as { name: string, nis: string, gender: 'Laki-laki' | 'Perempuan' }[]);
              
              setLoading(false);
              if (result.success && result.results) {
                  setImportReport(result.results);
                  setIsReportDialogOpen(true);
                  if (result.results.successCount > 0) {
                      router.refresh();
                  }
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
  
  if (classes.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full py-16">
            <School className="h-16 w-16 mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold">Anda Belum Membuat Kelas</h3>
            <p className="text-sm mt-2 max-w-md">Untuk dapat mengelola siswa, Anda perlu membuat setidaknya satu kelas terlebih dahulu. Silakan pergi ke menu pengaturan kelas.</p>
            <Button asChild className="mt-4">
                <Link href="/admin/roster/classes">Buat Kelas Baru</Link>
            </Button>
        </div>
    )
  }

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
                <Button variant="outline" onClick={handleDownloadTemplate} disabled={loading}><FileText className="h-4 w-4 mr-2" /> Unduh Template</Button>
                <Button variant="outline" onClick={handleImportClick} disabled={loading || !selectedClassId}><Upload className="h-4 w-4 mr-2" /> Impor Siswa</Button>
                <Button variant="outline" onClick={handleExportCSV} disabled={loading || studentsInClass.length === 0}><Download className="h-4 w-4 mr-2" /> Ekspor Siswa</Button>
            </div>
        </div>

        <Card>
        <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <CardTitle>Daftar Siswa Aktif - {selectedClass?.name || '...'}</CardTitle>
                    <CardDescription>
                        Total siswa di kelas ini: <span className="font-semibold">{studentsInClass.length}</span>
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
                    <Button onClick={handleOpenAddDialog} disabled={!selectedClassId || loading}>
                        <UserPlus className="h-4 w-4 mr-2" />
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
                            <UserRoundCog className="mr-2 h-3.5 w-3.5"/>
                            Kelola
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

        {/* Import Report Dialog */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogContent className="max-w-2xl dialog-content-mobile mobile-safe-area">
                <DialogHeader>
                    <DialogTitle>Laporan Hasil Impor</DialogTitle>
                    <DialogDescription>
                        Berikut adalah ringkasan dari proses impor data siswa.
                    </DialogDescription>
                </DialogHeader>
                {importReport && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold">{importReport.total}</p>
                                <p className="text-sm text-blue-700">Total Diproses</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-700">{importReport.successCount}</p>
                                <p className="text-sm text-green-700">Berhasil</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-700">{importReport.failureCount}</p>
                                <p className="text-sm text-red-700">Gagal</p>
                            </div>
                        </div>
                        <Tabs defaultValue="failures">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="failures">Gagal ({importReport.failureCount})</TabsTrigger>
                                <TabsTrigger value="successes">Berhasil ({importReport.successCount})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="failures" className="mt-4">
                                <ScrollArea className="h-60">
                                    {importReport.failureCount > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>NIS</TableHead>
                                                    <TableHead>Alasan</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importReport.failures.map((f, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{f.name}</TableCell>
                                                        <TableCell>{f.nis}</TableCell>
                                                        <TableCell className="text-destructive text-xs">{f.reason}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                                            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                                            <p className="font-semibold">Luar Biasa!</p>
                                            <p className="text-sm">Semua data siswa berhasil diimpor tanpa ada yang gagal.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="successes" className="mt-4">
                               <ScrollArea className="h-60">
                                    {importReport.successCount > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>NIS</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importReport.successes.map((s, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{s.name}</TableCell>
                                                        <TableCell>{s.nis}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                     ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                                            <XCircle className="h-12 w-12 text-red-500 mb-4" />
                                            <p className="font-semibold">Tidak Ada Data Berhasil</p>
                                            <p className="text-sm">Tidak ada data siswa yang berhasil diimpor. Periksa tab "Gagal" untuk detail.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
                 <DialogFooter>
                    <Button onClick={() => setIsReportDialogOpen(false)}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
