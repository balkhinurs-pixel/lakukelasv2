
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
  Calendar,
  FileText,
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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
    const isMobile = useIsMobile();

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
                <Button size={isMobile ? "sm" : "default"} className={isMobile ? "w-full" : ""}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    {isMobile ? "Tambah" : "Tambah Catatan"}
                </Button>
            </DialogTrigger>
            <DialogContent className={cn("max-w-lg", isMobile && "m-4")}>
                <DialogHeader>
                    <DialogTitle className={cn("text-lg", isMobile && "text-base break-words")}>
                        Tambah Catatan Baru untuk {student.name}
                    </DialogTitle>
                    <DialogDescription className={isMobile ? "text-sm" : ""}>
                        Catatan ini akan dapat dilihat oleh guru mapel lain yang mengajar siswa ini.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="note">Isi Catatan</Label>
                        <Textarea 
                            id="note" 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)} 
                            placeholder="Tulis catatan perkembangan siswa di sini..."
                            className={isMobile ? "min-h-[100px]" : "min-h-[120px]"}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Jenis Catatan</Label>
                        <RadioGroup 
                            defaultValue="neutral" 
                            value={noteType} 
                            onValueChange={(value: StudentNote['type']) => setNoteType(value)} 
                            className={cn("flex gap-4", isMobile && "flex-col gap-3")}
                        >
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
                    <Button onClick={handleSaveNote} type="submit" disabled={loading} className={isMobile ? "w-full" : ""}>
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
  const isMobile = useIsMobile();

  const selectedStudent = studentsInClass.find(s => s.id === selectedStudentId);

  const fetchLedger = React.useCallback(async (studentId: string) => {
    if (!studentId) return;
    setLoading(true);
    // This server action needs to be called carefully. A client-specific function is better.
    // For now, we will navigate to reload the page with new props.
    router.push(`/dashboard/homeroom/student-ledger?student_id=${studentId}`);
    setLoading(false);
  }, [router]);

  const handleStudentChange = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoading(true);
    try {
      const response = await fetch(`/api/student-ledger?studentId=${studentId}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data ledger');
      }
      const data = await response.json();
      setLedgerData(data);
    } catch (error) {
      console.error(error);
      // Handle error display
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      <div className={cn("flex items-center gap-4", isMobile && "flex-col items-start gap-3")}>
        <div className={cn(
          "p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg",
          isMobile && "self-center"
        )}>
          <ClipboardList className="h-6 w-6" />
        </div>
        <div className={cn("text-center", isMobile && "")}>
          <h1 className={cn(
            "text-2xl font-bold font-headline text-slate-900",
            isMobile && "text-xl break-words"
          )}>
            Catatan & Leger Siswa - Kelas {homeroomClass.name}
          </h1>
          <p className={cn(
            "text-slate-600 mt-1",
            isMobile && "text-sm text-center"
          )}>
            Pusat data terpadu untuk setiap siswa di kelas perwalian Anda.
          </p>
        </div>
      </div>

      <Card className={cn("transition-all duration-200", isMobile && "mx-2")}>
        <CardHeader className={isMobile ? "pb-4 px-4" : ""}>
          <Label htmlFor="student-select" className={isMobile ? "text-sm font-semibold" : ""}>
            Pilih Siswa
          </Label>
          <Select value={selectedStudentId} onValueChange={handleStudentChange}>
            <SelectTrigger 
              id="student-select" 
              className={cn("w-full transition-all duration-200", 
                isMobile ? "h-12 text-base" : "md:w-[350px]"
              )}
            >
              <SelectValue placeholder="Pilih siswa untuk melihat detail..." />
            </SelectTrigger>
            <SelectContent>
              {studentsInClass.map((student) => (
                <SelectItem key={student.id} value={student.id} className={isMobile ? "py-3" : ""}>
                  <div className={cn("flex items-center gap-2", isMobile && "flex-col items-start gap-1")}>
                    <span className={cn("font-medium", isMobile && "text-sm")}>{student.name}</span>
                    {isMobile && <span className="text-xs text-muted-foreground">NIS: {student.nis}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {loading ? (
         <div className={cn("text-center py-16 text-muted-foreground", isMobile && "py-12")}>
            <Loader2 className={cn("mx-auto h-12 w-12 animate-spin text-primary", isMobile && "h-10 w-10")} />
            <p className={cn("mt-4", isMobile && "mt-3 text-sm")}>Memuat data siswa...</p>
        </div>
      ) : selectedStudent ? (
        <>
            <Card className={cn(
              "bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-200",
              isMobile && "mx-2"
            )}>
                <CardHeader className={cn(
                  "flex flex-col md:flex-row items-center gap-6",
                  isMobile && "gap-4 pb-4 px-4"
                )}>
                    <Avatar className={cn(
                      "h-24 w-24 border-4 border-white shadow-lg",
                      isMobile && "h-20 w-20"
                    )}>
                        <AvatarImage src={selectedStudent.avatar_url} alt={selectedStudent.name} data-ai-hint="student portrait" />
                        <AvatarFallback className={cn("text-3xl", isMobile && "text-2xl")}>
                          {getInitials(selectedStudent.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left">
                        <CardTitle className={cn("text-2xl", isMobile && "text-lg break-words")}>
                          {selectedStudent.name}
                        </CardTitle>
                        <p className={cn("text-muted-foreground", isMobile && "text-sm")}>
                          NIS: {selectedStudent.nis}
                        </p>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="grades" className={isMobile ? "mx-2" : ""}>
                <TabsList className={cn(
                  "grid w-full grid-cols-3",
                  isMobile && "h-auto p-1"
                )}>
                    <TabsTrigger 
                      value="grades" 
                      className={cn(
                        "flex items-center justify-center",
                        isMobile && "flex-col gap-1 py-2 px-1 text-xs"
                      )}
                    >
                        <Award className={cn("mr-2 h-4 w-4", isMobile && "mr-0 h-3 w-3")} />
                        {isMobile ? "Nilai" : "Leger Nilai"}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="attendance" 
                      className={cn(
                        "flex items-center justify-center",
                        isMobile && "flex-col gap-1 py-2 px-1 text-xs"
                      )}
                    >
                        <ClipboardList className={cn("mr-2 h-4 w-4", isMobile && "mr-0 h-3 w-3")} />
                        {isMobile ? "Absensi" : "Leger Absensi"}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notes" 
                      className={cn(
                        "flex items-center justify-center",
                        isMobile && "flex-col gap-1 py-2 px-1 text-xs"
                      )}
                    >
                        <MessageSquarePlus className={cn("mr-2 h-4 w-4", isMobile && "mr-0 h-3 w-3")} />
                        {isMobile ? "Catatan" : "Catatan Perkembangan"}
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="grades">
                    <Card>
                        <CardHeader>
                            <CardTitle className={isMobile ? "text-lg" : ""}>
                                Buku Leger Nilai Digital
                            </CardTitle>
                            <CardDescription className={isMobile ? "text-sm" : ""}>
                                Rekapitulasi nilai siswa dari semua mata pelajaran.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className={isMobile ? "p-3" : ""}>
                            {isMobile ? (
                                <div className="space-y-3">
                                    {ledgerData.grades.map(grade => (
                                        <Card key={grade.id} className="p-4 bg-gradient-to-r from-white to-gray-50">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-semibold text-sm text-gray-900 break-words flex-1">
                                                        {grade.subjectName}
                                                    </h4>
                                                    <Badge 
                                                        variant={grade.score >= grade.kkm ? 'default' : 'destructive'} 
                                                        className={cn(
                                                            "text-xs font-bold shrink-0",
                                                            grade.score >= grade.kkm ? 'bg-green-600' : ''
                                                        )}
                                                    >
                                                        {grade.score >= grade.kkm ? 'Tuntas' : 'Remedial'}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {grade.assessment_type} • {format(new Date(grade.date), 'dd MMM yyyy', {locale: id})}
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <span className="text-xs text-gray-600">Nilai</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-lg font-bold",
                                                            getGradeColor(grade.score, grade.kkm)
                                                        )}>
                                                            {grade.score}
                                                        </span>
                                                        <span className="text-xs text-gray-500">/ {grade.kkm}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {ledgerData.grades.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Award className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                            <p className="text-sm">Belum ada data nilai</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
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
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="attendance">
                     <Card>
                        <CardHeader>
                            <CardTitle className={isMobile ? "text-lg" : ""}>
                                Buku Leger Absensi
                            </CardTitle>
                            <CardDescription className={isMobile ? "text-sm" : ""}>
                                Rekapitulasi kehadiran siswa di semua mata pelajaran.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className={isMobile ? "p-3" : ""}>
                            {isMobile ? (
                                <div className="space-y-3">
                                    {ledgerData.attendance.map(att => {
                                        const { icon: Icon, className } = getAttendanceInfo(att.status);
                                        return (
                                            <Card key={att.id} className="p-4 bg-gradient-to-r from-white to-gray-50">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className="font-semibold text-sm text-gray-900 break-words flex-1">
                                                            {att.subjectName}
                                                        </h4>
                                                        <Badge variant="outline" className={cn("font-semibold shrink-0 text-xs", className)}>
                                                            <Icon className="mr-1 h-3 w-3"/>
                                                            {att.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{format(new Date(att.date), 'EEEE, dd MMM yyyy', {locale: id})}</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                    {ledgerData.attendance.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <ClipboardList className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                            <p className="text-sm">Belum ada data absensi</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
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
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notes">
                     <Card>
                        <CardHeader className={cn(
                          "flex-row justify-between items-center",
                          isMobile && "flex-col items-start gap-3"
                        )}>
                            <div>
                                <CardTitle className={isMobile ? "text-lg" : ""}>
                                    Catatan Perkembangan Siswa
                                </CardTitle>
                                <CardDescription className={isMobile ? "text-sm" : ""}>
                                    Catatan dari wali kelas dan guru mapel.
                                </CardDescription>
                            </div>
                            <AddNoteDialog student={selectedStudent} onNoteSaved={() => handleStudentChange(selectedStudentId)} />
                        </CardHeader>
                        <CardContent className={isMobile ? "p-3" : ""}>
                            <ScrollArea className={cn("h-96 pr-4", isMobile && "h-80 pr-2")}>
                                <div className={cn("space-y-4", isMobile && "space-y-3")}>
                                    {ledgerData.notes.map(note => {
                                         const { icon: Icon, className } = getNoteInfo(note.type);
                                        return (
                                            <div key={note.id} className={cn(
                                              "p-4 rounded-lg border-l-4 transition-all duration-200", 
                                              className,
                                              isMobile && "p-3"
                                            )}>
                                                <div className="flex items-start gap-3">
                                                    <Icon className={cn(
                                                      "h-5 w-5 mt-1 shrink-0",
                                                      isMobile && "h-4 w-4"
                                                    )}/>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn(
                                                          "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2",
                                                          isMobile && "flex-col gap-1"
                                                        )}>
                                                            <p className={cn(
                                                              "font-semibold text-sm break-words",
                                                              isMobile && "text-xs"
                                                            )}>
                                                                {note.teacher_name}
                                                            </p>
                                                            <p className={cn(
                                                              "text-xs text-muted-foreground",
                                                              isMobile && "text-xs"
                                                            )}>
                                                                {format(new Date(note.date), "dd MMM yyyy, HH:mm")}
                                                            </p>
                                                        </div>
                                                        <p className={cn(
                                                          "mt-2 text-sm break-words",
                                                          isMobile && "text-xs mt-1 leading-relaxed"
                                                        )}>
                                                            {note.note}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {ledgerData.notes.length === 0 && (
                                        <div className={cn(
                                          "text-center py-8 text-muted-foreground",
                                          isMobile && "py-6"
                                        )}>
                                            <MessageSquarePlus className={cn(
                                              "mx-auto h-12 w-12 mb-2 opacity-50",
                                              isMobile && "h-10 w-10"
                                            )} />
                                            <p className={cn("text-sm", isMobile && "text-xs")}>
                                                Belum ada catatan perkembangan
                                            </p>
                                        </div>
                                    )}
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
