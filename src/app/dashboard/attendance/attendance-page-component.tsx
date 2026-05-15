"use client";

import * as React from "react";
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, Edit, Eye, Loader2, User, Users, CheckCircle2, XCircle, AlertCircle, Clock, MessageSquarePlus, TrendingUp, TrendingDown, MessageSquare, ArrowUpCircle, Flag, School, Coffee, AlertTriangle } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';

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
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import type { Student, Class, AttendanceHistoryEntry, Subject, StudentNote, Holiday, ScheduleItem } from "@/lib/types";
import { saveAttendance, addStudentNote } from "@/lib/actions";
import { getLatestClassPresence } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { getIndonesianDayFromDate } from "@/lib/timezone";
import { LottieWhatsApp } from "@/components/ui/lottie-whatsapp";
import { LottieCalendar } from "@/components/ui/lottie-calendar";
import { LottieSchoolHoliday } from "@/components/ui/lottie-school-holiday";

const attendanceOptions: { value: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha', label: string, icon: React.ReactNode, className: string, selectedClassName: string }[] = [
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

const AttendanceInput = React.memo(({ studentId, value, onChange, disabled }: { studentId: string, value: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha', onChange: (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => void, disabled?: boolean }) => {
    return (
        <div className={cn("flex flex-wrap gap-2 justify-start sm:justify-end", disabled && "opacity-50 pointer-events-none")}>
        {attendanceOptions.map(opt => (
            <Button
                key={opt.value}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(studentId, opt.value)}
                className={cn(
                    "h-10 px-3.5 rounded-xl border text-sm font-bold transition-all duration-200 ease-in-out flex-shrink-0",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current/20",
                    "active:scale-95 transform",
                    value === opt.value
                        ? `${opt.selectedClassName} scale-105 z-10`
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

const AddNoteDialog = ({ student, onNoteSaved, disabled }: { student: Student | null, onNoteSaved: () => void, disabled?: boolean }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [note, setNote] = React.useState('');
    const [noteType, setNoteType] = React.useState<StudentNote['type']>('neutral');
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const handleSaveNote = async () => {
        if (!student || !note) {
            toast({ title: "Gagal", description: "Isi catatan tidak boleh kosong.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const result = await addStudentNote({ studentId: student.id, note, type: noteType });
        if (result.success) {
            toast({ title: "Catatan Disimpan", description: `Catatan untuk ${student.name} telah disimpan.` });
            onNoteSaved();
            setIsOpen(false);
            setNote('');
            setNoteType('neutral');
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    if (!student) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={disabled} className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                    <MessageSquarePlus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="dialog-content-mobile mobile-safe-area">
                <DialogHeader>
                    <DialogTitle>Tambah Catatan untuk {student.name}</DialogTitle>
                    <DialogDescription>Catatan ini akan dapat dilihat oleh wali kelas.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="note-content">Isi Catatan</Label>
                        <Textarea id="note-content" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Tidak mengerjakan PR, sangat aktif di kelas, dll." />
                    </div>
                    <div className="space-y-2">
                        <Label>Jenis Catatan</Label>
                        <RadioGroup value={noteType} onValueChange={(value: StudentNote['type']) => setNoteType(value)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="positive" id="r-positive" />
                                <Label htmlFor="r-positive" className="flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-500"/> Positif</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement" id="r-improvement" />
                                <Label htmlFor="r-improvement" className="flex items-center gap-1"><TrendingDown className="h-4 w-4 text-yellow-500"/> Perbaikan</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="neutral" id="r-neutral" />
                                <Label htmlFor="r-neutral" className="flex items-center gap-1">Netral</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter className="flex flex-row gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsOpen(false)}>Batal</Button>
                    <Button className="flex-1 rounded-xl" onClick={handleSaveNote} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Simpan Catatan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AttendancePageComponent({
    classes,
    subjects,
    initialHistory,
    allStudents,
    activeSchoolYearName,
    teacherName,
    holidays = [],
    teacherSchedule = []
}: {
    classes: Class[];
    subjects: Subject[];
    initialHistory: AttendanceHistoryEntry[];
    allStudents: Student[];
    activeSchoolYearName: string;
    teacherName: string;
    holidays?: Holiday[];
    teacherSchedule?: ScheduleItem[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedClassId = searchParams.get('classId');
  const preselectedSubjectId = searchParams.get('subjectId');

  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>(preselectedClassId || undefined);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | undefined>(preselectedSubjectId || undefined);
  const [meetingNumber, setMeetingNumber] = React.useState<number | "">("");
  const [attendance, setAttendance] = React.useState<Map<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>>(new Map());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [viewingEntry, setViewingEntry] = React.useState<AttendanceHistoryEntry | null>(null);
  const [isInherited, setIsInherited] = React.useState(false);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 3;

  const lastLoadedKeyRef = React.useRef<string>("");

  React.useEffect(() => {
    setDate(new Date());
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const students = React.useMemo(() => {
    if (!selectedClassId) return [];
    return allStudents.filter(s => s.class_id === selectedClassId);
  }, [allStudents, selectedClassId]);

  const currentHoliday = React.useMemo(() => {
      if (!date) return null;
      const dateStr = format(date, 'yyyy-MM-dd');
      const dbHoliday = holidays.find(h => h.date === dateStr);
      if (dbHoliday) return dbHoliday;
      
      if (date.getDay() === 0) {
          return {
              id: 'sunday',
              date: dateStr,
              description: "Hari Minggu - Libur Rutin",
              type: 'school' as const
          };
      }
      return null;
  }, [date, holidays]);

  const isScheduledToday = React.useMemo(() => {
    if (!date || !selectedClassId || !selectedSubjectId || teacherSchedule.length === 0) return true;
    
    const dayName = getIndonesianDayFromDate(format(date, 'yyyy-MM-dd'));
    return teacherSchedule.some(item => 
        item.day === dayName && 
        item.class_id === selectedClassId && 
        item.subject_id === selectedSubjectId
    );
  }, [date, selectedClassId, selectedSubjectId, teacherSchedule]);
  
  React.useEffect(() => {
    if (!selectedClassId || !date || editingId || currentHoliday) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const currentKey = `${selectedClassId}-${dateStr}`;
    
    if (lastLoadedKeyRef.current === currentKey) return;
    lastLoadedKeyRef.current = currentKey;

    const initForm = async () => {
        setLoading(true);
        try {
          const newAttendance = new Map();
          students.forEach(student => {
            newAttendance.set(student.id, 'Hadir');
          });
          
          setIsInherited(false);
          const inherited = await getLatestClassPresence(selectedClassId, dateStr);
          
          if (Object.keys(inherited).length > 0) {
            Object.entries(inherited).forEach(([id, status]) => {
                newAttendance.set(id, status as any);
            });
            setIsInherited(true);
          }
          
          setAttendance(newAttendance);
        } catch (error) {
          console.error("Failed to initialize attendance form:", error);
        } finally {
          setLoading(false);
        }
    };
    
    initForm();
  }, [selectedClassId, date, editingId, students, currentHoliday]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedClassId, selectedSubjectId]);

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date());
    setMeetingNumber("");
    setIsInherited(false);
    lastLoadedKeyRef.current = "";
  }

  const handleAttendanceChange = React.useCallback((studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => {
    setAttendance(prev => {
        const next = new Map(prev);
        next.set(studentId, status);
        return next;
    });
  }, []);

  const getStudentName = (studentId: string) => {
    return allStudents.find(s => s.id === studentId)?.name || "Siswa tidak ditemukan";
  }

  const handleSendWhatsApp = () => {
    if (!selectedClass || !selectedSubject || !date || !meetingNumber) {
        toast({ title: "Data Tidak Lengkap", description: "Mohon isi semua data di formulir sebelum mengirim ke WhatsApp.", variant: "destructive" });
        return;
    }

    const hadirCount = Array.from(attendance.values()).filter(s => s === 'Hadir').length;
    const sakitList = Array.from(attendance.entries()).filter(([, s]) => s === 'Sakit').map(([id]) => getStudentName(id));
    const izinList = Array.from(attendance.entries()).filter(([, s]) => s === 'Izin').map(([id]) => getStudentName(id));
    const alphaList = Array.from(attendance.entries()).filter(([, s]) => s === 'Alpha').map(([id]) => getStudentName(id));

    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const message = `*LAPORAN PRESENSI SISWA*
*---------------------------*
👤 *Guru:* ${teacherName}
🏫 *Kelas:* ${selectedClass.name}
📚 *Mapel:* ${selectedSubject.name}
🗓️ *Hari/Tgl:* ${format(date, 'EEEE, dd MMMM yyyy', { locale: id })}
⏰ *Jam:* ${currentTime} WIB
🔢 *Pertemuan Ke:* ${meetingNumber}

*RINGKASAN KEHADIRAN:*
✅ Hadir: ${hadirCount} Siswa
🤒 Sakit: ${sakitList.length}${sakitList.length > 0 ? ` (${sakitList.join(', ')})` : ''}
📩 Izin: ${izinList.length}${izinList.length > 0 ? ` (${izinList.join(', ')})` : ''}
❌ Alpha: ${alphaList.length}${alphaList.length > 0 ? ` (${alphaList.join(', ')})` : ''}

*Total Siswa:* ${students.length}

_Laporan ini dibuat otomatis melalui LakuKelas_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleSubmit = async () => {
    if (currentHoliday) return;
    
    if (!selectedClassId || !selectedSubjectId || !date || !meetingNumber) {
        toast({
            title: "Gagal Menyimpan",
            description: "Harap pilih kelas, mata pelajaran, tanggal, and isi nomor pertemuan.",
            variant: "destructive",
        });
        return;
    }
    setLoading(true);

    const formData = new FormData();
    if (editingId) {
      const originalEntry = initialHistory.find(h => h.id === editingId);
      if (originalEntry) {
          formData.append('original_date', originalEntry.date);
          formData.append('original_class_id', originalEntry.class_id);
          formData.append('original_subject_id', originalEntry.subject_id);
          formData.append('original_meeting_number', String(originalEntry.meeting_number));
      }
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
      resetForm();
    } else {
      toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleEdit = (entry: AttendanceHistoryEntry) => {
      setLoading(true);
      if (selectedClassId !== entry.class_id) {
        setSelectedClassId(entry.class_id);
      }
      setSelectedSubjectId(entry.subject_id);
      
      setEditingId(entry.id); 
      setDate(parseISO(entry.date));
      setMeetingNumber(entry.meeting_number);

      const loadedAttendance = new Map<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'>();
      const sessionRecords = initialHistory.filter(h => 
          h.date === entry.date && 
          h.class_id === entry.class_id && 
          h.subject_id === entry.subject_id && 
          h.meeting_number === entry.meeting_number
      );
      
      const studentsForClass = allStudents.filter(s => s.class_id === entry.class_id);
      studentsForClass.forEach(student => {
        const studentRecord = sessionRecords.find(h => h.student_id === student.id);
        loadedAttendance.set(student.id, studentRecord ? studentRecord.status : 'Hadir');
      });

      setAttendance(loadedAttendance);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleViewDetails = (entry: AttendanceHistoryEntry) => {
    setViewingEntry(entry);
    setIsDetailDialogOpen(true);
  }

  const groupedHistory = React.useMemo(() => {
    const groups: { [key: string]: { entry: AttendanceHistoryEntry, records: { student_id: string, status: string }[] } } = {};
    initialHistory.forEach(item => {
      const key = `${item.date}-${item.class_id}-${item.subject_id}-${item.meeting_number}`;
      if (!groups[key]) {
        groups[key] = {
          entry: { ...item },
          records: []
        };
      }
      groups[key].records.push({ student_id: item.student_id, status: item.status });
    });
    return Object.values(groups);
  }, [initialHistory]);

  const filteredHistory = React.useMemo(() => {
      return groupedHistory.filter(h => 
        (!selectedClassId || h.entry.class_id === selectedClassId) && 
        (!selectedSubjectId || h.entry.subject_id === selectedSubjectId)
      );
  }, [groupedHistory, selectedClassId, selectedSubjectId]);
  
  const pageCount = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
      setCurrentPage(page);
  };

  const renderPagination = () => {
    if (pageCount <= 1) return null;
    const pageNumbers = [];
    const ellipsis = <PaginationItem key="ellipsis"><PaginationEllipsis /></PaginationItem>;

    if (pageCount <= 7) {
        for (let i = 1; i <= pageCount; i++) {
            pageNumbers.push(
                <PaginationItem key={i}>
                    <PaginationLink href="#" isActive={i === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(i); }}>{i}</PaginationLink>
                </PaginationItem>
            );
        }
    } else {
        pageNumbers.push(
            <PaginationItem key={1}>
                <PaginationLink href="#" isActive={1 === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>1</PaginationLink>
            </PaginationItem>
        );

        if (currentPage > 3) pageNumbers.push(React.cloneElement(ellipsis, {key: "start-ellipsis"}));

        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(pageCount - 1, currentPage + 1);
        
        if (currentPage <= 3) {
           startPage = 2;
           endPage = 4;
        }
        if (currentPage >= pageCount - 2) {
            startPage = pageCount - 3;
            endPage = pageCount -1;
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <PaginationItem key={i}>
                    <PaginationLink href="#" isActive={i === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(i); }}>{i}</PaginationLink>
                </PaginationItem>
            );
        }
        
        if (currentPage < pageCount - 2) pageNumbers.push(React.cloneElement(ellipsis, {key: "end-ellipsis"}));

        pageNumbers.push(
            <PaginationItem key={pageCount}>
                <PaginationLink href="#" isActive={pageCount === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(pageCount); }}>{pageCount}</PaginationLink>
            </PaginationItem>
        );
    }

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(1, currentPage - 1)); }} />
                </PaginationItem>
                {pageNumbers}
                <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(pageCount, currentPage + 1)); }} />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
  };

  const getStatusBadgeVariant = (status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => {
    switch (status) {
        case 'Hadir': return "default";
        case 'Sakit': return "secondary";
        case 'Izin': return "secondary";
        case 'Alpha': return "destructive";
    }
  }

  const getStatusBadgeClass = (status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha') => {
    switch (status) {
        case 'Hadir': return "bg-green-600 hover:bg-green-700";
        case 'Sakit': return "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200";
        case 'Izin': return "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200";
        case 'Alpha': return "bg-red-50 hover:bg-red-100 text-red-700 border-red-200";
    }
  }

  return (
    <div className="space-y-6 p-1">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader className="pb-4 text-center">
          <HandWrittenTitle 
            title={editingId ? 'Ubah Presensi' : 'Input Presensi'} 
            subtitle="Siswa"
            className="py-4 md:py-6"
          />
        </CardHeader>
        <CardContent className="pt-4">
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
                  disabled={!!currentHoliday}
                  className="bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
            </div>
          </div>
          
          {selectedClassId && selectedSubjectId && !currentHoliday && !isScheduledToday && !editingId && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 py-1.5 px-4 rounded-xl shadow-sm w-full sm:w-fit">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold">Perhatian: Anda tidak memiliki jadwal mengajar Mapel ini di Kelas ini pada hari {date ? getIndonesianDayFromDate(format(date, 'yyyy-MM-dd')) : 'tersebut'}.</span>
                </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClassId && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex flex-col items-center gap-2">
                <AnimatedText 
                    text={`Daftar Siswa - ${selectedClass?.name}`}
                    textClassName="text-2xl sm:text-3xl text-slate-900"
                    underlineClassName="text-blue-500/40"
                />
                {!currentHoliday && isInherited && !editingId && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse flex items-center gap-1.5 py-1 px-3 rounded-full shadow-sm">
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        Data disinkronkan dari jam sebelumnya
                    </Badge>
                )}
              </div>
              {!currentHoliday && (
                <CardDescription className="text-center">
                    Pilih status kehadiran untuk setiap siswa. Nama siswa sudah diurutkan berdasarkan abjad.
                    <span className="ml-2 text-sm font-semibold text-blue-600 block sm:inline mt-1">
                    ({students.length > 0 ? `${students.length} siswa terdaftar` : 'Memuat siswa...'})
                    </span>
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 overflow-hidden">
            {loading ? (
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
            ) : currentHoliday ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-6 px-4">
                    <div className={cn(
                        "p-8 rounded-xl border-2 flex flex-col items-center text-center gap-4 shadow-xl animate-in zoom-in-95 duration-500 w-full max-w-2xl bg-white",
                        currentHoliday.type === 'national' 
                            ? "border-red-100" 
                            : "border-indigo-100"
                    )}>
                        <div className="shrink-0 -mt-16">
                            {currentHoliday.type === 'national' ? (
                                <LottieCalendar size={120} />
                            ) : (
                                <LottieSchoolHoliday size={120} />
                            )}
                        </div>
                        <div className="pt-2">
                            <Badge variant="outline" className={cn(
                                "text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 mb-2 border-0",
                                currentHoliday.type === 'national' ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
                            )}>
                                {currentHoliday.type === 'national' ? 'Libur Nasional' : 'Libur Sekolah'}
                            </Badge>
                            <h3 className={cn(
                                "font-black text-2xl leading-tight tracking-tight break-words",
                                currentHoliday.type === 'national' ? "text-rose-600" : "text-indigo-600"
                            )}>{currentHoliday.description}</h3>
                            <p className="text-sm opacity-70 mt-3 font-medium text-slate-500">Aktivitas belajar mengajar dan presensi siswa ditiadakan untuk tanggal ini.</p>
                        </div>
                    </div>
                </div>
            ) : students.length > 0 ? (
                <>
                    <div className="md:hidden space-y-3">
                        {students.map((student, index) => (
                            <div key={student.id} className="group relative border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 break-words leading-tight">{student.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Status kehadiran</p>
                                      </div>
                                      <AddNoteDialog student={student} onNoteSaved={() => router.refresh()} />
                                    </div>
                                    <div className="pt-2 border-t border-slate-100">
                                       <AttendanceInput 
                                            studentId={student.id} 
                                            value={attendance.get(student.id) || 'Hadir'}
                                            onChange={handleAttendanceChange}
                                       />
                                    </div>
                                  </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <Table>
                        <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[80px] text-center font-semibold text-slate-700">No.</TableHead>
                            <TableHead className="font-semibold text-slate-700">Nama Siswa</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700 w-[420px]">Status Kehadiran</TableHead>
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
                            <TableCell className="font-medium text-slate-900">
                                <div className="flex items-center gap-2">
                                    <span>{student.name}</span>
                                    <AddNoteDialog student={student} onNoteSaved={() => router.refresh()} />
                                </div>
                            </TableCell>
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
          {!currentHoliday && students.length > 0 && (
            <CardFooter className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 rounded-b-xl">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between sm:items-center">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || !meetingNumber}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 h-11 rounded-xl"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? 'Simpan Perubahan' : 'Simpan Presensi'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleSendWhatsApp}
                    className="border-green-600 text-green-700 hover:bg-green-50 shadow-sm h-11 rounded-xl"
                  >
                    <LottieWhatsApp size={18} className="mr-2" />
                    Kirim ke WhatsApp
                  </Button>
                  {editingId && (
                    <Button 
                      variant="outline" 
                      onClick={resetForm} 
                      disabled={loading}
                      className="border-slate-300 hover:bg-slate-50 h-11 rounded-xl"
                    >
                      Batal Mengubah
                    </Button>
                  )}
                </div>
                <div className="text-sm text-slate-600 font-medium">
                  Total siswa: <span className="font-bold text-indigo-600">{students.length}</span>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      )}

      {selectedClassId && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50 rounded-xl">
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
              <div className="md:hidden space-y-3">
                {paginatedHistory.map(({entry, records}) => {
                  const summary = records.reduce((acc, record) => {
                      acc[record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'] = (acc[record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'] || 0) + 1;
                      return acc;
                  }, {} as Record<'Hadir' | 'Sakit' | 'Izin' | 'Alpha', number>);
                  return (
                    <div key={entry.id} className="group border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
                      <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{entry.class_name} - {entry.subject_name}</p>
                              <p className="text-sm text-slate-500 mt-1 font-medium">
                                {format(parseISO(entry.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                                Pertemuan ke-{entry.meeting_number}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <div className="text-sm">
                                <span className="font-medium text-emerald-800">Hadir</span>
                                <span className="ml-1 text-emerald-600 font-bold">{summary.Hadir || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <div className="text-sm">
                                <span className="font-medium text-amber-800">Sakit</span>
                                <span className="ml-1 text-emerald-600 font-bold">{summary.Sakit || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <div className="text-sm">
                                <span className="font-medium text-blue-800">Izin</span>
                                <span className="ml-1 text-emerald-600 font-bold">{summary.Izin || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <div className="text-sm">
                                <span className="font-medium text-red-800">Alpha</span>
                                <span className="ml-1 text-emerald-600 font-bold">{summary.Alpha || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                              <Button variant="secondary" size="sm" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 h-10 rounded-xl font-bold" onClick={() => handleViewDetails(entry)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detail
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 border-slate-300 hover:bg-slate-50 h-10 rounded-xl font-bold" onClick={() => handleEdit(entry)} disabled={loading}>
                                <Edit className="mr-2 h-4 w-4" />
                                Ubah
                              </Button>
                          </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <Table>
                      <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
                              <TableHead className="font-semibold text-slate-700">Info</TableHead>
                              <TableHead className="font-semibold text-slate-700">Pertemuan</TableHead>
                              <TableHead className="font-semibold text-slate-700">Ringkasan</TableHead>
                              <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
                          </TableRow>
                      <TableBody>
                          {paginatedHistory.map(({entry, records}) => {
                              const summary = records.reduce((acc, record) => {
                                  acc[record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'] = (acc[record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'] || 0) + 1;
                                  return acc;
                              }, {} as Record<'Hadir' | 'Sakit' | 'Izin' | 'Alpha', number>);
                              return (
                                   <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                      <TableCell className="font-medium text-slate-900">
                                        {format(parseISO(entry.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                                      </TableCell>
                                      <TableCell>
                                          <div className="font-bold text-slate-900">{entry.class_name}</div>
                                          <div className="text-sm text-slate-500 font-medium">{entry.subject_name}</div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700">
                                          {entry.meeting_number}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                          <div className="flex flex-wrap gap-1">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                              {summary.Hadir || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
                                              <AlertCircle className="w-3 h-3 mr-1" />
                                              {summary.Sakit || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                                              <Clock className="w-3 h-3 mr-1" />
                                              {summary.Izin || 0}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800">
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
                                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold"
                                          >
                                              <Eye className="mr-2 h-4 w-4" />
                                              Detail
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEdit(entry)} 
                                            disabled={loading}
                                            className="border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
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
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <div className="p-4 rounded-full bg-slate-100">
                          <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold text-slate-700 text-lg">Belum ada riwayat presensi</p>
                          <p className="text-sm text-slate-500 font-medium">Riwayat presensi yang sudah disimpan akan muncul di sini</p>
                        </div>
                      </div>
                  </div>
              )}
          </CardContent>
          {pageCount > 1 && (
            <CardFooter className="flex justify-center border-t pt-4">
                {renderPagination()}
            </CardFooter>
          )}
        </Card>
      )}

       <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="dialog-content-mobile mobile-safe-area max-w-2xl rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Detail Presensi: {viewingEntry?.class_name}</DialogTitle>
                  <DialogDescription className="mt-1 font-medium">
                      {viewingEntry?.subject_name} - {viewingEntry ? format(parseISO(viewingEntry.date), "EEEE, dd MMMM yyyy", { locale: id }) : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] pr-2 mb-4">
                {viewingEntry && students.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                      <Table>
                          <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-bold text-slate-700">Nama Siswa</TableHead>
                              <TableHead className="text-right font-bold text-slate-700">Status</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {groupedHistory.find(h => h.entry.id === viewingEntry.id)?.records.map(record => (
                                  <TableRow key={record.student_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                      <TableCell className="font-bold text-slate-900">{getStudentName(record.student_id)}</TableCell>
                                      <TableCell className="text-right">
                                          <Badge 
                                            variant={getStatusBadgeVariant(record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha')} 
                                            className={cn(
                                              getStatusBadgeClass(record.status as 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'),
                                              "px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg border-0"
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
                          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                          <div className="space-y-2">
                            <p className="font-bold text-slate-700">Memuat data detail...</p>
                            <p className="text-sm text-slate-500 font-medium">Mohon tunggu sebentar</p>
                          </div>
                        </div>
                    </div>
                )}
            </ScrollArea>
            <DialogFooter>
                <Button variant="ghost" className="w-full h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-50" onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
