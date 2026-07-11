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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowRight, 
    Loader2, 
    Users, 
    GraduationCap, 
    ArrowRightLeft, 
    Info, 
    DatabaseZap, 
    Search, 
    X 
} from "lucide-react";
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

    const handleSelectStudent = (studentId: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        setter(prev => {
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
        if (list.length === 0) return;
        
        const allInListSelected = list.every(s => selectedSet.has(s.id));
        
        setter(prev => {
            const next = new Set(prev);
            if (allInListSelected) {
                // Jika semua di list sudah dipilih, maka hapus pilihannya (deselect subset)
                list.forEach(s => next.delete(s.id));
            } else {
                // Jika belum semua dipilih, maka pilih semua di list (select subset)
                list.forEach(s => next.add(s.id));
            }
            return next;
        });
    }

    const handlePromotion = async () => {
        if (selectedStudentIds.size === 0 || !destinationClassId) return;
        setLoading(true);
        const result = await moveStudents(Array.from(selectedStudentIds), destinationClassId);
        if (result.success) {
            toast({ title: "Kenaikan Kelas Berhasil!", description: `${selectedStudentIds.size} siswa telah dipindahkan dan data riwayat telah diringkas.` });
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
         <div className="space-y-3">
            <h3 className="font-semibold text-sm text-slate-700">{title} ({students.length} siswa)</h3>
            <Card className="h-72 shadow-inner bg-slate-50/50">
                <ScrollArea className="h-full">
                    <CardContent className="p-2">
                        {students.length > 0 ? (
                             <ul className="space-y-1">
                                {students.map(student => (
                                    <li key={student.id} className="text-[11px] p-2.5 rounded-lg bg-white border border-slate-100 font-bold uppercase tracking-tight shadow-sm">{student.name}</li>
                                ))}
                            </ul>
                        ) : (
                             <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                                <p className="text-xs italic">Tidak ada siswa di kelas ini.</p>
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
        onSelectAll: (filtered: Student[]) => void;
    }) => {
        const [searchTerm, setSearchTerm] = React.useState("");

        const filtered = React.useMemo(() => {
            return students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }, [students, searchTerm]);

        const allInListSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id));

        return (
            <Card className="overflow-hidden shadow-md border-slate-200">
                <CardHeader className="p-4 border-b space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Checkbox 
                                id={`select-all-${students[0]?.class_id || 'grad'}`} 
                                onCheckedChange={() => onSelectAll(filtered)}
                                checked={allInListSelected}
                                disabled={filtered.length === 0}
                            />
                            <label htmlFor={`select-all-${students[0]?.class_id || 'grad'}`} className="text-xs font-bold uppercase tracking-widest text-slate-600 cursor-pointer">
                                Pilih Semua {searchTerm ? 'Hasil' : ''}
                            </label>
                        </div>
                        {searchTerm && (
                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tight bg-indigo-100 text-indigo-700">
                                {filtered.length} Ditemukan
                            </Badge>
                        )}
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                        <Input 
                            placeholder="Cari nama siswa..." 
                            className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200 shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </CardHeader>
                <ScrollArea className="h-72">
                    <CardContent className="p-2 bg-white">
                        {filtered.length > 0 ? (
                            <div className="space-y-1">
                                {filtered.map(student => {
                                    const isSelected = selectedIds.has(student.id);
                                    return (
                                        <div 
                                            key={student.id} 
                                            className={cn(
                                                "flex items-center space-x-3 p-2.5 rounded-xl transition-all cursor-pointer border",
                                                isSelected ? "bg-indigo-50 border-indigo-100" : "bg-white border-transparent hover:bg-slate-50"
                                            )}
                                            onClick={() => onSelect(student.id)}
                                        >
                                            <Checkbox 
                                                id={`student-${student.id}`} 
                                                checked={isSelected}
                                                onCheckedChange={() => onSelect(student.id)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                            <label htmlFor={`student-${student.id}`} className={cn(
                                                "text-xs font-bold uppercase tracking-tight leading-none cursor-pointer flex-1 truncate",
                                                isSelected ? "text-indigo-900" : "text-slate-700"
                                            )}>
                                                {student.name}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-8 opacity-40">
                                <Search className="h-10 w-10 mb-2"/>
                                <p className="text-xs font-bold uppercase tracking-widest">Siswa Tidak Ditemukan</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
                {selectedIds.size > 0 && students.length > 0 && (
                    <div className="bg-slate-50 p-2 border-t text-center">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            {selectedIds.size} SISWA TERPILIH
                        </span>
                    </div>
                )}
            </Card>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg">
                    <ArrowRightLeft className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900 tracking-tight leading-tight">Promosi & Kelulusan</h1>
                    <p className="text-muted-foreground text-sm">Pindahkan siswa ke kelas baru atau luluskan siswa di akhir tahun ajaran.</p>
                </div>
            </div>
            
            <Alert className="bg-indigo-50 border-indigo-200 rounded-3xl">
                <DatabaseZap className="h-4 w-4 text-indigo-600" />
                <AlertTitle className="text-indigo-800 font-bold uppercase text-[11px] tracking-widest">Sistem Snapshot & Purge Aktif</AlertTitle>
                <AlertDescription className="text-indigo-700 text-sm leading-relaxed">
                   Kenaikan kelas akan otomatis <strong>meringkas</strong> detail absensi/nilai menjadi total akhir dan <strong>menghapus</strong> log harian untuk menjaga database tetap ringan.
                </AlertDescription>
            </Alert>
            
            <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white overflow-hidden border border-slate-100">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Alat Bantu Kenaikan Kelas</CardTitle>
                    <CardDescription className="font-medium">Pindahkan siswa secara kolektif dan buat arsip riwayat kelasnya.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8 items-start p-8 pt-4">
                    {/* Source Class Column */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">1. Pilih Kelas Asal</Label>
                            <Select value={sourceClassId} onValueChange={setSourceClassId}>
                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 shadow-inner font-bold">
                                    <SelectValue placeholder="Pilih kelas..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {classes.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {sourceClassId && (
                            <SelectableStudentList
                                students={studentsInSourceClass}
                                selectedIds={selectedStudentIds}
                                onSelect={(id) => handleSelectStudent(id, setSelectedStudentIds)}
                                onSelectAll={(filtered) => handleSelectAll(filtered, selectedStudentIds, setSelectedStudentIds)}
                            />
                        )}
                    </div>
                    {/* Destination Class Column */}
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">2. Pilih Kelas Tujuan</Label>
                            <Select value={destinationClassId} onValueChange={setDestinationClassId}>
                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 shadow-inner font-bold">
                                    <SelectValue placeholder="Pilih kelas..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {classes.filter(c => c.id !== sourceClassId).map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {destinationClassId && (
                             <StudentList students={studentsInDestinationClass} title="Siswa di Kelas Tujuan" />
                        )}

                        <div className="pt-4">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 gap-3"
                                        disabled={loading || selectedStudentIds.size === 0 || !destinationClassId}
                                    >
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                                        Proses Kenaikan ({selectedStudentIds.size}) Siswa
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                                    <AlertDialogHeader className="space-y-4">
                                        <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center">
                                            <ArrowRightLeft className="h-8 w-8" />
                                        </div>
                                        <AlertDialogTitle className="text-2xl font-black tracking-tight text-center">Konfirmasi Kenaikan Kelas</AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-4 text-center">
                                            <p className="font-medium text-slate-600 text-base">Anda akan memindahkan <span className="font-black text-slate-900">{selectedStudentIds.size} siswa</span> ke kelas <span className="font-black text-indigo-600">{classes.find(c => c.id === destinationClassId)?.name}</span>.</p>
                                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs font-bold leading-relaxed text-left">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Info className="h-3 w-3" />
                                                    <span>PERHATIAN:</span>
                                                </div>
                                                Detail log absensi dan nilai harian siswa pada tahun ini akan <strong>dihapus</strong> dan diringkas menjadi total akhir di tabel arsip akademik.
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-3 pt-4">
                                        <AlertDialogCancel className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-slate-400 border-slate-100 hover:bg-slate-50 transition-all">Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handlePromotion} className="flex-1 rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all">Ya, Proses</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg rounded-[2.5rem] bg-white overflow-hidden border border-slate-100">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Mutasi Siswa (Pindah/Keluar)</CardTitle>
                        <CardDescription className="font-medium">Ubah status siswa tanpa menghapus data log harian (mutasi darurat).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8 pt-0">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Kelas</Label>
                                <Select value={mutationClassId} onValueChange={setMutationClassId}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                                        <SelectValue placeholder="Pilih kelas..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {classes.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {mutationClassId && (
                                <SelectableStudentList
                                    students={studentsInMutationClass}
                                    selectedIds={selectedMutationIds}
                                    onSelect={(id) => handleSelectStudent(id, setSelectedMutationIds)}
                                    onSelectAll={(filtered) => handleSelectAll(filtered, selectedMutationIds, setSelectedMutationIds)}
                                />
                            )}
                        </div>
                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ubah Status Menjadi</Label>
                                <Select value={targetStatus} onValueChange={(value: 'dropout' | 'inactive') => setTargetStatus(value)}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="dropout" className="font-bold">Pindah/Keluar Sekolah</SelectItem>
                                        <SelectItem value="inactive" className="font-bold">Tidak Aktif (Lainnya)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                variant="secondary"
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95"
                                disabled={loading || selectedMutationIds.size === 0}
                                onClick={handleStatusMutation}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                                Ubah Status ({selectedMutationIds.size}) Siswa
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-[2.5rem] bg-white overflow-hidden border border-slate-100">
                    <CardHeader className="p-8 text-rose-900 bg-rose-50/30">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <GraduationCap className="h-6 w-6 text-rose-600" />
                            Luluskan Siswa
                        </CardTitle>
                        <CardDescription className="text-rose-700/70 font-medium">Tandai siswa sebagai 'lulus'. Data detail akan diringkas ke tabel alumni.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pilih Kelas Lulusan</Label>
                                <Select value={graduationClassId} onValueChange={setGraduationClassId}>
                                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 font-bold">
                                        <SelectValue placeholder="Pilih kelas yang akan diluluskan..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {classes.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             {graduationClassId && (
                                <SelectableStudentList
                                    students={studentsInGraduationClass}
                                    selectedIds={selectedGraduationIds}
                                    onSelect={(id) => handleSelectStudent(id, setSelectedGraduationIds)}
                                    onSelectAll={(filtered) => handleSelectAll(filtered, selectedGraduationIds, setSelectedGraduationIds)}
                                />
                            )}
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="destructive"
                                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-100 transition-all active:scale-95 gap-3"
                                        disabled={loading || selectedGraduationIds.size === 0}
                                    >
                                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <GraduationCap className="mr-2 h-5 w-5" />}
                                        Luluskan ({selectedGraduationIds.size}) Siswa Terpilih
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                                    <AlertDialogHeader className="space-y-4">
                                        <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center">
                                            <GraduationCap className="h-8 w-8" />
                                        </div>
                                        <AlertDialogTitle className="text-2xl font-black tracking-tight text-center text-rose-600">Konfirmasi Kelulusan</AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-4 text-center">
                                            <p className="font-medium text-slate-600 text-base">Anda akan meluluskan <span className="font-black text-slate-900">{selectedGraduationIds.size} siswa</span>. Siswa ini akan dipindahkan ke daftar Alumni.</p>
                                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800 text-xs font-bold leading-relaxed text-left">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Info className="h-3 w-3" />
                                                    <span>ARSIP ALUMNI:</span>
                                                </div>
                                                Seluruh data performa siswa selama satu tahun terakhir akan diringkas dan log detailnya akan dihapus permanen dari sistem.
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-3 pt-4">
                                        <AlertDialogCancel className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-slate-400 border-slate-100 hover:bg-slate-50 transition-all">Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleGraduation} className="flex-1 rounded-2xl h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest shadow-xl shadow-rose-100 transition-all">Ya, Luluskan</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
