
"use client";

import * as React from "react";
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, Edit, Eye, Loader2, User, Users, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Student, AttendanceRecord, Class, AttendanceHistoryEntry, Subject } from "@/lib/types";
import { saveAttendance } from "@/lib/actions";
import { getStudentsByClass } from "@/lib/data-client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const attendanceOptions: { value: AttendanceRecord['status'], label: string, icon: React.ReactNode, className: string, selectedClassName: string }[] = [
    { 
        value: 'Hadir', 
        label: 'Hadir', 
        icon: <CheckCircle2 className="h-4 w-4" />,
        className: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300', 
        selectedClassName: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-md shadow-emerald-200' 
    },
    { 
        value: 'Sakit', 
        label: 'Sakit', 
        icon: <AlertCircle className="h-4 w-4" />,
        className: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-300', 
        selectedClassName: 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500 shadow-md shadow-amber-200' 
    },
    { 
        value: 'Izin', 
        label: 'Izin', 
        icon: <Clock className="h-4 w-4" />,
        className: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300', 
        selectedClassName: 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500 shadow-md shadow-blue-200' 
    },
    { 
        value: 'Alpha', 
        label: 'Alpha', 
        icon: <XCircle className="h-4 w-4" />,
        className: 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-300', 
        selectedClassName: 'bg-red-500 text-white hover:bg-red-600 border-red-500 shadow-md shadow-red-200' 
    },
];


// Isolated component to prevent re-rendering the entire list on a single change
const AttendanceInput = React.memo(({ studentId, value, onChange }: { studentId: string, value: AttendanceRecord['status'], onChange: (studentId: string, status: AttendanceRecord['status']) => void }) => {
    return (
        <div className="flex flex-wrap gap-2 justify-end">
        {attendanceOptions.map(opt => (
            <Button
                key={opt.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(studentId, opt.value)}
                className={cn(
                    "h-9 px-3 rounded-lg border text-sm font-medium transition-all duration-200 ease-in-out",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current/20",
                    "active:scale-95 transform",
                    value === opt.value
                        ? `${opt.selectedClassName} scale-105`
                        : `${opt.className}`
                )}
            >
                <span className="mr-1.5">{opt.icon}</span>
                <span className="hidden sm:inline">{opt.label}</span>
                <span className="sm:hidden">{opt.label.charAt(0)}</span>
            </Button>
        ))}
        </div>
    );
});
AttendanceInput.displayName = 'AttendanceInput';


