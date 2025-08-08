
"use client";

import * as React from "react";
import { format } from "date-fns";
import { useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Edit } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { classes, subjects, gradeHistory as initialHistory } from "@/lib/placeholder-data";
import type { Student, Class, GradeHistoryEntry, GradeRecord, Subject } from "@/lib/types";

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

    const newEntry: GradeHistoryEntry = {
        id: editingId || `GH${Date.now()}`,
        date,
        classId: selectedClass.id,
        className: selectedClass.name,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        assessmentType: assessmentType,
        records: Array.from(grades.entries()).map(([studentId, score]) => ({ studentId, score })),
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
      entry.records.forEach(record => {
          loadedGrades.set(record.studentId, record.score);
      });
      setGrades(loadedGrades);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
                      {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
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
              Input nilai (0-100) untuk setiap siswa.
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
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Kelas</TableHead>
                            <TableHead>Mata Pelajaran</TableHead>
                            <TableHead>Jenis Penilaian</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.map(entry => (
                            <TableRow key={entry.id}>
                                <TableCell>{format(entry.date, "dd MMM yyyy")}</TableCell>
                                <TableCell>{entry.className}</TableCell>
                                <TableCell>{entry.subjectName}</TableCell>
                                <TableCell>{entry.assessmentType}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Ubah
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
  );
}
