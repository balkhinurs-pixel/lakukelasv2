
"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Edit, Eye, Loader2, Search, BookOpen, Award, TrendingUp, Users, Target } from "lucide-react";
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
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Student, Class, GradeHistoryEntry, GradeRecord, Subject } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { saveGrades } from "@/lib/actions";
import { getStudentsByClass } from "@/lib/data-client";

function FormattedDate({ date, formatString }: { date: Date | null, formatString: string }) {
    const [formattedDate, setFormattedDate] = React.useState<string>('');

    React.useEffect(() => {
        if (date) {
            setFormattedDate(format(date, formatString, { locale: id }));
        }
    }, [date, formatString]);

    return <>{formattedDate}</>;
}

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

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedClassId, setSelectedClassId] = React.useState<string | undefined>(preselectedClassId || undefined);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | undefined>(preselectedSubjectId || undefined);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [grades, setGrades] = React.useState<Map<string, number | string>>(new Map());
  const [assessmentType, setAssessmentType] = React.useState<string>("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = React.useState<GradeHistoryEntry | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const { toast } = useToast();

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  React.useEffect(() => {
    if (preselectedSubjectId) {
        const subject = subjects.find(s => s.id === preselectedSubjectId);
        if (subject) {
            setAssessmentType(`Tugas Harian - ${subject.name}`);
        }
    }
  }, [preselectedSubjectId, subjects]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

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

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubjectId || !date || !assessmentType) {
        toast({
            title: "Gagal Menyimpan",
            description: "Harap pilih kelas, mata pelajaran, tanggal, dan isi jenis penilaian.",
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
    if(editingId) formData.append('id', editingId);
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
  
  const handleEdit = async (entry: GradeHistoryEntry) => {
      setLoading(true);
      setSelectedClassId(entry.class_id);
      setSelectedSubjectId(entry.subject_id);
      
      const fetchedStudents = await getStudentsByClass(entry.class_id);
      setStudents(fetchedStudents);

      setEditingId(entry.id);
      setDate(parseISO(entry.date));
      setAssessmentType(entry.assessment_type);
      
      const loadedGrades = new Map<string, GradeRecord['score']>();
      fetchedStudents.forEach(student => {
          const record = entry.records.find(r => r.studentId === student.id);
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

  const filteredHistory = React.useMemo(() => {
    return initialHistory.filter(entry => 
        (!selectedClassId || entry.class_id === selectedClassId) &&
        (!selectedSubjectId || entry.subject_id === selectedSubjectId)
    );
  }, [initialHistory, selectedClassId, selectedSubjectId]);
  
  const filteredStudents = React.useMemo(() => {
      return students.filter(student => student.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, searchTerm]);

  const getStudentName = (studentId: string) => {
    return allStudents.find(s => s.id === studentId)?.name || "Siswa Tidak Ditemukan";
  };
  
  const getSubjectKkm = (subjectId: string | undefined): number => {
      if (!subjectId) return 75; // Default KKM
      const subject = subjects.find(s => s.id === subjectId);
      return subject ? subject.kkm : 75;
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
              {editingId ? <Edit className="h-5 w-5" /> : <Award className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-xl">{editingId ? 'Ubah Nilai' : 'Input Nilai'}</CardTitle>
              <CardDescription className="mt-1">
                {editingId ? 'Ubah detail nilai yang sudah tersimpan.' : 'Pilih kelas, tanggal, dan jenis penilaian untuk menginput nilai siswa.'}
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
                <Label className="text-sm font-medium text-slate-700">Tanggal Penilaian</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20",
                        !date && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? <FormattedDate date={date} formatString="PPP" /> : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
            </div>
             <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-5">
                <Label htmlFor="assessmentType" className="text-sm font-medium text-slate-700">Jenis Penilaian</Label>
                <Input 
                  id="assessmentType" 
                  value={assessmentType} 
                  onChange={(e) => setAssessmentType(e.target.value)} 
                  placeholder="e.g. Ulangan Harian 1, Tugas Praktikum, UTS, UAS" 
                  disabled={loading}
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
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Daftar Nilai - {selectedClass?.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({students.length > 0 ? `${students.length} siswa` : '...'})
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Input nilai (0-100) untuk setiap siswa. Kosongkan jika tidak ada nilai.
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
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Cari nama siswa..." 
                        className="pl-10 bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {filteredStudents.map((student, index) => (
                    <div key={student.id} className="group border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">Input nilai (0-100)</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grades.get(student.id) ?? ""}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="w-20 text-center bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                            disabled={loading}
                            placeholder="0-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-8">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="h-8 w-8 text-slate-400" />
                        <p className="text-slate-600">Tidak ada siswa yang cocok dengan pencarian Anda.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <Table>
                    <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[80px] text-center font-semibold text-slate-700">No.</TableHead>
                        <TableHead className="font-semibold text-slate-700">Nama Siswa</TableHead>
                        <TableHead className="w-[150px] text-right font-semibold text-slate-700">Nilai</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredStudents.map((student, index) => (
                        <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <TableCell className="text-center">
                          <div className="w-6 h-6 bg-gradient-to-br from-slate-500 to-slate-600 rounded-md flex items-center justify-center text-white text-xs font-semibold mx-auto">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                        <TableCell className="text-right">
                            <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grades.get(student.id) ?? ""}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            className="w-24 text-center bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                            disabled={loading}
                            placeholder="0-100"
                            />
                        </TableCell>
                        </TableRow>
                    ))}
                     {filteredStudents.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                              <div className="flex flex-col items-center gap-3">
                                <Search className="h-8 w-8 text-slate-400" />
                                <p className="text-slate-600">Tidak ada siswa yang cocok dengan pencarian Anda.</p>
                              </div>
                            </TableCell>
                        </TableRow>
                     )}
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
                    disabled={loading || !assessmentType || !selectedSubjectId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? 'Simpan Perubahan' : 'Simpan Nilai'}
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

       <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Riwayat Penilaian</CardTitle>
              <CardDescription className="mt-1">
                Daftar nilai yang telah Anda simpan. Filter berdasarkan kelas atau mapel di atas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3">
              {filteredHistory.map(entry => {
                const scores = entry.records.map(r => Number(r.score)).filter(s => !isNaN(s));
                const average = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
                const kkm = getSubjectKkm(entry.subject_id);
                const passingCount = scores.filter(score => score >= kkm).length;
                const passingRate = scores.length > 0 ? ((passingCount / scores.length) * 100).toFixed(0) : '0';
                
                return (
                    <div key={entry.id} className="group border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-all duration-200 hover:border-slate-300">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{entry.assessment_type}</p>
                                <p className="text-sm text-slate-500 mt-1">
                                  {entry.className} - {entry.subjectName}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  <FormattedDate date={parseISO(entry.date)} formatString="dd MMM yyyy" />
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                <div className="text-sm">
                                  <span className="font-medium text-emerald-800">Rata-rata</span>
                                  <span className="ml-1 text-emerald-600 font-semibold">{average}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
                                <Users className="h-4 w-4 text-blue-600" />
                                <div className="text-sm">
                                  <span className="font-medium text-blue-800">Dinilai</span>
                                  <span className="ml-1 text-blue-600 font-semibold">{entry.records.length}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50">
                                <Target className="h-4 w-4 text-amber-600" />
                                <div className="text-sm">
                                  <span className="font-medium text-amber-800">KKM</span>
                                  <span className="ml-1 text-amber-600 font-semibold">{kkm}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
                                <Award className="h-4 w-4 text-green-600" />
                                <div className="text-sm">
                                  <span className="font-medium text-green-800">Tuntas</span>
                                  <span className="ml-1 text-green-600 font-semibold">{passingRate}%</span>
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

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-semibold text-slate-700">Tanggal</TableHead>
                            <TableHead className="font-semibold text-slate-700">Jenis Penilaian</TableHead>
                            <TableHead className="font-semibold text-slate-700">Info</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">Siswa</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">Rata-rata</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">KKM</TableHead>
                            <TableHead className="text-center font-semibold text-slate-700">Tuntas</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.map(entry => {
                           const scores = entry.records.map(r => Number(r.score)).filter(s => !isNaN(s));
                           const average = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
                           const kkm = getSubjectKkm(entry.subject_id);
                           const passingCount = scores.filter(score => score >= kkm).length;
                           const passingRate = scores.length > 0 ? ((passingCount / scores.length) * 100).toFixed(0) : '0';
                           return (
                                <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                    <TableCell className="font-medium text-slate-900">
                                      <FormattedDate date={parseISO(entry.date)} formatString="dd MMM yyyy" />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">{entry.assessment_type}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{entry.className}</div>
                                        <div className="text-sm text-slate-500">{entry.subjectName}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        {entry.records.length}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 font-semibold">
                                        {average}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                                        {kkm}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className={cn(
                                        "inline-flex items-center px-2 py-1 rounded-full text-sm font-medium",
                                        Number(passingRate) >= 80 ? "bg-green-100 text-green-800" :
                                        Number(passingRate) >= 60 ? "bg-yellow-100 text-yellow-800" :
                                        "bg-red-100 text-red-800"
                                      )}>
                                        {passingRate}%
                                      </span>
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
            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-slate-100">
                    <TrendingUp className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-slate-700">Belum ada riwayat penilaian</p>
                    <p className="text-sm text-slate-500">Riwayat nilai yang sudah disimpan akan muncul di sini</p>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="dialog-content-mobile mobile-safe-area max-w-2xl">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Detail Nilai: {viewingEntry?.assessment_type}</DialogTitle>
                  <DialogDescription className="mt-1">
                      Daftar nilai untuk kelas {viewingEntry?.className} ({viewingEntry?.subjectName}). KKM: <span className="font-bold text-amber-600">{getSubjectKkm(viewingEntry?.subject_id)}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <Table>
                      <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">Nama Siswa</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Nilai</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Status</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {viewingEntry?.records.map(record => {
                              const score = Number(record.score);
                              const kkm = getSubjectKkm(viewingEntry.subject_id);
                              const isPassing = score >= kkm;
                              return (
                                  <TableRow key={record.studentId} className="hover:bg-slate-50/50 transition-colors duration-150">
                                      <TableCell className="font-medium text-slate-900">{getStudentName(record.studentId)}</TableCell>
                                      <TableCell className="text-right">
                                        <span className={cn(
                                          "inline-flex items-center px-2 py-1 rounded-md text-sm font-medium",
                                          score >= 90 ? "bg-emerald-100 text-emerald-800" :
                                          score >= 80 ? "bg-blue-100 text-blue-800" :
                                          score >= 70 ? "bg-amber-100 text-amber-800" :
                                          score >= 60 ? "bg-orange-100 text-orange-800" :
                                          "bg-red-100 text-red-800"
                                        )}>
                                          {record.score}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <Badge 
                                            variant={isPassing ? 'default' : 'destructive'} 
                                            className={cn(
                                              isPassing ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700",
                                              "px-3 py-1 text-sm font-medium"
                                            )}
                                          >
                                              {isPassing ? 'Tuntas' : 'Remedial'}
                                          </Badge>
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                  </Table>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
