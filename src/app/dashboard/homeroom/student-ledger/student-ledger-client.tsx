
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Award,
  BookOpen,
  ClipboardList,
  MessageSquarePlus,
  TrendingUp,
  TrendingDown,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  PlusCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getStudentLedgerData } from "@/lib/data-client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { addStudentNote } from "@/lib/actions";
import { useRouter } from "next/navigation";


import type {
  Class,
  Student,
  Subject,
  StudentLedgerGradeEntry,
  StudentLedgerAttendanceEntry,
  StudentNote,
} from "@/lib/types";

// Helper function to get initials from a name
const getInitials = (name: string) => {
  if (!name) return "S";
  const parts = name.split(" ");
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getGradeColor = (score: number, kkm: number) => {
  if (score >= kkm) {
    if (score >= 90) return "text-emerald-600 font-bold";
    if (score >= 80) return "text-blue-600 font-semibold";
    return "text-green-600";
  }
  if (score >= 60) return "text-orange-500";
  return "text-red-600 font-semibold";
};

const getAttendanceInfo = (status: StudentLedgerAttendanceEntry["status"]) => {
  switch (status) {
    case "Hadir":
      return { icon: CheckCircle, className: "bg-green-100 text-green-800" };
    case "Sakit":
      return { icon: AlertCircle, className: "bg-yellow-100 text-yellow-800" };
    case "Izin":
      return { icon: Clock, className: "bg-blue-100 text-blue-800" };
    case "Alpha":
      return { icon: XCircle, className: "bg-red-100 text-red-800" };
    default:
      return { icon: CheckCircle, className: "bg-gray-100 text-gray-800" };
  }
};

const getNoteInfo = (type: StudentNote["type"]) => {
    switch(type) {
        case 'positive':
            return { icon: TrendingUp, className: 'border-l-green-500 bg-green-50' };
        case 'improvement':
            return { icon: TrendingDown, className: 'border-l-yellow-500 bg-yellow-50' };
        default:
            return { icon: MessageSquarePlus, className: 'border-l-gray-400 bg-gray-50' };
    }
}

const AddNoteDialog = ({ student, onNoteSaved }: { student: Student | null, onNoteSaved: () => void }) => {
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
                <Button><PlusCircle className="mr-2 h-4 w-4"/>Tambah Catatan</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Catatan Baru untuk {student.name}</DialogTitle>
                    <DialogDescription>Catatan ini akan dapat dilihat oleh guru mapel lain yang mengajar siswa ini.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="note">Isi Catatan</Label>
                        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tulis catatan perkembangan siswa di sini..."/>
                    </div>
                    <div className="space-y-2">
                        <Label>Jenis Catatan</Label>
                        <RadioGroup defaultValue="neutral" value={noteType} onValueChange={(value: StudentNote['type']) => setNoteType(value)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="positive" id="r-positive" />
                                <Label htmlFor="r-positive">Positif</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement" id="r-improvement" />
                                <Label htmlFor="r-improvement">Butuh Perbaikan</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="neutral" id="r-neutral" />
                                <Label htmlFor="r-neutral">Netral</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveNote} type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Catatan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function StudentLedgerClientPage({
  homeroomClass,
  studentsInClass,
  subjects,
  initialLedgerData,
  initialStudentId,
}: {
  homeroomClass: Class;
  studentsInClass: Student[];
  subjects: Subject[];
  initialLedgerData: {
    grades: StudentLedgerGradeEntry[];
    attendance: StudentLedgerAttendanceEntry[];
    notes: StudentNote[];
  };
  initialStudentId: string;
}) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = React.useState(initialStudentId);
  const [ledgerData, setLedgerData] = React.useState(initialLedgerData);
  const [loading, setLoading] = React.useState(false);

  const selectedStudent = studentsInClass.find(s => s.id === selectedStudentId);

  const fetchLedger = React.useCallback(async (studentId: string) => {
    if (!studentId) return;
    setLoading(true);
    const data = await getStudentLedgerData(studentId);
    setLedgerData(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    // Don't refetch for the initial student
    if (selectedStudentId !== initialStudentId) {
        fetchLedger(selectedStudentId);
    }
  }, [selectedStudentId, initialStudentId, fetchLedger]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline text-slate-900">
            Catatan & Leger Siswa - Kelas {homeroomClass.name}
          </h1>
          <p className="text-slate-600 mt-1">
            Pusat data terpadu untuk setiap siswa di kelas perwalian Anda.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Label htmlFor="student-select">Pilih Siswa</Label>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger id="student-select" className="w-full md:w-[350px]">
              <SelectValue placeholder="Pilih siswa untuk melihat detail..." />
            </SelectTrigger>
            <SelectContent>
              {studentsInClass.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {loading ? (
         <div className="text-center py-16 text-muted-foreground">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4">Memuat data siswa...</p>
        </div>
      ) : selectedStudent ? (
        <>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                        <AvatarImage src={selectedStudent.avatar_url} alt={selectedStudent.name} data-ai-hint="student portrait" />
                        <AvatarFallback className="text-3xl">{getInitials(selectedStudent.name)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left">
                        <CardTitle className="text-2xl">{selectedStudent.name}</CardTitle>
                        <p className="text-muted-foreground">NIS: {selectedStudent.nis}</p>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="grades">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="grades"><Award className="mr-2 h-4 w-4"/>Leger Nilai</TabsTrigger>
                    <TabsTrigger value="attendance"><ClipboardList className="mr-2 h-4 w-4"/>Leger Absensi</TabsTrigger>
                    <TabsTrigger value="notes"><MessageSquarePlus className="mr-2 h-4 w-4"/>Catatan Perkembangan</TabsTrigger>
                </TabsList>
                
                <TabsContent value="grades">
                    <Card>
                        <CardHeader>
                            <CardTitle>Buku Leger Nilai Digital</CardTitle>
                            <CardDescription>Rekapitulasi nilai siswa dari semua mata pelajaran.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mata Pelajaran</TableHead>
                                        <TableHead>Jenis Penilaian</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-center">Nilai</TableHead>
                                        <TableHead className="text-center">KKM</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ledgerData.grades.map(grade => (
                                        <TableRow key={grade.id}>
                                            <TableCell className="font-medium">{grade.subjectName}</TableCell>
                                            <TableCell>{grade.assessment_type}</TableCell>
                                            <TableCell>{format(new Date(grade.date), 'dd MMM yyyy', {locale: id})}</TableCell>
                                            <TableCell className={cn("text-center", getGradeColor(grade.score, grade.kkm))}>
                                                {grade.score}
                                            </TableCell>
                                            <TableCell className="text-center">{grade.kkm}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={grade.score >= grade.kkm ? 'default' : 'destructive'} className={grade.score >= grade.kkm ? 'bg-green-600' : ''}>
                                                    {grade.score >= grade.kkm ? 'Tuntas' : 'Remedial'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="attendance">
                     <Card>
                        <CardHeader>
                            <CardTitle>Buku Leger Absensi</CardTitle>
                            <CardDescription>Rekapitulasi kehadiran siswa di semua mata pelajaran.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mata Pelajaran</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ledgerData.attendance.map(att => {
                                        const { icon: Icon, className } = getAttendanceInfo(att.status);
                                        return (
                                            <TableRow key={att.id}>
                                                <TableCell className="font-medium">{att.subjectName}</TableCell>
                                                <TableCell>{format(new Date(att.date), 'EEEE, dd MMM yyyy', {locale: id})}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={cn("font-semibold", className)}>
                                                        <Icon className="mr-2 h-4 w-4"/>
                                                        {att.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notes">
                     <Card>
                        <CardHeader className="flex-row justify-between items-center">
                            <div>
                                <CardTitle>Catatan Perkembangan Siswa</CardTitle>
                                <CardDescription>Catatan dari wali kelas dan guru mapel.</CardDescription>
                            </div>
                            <AddNoteDialog student={selectedStudent} onNoteSaved={() => fetchLedger(selectedStudentId)} />
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96 pr-4">
                                <div className="space-y-4">
                                    {ledgerData.notes.map(note => {
                                         const { icon: Icon, className } = getNoteInfo(note.type);
                                        return (
                                            <div key={note.id} className={cn("p-4 rounded-lg border-l-4", className)}>
                                                <div className="flex items-start gap-3">
                                                    <Icon className="h-5 w-5 mt-1 shrink-0"/>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm">{note.teacher_name}</p>
                                                        <p className="text-xs text-muted-foreground">{format(new Date(note.date), "dd MMM yyyy, HH:mm")}</p>
                                                        <p className="mt-2 text-sm">{note.note}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
      ) : null}
    </div>
  );
}
