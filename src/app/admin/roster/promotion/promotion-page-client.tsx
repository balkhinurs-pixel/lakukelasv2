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
import { ArrowRight, Loader2, Users, GraduationCap, ArrowRightLeft, Info, DatabaseZap } from "lucide-react";
import type { Class, Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { moveStudents, graduateStudents, updateStudentsStatus } from "@/lib/actions";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    
    // --- State for Promotion ---
    const [sourceClassId, setSourceClassId] = React.useState<string>("");
    const [destinationClassId, setDestinationClassId] = React.useState<string>("");
    const [selectedStudentIds, setSelectedStudentIds] = React.useState<Set<string>>(new Set());
    
    // --- State for Graduation ---
    const [graduationClassId, setGraduationClassId] = React.useState<string>("");
    const [selectedGraduationIds, setSelectedGraduationIds] = React.useState<Set<string>>(new Set());

    // --- State for Mutation ---
    const [mutationClassId, setMutationClassId] = React.useState<string>("");
    const [selectedMutationIds, setSelectedMutationIds] = React.useState<Set<string>>(new Set());
    const [targetStatus, setTargetStatus] = React.useState<'dropout' | 'inactive'>('dropout');
    
    const activeStudents = React.useMemo(() => {
        return allStudents.filter(s => s.status === 'active');
    }, [allStudents]);

    const studentsInSourceClass = React.useMemo(() => {
        if (!sourceClassId) return [];
        return activeStudents.filter(s => s.class_id === sourceClassId);
    }, [activeStudents, sourceClassId]);

    const studentsInDestinationClass = React.useMemo(() => {
        if (!destinationClassId) return [];
        return activeStudents.filter(s => s.class_id === destinationClassId);
    }, [activeStudents, destinationClassId]);
    
    const studentsInGraduationClass = React.useMemo(() => {
        if (!graduationClassId) return [];
        return activeStudents.filter(s => s.class_id === graduationClassId);
    }, [activeStudents, graduationClassId]);

    const studentsInMutationClass = React.useMemo(() => {
        if (!mutationClassId) return [];
        return activeStudents.filter(s => s.class_id === mutationClassId);
    }, [activeStudents, mutationClassId]);

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
        if (selectedStudentIds.size === 0 || !destinationClassId) return;
        setLoading(true);
        const result = await moveStudents(Array.from(selectedStudentIds), destinationClassId);
        if (result.success) {
            toast({ title: "Kenaikan Kelas Berhasil!", description: `${selectedStudentIds.size} siswa telah dipindahkan dan data riwayat telah diarsipkan.` });
            setSelectedStudentIds(new Set());
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }
    
    const handleGraduation = async () => {
        if (selectedGraduationIds.size === 0) return;
        setLoading(true);
        const result = await graduateStudents(Array.from(selectedGraduationIds));
        if (result.success) {
            toast({ title: "Kelulusan Berhasil!", description: `${selectedGraduationIds.size} siswa telah diluluskan dan data riwayat telah diringkas.` });
            setSelectedGraduationIds(new Set());
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    const handleStatusMutation = async () => {
        if (selectedMutationIds.size === 0) return;
        setLoading(true);
        const result = await updateStudentsStatus(Array.from(selectedMutationIds), targetStatus);
        if (result.success) {
            toast({ title: "Mutasi Berhasil!", description: `${selectedMutationIds.size} siswa telah diubah statusnya.` });
            setSelectedMutationIds(new Set());
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
                <h1 className="text-2xl font-bold font-headline">Promosi & Kelulusan</h1>
                <p className="text-muted-foreground">Pindahkan siswa ke kelas baru atau luluskan siswa di akhir tahun ajaran.</p>
            </div>
            
            <Alert className="bg-indigo-50 border-indigo-200">
                <DatabaseZap className="h-4 w-4 text-indigo-600" />
                <AlertTitle className="text-indigo-800">Sistem Snapshot & Purge Aktif</AlertTitle>
                <AlertDescription className="text-indigo-700">
                   Kenaikan kelas akan otomatis <strong>meringkas</strong> detail absensi/nilai menjadi total akhir dan <strong>menghapus</strong> log harian untuk menjaga database tetap ringan.
                </AlertDescription>
            </Alert>
            
            <Card>
                <CardHeader>
                    <CardTitle>Alat Bantu Kenaikan Kelas</CardTitle>
                    <CardDescription>Pindahkan siswa secara kolektif dan buat arsip riwayat kelasnya.</CardDescription>
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

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    className="w-full h-12 bg-indigo-600 font-bold shadow-lg shadow-indigo-100"
                                    disabled={loading || selectedStudentIds.size === 0 || !destinationClassId}
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                    Proses Kenaikan ({selectedStudentIds.size}) Siswa
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-bold">Konfirmasi Kenaikan Kelas</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-4">
                                        <p>Anda akan memindahkan <span className="font-bold text-slate-900">{selectedStudentIds.size} siswa</span> ke kelas <span className="font-bold text-indigo-600">{classes.find(c => c.id === destinationClassId)?.name}</span>.</p>
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs">
                                            <strong>Perhatian:</strong> Detail log absensi dan nilai harian siswa pada tahun ini akan <strong>dihapus</strong> dan diringkas menjadi total akhir di tabel arsip.
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel className="flex-1 rounded-xl">Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePromotion} className="flex-1 rounded-xl bg-indigo-600 font-bold">Ya, Proses</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mutasi Siswa (Pindah/Keluar)</CardTitle>
                    <CardDescription>Ubah status siswa menjadi 'Pindah/Keluar' tanpa menghapus data log (untuk mutasi darurat).</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Pilih Kelas</Label>
                            <Select value={mutationClassId} onValueChange={setMutationClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {mutationClassId && (
                            <SelectableStudentList
                                students={studentsInMutationClass}
                                selectedIds={selectedMutationIds}
                                onSelect={(id) => setSelectedMutationIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; })}
                                onSelectAll={() => handleSelectAll(studentsInMutationClass, selectedMutationIds, setSelectedMutationIds)}
                            />
                        )}
                    </div>
                    <div className="flex flex-col justify-between h-full">
                        <div className="space-y-2">
                            <Label>Ubah Status Menjadi</Label>
                            <Select value={targetStatus} onValueChange={(value: 'dropout' | 'inactive') => setTargetStatus(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dropout">Pindah/Keluar</SelectItem>
                                    <SelectItem value="inactive">Tidak Aktif Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button 
                            variant="secondary"
                            className="w-full h-12 mt-4 rounded-xl font-bold"
                            disabled={loading || selectedMutationIds.size === 0}
                            onClick={handleStatusMutation}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                            Ubah Status ({selectedMutationIds.size}) Siswa
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Luluskan Siswa</CardTitle>
                    <CardDescription>Tandai siswa sebagai 'lulus'. Data detail akan diringkas ke tabel alumni.</CardDescription>
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
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive"
                                    className="w-full h-12 rounded-xl font-bold shadow-lg shadow-rose-100"
                                    disabled={loading || selectedGraduationIds.size === 0}
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                                    Luluskan ({selectedGraduationIds.size}) Siswa Terpilih
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-bold text-rose-600">Konfirmasi Kelulusan</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-4">
                                        <p>Anda akan meluluskan <span className="font-bold text-slate-900">{selectedGraduationIds.size} siswa</span>. Siswa ini akan dipindahkan ke daftar Alumni.</p>
                                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800 text-xs">
                                            <strong>Arsip Alumni:</strong> Seluruh data performa siswa selama satu tahun terakhir akan diringkas dan log detailnya akan dihapus permanen.
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel className="flex-1 rounded-xl">Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleGraduation} className="flex-1 rounded-xl bg-rose-600 font-bold hover:bg-rose-700">Ya, Luluskan</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
