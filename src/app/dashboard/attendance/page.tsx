
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, History, Edit, Eye, Trash2, Check, X, Hand, AlertCircle } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AttendanceStatus = AttendanceRecord['status'];
const attendanceOptions: { value: AttendanceStatus, label: string, icon: React.ElementType, color: string, tooltip: string }[] = [
    { value: 'Hadir', label: 'H', icon: Check, color: 'bg-green-100 text-green-800 border-green-200 data-[state=checked]:bg-green-500 data-[state=checked]:text-white data-[state=checked]:border-green-600', tooltip: 'Hadir' },
    { value: 'Sakit', label: 'S', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-white data-[state=checked]:border-yellow-600', tooltip: 'Sakit' },
    { value: 'Izin', label: 'I', icon: Hand, color: 'bg-blue-100 text-blue-800 border-blue-200 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white data-[state=checked]:border-blue-600', tooltip: 'Izin' },
    { value: 'Alpha', label: 'A', icon: X, color: 'bg-red-100 text-red-800 border-red-200 data-[state=checked]:bg-red-500 data-[state=checked]:text-white data-[state=checked]:border-red-600', tooltip: 'Alpha' },
];

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
            <div className="space-y-2">
              {students.map((student, index) => (
                <div key={student.id} className={cn("p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", index % 2 === 0 ? "bg-muted/50" : "")}>
                  <p className="font-medium flex-1">{student.name}</p>
                  <RadioGroup
                      value={attendance.get(student.id) || 'Hadir'}
                      onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceRecord['status'])}
                      className="flex justify-start sm:justify-end gap-2 flex-wrap"
                    >
                      <TooltipProvider delayDuration={200}>
                      {attendanceOptions.map(option => (
                        <Tooltip key={option.value}>
                          <TooltipTrigger asChild>
                             <RadioGroupItem value={option.value} id={`${student.id}-${option.value}`} className="peer sr-only" />
                          </TooltipTrigger>
                          <TooltipContent className="hidden sm:block">
                            <p>{option.tooltip}</p>
                          </TooltipContent>
                           <Label 
                            htmlFor={`${student.id}-${option.value}`}
                            className={cn("h-9 w-9 flex items-center justify-center rounded-md border text-sm font-semibold cursor-pointer transition-colors", option.color)}
                           >
                            {option.label}
                           </Label>
                        </Tooltip>
                      ))}
                      </TooltipProvider>
                    </RadioGroup>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 justify-between flex-wrap gap-2">
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
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {filteredHistory.map(entry => {
                const total = entry.records.length;
                const hadir = entry.records.filter(r => r.status === 'Hadir').length;
                const percentage = total > 0 ? ((hadir / total) * 100).toFixed(0) : 0;
                return (
                  <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                    <div>
                      <div className="font-semibold">{entry.subjectName} - {entry.className}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(entry.date, "dd MMM yyyy")} - Pertemuan ke-{entry.meetingNumber}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      Kehadiran: {hadir}/{total} ({percentage}%)
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(entry)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Ubah
                    </Button>
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
            </div>
             {filteredHistory.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <p>Belum ada riwayat presensi.</p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}


    
    