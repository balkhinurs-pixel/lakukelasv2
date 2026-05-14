
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
  ClipboardList,
  MessageSquarePlus,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  PlusCircle,
  Calendar,
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
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

import type {
  Class,
  Student,
  Subject,
  StudentLedgerGradeEntry,
  StudentLedgerAttendanceEntry,
  StudentNote,
} from "@/lib/types";

const getInitials = (name: string) => {
  if (!name) return "S";
  const parts = name.split(" ");
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getGradeColor = (score: number, kkm: number) => {
  if (score >= kkm) return score >= 90 ? "text-emerald-600 font-bold" : "text-green-600";
  return score >= 60 ? "text-orange-500" : "text-red-600 font-semibold";
};

const getAttendanceInfo = (status: StudentLedgerAttendanceEntry["status"]) => {
  switch (status) {
    case "Hadir": return { icon: CheckCircle, className: "bg-green-100 text-green-800" };
    case "Sakit": return { icon: AlertCircle, className: "bg-yellow-100 text-yellow-800" };
    case "Izin": return { icon: Clock, className: "bg-blue-100 text-blue-800" };
    case "Alpha": return { icon: XCircle, className: "bg-red-100 text-red-800" };
    default: return { icon: CheckCircle, className: "bg-gray-100 text-gray-800" };
  }
};

const getNoteInfo = (type: StudentNote["type"]) => {
    switch(type) {
        case 'positive': return { icon: TrendingUp, className: 'border-l-green-500 bg-green-50' };
        case 'improvement': return { icon: TrendingDown, className: 'border-l-yellow-500 bg-yellow-50' };
        default: return { icon: MessageSquarePlus, className: 'border-l-gray-400 bg-gray-50' };
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
        if (!student || !note) return;
        setLoading(true);
        const result = await addStudentNote({ studentId: student.id, note, type: noteType });
        if (result.success) {
            onNoteSaved();
            setIsOpen(false);
            setNote('');
        }
        setLoading(false);
    }

    if (!student) return null;

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl">
                    <PlusCircle className="mr-2 h-4 w-4"/> Tambah Catatan
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Catatan untuk {student.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tulis catatan..." className="min-h-[120px] rounded-xl" />
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveNote} disabled={loading} className="w-full rounded-xl h-11">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
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
  const isMobile = useIsMobile();
  const selectedStudent = studentsInClass.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-6 p-1">
      <HandWrittenTitle 
        title={`Leger Siswa ${homeroomClass.name}`} 
        subtitle="Siswa"
        className="py-4 md:py-6"
      />

      <Card className="rounded-3xl shadow-lg border-0">
        <CardHeader>
          <Label className="mb-2 block">Pilih Siswa</Label>
          <Select value={selectedStudentId} onValueChange={(v) => router.push(`/dashboard/homeroom/student-ledger?student_id=${v}`)}>
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Pilih siswa..." />
            </SelectTrigger>
            <SelectContent>
              {studentsInClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {selectedStudent && (
        <>
            <Card className="bg-indigo-50 border-0 rounded-3xl shadow-md p-6">
                <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                        <AvatarImage src={selectedStudent.avatar_url} />
                        <AvatarFallback>{getInitials(selectedStudent.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-xl font-bold">{selectedStudent.name}</CardTitle>
                        <p className="text-muted-foreground">NIS: {selectedStudent.nis}</p>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="grades" className="mt-6">
                <TabsList className="bg-white border rounded-2xl h-12 p-1">
                    <TabsTrigger value="grades" className="rounded-xl flex-1">Nilai</TabsTrigger>
                    <TabsTrigger value="attendance" className="rounded-xl flex-1">Absensi</TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-xl flex-1">Catatan</TabsTrigger>
                </TabsList>
                
                <TabsContent value="grades" className="mt-4">
                    <Card className="rounded-3xl border-0 shadow-lg">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader><TableRow><TableHead>Mapel</TableHead><TableHead className="text-center">Nilai</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {initialLedgerData.grades.map(g => (
                                        <TableRow key={g.id}>
                                            <TableCell className="font-medium">{g.subjectName}</TableCell>
                                            <TableCell className={cn("text-center font-bold", getGradeColor(g.score, g.kkm))}>{g.score}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* ... other tabs ... */}
            </Tabs>
        </>
      )}
    </div>
  );
}
