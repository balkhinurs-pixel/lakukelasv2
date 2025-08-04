
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, History, Edit, Eye, Trash2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { classes, subjects, attendanceHistory as initialHistory } from "@/lib/placeholder-data";
import type { Student, AttendanceRecord, Class, AttendanceHistoryEntry, Subject } from "@/lib/types";

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId');
  const preselectedSubjectId = searchParams.get('subjectId');

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [meetingNumber, setMeetingNumber] = React.useState<number | "">("");
  const [attendance, setAttendance] = React.useState<Map<string, AttendanceRecord['status']>>(new Map());
  const [history, setHistory] = React.useState<AttendanceHistoryEntry[]>(initialHistory);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (preselectedClassId) {
      handleClassChange(preselectedClassId);
    }
    if (preselectedSubjectId) {
        handleSubjectChange(preselectedSubjectId);
    }
  }, [preselectedClassId, preselectedSubjectId]);

  const handleClassChange = (classId: string) => {
    const newClass = classes.find((c) => c.id === classId) || null;
    setSelectedClass(newClass);
    setStudents(newClass ? newClass.students : []);
    resetForm(newClass, selectedSubject);
  };
  
  const handleSubjectChange = (subjectId: string) => {
      const newSubject = subjects.find(s => s.id === subjectId) || null;
      setSelectedSubject(newSubject);
  }
  
  const resetForm = (currentClass: Class | null, currentSubject: Subject | null) => {
    setEditingId(null);
    setDate(new Date());
    setMeetingNumber("");
    const newAttendance = new Map();
    currentClass?.students.forEach(student => {
      newAttendance.set(student.id, 'Hadir');
    });
    setAttendance(newAttendance);
  }

  const handleAttendanceChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendance(new Map(attendance.set(studentId, status)));
  };

  const saveAttendance = () => {
    if (!selectedClass || !selectedSubject || !date || !meetingNumber) {
        toast({
            title: "Gagal Menyimpan",
            description: "Harap pilih kelas, mata pelajaran, tanggal, dan isi nomor pertemuan.",
            variant: "destructive",
        });
        return;
    }

    const newEntry: AttendanceHistoryEntry = {
        id: editingId || `AH${Date.now()}`,
        date,
        classId: selectedClass.id,
        className: selectedClass.name,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        meetingNumber: Number(meetingNumber),
        records: Array.from(attendance.entries()).map(([studentId, status]) => ({ studentId, status })),
    };

    if (editingId) {
        setHistory(history.map(h => h.id === editingId ? newEntry : h));
        toast({
            title: "Presensi Diperbarui",
            description: `Presensi untuk ${selectedClass?.name} pada ${date ? format(date, "PPP") : ''} telah diperbarui.`,
        });
    } else {
        setHistory([newEntry, ...history]);
        toast({
          title: "Presensi Disimpan",
          description: `Presensi untuk ${selectedClass?.name} pada ${date ? format(date, "PPP") : ''} (Pertemuan ke-${meetingNumber}) telah berhasil disimpan.`,
          variant: "default",
          className: "bg-green-100 text-green-900 border-green-200",
        });
    }

    resetForm(selectedClass, selectedSubject);
  };

  const handleEdit = (entry: AttendanceHistoryEntry) => {
      const classToEdit = classes.find(c => c.id === entry.classId) || null;
      const subjectToEdit = subjects.find(s => s.id === entry.subjectId) || null;
      if (!classToEdit || !subjectToEdit) return;

      setSelectedClass(classToEdit);
      setSelectedSubject(subjectToEdit);
      setStudents(classToEdit.students);
      setEditingId(entry.id);
      setDate(entry.date);
      setMeetingNumber(entry.meetingNumber);
      
      const loadedAttendance = new Map<string, AttendanceRecord['status']>();
      entry.records.forEach(record => {
          loadedAttendance.set(record.studentId, record.status);
      });
      setAttendance(loadedAttendance);

      // Scroll to top to see the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  const attendanceOptions: AttendanceRecord['status'][] = ['Hadir', 'Sakit', 'Izin', 'Alpha'];

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
          <CardTitle>{editingId ? 'Ubah Presensi' : 'Isi Presensi'}</CardTitle>
          <CardDescription>
            {editingId ? 'Ubah detail presensi yang sudah tersimpan.' : 'Pilih kelas, tanggal, dan pertemuan untuk mengisi presensi siswa.'}
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
                <Label>Tanggal</Label>
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
                <Label htmlFor="meetingNumber">Pertemuan Ke</Label>
                <Input 
                    id="meetingNumber" 
                    type="number"
                    value={meetingNumber} 
                    onChange={(e) => setMeetingNumber(e.target.value === '' ? '' : parseInt(e.target.value))} 
                    placeholder="e.g. 1" 
                    min="1"
                />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Siswa - {selectedClass.name}</CardTitle>
            <CardDescription>
              Tandai status kehadiran setiap siswa untuk tanggal {date ? format(date, "PPP") : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-right">
                        <RadioGroup
                          value={attendance.get(student.id) || 'Hadir'}
                          onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceRecord['status'])}
                          className="flex justify-end gap-2 md:gap-4"
                        >
                          {attendanceOptions.map(option => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${student.id}-${option}`} />
                                <Label htmlFor={`${student.id}-${option}`}>{option}</Label>
                              </div>
                          ))}
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 justify-between">
            <Button onClick={saveAttendance} disabled={!meetingNumber || !selectedSubject}>{editingId ? 'Simpan Perubahan' : 'Simpan Presensi'}</Button>
            {editingId && <Button variant="ghost" onClick={() => resetForm(selectedClass, selectedSubject)}>Batal Mengubah</Button>}
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Riwayat Presensi</CardTitle>
            <CardDescription>Daftar presensi yang telah Anda simpan. Filter berdasarkan kelas atau mapel di atas.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Pertemuan Ke</TableHead>
                        <TableHead>Kehadiran</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredHistory.map(entry => {
                        const total = entry.records.length;
                        const hadir = entry.records.filter(r => r.status === 'Hadir').length;
                        const percentage = total > 0 ? ((hadir / total) * 100).toFixed(0) : 0;
                        return (
                            <TableRow key={entry.id}>
                                <TableCell>{format(entry.date, "dd MMM yyyy")}</TableCell>
                                <TableCell>{entry.className}</TableCell>
                                <TableCell>{entry.subjectName}</TableCell>
                                <TableCell className="text-center">{entry.meetingNumber}</TableCell>
                                <TableCell>{hadir}/{total} ({percentage}%)</TableCell>
                                <TableCell className="text-right">
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
        </CardContent>
      </Card>
    </div>
  );
}
