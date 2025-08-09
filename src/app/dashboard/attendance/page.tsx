
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
import type { Student, AttendanceRecord, Class, AttendanceHistoryEntry, Subject } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mock data, to be replaced by API calls
const classes: Class[] = [];
const subjects: Subject[] = [];
const initialHistory: AttendanceHistoryEntry[] = [];

type AttendanceStatus = AttendanceRecord['status'];
const attendanceOptions: { value: AttendanceStatus, label: string, icon: React.ElementType, color: string, tooltip: string }[] = [
    { value: 'Hadir', label: 'H', icon: Check, color: 'bg-green-100 text-green-800 border-green-200 data-[state=checked]:bg-green-600 data-[state=checked]:text-white data-[state=checked]:border-green-700', tooltip: 'Hadir' },
    { value: 'Sakit', label: 'S', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-white data-[state=checked]:border-yellow-600', tooltip: 'Sakit' },
    { value: 'Izin', label: 'I', icon: Hand, color: 'bg-blue-100 text-blue-800 border-blue-200 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white data-[state=checked]:border-blue-600', tooltip: 'Izin' },
    { value: 'Alpha', label: 'A', icon: X, color: 'bg-red-100 text-red-800 border-red-200 data-[state=checked]:bg-red-600 data-[state=checked]:text-white data-[state=checked]:border-red-700', tooltip: 'Alpha' },
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
      setStudents(classToE...
<TRUNCATED>