export default function AttendancePageComponent({
    classes,
    subjects,
    initialHistory,
    activeSchoolYearName
}: {
    classes: Class[];
    subjects: Subject[];
    initialHistory: AttendanceHistoryEntry[];
    activeSchoolYearName: string;
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
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [viewingEntry, setViewingEntry] = React.useState<AttendanceHistoryEntry | null>(null);
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
          // Only reset form if not editing
          if (!editingId) {
            resetForm(fetchedStudents);
          }
          setLoading(false);
      };
      fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAttendanceChange = React.useCallback((studentId: string, status: AttendanceRecord['status']) => {
    setAttendance(prev => new Map(prev.set(studentId, status)));
  }, []);

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
      // Ensure the correct class students are loaded before setting state
      if (selectedClassId !== entry.class_id) {
        setSelectedClassId(entry.class_id);
      }
      setSelectedSubjectId(entry.subject_id);
      
      setLoading(true);
      const fetchedStudents = await getStudentsByClass(entry.class_id);
      setStudents(fetchedStudents);
      
      setEditingId(entry.id);
      setDate(parseISO(entry.date));
      setMeetingNumber(entry.meeting_number);

      const loadedAttendance = new Map<string, AttendanceRecord['status']>();
      fetchedStudents.forEach(student => {
        const record = entry.records.find(r => r.studentId === student.id);
        loadedAttendance.set(student.id, record ? record.status : 'Hadir');
      });
      setAttendance(loadedAttendance);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleViewDetails = (entry: AttendanceHistoryEntry) => {
    setViewingEntry(entry);
    setIsDetailDialogOpen(true);
  }

  const filteredHistory = React.useMemo(() => {
      return initialHistory.filter(h => 
        (!selectedClassId || h.class_id === selectedClassId) && 
        (!selectedSubjectId || h.subject_id === selectedSubjectId)
      );
  }, [initialHistory, selectedClassId, selectedSubjectId]);
  
  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || "Siswa tidak ditemukan";
  }

  const getStatusBadgeVariant = (status: AttendanceRecord['status']) => {
    switch (status) {
        case 'Hadir': return "default";
        case 'Sakit': return "secondary";
        case 'Izin': return "secondary";
        case 'Alpha': return "destructive";
    }
  }
   const getStatusBadgeClass = (status: AttendanceRecord['status']) => {
    switch (status) {
        case 'Hadir': return "bg-green-600 hover:bg-green-700";
        case 'Sakit': return "bg-yellow-500 hover:bg-yellow-600 text-black";
        case 'Izin': return "bg-blue-500 hover:bg-blue-600";
        case 'Alpha': return "bg-red-600 hover:bg-red-700";
    }
  }

  return (
    <div className="space-y-6 p-1">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl",
              editingId ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {editingId ? <Edit className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-xl">{editingId ? 'Ubah Presensi' : 'Input Presensi'}</CardTitle>
              <CardDescription className="mt-1">
                {editingId ? 'Ubah detail presensi yang sudah tersimpan.' : 'Pilih kelas, tanggal, dan pertemuan untuk mencatat presensi siswa.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="space-y-2 xl:col-span-2">
                <Label className="text-sm font-medium text-slate-700">Tahun Ajaran Aktif</Label>
                <Input 
                  value={activeSchoolYearName} 
                  disabled 
                  className="font-semibold bg-slate-50 border-slate-200 text-slate-600"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Kelas</Label>
                <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                  <SelectTrigger className="bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
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
                <Label className="text-sm font-medium text-slate-700">Mata Pelajaran</Label>
                 <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId}>
                    <SelectTrigger className="bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
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
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label className="text-sm font-medium text-slate-700">Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
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
             <div className="space-y-2 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                <Label htmlFor="pertemuan" className="text-sm font-medium text-slate-700">Pertemuan Ke</Label>
                <Input 
                  id="pertemuan" 
                  type="number" 
                  placeholder="e.g. 5" 
                  value={meetingNumber} 
                  onChange={(e) => setMeetingNumber(Number(e.target.value))}
                  className="bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Daftar Siswa - {selectedClass?.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({students.length > 0 ? `${students.length} siswa` : '...'})
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Pilih status kehadiran untuk setiap siswa. Nama siswa sudah diurutkan berdasarkan abjad.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading && students.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <div className="space-y-2">
                        <p className="font-medium">Memuat data siswa...</p>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                </div>
            ) : students.length > 0 ? (
                <>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                        {students.map((student, index) => (
                            <div key={student.id} className="group relative border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                                        {index + 1}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Status kehadiran</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-100">
                                   <AttendanceInput 
                                        studentId={student.id} 
                                        value={attendance.get(student.id) || 'Hadir'}
                                        onChange={handleAttendanceChange}
                                   />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <Table>
                        <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[80px] text-center font-semibold text-slate-700">No.</TableHead>
                            <TableHead className="font-semibold text-slate-700">Nama Siswa</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Status Kehadiran</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {students.map((student, index) => (
                            <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                            <TableCell className="text-center">
                              <div className="w-6 h-6 bg-gradient-to-br from-slate-500 to-slate-600 rounded-md flex items-center justify-center text-white text-xs font-semibold mx-auto">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                            <TableCell className="text-right">
                                <AttendanceInput 
                                    studentId={student.id} 
                                    value={attendance.get(student.id) || 'Hadir'}
                                    onChange={handleAttendanceChange}
                                />
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-slate-100">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-slate-700">Belum ada siswa di kelas ini</p>
                        <p className="text-sm text-slate-500">Silakan tambahkan siswa di menu Manajemen Rombel</p>
                      </div>
                    </div>
                </div>
            )}
          </CardContent>
          {students.length > 0 && (
            <CardFooter className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 rounded-b-xl">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between sm:items-center">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || !meetingNumber}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? 'Simpan Perubahan' : 'Simpan Presensi'}
                  </Button>
                  {editingId && (
                    <Button 
                      variant="outline" 
                      onClick={() => resetForm(students)} 
                      disabled={loading}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      Batal Mengubah
                    </Button>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  Total siswa: <span className="font-semibold">{students.length}</span>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      )}

      {selectedClassId && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Riwayat Presensi</CardTitle>
                <CardDescription className="mt-1">
                  Daftar presensi yang telah Anda simpan. Filter berdasarkan kelas atau mapel di atas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
             {filteredHistory.length > 0 ? (
            <>
              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {filteredHistory.map(entry => {
                  const summary = entry.records.reduce((acc, record) => {
                      acc[record.status] = (acc[record.status] || 0) + 1;
                      return acc;
                  }, {} as Record<AttendanceRecord['status'], number>);
                  return (
                    <div key={entry.id} className="group border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
                      <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{entry.className} - {entry.subjectName}</p>
                              <p className="text-sm text-slate-500 mt-1">
                                {format(parseISO(entry.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Pertemuan ke-{entry.meeting_number}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <div className="text-sm">
                                <span className="font-medium text-emerald-800">Hadir</span>
                                <span className="ml-1 text-emerald-600">{summary.Hadir || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <div className="text-sm">
                                <span className="font-medium text-amber-800">Sakit</span>
                                <span className="ml-1 text-amber-600">{summary.Sakit || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <div className="text-sm">
                                <span className="font-medium text-blue-800">Izin</span>
                                <span className="ml-1 text-blue-600">{summary.Izin || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <div className="text-sm">
                                <span className="font-medium text-red-800">Alpha</span>
                                <span className="ml-1 text-red-600">{summary.Alpha || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                              <Button variant="secondary" size="sm" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => handleViewDetails(entry)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detail
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 border-slate-300 hover:bg-slate-50" onClick={() => handleEdit(entry)} disabled={loading}>
                                <Edit className="mr-2 h-4 w-4" />
                                Ubah
                              </Button>
                          </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <Table>
                      <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
                              <TableHead className="font-semibold text-slate-700">Info</TableHead>
                              <TableHead className="font-semibold text-slate-700">Pertemuan</TableHead>
                              <TableHead className="font-semibold text-slate-700">Ringkasan</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredHistory.map(entry => {
                              const summary = entry.records.reduce((acc, record) => {
                                  acc[record.status] = (acc[record.status] || 0) + 1;
                                  return acc;
                              }, {} as Record<AttendanceRecord['status'], number>);
                              return (
                                   <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                      <TableCell className="font-medium text-slate-900">
                                        {format(parseISO(entry.date), 'EEEE, dd MMM yyyy', { locale: id })}
                                      </TableCell>
                                      <TableCell>
                                          <div className="font-medium text-slate-900">{entry.className}</div>
                                          <div className="text-sm text-slate-500">{entry.subjectName}</div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                                          {entry.meeting_number}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex flex-wrap gap-1">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              {summary.Hadir || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                                              <AlertCircle className="w-3 h-3 mr-1" />
                                              {summary.Sakit || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                              <Clock className="w-3 h-3 mr-1" />
                                              {summary.Izin || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                                              <XCircle className="w-3 h-3 mr-1" />
                                              {summary.Alpha || 0}
                                            </span>
                                          </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleViewDetails(entry)}
                                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                          >
                                              <Eye className="mr-2 h-4 w-4" />
                                              Detail
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEdit(entry)} 
                                            disabled={loading}
                                            className="border-slate-300 hover:bg-slate-50 text-slate-700"
                                          >
                                              <Edit className="mr-2 h-4 w-4" />
                                              Ubah
                                          </Button>
                                        </div>
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                  </Table>
              </div>
            </>
             ) : (
                  <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-slate-100">
                          <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-slate-700">Belum ada riwayat presensi</p>
                          <p className="text-sm text-slate-500">Riwayat presensi yang sudah disimpan akan muncul di sini</p>
                        </div>
                      </div>
                  </div>
              )}
          </CardContent>
        </Card>
      )}

       <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="dialog-content-mobile mobile-safe-area max-w-2xl">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Detail Presensi: {viewingEntry?.className}</DialogTitle>
                  <DialogDescription className="mt-1">
                      {viewingEntry?.subjectName} - {viewingEntry ? format(parseISO(viewingEntry.date), "EEEE, dd MMMM yyyy", { locale: id }) : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2">
                {viewingEntry && students.length > 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                      <Table>
                          <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-semibold text-slate-700">Nama Siswa</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700">Status</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {viewingEntry.records.map(record => (
                                  <TableRow key={record.studentId} className="hover:bg-slate-50/50 transition-colors duration-150">
                                      <TableCell className="font-medium text-slate-900">{getStudentName(record.studentId)}</TableCell>
                                      <TableCell className="text-right">
                                          <Badge 
                                            variant={getStatusBadgeVariant(record.status)} 
                                            className={cn(
                                              getStatusBadgeClass(record.status),
                                              "px-3 py-1 text-sm font-medium"
                                            )}
                                          >
                                              {record.status}
                                          </Badge>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                    </div>
                ) : (
                     <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 rounded-full bg-slate-100">
                            <Users className="h-8 w-8 text-slate-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-slate-700">Memuat data...</p>
                            <p className="text-sm text-slate-500">Mohon tunggu sebentar</p>
                          </div>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
