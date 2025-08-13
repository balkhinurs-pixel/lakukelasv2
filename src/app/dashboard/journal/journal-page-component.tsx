

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Eye, Calendar, BookOpen, Hash, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry, Class, Subject } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { saveJournal, deleteJournal } from "@/lib/actions";


type NewJournalEntry = Omit<JournalEntry, 'id' | 'date' | 'className' | 'subjectName' | 'teacher_id'>;
const ITEMS_PER_PAGE = 6;


function FormattedDate({ date, formatString }: { date: Date | null, formatString: string }) {
    const [formattedDate, setFormattedDate] = React.useState<string>('');

    React.useEffect(() => {
        if (date) {
            setFormattedDate(format(date, formatString, { locale: id }));
        }
    }, [date, formatString]);

    return <>{formattedDate}</>;
}


export default function JournalPageComponent({
    initialJournalEntries,
    classes,
    subjects,
    activeSchoolYearName,
}: {
    initialJournalEntries: JournalEntry[];
    classes: Class[];
    subjects: Subject[];
    activeSchoolYearName: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedClassId = searchParams.get('classId');
  const preselectedSubjectId = searchParams.get('subjectId');
  const openDialog = searchParams.get('openDialog');

  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = React.useState<JournalEntry | null>(null);
  const [filterClass, setFilterClass] = React.useState<string>("all");
  const [filterSubject, setFilterSubject] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  const initialFormState: NewJournalEntry = {
    class_id: "",
    subject_id: "",
    meeting_number: undefined,
    learning_objectives: "",
    learning_activities: "",
    assessment: "",
    reflection: ""
  };

  const [newEntry, setNewEntry] = React.useState<NewJournalEntry>(initialFormState);
  const { toast } = useToast();

  React.useEffect(() => {
    if (openDialog === "true") {
      handleOpenAddDialog();
    }
  }, [openDialog]);

  React.useEffect(() => {
      if (isFormDialogOpen && preselectedClassId && preselectedSubjectId && !editingEntry) {
          setNewEntry(prev => ({
              ...prev,
              class_id: preselectedClassId || "",
              subject_id: preselectedSubjectId || "",
          }));
          const selectedClass = classes.find(c => c.id === preselectedClassId);
          if (selectedClass) {
            setFilterClass(selectedClass.id || "all");
          }
      }
  }, [isFormDialogOpen, preselectedClassId, preselectedSubjectId, editingEntry, classes]);


  const handleOpenAddDialog = () => {
    setEditingEntry(null);
    setNewEntry(initialFormState);
    setIsFormDialogOpen(true);
  };
  
  const handleOpenEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      class_id: entry.class_id,
      subject_id: entry.subject_id,
      meeting_number: entry.meeting_number,
      learning_objectives: entry.learning_objectives,
      learning_activities: entry.learning_activities,
      assessment: entry.assessment,
      reflection: entry.reflection,
    });
    setIsViewDialogOpen(false);
    setIsFormDialogOpen(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
      setLoading(true);
      const result = await deleteJournal(entryId);
      if (result.success) {
          toast({ title: "Sukses", description: "Jurnal berhasil dihapus." });
          router.refresh();
      } else {
          toast({ title: "Gagal", description: result.error, variant: "destructive" });
      }
      setIsViewDialogOpen(false);
      setSelectedEntry(null);
      setLoading(false);
  }

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.class_id || !newEntry.subject_id || !newEntry.learning_objectives || !newEntry.learning_activities) {
        toast({ title: "Gagal Menyimpan", description: "Mohon isi semua kolom wajib: Kelas, Mapel, Tujuan, dan Kegiatan.", variant: "destructive" });
        return;
    }
    setLoading(true);

    const formData = new FormData();
    if(editingEntry) formData.append('id', editingEntry.id);
    formData.append('class_id', newEntry.class_id);
    formData.append('subject_id', newEntry.subject_id);
    if(newEntry.meeting_number) formData.append('meeting_number', String(newEntry.meeting_number));
    formData.append('learning_objectives', newEntry.learning_objectives);
    formData.append('learning_activities', newEntry.learning_activities);
    if(newEntry.assessment) formData.append('assessment', newEntry.assessment);
    if(newEntry.reflection) formData.append('reflection', newEntry.reflection);

    const result = await saveJournal(formData);
    
    if (result.success) {
        toast({ title: editingEntry ? "Jurnal Diperbarui" : "Jurnal Disimpan", description: "Perubahan Anda telah berhasil disimpan." });
        router.refresh();
        setIsFormDialogOpen(false);
        setEditingEntry(null);
    } else {
        toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  }

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsViewDialogOpen(true);
  }

  const filteredEntries = React.useMemo(() => {
    let result = initialJournalEntries;
    if (filterClass !== "all") {
        result = result.filter(entry => entry.class_id === filterClass);
    }
    if (filterSubject !== "all") {
        result = result.filter(entry => entry.subject_id === filterSubject);
    }
    return result;
  }, [initialJournalEntries, filterClass, filterSubject]);

  // Pagination logic
  const pageCount = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
      setCurrentPage(page);
  };

  const renderPagination = () => {
    if (pageCount <= 1) return null;
    const pageNumbers = [];
    const ellipsis = <PaginationItem key="ellipsis"><PaginationEllipsis /></PaginationItem>;

    if (pageCount <= 7) {
        for (let i = 1; i <= pageCount; i++) {
            pageNumbers.push(
                <PaginationItem key={i}>
                    <PaginationLink href="#" isActive={i === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(i); }}>{i}</PaginationLink>
                </PaginationItem>
            );
        }
    } else {
        pageNumbers.push(
            <PaginationItem key={1}>
                <PaginationLink href="#" isActive={1 === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>1</PaginationLink>
            </PaginationItem>
        );

        if (currentPage > 3) pageNumbers.push(React.cloneElement(ellipsis, {key: "start-ellipsis"}));

        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(pageCount - 1, currentPage + 1);
        
        if (currentPage <= 3) {
           startPage = 2;
           endPage = 4;
        }
        if (currentPage >= pageCount - 2) {
            startPage = pageCount - 3;
            endPage = pageCount -1;
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <PaginationItem key={i}>
                    <PaginationLink href="#" isActive={i === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(i); }}>{i}</PaginationLink>
                </PaginationItem>
            );
        }
        
        if (currentPage < pageCount - 2) pageNumbers.push(React.cloneElement(ellipsis, {key: "end-ellipsis"}));

        pageNumbers.push(
            <PaginationItem key={pageCount}>
                <PaginationLink href="#" isActive={pageCount === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(pageCount); }}>{pageCount}</PaginationLink>
            </PaginationItem>
        );
    }

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(1, currentPage - 1)); }} />
                </PaginationItem>
                {pageNumbers}
                <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(pageCount, currentPage + 1)); }} />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
            <h1 className="text-2xl font-bold font-headline">Jurnal Mengajar</h1>
            <p className="text-muted-foreground">Catatan reflektif kegiatan mengajar harian Anda.</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Jurnal Baru
        </Button>
       </div>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogContent className="sm:max-w-lg dialog-content-mobile mobile-safe-area">
                <form onSubmit={handleSaveJournal}>
                    <DialogHeader>
                    <DialogTitle>{editingEntry ? 'Ubah Jurnal Mengajar' : 'Tambah Jurnal Mengajar'}</DialogTitle>
                    <DialogDescription>
                        {editingEntry ? 'Perbarui detail jurnal mengajar ini.' : 'Dokumentasikan proses pembelajaran secara lengkap dan reflektif.'}
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="space-y-2">
                            <Label>Tahun Ajaran Aktif</Label>
                            <Input value={activeSchoolYearName} disabled className="font-semibold"/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="class_id">Kelas</Label>
                                <Select value={newEntry.class_id} onValueChange={(value) => setNewEntry({...newEntry, class_id: value})} required>
                                    <SelectTrigger id="class_id">
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
                                <Label htmlFor="subject_id">Mata Pelajaran</Label>
                                 <Select value={newEntry.subject_id} onValueChange={(value) => setNewEntry({...newEntry, subject_id: value})} required>
                                    <SelectTrigger id="subject_id">
                                        <SelectValue placeholder="Pilih mapel" />
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
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meeting_number">Pertemuan Ke</Label>
                            <Input 
                                id="meeting_number" 
                                type="number" 
                                placeholder="e.g. 5" 
                                value={newEntry.meeting_number || ""} 
                                onChange={(e) => setNewEntry({...newEntry, meeting_number: e.target.value ? parseInt(e.target.value) : undefined})} 
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="learning_objectives">Tujuan Pembelajaran</Label>
                            <Textarea id="learning_objectives" placeholder="Siswa mampu mengidentifikasi..." value={newEntry.learning_objectives} onChange={(e) => setNewEntry({...newEntry, learning_objectives: e.target.value})} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="learning_activities">Kegiatan Pembelajaran (Sintaks)</Label>
                            <Textarea id="learning_activities" placeholder="1. Kegiatan Awal: Apersepsi dan doa..." value={newEntry.learning_activities} onChange={(e) => setNewEntry({...newEntry, learning_activities: e.target.value})} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assessment">Penilaian (Asesmen)</Label>
                            <Textarea id="assessment" placeholder="Asesmen formatif melalui tanya jawab, asesmen sumatif melalui..." value={newEntry.assessment || ''} onChange={(e) => setNewEntry({...newEntry, assessment: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reflection">Refleksi & Tindak Lanjut</Label>
                            <Textarea id="reflection" placeholder="Sebagian besar siswa sudah paham, namun 3 siswa perlu bimbingan..." value={newEntry.reflection || ''} onChange={(e) => setNewEntry({...newEntry, reflection: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                      <Button type="button" variant="ghost" onClick={() => setIsFormDialogOpen(false)} disabled={loading}>Batal</Button>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Jurnal
                      </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div>
                    <CardTitle>Riwayat Jurnal</CardTitle>
                    <CardDescription>
                        Entri jurnal mengajar yang telah Anda simpan sebelumnya. Riwayat disaring berdasarkan tahun ajaran aktif: <span className="font-semibold">{activeSchoolYearName}</span>
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:self-start">
                    <Select value={filterClass} onValueChange={setFilterClass}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filter berdasarkan kelas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kelas</SelectItem>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filter berdasarkan mapel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Mapel</SelectItem>
                            {subjects.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedEntries.map((entry) => (
                        <Card key={entry.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{entry.subjectName}</CardTitle>
                                        <CardDescription>{entry.className}</CardDescription>
                                    </div>
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewEntry(entry)}>
                                                    <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenEditDialog(entry)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Ubah
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus Jurnal?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini tidak dapat dibatalkan. Anda yakin ingin menghapus jurnal untuk <span className="font-semibold">{entry.subjectName} di {entry.className}</span> pada tanggal <FormattedDate date={parseISO(entry.date)} formatString="dd MMM yyyy" />?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Ya, Hapus
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> <FormattedDate date={parseISO(entry.date)} formatString="dd MMM yyyy" /></div>
                                    {entry.meeting_number && <div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Pertemuan ke-{entry.meeting_number}</div>}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                 <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary"/> Tujuan Pembelajaran</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{entry.learning_objectives}</p>
                                 </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" onClick={() => handleViewEntry(entry)}>Lihat Detail Lengkap</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                 {paginatedEntries.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                        <p>Tidak ada entri jurnal yang cocok dengan filter Anda.</p>
                    </div>
                )}
            </CardContent>
            {pageCount > 1 && (
                <CardFooter className="flex justify-center border-t pt-4">
                    {renderPagination()}
                </CardFooter>
            )}
        </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg dialog-content-mobile mobile-safe-area">
            <DialogHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <DialogTitle>Detail Jurnal Mengajar</DialogTitle>
                        <DialogDescription>
                            {selectedEntry?.subjectName} - {selectedEntry?.className}
                        </DialogDescription>
                    </div>
                     <div className="flex items-center gap-2 -mt-2 -mr-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={loading}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                             {selectedEntry && (
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Jurnal?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tindakan ini tidak dapat dibatalkan. Anda yakin ingin menghapus jurnal untuk <span className="font-semibold">{selectedEntry.subjectName} di {selectedEntry.className}</span> pada tanggal <FormattedDate date={parseISO(selectedEntry.date)} formatString="dd MMM yyyy" />?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => selectedEntry && handleDeleteEntry(selectedEntry.id)} className="bg-destructive hover:bg-destructive/90">
                                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                            Ya, Hapus
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                             )}
                        </AlertDialog>
                         <Button variant="ghost" size="icon" onClick={() => selectedEntry && handleOpenEditDialog(selectedEntry)} disabled={loading}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogHeader>
            {selectedEntry && (
                 <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    <p className="text-sm text-muted-foreground -mt-2">
                        <FormattedDate date={parseISO(selectedEntry.date)} formatString="eeee, dd MMMM yyyy"/> {selectedEntry.meeting_number ? `- Pertemuan ${selectedEntry.meeting_number}` : ''}
                    </p>
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Tujuan Pembelajaran</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEntry.learning_objectives}</p>
                    </div>
                     <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Kegiatan Pembelajaran</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEntry.learning_activities}</p>
                    </div>
                     <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Penilaian (Asesmen)</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEntry.assessment || "-"}</p>
                    </div>
                     <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Refleksi & Tindak Lanjut</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEntry.reflection || "-"}</p>
                    </div>
                 </div>
            )}
            <DialogFooter className="pt-4 border-t">
                <Button variant="secondary" onClick={() => setIsViewDialogOpen(false)} disabled={loading} className="w-full">
                    Tutup
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
