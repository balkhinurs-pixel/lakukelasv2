
"use client"
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Loader2, Users } from "lucide-react";
import type { Class, Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { moveStudents } from "@/lib/actions";
import { useRouter } from "next/navigation";


export default function PromotionPageClient({ 
    classes,
    allStudents,
}: { 
    classes: Class[];
    allStudents: Student[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [sourceClassId, setSourceClassId] = React.useState<string>("");
    const [destinationClassId, setDestinationClassId] = React.useState<string>("");
    const [selectedStudentIds, setSelectedStudentIds] = React.useState<Set<string>>(new Set());

    const studentsInSourceClass = React.useMemo(() => {
        return allStudents.filter(s => s.class_id === sourceClassId);
    }, [allStudents, sourceClassId]);

    const studentsInDestinationClass = React.useMemo(() => {
        return allStudents.filter(s => s.class_id === destinationClassId);
    }, [allStudents, destinationClassId]);

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    }

    const handleSelectAll = () => {
        if (selectedStudentIds.size === studentsInSourceClass.length) {
            setSelectedStudentIds(new Set()); // Deselect all
        } else {
            setSelectedStudentIds(new Set(studentsInSourceClass.map(s => s.id))); // Select all
        }
    }

    const handlePromotion = async () => {
        if (selectedStudentIds.size === 0 || !destinationClassId) {
            toast({ title: "Gagal", description: "Pilih setidaknya satu siswa dan kelas tujuan.", variant: "destructive"});
            return;
        }
        setLoading(true);
        const result = await moveStudents(Array.from(selectedStudentIds), destinationClassId);
        if (result.success) {
            toast({ title: "Sukses!", description: `${selectedStudentIds.size} siswa berhasil dipindahkan.` });
            setSelectedStudentIds(new Set());
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }


    const StudentList = ({ students, title }: { students: Student[], title: string }) => (
         <div>
            <h3 className="font-semibold mb-2">{title} ({students.length} siswa)</h3>
            <Card className="h-72">
                <ScrollArea className="h-full">
                    <CardContent className="p-2">
                        {students.length > 0 ? (
                             <ul className="space-y-1">
                                {students.map(student => (
                                    <li key={student.id} className="text-sm p-2 rounded-md bg-muted/50">{student.name}</li>
                                ))}
                            </ul>
                        ) : (
                             <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                                <p>Tidak ada siswa di kelas ini.</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Promosi & Mutasi Siswa</h1>
                <p className="text-muted-foreground">Pindahkan siswa secara kolektif di akhir tahun ajaran.</p>
            </div>
            
            <Alert>
                <AlertTitle>Proses Akhir Tahun Ajaran</AlertTitle>
                <AlertDescription>
                   Gunakan fitur ini dengan hati-hati, idealnya di akhir semester genap. Pastikan semua nilai dan laporan telah final sebelum melakukan promosi atau kelulusan siswa.
                </AlertDescription>
            </Alert>
            
            <Card>
                <CardHeader>
                    <CardTitle>Alat Bantu Kenaikan Kelas</CardTitle>
                    <CardDescription>Pilih siswa dari kelas asal, lalu pindahkan mereka ke kelas tujuan.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 items-start">
                    {/* Source Class Column */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>1. Pilih Kelas Asal</Label>
                            <Select value={sourceClassId} onValueChange={setSourceClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {sourceClassId && (
                           <Card>
                                <CardHeader className="p-4 border-b">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox 
                                            id="select-all" 
                                            onCheckedChange={handleSelectAll}
                                            checked={studentsInSourceClass.length > 0 && selectedStudentIds.size === studentsInSourceClass.length}
                                        />
                                        <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Pilih Semua Siswa
                                        </label>
                                    </div>
                                </CardHeader>
                                <ScrollArea className="h-72">
                                <CardContent className="p-4">
                                    {studentsInSourceClass.length > 0 ? (
                                        <div className="space-y-3">
                                            {studentsInSourceClass.map(student => (
                                                <div key={student.id} className="flex items-center space-x-3">
                                                    <Checkbox 
                                                        id={`student-${student.id}`} 
                                                        checked={selectedStudentIds.has(student.id)}
                                                        onCheckedChange={() => handleSelectStudent(student.id)}
                                                    />
                                                    <label htmlFor={`student-${student.id}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {student.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                                            <Users className="h-10 w-10 mb-2"/>
                                            <p>Tidak ada siswa di kelas ini.</p>
                                        </div>
                                    )}
                                </CardContent>
                                </ScrollArea>
                           </Card>
                        )}
                    </div>
                    {/* Destination Class Column */}
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>2. Pilih Kelas Tujuan</Label>
                            <Select value={destinationClassId} onValueChange={setDestinationClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.filter(c => c.id !== sourceClassId).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {destinationClassId && (
                             <StudentList students={studentsInDestinationClass} title="Siswa di Kelas Tujuan" />
                        )}
                        <Button 
                            className="w-full"
                            disabled={loading || selectedStudentIds.size === 0 || !destinationClassId}
                            onClick={handlePromotion}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                            Pindahkan {selectedStudentIds.size > 0 ? `(${selectedStudentIds.size})` : ''} Siswa
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Luluskan Siswa</CardTitle>
                    <CardDescription>Tandai siswa sebagai lulus. Data mereka akan diarsipkan dan tidak aktif lagi.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-center text-muted-foreground p-8">Fitur untuk meluluskan siswa akan segera hadir.</p>
                </CardContent>
            </Card>
        </div>
    )
}
