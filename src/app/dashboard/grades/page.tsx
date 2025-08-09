
"use client";

import * as React from "react";
import { format } from "date-fns";
import { useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Edit, Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { classes, subjects, gradeHistory as initialHistory, students as allStudents } from "@/lib/placeholder-data";
import type { Student, Class, GradeHistoryEntry, GradeRecord, Subject } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

function FormattedDate({ date, formatString }: { date: Date, formatString: string }) {
    const [formattedDate, setFormattedDate] = React.useState<string>('');

    React.useEffect(() => {
        if (date) {
            setFormattedDate(format(date, formatString));
        }
    }, [date, formatString]);

    return <>{formattedDate}</>;
}


export default function GradesPage() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId');
  const preselectedSubjectId = searchParams.get('subjectId');

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [grades, setGrades] = React.useState<Map<string, number | string>>(new Map());
  const [assessmentType, setAssessmentType] = React.useState<string>("");
  const [history, setHistory] = React.useState<GradeHistoryEntry[]>(initialHistory);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = React.useState<GradeHistoryEntry | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);


  const { toast } = useToast();

  React.useEffect(() => {
    if (preselectedClassId) {
      handleClassChange(preselectedClassId);
    }
    if (preselectedSubjectId) {
        const subject = subjects.find(s => s.id === preselectedSubjectId);
        if (subject) {
            setSelectedSubject(subject);
            setAssessmentType(`Tugas Harian - ${subject.name}`);
        }
    }
  }, [preselectedClassId, preselectedSubjectId]);

  const handleClassChange = (classId: string) => {
    const newClass = classes.find((c) => c.id === classId) || null;
    setSelectedClass(newClass);
    setStudents(newClass ? newClass.students : []);
    resetForm(newClass);
  };
  
  const handleSubjectChange = (subjectId: string) => {
      const newSubject = subjects.find(s => s.id === subjectId) || null;
      setSelectedSubject(newSubject);
  }

  const resetForm = (newClass: Class | null) => {
    setEditingId(null);
    setDate(new Date());
    setAssessmentType(selectedSubject ? `Tugas Harian - ${selectedSubject.name}` : "");
    const newGrades = new Map();
    newClass?.students.forEach(student => {
      newGrades.set(student.id, "");
    });
    setGrades(newGrades);
  }

  const handleGradeChange = (studentId: string, value: string) => {
    const score = value === "" ? "" : Math.max(0, Math.min(100, Number(value)));
    setGrades(new Map(grades.set(studentId, score)));
  };

  const saveGrades = () => {
    if (!selectedClass || !selectedSubject || !date || !assessmentType) {
        toast({
            title: "Gagal Menyimpan",
            description: "Harap pilih kelas, mata pelajaran, tanggal, dan isi jenis penilaian.",
            variant: "destructive",
        });
        return;
    }
    
    const gradedRecords = Array.from(grades.entries())
        .filter(([, score]) => score !== "" && score !== null && score !== undefined)
        .map(([studentId, score]) => ({ studentId, score }));

    if (gradedRecords.length === 0) {
        toast({
            title: "Gagal Menyimpan",
            description: "Tidak ada nilai yang diinput. Harap isi setidaknya satu nilai siswa.",
            variant: "destructive",
        });
        return;
    }


    const newEntry: GradeHistoryEntry = {
        id: editingId || `GH${Date.now()}`,
        date,
        classId: selectedClass.id,
        className: selectedClass.name,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        assessmentType: assessmentType,
        records: gradedRecords,
    };

    if (editingId) {
        setHistory(history.map(h => h.id === editingId ? newEntry : h));
        toast({ title: "Nilai Diperbarui", description: `Nilai untuk ${assessmentType} telah diperbarui.` });
    } else {
        setHistory([newEntry, ...history]);
        toast({
          title: "Nilai Disimpan",
          description: `Nilai untuk ${selectedClass?.name} pada ${date ? format(date, "PPP") : ''} telah berhasil disimpan.`,
          variant: "default",
          className: "bg-green-100 text-green-900 border-green-200",
        });
    }

    resetForm(selectedClass);
  };
  
  const handleEdit = (entry: GradeHistoryEntry) => {
      const classToEdit = classes.find(c => c.id === entry.classId) || null;
      const subjectToEdit = subjects.find(s => s.id === entry.subjectId) || null;
      if (!classToEdit || !subjectToEdit) return;

      setSelectedClass(classToEdit);
      setSelectedSubject(subjectToEdit);
      setStudents(classToEdit.students);
      setEditingId(entry.id);
      setDate(entry.date);
      setAssessmentType(entry.assessmentType);
      
      const loadedGrades = new Map<string, GradeRecord['score']>();
      classToEdit.students.forEach(student => {
          const record = entry.records.find(r => r.studentId === student.id);
          loadedGrades.set(student.id, record ? record.score : "");
      });
      setGrades(loadedGrades);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleViewDetails = (entry: GradeHistoryEntry) => {
    setViewingEntry(entry);
    setIsDetailDialogOpen(true);
  }

  const filteredHistory = React.useMemo(() => {
    let result = history;
    if (selectedClass) {
        result = result.filter(entry => entry.classId === selectedClass.id);
    }
    if (selectedSubject) {
        result = result.filter(entry => entry.subjectId === selectedSubject.id);
    }
    return result;
  }, [history, selectedClass, selectedSubject]);

  const getStudentName = (studentId: string) => {
    return allStudents.find(s => s.id === studentId)?.name || "Siswa Tidak Ditemukan";
  };
  
  const getSubjectKkm = (subjectId: string | undefined): number => {
      if (!subjectId) return 75; // Default KKM
      const subject = subjects.find(s => s.id === subjectId);
      return subject ? subject.kkm : 75;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Ubah Nilai' : 'Input Nilai'}</CardTitle>
          <CardDescription>
            {editingId ? 'Ubah detail nilai yang sudah tersimpan.' : 'Pilih kelas, tanggal, dan jenis penilaian untuk menginput nilai siswa.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label>Kelas</Label>
                <Select onValueChange={handleClassChange} value={selectedClass?.id}>
                  <SelectTrigger>
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
            </div>
             <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                 <Select onValueChange={handleSubjectChange} value={selectedSubject?.id}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                            {s.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Tanggal Penilaian</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? <FormattedDate date={date} formatString="PPP" /> : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
            </div>
             <div className="space-y-2">
                <Label htmlFor="assessmentType">Jenis Penilaian</Label>
                <Input id="assessmentType" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} placeholder="e.g. Ulangan Harian 1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Nilai - {selectedClass.name}</CardTitle>
            <CardDescription>
              Input nilai (0-100) untuk setiap siswa. Kosongkan jika tidak ada nilai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="w-[120px] text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={grades.get(student.id) ?? ""}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className="w-24 text-right"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 justify-between flex-wrap gap-2">
            <Button onClick={saveGrades} disabled={!assessmentType || !selectedSubject}>{editingId ? 'Simpan Perubahan' : 'Simpan Nilai'}</Button>
             {editingId && <Button variant="ghost" onClick={() => resetForm(selectedClass)}>Batal Mengubah</Button>}
          </CardFooter>
        </Card>
      )}

       <Card>
        <CardHeader>
            <CardTitle>Riwayat Penilaian</CardTitle>
            <CardDescription>Daftar nilai yang telah Anda simpan. Filter berdasarkan kelas atau mapel di atas.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {filteredHistory.map(entry => {
                const scores = entry.records.map(r => Number(r.score)).filter(s => !isNaN(s));
                const average = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
                return (
                    <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                        <div className="font-semibold">{entry.assessmentType}</div>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>Kelas: {entry.className}</p>
                            <p>Mapel: {entry.subjectName}</p>
                            <p>Tanggal: <FormattedDate date={entry.date} formatString="dd MMM yyyy" /></p>
                        </div>
                        <div className="border-t pt-3 mt-3 flex justify-between items-center text-sm">
                            <div>
                                <p className="font-semibold">{average}</p>
                                <p className="text-xs text-muted-foreground">Rata-rata</p>
                            </div>
                             <div>
                                <p className="font-semibold">{entry.records.length}</p>
                                <p className="text-xs text-muted-foreground">Siswa Dinilai</p>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                             <Button variant="secondary" size="sm" className="w-full" onClick={() => handleViewDetails(entry)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </Button>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(entry)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Ubah
                            </Button>
                        </div>
                    </div>
                )
              })}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Jenis Penilaian</TableHead>
                            <TableHead>Info</TableHead>
                            <TableHead className="text-center">Siswa Dinilai</TableHead>
                            <TableHead className="text-center">Rata-rata</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.map(entry => {
                           const scores = entry.records.map(r => Number(r.score)).filter(s => !isNaN(s));
                           const average = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
                           return (
                                <TableRow key={entry.id}>
                                    <TableCell><FormattedDate date={entry.date} formatString="dd MMM yyyy" /></TableCell>
                                    <TableCell>{entry.assessmentType}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{entry.className}</div>
                                        <div className="text-xs text-muted-foreground">{entry.subjectName}</div>
                                    </TableCell>
                                    <TableCell className="text-center">{entry.records.length}</TableCell>
                                    <TableCell className="text-center font-semibold">{average}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                         <Button variant="ghost" size="sm" onClick={() => handleViewDetails(entry)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Detail
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Ubah
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
            {filteredHistory.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <p>Belum ada riwayat penilaian.</p>
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Detail Nilai: {viewingEntry?.assessmentType}</DialogTitle>
            <DialogDescription>
                Daftar nilai untuk kelas {viewingEntry?.className} ({viewingEntry?.subjectName}). KKM: <span className="font-bold">{getSubjectKkm(viewingEntry?.subjectId)}</span>
            </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead className="text-right">Nilai</TableHead>
                        <TableHead className="text-right">Predikat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {viewingEntry?.records.map(record => {
                            const score = Number(record.score);
                            const kkm = getSubjectKkm(viewingEntry.subjectId);
                            const isPassing = score >= kkm;
                            return (
                                <TableRow key={record.studentId}>
                                    <TableCell>{getStudentName(record.studentId)}</TableCell>
                                    <TableCell className="text-right font-medium">{record.score}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={isPassing ? 'default' : 'destructive'} className={isPassing ? "bg-green-600 hover:bg-green-700" : ""}>
                                            {isPassing ? 'Tuntas' : 'Remedial'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
