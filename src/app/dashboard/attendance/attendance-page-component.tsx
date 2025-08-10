
"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Edit, Loader2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";

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
import type { Student, AttendanceRecord, Class, AttendanceHistoryEntry, Subject } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { saveAttendance } from "@/lib/actions";
import { getStudentsByClass } from "@/lib/data-client";

const attendanceOptions: { value: AttendanceRecord['status'], label: string, color: string, tooltip: string }[] = [
    { value: 'Hadir', label: 'H', color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 data-[state=checked]:bg-green-600 data-[state=checked]:text-white data-[state=checked]:border-green-700', tooltip: 'Hadir' },
    { value: 'Sakit', label: 'S', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-white data-[state=checked]:border-yellow-600', tooltip: 'Sakit' },
    { value: 'Izin', label: 'I', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white data-[state=checked]:border-blue-600', tooltip: 'Izin' },
    { value: 'Alpha', label: 'A', color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 data-[state=checked]:bg-red-600 data-[state=checked]:text-white data-[state=checked]:border-red-700', tooltip: 'Alpha' },
];


export default function AttendancePageComponent({
    classes,
    subjects,
    initialHistory
}: {
    classes: Class[];
    subjects: Subject[];
    initialHistory: AttendanceHistoryEntry[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedClassId = searchParams.get('classId');
  const preselectedSubjectId = searchParams.get('subjectId');

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>(preselectedClassId || undefined);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | undefined>(preselectedSubjectId || undefined);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [meetingNumber, setMeetingNumber] = React.useState<number | "">("");
  const [attendance, setAttendance] = React.useState<Map<string, AttendanceRecord['status']>>(new Map());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const selectedClass = classes.find(c => c.id === selectedClassId);

  React.useEffect(() => {
      const fetchStudents = async () => {
          if (!selectedClassId) {
              setStudents([]);
              return;
          }
          setLoading(true);
          const fetchedStudents = await getStudentsByClass(selectedClassId);
          setStudents(fetchedStudents);
          resetForm(fetchedStudents);
          setLoading(false);
      };
      fetchStudents();
  }, [selectedClassId]);

  const resetForm = (studentList: Student[]) => {
    setEditingId(null);
    setDate(new Date());
    setMeetingNumber("");
    const newAttendance = new Map();
    studentList.forEach(student => {
      newAttendance.set(student.id, 'Hadir');
    });
    setAttendance(newAttendance);
  }

  const handleAttendanceChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendance(new Map(attendance.set(studentId, status)));
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubjectId || !date || !meetingNumber) {
        toast({
            title: "Gagal Menyimpan",
            description: "Harap pilih kelas, mata pelajaran, tanggal, dan isi nomor pertemuan.",
            variant: "destructive",
        });
        return;
    }
    setLoading(true);

    const formData = new FormData();
    if (editingId) {
      formData.append('id', editingId);
    }
    formData.append('date', format(date, 'yyyy-MM-dd'));
    formData.append('class_id', selectedClassId);
    formData.append('subject_id', selectedSubjectId);
    formData.append('meeting_number', String(meetingNumber));
    formData.append('records', JSON.stringify(Array.from(attendance.entries()).map(([student_id, status]) => ({ student_id, status }))));
    
    const result = await saveAttendance(formData);

    if (result.success) {
      toast({
        title: editingId ? "Presensi Diperbarui" : "Presensi Disimpan",
        description: `Presensi telah berhasil disimpan.`,
      });
      router.refresh();
      resetForm(students);
    } else {
      toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleEdit = async (entry: AttendanceHistoryEntry) => {
      setSelectedClassId(entry.class_id);
      setSelectedSubjectId(entry.subject_id);
      
      setLoading(true);
      const fetchedStudents = await getStudentsByClass(entry.class_id);
      setStudents(fetchedStudents);
      
      setEditingId(entry.id);
      setDate(parseISO(entry.date));
      setMeetingNumber(entry.meeting_number);

      const loadedAttendance = new Map<string, AttendanceRecord['status']>();
      entry.records.forEach(record => {
          loadedAttendance.set(record.studentId, record.status);
      });
      setAttendance(loadedAttendance);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const filteredHistory = React.useMemo(() => {
      return initialHistory.filter(h => 
        (!selectedClassId || h.class_id === selectedClassId) && 
        (!selectedSubjectId || h.subject_id === selectedSubjectId)
      );
  }, [initialHistory, selectedClassId, selectedSubjectId]);

  const AttendanceInputComponent = ({studentId}: {studentId: string}) => (
        <RadioGroup
            value={attendance.get(studentId)}
            onValueChange={(status) => handleAttendanceChange(studentId, status as AttendanceRecord['status'])}
            className="justify-end"
        >
            <TooltipProvider>
                <div className="flex gap-1 justify-end">
                {attendanceOptions.map(opt => (
                    <Tooltip key={opt.value}>
                        <TooltipTrigger asChild>
                            <Label
                                htmlFor={`${studentId}-${opt.value}`}
                                className={cn(
                                "flex items-center justify-center size-8 rounded-md border text-xs font-semibold cursor-pointer transition-colors",
                                opt.color
                                )}
                            >
                                {opt.label}
                                <RadioGroupItem value={opt.value} id={`${studentId}-${opt.value}`} className="sr-only" />
                            </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{opt.tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
                </div>
        </TooltipProvider>
        </RadioGroup>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Ubah Presensi' : 'Input Presensi'}</CardTitle>
          <CardDescription>
            {editingId ? 'Ubah detail presensi yang sudah tersimpan.' : 'Pilih kelas, tanggal, dan pertemuan untuk mencatat presensi siswa.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label>Kelas</Label>
                <Select onValueChange={setSelectedClassId} value={selectedClassId}>
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
                 <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId}>
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
                <Label htmlFor="pertemuan">Pertemuan Ke</Label>
                <Input id="pertemuan" type="number" placeholder="e.g. 5" value={meetingNumber} onChange={(e) => setMeetingNumber(Number(e.target.value))}/>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Siswa - {selectedClass?.name}</CardTitle>
            <CardDescription>Pilih status kehadiran untuk setiap siswa. Nama siswa sudah diurutkan berdasarkan abjad.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && students.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="mt-2">Memuat data siswa...</p>
                </div>
            ) : students.length > 0 ? (
                <>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {students.map((student, index) => (
                            <div key={student.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                                <p><span className="font-bold mr-2">{index + 1}.</span>{student.name}</p>
                                <div className="border-t pt-3 mt-3">
                                   <AttendanceInputComponent studentId={student.id}/>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">No.</TableHead>
                            <TableHead>Nama Siswa</TableHead>
                            <TableHead className="text-right">Status Kehadiran</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {students.map((student, index) => (
                            <TableRow key={student.id}>
                            <TableCell className="font-medium text-center">{index + 1}</TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="text-right">
                                <AttendanceInputComponent studentId={student.id}/>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                </>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    <p>Belum ada siswa di kelas ini.</p>
                    <p className="text-sm">Silakan tambahkan siswa di menu Manajemen Rombel.</p>
                </div>
            )}
          </CardContent>
          {students.length > 0 && (
            <CardFooter className="border-t px-6 py-4 justify-between flex-wrap gap-2">
              <Button onClick={handleSubmit} disabled={loading || !meetingNumber}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Simpan Perubahan' : 'Simpan Presensi'}
              </Button>
              {editingId && <Button variant="ghost" onClick={() => resetForm(students)} disabled={loading}>Batal Mengubah</Button>}
            </CardFooter>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Riwayat Presensi</CardTitle>
            <CardDescription>Daftar presensi yang telah Anda simpan. Filter berdasarkan kelas atau mapel di atas.</CardDescription>
        </CardHeader>
        <CardContent>
           {filteredHistory.length > 0 ? (
            <>
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {filteredHistory.map(entry => {
                  const summary = entry.records.reduce((acc, record) => {
                      acc[record.status] = (acc[record.status] || 0) + 1;
                      return acc;
                  }, {} as Record<AttendanceRecord['status'], number>);
                  return (
                    <div key={entry.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="font-semibold">{entry.className} - {entry.subjectName}</p>
                              <p className="text-sm text-muted-foreground">{format(parseISO(entry.date), 'dd MMMM yyyy')} (Pertemuan ke-{entry.meeting_number})</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(entry)} disabled={loading} className="ml-auto shrink-0">
                            <Edit className="mr-2 h-4 w-4" />
                            Ubah
                          </Button>
                      </div>
                      <div className="border-t pt-3 mt-3 text-sm">
                        <span className="text-green-600 font-medium">H: {summary.Hadir || 0}</span>,{' '}
                        <span className="text-yellow-600 font-medium">S: {summary.Sakit || 0}</span>,{' '}
                        <span className="text-blue-600 font-medium">I: {summary.Izin || 0}</span>,{' '}
                        <span className="text-red-600 font-medium">A: {summary.Alpha || 0}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Tanggal</TableHead>
                              <TableHead>Info</TableHead>
                              <TableHead>Pertemuan Ke</TableHead>
                              <TableHead>Ringkasan</TableHead>
                              <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredHistory.map(entry => {
                              const summary = entry.records.reduce((acc, record) => {
                                  acc[record.status] = (acc[record.status] || 0) + 1;
                                  return acc;
                              }, {} as Record<AttendanceRecord['status'], number>);
                              return (
                                   <TableRow key={entry.id}>
                                      <TableCell>{format(parseISO(entry.date), 'dd MMM yyyy')}</TableCell>
                                      <TableCell>
                                          <div className="font-medium">{entry.className}</div>
                                          <div className="text-xs text-muted-foreground">{entry.subjectName}</div>
                                      </TableCell>
                                      <TableCell>{entry.meeting_number}</TableCell>
                                      <TableCell className="text-xs">
                                          <span className="text-green-600">H: {summary.Hadir || 0}</span>,{' '}
                                          <span className="text-yellow-600">S: {summary.Sakit || 0}</span>,{' '}
                                          <span className="text-blue-600">I: {summary.Izin || 0}</span>,{' '}
                                          <span className="text-red-600">A: {summary.Alpha || 0}</span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Button variant="outline" size="sm" onClick={() => handleEdit(entry)} disabled={loading}>
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
            </>
           ) : (
                <div className="text-center text-muted-foreground py-12">
                    <p>Belum ada riwayat presensi yang tersimpan.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    