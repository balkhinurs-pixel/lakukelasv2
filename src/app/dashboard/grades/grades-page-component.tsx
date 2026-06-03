
"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar as CalendarIcon, CalendarDays, Edit, Eye, Loader2, Search, BookOpen, Award, TrendingUp, Users, Target, Plus, Wand2, ArrowUpCircle, ClipboardCheck, Info, School, FileText, Hash } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Student, Class, GradeHistoryEntry, Subject } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { saveGrades } from "@/lib/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { LottieWelcome } from "@/components/ui/lottie-welcome";
import { RefinedFormField } from "@/components/ui/refined-form-field";

export default function GradesPageComponent({
    classes,
    subjects,
    initialHistory,
    allStudents,
    activeSchoolYearName,
}: {
    classes: Class[];
    subjects: Subject[];
    initialHistory: GradeHistoryEntry[];
    allStudents: Student[];
    activeSchoolYearName: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedClassId = searchParams.get('classId');
  const preselectedSubjectId = searchParams.get('subjectId');

  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>(preselectedClassId || undefined);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | undefined>(preselectedSubjectId || undefined);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [grades, setGrades] = React.useState<Map<string, number | string>>(new Map());
  const [assessmentType, setAssessmentType] = React.useState<string>("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = React.useState<GradeHistoryEntry | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  
  // Katrol States
  const [isKatrolDialogOpen, setIsKatrolDialogOpen] = React.useState(false);
  const [katrolMode, setKatrolMode] = React.useState<"fixed" | "linear">("linear");
  const [katrolPoints, setKatrolPoints] = React.useState<number | string>(0);
  const [targetMin, setTargetMin] = React.useState<number | string>(75);
  const [targetMax, setTargetMax] = React.useState<number | string>(95);

  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const { toast } = useToast();

  React.useEffect(() => {
    setDate(new Date());
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentKKM = selectedSubject?.kkm || 75;

  const hasEnteredGrades = React.useMemo(() => {
      return Array.from(grades.values()).some(score => score !== "" && score !== null && score !== undefined);
  }, [grades]);

  React.useEffect(() => {
    if (preselectedSubjectId) {
        const subject = subjects.find(s => s.id === preselectedSubjectId);
        if (subject) {
            setAssessmentType(`Tugas Harian - ${subject.name}`);
            setTargetMin(subject.kkm);
        }
    }
  }, [preselectedSubjectId, subjects]);

  React.useEffect(() => {
    if (selectedClassId) {
      setLoading(true);
      const filteredStudents = allStudents.filter(s => s.class_id === selectedClassId);
      setStudents(filteredStudents);
      if (!editingId) {
        resetForm(filteredStudents);
      }
      setLoading(false);
    } else {
      setStudents([]);
    }
  }, [selectedClassId, allStudents, editingId]);

  const resetForm = (studentList: Student[]) => {
    setEditingId(null);
    setDate(new Date());
    setAssessmentType(selectedSubject ? `Tugas Harian - ${selectedSubject.name}` : "");
    const newGrades = new Map();
    studentList.forEach(student => {
      newGrades.set(student.id, "");
    });
    setGrades(newGrades);
    setSearchTerm("");
  }

  const handleGradeChange = (studentId: string, value: string) => {
    const score = value === "" ? "" : Math.max(0, Math.min(100, Number(value)));
    setGrades(new Map(grades.set(studentId, score)));
  };

  const handleKatrol = () => {
    const filledGrades = Array.from(grades.entries())
        .filter(([, score]) => score !== "" && score !== null && score !== undefined)
        .map(([id, score]) => ({ id, score: Number(score) }));

    if (filledGrades.length === 0) return;

    const newGrades = new Map(grades);

    if (katrolMode === "fixed") {
        const pointsToAdd = Number(katrolPoints);
        if (isNaN(pointsToAdd) || pointsToAdd === 0) return;
        
        filledGrades.forEach(({ id, score }) => {
            const newScore = Math.max(0, Math.min(100, score + pointsToAdd));
            newGrades.set(id, Math.round(newScore));
        });
        toast({ title: "Katrol Berhasil", description: `Ditambahkan ${pointsToAdd} poin ke semua nilai.` });
    } else {
        const minT = Number(targetMin);
        const maxT = Number(targetMax);
        
        if (isNaN(minT) || isNaN(maxT) || minT >= maxT) {
            toast({ title: "Gagal", description: "Batas minimal harus lebih kecil dari batas maksimal.", variant: "destructive" });
            return;
        }

        const scoresOnly = filledGrades.map(g => g.score);
        const actualMin = Math.min(...scoresOnly);
        const actualMax = Math.max(...scoresOnly);

        filledGrades.forEach(({ id, score }) => {
            let newScore: number;
            if (actualMax === actualMin) {
                newScore = minT;
            } else {
                newScore = minT + ((score - actualMin) / (actualMax - actualMin)) * (maxT - minT);
            }
            newGrades.set(id, Math.round(Math.max(0, Math.min(100, newScore))));
        });
        toast({ title: "Katrol Berhasil", description: `Nilai telah disesuaikan ke rentang ${minT} - ${maxT}.` });
    }

    setGrades(newGrades);
    setIsKatrolDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubjectId || !date || !assessmentType) {
        toast({
            title: "Gagal Menyimpan",
            description: "Harap pilih kelas, mata pelajaran, tanggal, and isi jenis penilaian.",
            variant: "destructive",
        });
        return;
    }
    
    const gradedRecords = Array.from(grades.entries())
        .filter(([, score]) => score !== "" && score !== null && score !== undefined)
        .map(([student_id, score]) => ({ student_id, score: Number(score) }));

    if (gradedRecords.length === 0) {
        toast({ title: "Tidak Ada Nilai", description: "Harap isi setidaknya satu nilai siswa.", variant: "destructive" });
        return;
    }
    
    setLoading(true);

    const formData = new FormData();
    if(editingId) {
      const originalEntry = initialHistory.find(h => h.id === editingId);
      if (originalEntry) {
          formData.append('original_date', originalEntry.date);
          formData.append('original_class_id', originalEntry.class_id);
          formData.append('original_subject_id', originalEntry.subject_id);
          formData.append('original_assessment_type', originalEntry.assessment_type);
      }
    }
    formData.append('date', format(date, 'yyyy-MM-dd'));
    formData.append('class_id', selectedClassId);
    formData.append('subject_id', selectedSubjectId);
    formData.append('assessment_type', assessmentType);
    formData.append('records', JSON.stringify(gradedRecords));

    const result = await saveGrades(formData);

    if (result.success) {
        toast({ title: "Nilai Disimpan", description: `Nilai untuk ${assessmentType} telah berhasil disimpan.` });
        router.refresh();
        resetForm(students);
    } else {
        toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };
  
  const handleEdit = (entry: GradeHistoryEntry) => {
      setLoading(true);
      setSelectedClassId(entry.class_id);
      setSelectedSubjectId(entry.subject_id);
      
      const studentsForClass = allStudents.filter(s => s.class_id === entry.class_id);
      setStudents(studentsForClass);

      setEditingId(entry.id);
      setDate(parseISO(entry.date));
      setAssessmentType(entry.assessment_type);
      
      const loadedGrades = new Map<string, number | string>();
      const sessionRecords = initialHistory.filter(h => 
        h.date === entry.date && 
        h.class_id === entry.class_id &&
        h.subject_id === entry.subject_id &&
        h.assessment_type === entry.assessment_type
      );

      studentsForClass.forEach(student => {
          const record = sessionRecords.find(h => h.student_id === student.id);
          loadedGrades.set(student.id, record ? record.score : "");
      });

      setGrades(loadedGrades);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  const handleViewDetails = (entry: GradeHistoryEntry) => {
    setViewingEntry(entry);
    setIsDetailDialogOpen(true);
  }

  const groupedHistory = React.useMemo(() => {
    const groups: { [key: string]: { entry: Omit<GradeHistoryEntry, 'student_id'|'score'>, records: { studentId: string, score: number }[] } } = {};
    initialHistory.forEach(item => {
      const key = `${item.date}-${item.class_id}-${item.subject_id}-${item.assessment_type}`;
      if (!groups[key]) {
        groups[key] = {
          entry: { ...item },
          records: []
        };
      }
      groups[key].records.push({ studentId: item.student_id, score: item.score });
    });
    return Object.values(groups);
  }, [initialHistory]);

  const filteredHistory = React.useMemo(() => {
    return groupedHistory.filter(entry => 
        (!selectedClassId || entry.entry.class_id === selectedClassId) &&
        (!selectedSubjectId || entry.entry.subject_id === selectedSubjectId)
    );
  }, [groupedHistory, selectedClassId, selectedSubjectId]);
  
  const filteredStudents = React.useMemo(() => {
      return students.filter(student => student.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, searchTerm]);

  const getStudentName = (studentId: string) => {
    return allStudents.find(s => s.id === studentId)?.name || "Siswa Tidak Ditemukan";
  };
  
  const getSubjectKkm = (subjectId: string | undefined): number => {
      if (!subjectId) return 75;
      const subject = subjects.find(s => s.id === subjectId);
      return subject ? subject.kkm : 75;
  }

  return (
    <div className="space-y-6 p-1">
      <Card className="border-0 shadow-lg bg-white overflow-hidden rounded-[32px]">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-500 p-6 sm:p-8 flex flex-row items-center justify-between gap-4 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
            <div className="relative z-10 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-indigo-100 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
                    <span>🎯</span>
                    <span>Administrasi Nilai</span>
                </div>
                <h1 className="text-xl sm:text-4xl font-black tracking-tight leading-tight">
                    {editingId ? 'Ubah Nilai Siswa' : 'Input Nilai Siswa'}
                </h1>
                <p className="text-indigo-100 text-[11px] sm:text-sm font-bold leading-relaxed max-w-md opacity-80">
                    Catat capaian akademik siswa secara akurat untuk memantau progres belajar dan ketuntasan kurikulum.
                </p>
            </div>
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 relative">
                 <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
                 <LottieWelcome />
            </div>
        </div>

        <CardContent className="pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <RefinedFormField label="Tahun Ajaran" icon={<CalendarDays className="h-4 w-4" />} className="xl:col-span-2">
                <Input value={activeSchoolYearName} disabled className="font-semibold bg-slate-50 border-slate-200 text-slate-600" />
            </RefinedFormField>

            <RefinedFormField label="Kelas" icon={<School className="h-4 w-4" />}>
                <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                  <SelectTrigger><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </RefinedFormField>

            <RefinedFormField label="Mata Pelajaran" icon={<BookOpen className="h-4 w-4" />}>
                 <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId}>
                    <SelectTrigger><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger>
                    <SelectContent>
                        {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </RefinedFormField>

            <RefinedFormField label="Tanggal" icon={<CalendarIcon className="h-4 w-4" />} className="sm:col-span-2 lg:col-span-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-slate-200 h-12 rounded-xl",
                        !date && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
            </RefinedFormField>

            <RefinedFormField label="Jenis Penilaian" icon={<FileText className="h-4 w-4" />} className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
                <Input 
                  id="assessmentType" 
                  value={assessmentType} 
                  onChange={(e) => setAssessmentType(e.target.value)} 
                  placeholder="e.g. Ulangan Harian 1, UTS, UAS" 
                  disabled={loading}
                  className="bg-white border-slate-200"
                />
            </RefinedFormField>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && (
        <Card className="border-0 shadow-lg bg-white rounded-3xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Daftar Siswa - {selectedClass?.name}</CardTitle>
                  <CardDescription>Input nilai (0-100) untuk setiap siswa.</CardDescription>
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                      placeholder="Cari nama siswa..." 
                      className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Memuat Data Siswa...</p>
                </div>
            ) : students.length > 0 ? (
                <>
                <div className="md:hidden space-y-3">
                  {filteredStudents.map((student, index) => (
                    <div key={student.id} className="group border border-slate-100 rounded-2xl p-4 bg-white hover:shadow-md transition-all shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-black">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 uppercase tracking-tight text-sm">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase">NIS: {student.nis}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grades.get(student.id) ?? ""}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="w-20 h-11 text-center bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 font-black text-lg rounded-xl"
                            disabled={loading}
                            placeholder="-"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
                  <Table>
                    <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[80px] text-center font-black uppercase text-[10px] tracking-widest text-slate-400">No.</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Nama Siswa</TableHead>
                        <TableHead className="w-[150px] text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Input Nilai</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredStudents.map((student, index) => (
                        <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-center font-bold text-slate-400">{index + 1}</TableCell>
                        <TableCell className="font-bold text-slate-900 uppercase tracking-tight">{student.name}</TableCell>
                        <TableCell className="text-right">
                            <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grades.get(student.id) ?? ""}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="w-24 text-center h-10 rounded-xl bg-slate-50 border-slate-200 font-bold"
                            disabled={loading}
                            />
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
                </>
            ) : (
                <div className="text-center py-20">
                    <Info className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">Belum ada siswa di kelas ini.</p>
                </div>
            )}
          </CardContent>
          {students.length > 0 && (
            <CardFooter className="border-t border-slate-100 bg-slate-50/30 px-6 py-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button onClick={handleSubmit} disabled={loading || !assessmentType || !selectedSubjectId} className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? 'Simpan Perubahan' : 'Simpan Nilai Sekarang'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsKatrolDialogOpen(true)} disabled={loading || !hasEnteredGrades} className="h-12 px-6 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold">
                    <Wand2 className="mr-2 h-4 w-4" /> Katrol Nilai (Smart)
                  </Button>
                </div>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Rest of component history and dialogs kept as is */}
      <Card className="border-0 shadow-lg bg-white rounded-3xl overflow-hidden mt-8">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Riwayat Penilaian</CardTitle>
              <CardDescription>Daftar riwayat nilai yang pernah Anda simpan.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {filteredHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHistory.map(({entry, records}) => {
                    const scores = records.map(r => Number(r.score));
                    const average = scores.length > 0 ? (scores.reduce((a, b) => a + Number(b), 0) / scores.length).toFixed(1) : '0';
                    const kkm = getSubjectKkm(entry.subject_id);
                    const passingCount = scores.filter(score => score >= kkm).length;
                    const passingRate = scores.length > 0 ? ((passingCount / scores.length) * 100).toFixed(0) : '0';
                    
                    return (
                        <div key={entry.id} className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div className="min-w-0">
                                <h4 className="font-black text-slate-900 truncate uppercase tracking-tight">{entry.assessment_type}</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">{entry.class_name} • {entry.subject_name}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-center">
                                    <p className="text-lg font-black text-emerald-600">{average}</p>
                                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Rata-rata</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-2xl text-center">
                                    <p className="text-lg font-black text-blue-600">{passingRate}%</p>
                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Ketuntasan</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 font-bold text-xs" onClick={() => handleViewDetails(entry as GradeHistoryEntry)}>Detail</Button>
                                <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 font-bold text-xs border-indigo-200 text-indigo-700" onClick={() => handleEdit(entry as GradeHistoryEntry)}>Ubah</Button>
                            </div>
                        </div>
                    )
                  })}
                </div>
             ) : (
                <div className="text-center py-20 opacity-20">
                    <TrendingUp className="h-16 w-16 mx-auto mb-2" />
                    <p className="font-bold text-sm uppercase tracking-widest">Belum ada riwayat</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      {/* Katrol Dialog */}
      <Dialog open={isKatrolDialogOpen} onOpenChange={setIsKatrolDialogOpen}>
        <DialogContent className="sm:max-w-md dialog-content-mobile mobile-safe-area rounded-3xl border-0 shadow-2xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <Wand2 className="h-6 w-6 text-blue-600" />
                    Katrol Nilai Pintar
                </DialogTitle>
                <DialogDescription className="font-medium">Pilih metode untuk meningkatkan nilai siswa secara kolektif.</DialogDescription>
            </DialogHeader>
            
            <Tabs value={katrolMode} onValueChange={(v) => setKatrolMode(v as any)} className="mt-2">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-12">
                    <TabsTrigger value="linear" className="rounded-lg data-[state=active]:bg-white font-bold">Skala Linear</TabsTrigger>
                    <TabsTrigger value="fixed" className="rounded-lg data-[state=active]:bg-white font-bold">Tambah Poin</TabsTrigger>
                </TabsList>
                
                <TabsContent value="linear" className="space-y-4 pt-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] text-blue-700 leading-relaxed font-bold uppercase tracking-wide">
                        Metode ini menarik nilai terendah ke <strong>Batas Minimal</strong> dan nilai tertinggi ke <strong>Batas Maksimal</strong>.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Min (KKM)</Label>
                            <Input type="number" value={targetMin} onChange={e => setTargetMin(e.target.value)} className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Maksimal</Label>
                            <Input type="number" value={targetMax} onChange={e => setTargetMax(e.target.value)} className="h-11 rounded-xl" />
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="fixed" className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Tambahan Poin (Misal: 5)</Label>
                        <Input type="number" value={katrolPoints} onChange={e => setKatrolPoints(e.target.value)} className="h-11 rounded-xl" />
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6 flex flex-row gap-3">
                <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setIsKatrolDialogOpen(false)}>Batal</Button>
                <Button onClick={handleKatrol} className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">Terapkan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="dialog-content-mobile mobile-safe-area max-w-2xl rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Detail Nilai: {viewingEntry?.assessment_type}</DialogTitle>
                  <DialogDescription className="text-xs uppercase font-black tracking-widest text-slate-400 mt-1">KKM Mapel: {getSubjectKkm(viewingEntry?.subject_id)}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-y-auto pr-2 mb-4">
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <Table>
                      <TableHeader className="bg-slate-50">
                          <TableRow>
                          <TableHead className="font-black text-[10px] uppercase">Nama Siswa</TableHead>
                          <TableHead className="text-right font-black text-[10px] uppercase">Nilai</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {groupedHistory.find(g => g.entry.id === viewingEntry?.id)?.records.map(record => {
                              const score = Number(record.score);
                              const kkm = getSubjectKkm(viewingEntry!.subject_id);
                              return (
                                  <TableRow key={record.studentId}>
                                      <TableCell className="font-bold text-slate-900 uppercase text-xs">{getStudentName(record.studentId)}</TableCell>
                                      <TableCell className="text-right">
                                          <Badge variant={score >= kkm ? 'default' : 'destructive'} className={cn("rounded-lg px-3 py-1 font-black", score >= kkm ? "bg-emerald-600" : "bg-red-600")}>
                                              {score}
                                          </Badge>
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                  </Table>
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" className="w-full h-12 rounded-xl font-bold" onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
