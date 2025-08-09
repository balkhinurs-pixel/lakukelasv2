
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
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
import { PlusCircle, MoreHorizontal, Edit, Trash2, Eye, Calendar, BookOpen, Hash } from "lucide-react";
import { journalEntries as initialJournalEntries, classes, subjects } from "@/lib/placeholder-data";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry } from "@/lib/types";
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


type NewJournalEntry = Omit<JournalEntry, 'id' | 'date' | 'className' | 'subjectName'>;
const ITEMS_PER_PAGE = 6;


function FormattedDate({ date, formatString }: { date: Date, formatString: string }) {
    const [formattedDate, setFormattedDate] = React.useState<string>('');

    React.useEffect(() => {
        if (date) {
            setFormattedDate(format(date, formatString, { locale: id }));
        }
    }, [date, formatString]);

    return <>{formattedDate}</>;
}


export default function JournalPage() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId');
  const preselectedSubjectId = searchParams.get('subjectId');
  const openDialog = searchParams.get('openDialog');

  const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>(initialJournalEntries);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = React.useState<JournalEntry | null>(null);
  const [filterClass, setFilterClass] = React.useState<string>("all");
  const [filterSubject, setFilterSubject] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);

  const initialFormState: NewJournalEntry = {
    classId: "",
    subjectId: "",
    meetingNumber: undefined,
    learningObjectives: "",
    learningActivities: "",
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
              classId: preselectedClassId || "",
              subjectId: preselectedSubjectId || "",
          }));
          const selectedClass = classes.find(c => c.id === preselectedClassId);
          if (selectedClass) {
            setFilterClass(selectedClass.id || "all");
          }
      }
  }, [isFormDialogOpen, preselectedClassId, preselectedSubjectId, editingEntry]);


  const handleOpenAddDialog = () => {
    setEditingEntry(null);
    setNewEntry(initialFormState);
    setIsFormDialogOpen(true);
  };
  
  const handleOpenEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      classId: entry.classId,
      subjectId: entry.subjectId,
      meetingNumber: entry.meetingNumber,
      learningObjectives: entry.learningObjectives,
      learningActivities: entry.learningActivities,
      assessment: entry.assessment,
      reflection: entry.reflection,
    });
    setIsViewDialogOpen(false);
    setIsFormDialogOpen(true);
  };

  const handleDeleteEntry = (entryId: string) => {
      setJournalEntries(journalEntries.filter(entry => entry.id !== entryId));
      toast({ title: "Sukses", description: "Jurnal berhasil dihapus.", variant: "destructive" });
      setIsViewDialogOpen(false);
      setSelectedEntry(null);
  }

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.classId || !newEntry.subjectId || !newEntry.learningObjectives || !newEntry.learningActivities) {
        toast({ title: "Gagal Menyimpan", description: "Mohon isi semua kolom wajib: Kelas, Mapel, Tujuan, dan Kegiatan.", variant: "destructive" });
        return;
    }

    const selectedClass = classes.find(c => c.id === newEntry.classId);
    const selectedSubject = subjects.find(s => s.id === newEntry.subjectId);

    if(!selectedClass || !selectedSubject) {
        toast({ title: "Gagal", description: "Kelas atau mapel tidak valid.", variant: "destructive" });
        return;
    }

    if (editingEntry) {
        const updatedEntries = journalEntries.map(entry => 
            entry.id === editingEntry.id ? { 
                ...editingEntry, 
                ...newEntry, 
                className: selectedClass.name, 
                subjectName: selectedSubject.name 
            } : entry
        );
        setJournalEntries(updatedEntries);
        toast({ title: "Jurnal Diperbarui", description: "Jurnal mengajar berhasil diperbarui." });
    } else {
        const newJournalEntry: JournalEntry = {
            id: `J${Date.now()}`,
            date: new Date(),
            ...newEntry,
            className: selectedClass.name,
            subjectName: selectedSubject.name,
            meetingNumber: newEntry.meetingNumber || undefined,
        };
        setJournalEntries([newJournalEntry, ...journalEntries]);
        toast({ title: "Jurnal Disimpan", description: "Jurnal mengajar baru berhasil disimpan.", className: "bg-green-100 text-green-900 border-green-200" });
    }
    
    setNewEntry(initialFormState);
    setIsFormDialogOpen(false);
    setEditingEntry(null);
  }

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsViewDialogOpen(true);
  }

  const filteredEntries = React.useMemo(() => {
    let result = journalEntries;
    if (filterClass !== "all") {
        result = result.filter(entry => entry.classId === filterClass);
    }
    if (filterSubject !== "all") {
        result = result.filter(entry => entry.subjectId === filterSubject);
    }
    return result;
  }, [journalEntries, filterClass, filterSubject]);

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
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSaveJournal}>
                    <DialogHeader>
                    <DialogTitle>{editingEntry ? 'Ubah Jurnal Mengajar' : 'Tambah Jurnal Mengajar'}</DialogTitle>
                    <DialogDescription>
                        {editingEntry ? 'Perbarui detail jurnal mengajar ini.' : 'Dokumentasikan proses pembelajaran secara lengkap dan reflektif.'}
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="class">Kelas</Label>
                                <Select value={newEntry.classId} onValueChange={(value) => setNewEntry({...newEntry, classId: value})} required>
                                    <SelectTrigger id="class">
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
                                <Label htmlFor="subject">Mata Pelajaran</Label>
                                 <Select value={newEntry.subjectId} onValueChange={(value) => setNewEntry({...newEntry, subjectId: value})} required>
                                    <SelectTrigger id="subject">
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
                            <Label htmlFor="meetingNumber">Pertemuan Ke</Label>
                            <Input 
                                id="meetingNumber" 
                                type="number" 
                                placeholder="e.g. 5" 
                                value={newEntry.meetingNumber || ""} 
                                onChange={(e) => setNewEntry({...newEntry, meetingNumber: e.target.value ? parseInt(e.target.value) : undefined})} 
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="learningObjectives">Tujuan Pembelajaran</Label>
                            <Textarea id="learningObjectives" placeholder="Siswa mampu mengidentifikasi..." value={newEntry.learningObjectives} onChange={(e) => setNewEntry({...newEntry, learningObjectives: e.target.value})} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="learningActivities">Kegiatan Pembelajaran (Sintaks)</Label>
                            <Textarea id="learningActivities" placeholder="1. Kegiatan Awal: Apersepsi dan doa..." value={newEntry.learningActivities} onChange={(e) => setNewEntry({...newEntry, learningActivities: e.target.value})} required/>
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
                      <Button type="button" variant="ghost" onClick={() => setIsFormDialogOpen(false)}>Batal</Button>
                      <Button type="submit">Simpan Jurnal</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div>
                    <CardTitle>Riwayat Jurnal</CardTitle>
                    <CardDescription>
                        Entri jurnal mengajar yang telah Anda simpan sebelumnya.
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
                                                    Tindakan ini tidak dapat dibatalkan. Anda yakin ingin menghapus jurnal untuk <span className="font-semibold">{entry.subjectName} di {entry.className}</span> pada tanggal <FormattedDate date={entry.date} formatString="dd MMM yyyy" />?
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
                                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> <FormattedDate date={entry.date} formatString="dd MMM yyyy" /></div>
                                    {entry.meetingNumber && <div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Pertemuan ke-{entry.meetingNumber}</div>}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                 <div className="space-y-2">
                                    <h4 className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary"/> Tujuan Pembelajaran</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{entry.learningObjectives}</p>
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
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Detail Jurnal Mengajar</DialogTitle>
                <DialogDescription>
                    {selectedEntry?.subjectName} - {selectedEntry?.className} ({selectedEntry ? <FormattedDate date={selectedEntry.date} formatString="eeee, dd MMMM yyyy"/> : ''}) {selectedEntry?.meetingNumber ? `- Pertemuan ${selectedEntry.meetingNumber}` : ''}
                </DialogDescription>
            </DialogHeader>
            {selectedEntry && (
                 <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Tujuan Pembelajaran</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEntry.learningObjectives}</p>
                    </div>
                     <div className="space-y-1">
                        <h4 className="font-semibold text-sm">Kegiatan Pembelajaran</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEntry.learningActivities}</p>
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
            <DialogFooter className="justify-between pt-4 border-t flex-wrap gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4"/> Hapus
                        </Button>
                    </AlertDialogTrigger>
                     {selectedEntry && (
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Jurnal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tindakan ini tidak dapat dibatalkan. Anda yakin ingin menghapus jurnal untuk <span className="font-semibold">{selectedEntry.subjectName} di {selectedEntry.className}</span> pada tanggal <FormattedDate date={selectedEntry.date} formatString="dd MMM yyyy" />?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => selectedEntry && handleDeleteEntry(selectedEntry.id)} className="bg-destructive hover:bg-destructive/90">
                                    Ya, Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                     )}
                </AlertDialog>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => selectedEntry && handleOpenEditDialog(selectedEntry)}>
                      <Edit className="mr-2 h-4 w-4"/> Ubah
                  </Button>
                  <Button variant="secondary" onClick={() => setIsViewDialogOpen(false)}>Tutup</Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
