
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
import { ArrowRight, Loader2, Users, GraduationCap } from "lucide-react";
import type { Class, Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { moveStudents, graduateStudents } from "@/lib/actions";
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
    
    // --- State for Graduation ---
    const [graduationClassId, setGraduationClassId] = React.useState<string>("");
    const [selectedGraduationIds, setSelectedGraduationIds] = React.useState<Set<string>>(new Set());
    
    const activeStudents = React.useMemo(() => {
        return allStudents.filter(s => s.status === 'active');
    }, [allStudents]);

    const studentsInSourceClass = React.useMemo(() => {
        return activeStudents.filter(s => s.class_id === sourceClassId);
    }, [activeStudents, sourceClassId]);

    const studentsInDestinationClass = React.useMemo(() => {
        return activeStudents.filter(s => s.class_id === destinationClassId);
    }, [activeStudents, destinationClassId]);
    
    const studentsInGraduationClass = React.useMemo(() => {
        return activeStudents.filter(s => s.class_id === graduationClassId);
    }, [activeStudents, graduationClassId]);

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

    const handleSelectAll = (list: Student[], selectedSet: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        if (selectedSet.size === list.length) {
            setter(new Set()); // Deselect all
        } else {
            setter(new Set(list.map(s => s.id))); // Select all
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
    
    const handleGraduation = async () => {
        if (selectedGraduationIds.size === 0) {
            toast({ title: "Gagal", description: "Pilih setidaknya satu siswa untuk diluluskan.", variant: "destructive"});
            return;
        }
        setLoading(true);
        const result = await graduateStudents(Array.from(selectedGraduationIds));
        if (result.success) {
            toast({ title: "Sukses!", description: `${selectedGraduationIds.size} siswa berhasil diluluskan dan diarsipkan.` });
            setSelectedGraduationIds(new Set());
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
    
    const SelectableStudentList = ({
        students,
        selectedIds,
        onSelect,
        onSelectAll,
    }: {
        students: Student[];
        selectedIds: Set<string>;
        onSelect: (studentId: string) => void;
        onSelectAll: () => void;
    }) => (
        <Card>
            <CardHeader className="p-4 border-b">
                <div className="flex items-center space-x-3">
                    <Checkbox 
                        id={`select-all-${students[0]?.class_id || 'grad'}`} 
                        onCheckedChange={onSelectAll}
                        checked={students.length > 0 && selectedIds.size === students.length}
                        disabled={students.length === 0}
                    />
                    <label htmlFor={`select-all-${students[0]?.class_id || 'grad'}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Pilih Semua Siswa
                    </label>
                </div>
            </CardHeader>
            <ScrollArea className="h-72">
            <CardContent className="p-4">
                {students.length > 0 ? (
                    <div className="space-y-3">
                        {students.map(student => (
                            <div key={student.id} className="flex items-center space-x-3">
                                <Checkbox 
                                    id={`student-${student.id}`} 
                                    checked={selectedIds.has(student.id)}
                                    onCheckedChange={() => onSelect(student.id)}
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
                            <SelectableStudentList
                                students={studentsInSourceClass}
                                selectedIds={selectedStudentIds}
                                onSelect={handleSelectStudent}
                                onSelectAll={() => handleSelectAll(studentsInSourceClass, selectedStudentIds, setSelectedStudentIds)}
                            />
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
                    <CardDescription>Tandai siswa sebagai 'lulus'. Data mereka akan diarsipkan dan tidak aktif lagi.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Pilih Kelas</Label>
                            <Select value={graduationClassId} onValueChange={setGraduationClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas yang akan diluluskan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         {graduationClassId && (
                            <SelectableStudentList
                                students={studentsInGraduationClass}
                                selectedIds={selectedGraduationIds}
                                onSelect={(id) => setSelectedGraduationIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
                                onSelectAll={() => handleSelectAll(studentsInGraduationClass, selectedGraduationIds, setSelectedGraduationIds)}
                            />
                        )}
                    </div>
                    <div className="flex flex-col justify-end">
                        <Button 
                            variant="destructive"
                            className="w-full"
                            disabled={loading || selectedGraduationIds.size === 0}
                            onClick={handleGraduation}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                            Luluskan {selectedGraduationIds.size > 0 ? `(${selectedGraduationIds.size})` : ''} Siswa Terpilih
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
