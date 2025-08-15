

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
import { PlusCircle, MoreHorizontal, Edit, Trash2, Eye, Calendar, BookOpen, Hash, Loader2, FileText, Target, Activity, ClipboardCheck, Lightbulb, Filter, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
    <div className="space-y-6 p-1">
       <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline text-slate-900">Jurnal Mengajar</h1>
            <p className="text-slate-600 mt-1">Catatan reflektif kegiatan mengajar harian Anda.</p>
          </div>
        </div>
        <Button 
          onClick={handleOpenAddDialog}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Jurnal Baru
        </Button>
       </div>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogContent className="sm:max-w-2xl dialog-content-mobile mobile-safe-area">
                <form onSubmit={handleSaveJournal}>
                    <DialogHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-xl",
                          editingEntry ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                        )}>
                          {editingEntry ? <Edit className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                          <DialogTitle className="text-xl">{editingEntry ? 'Ubah Jurnal Mengajar' : 'Tambah Jurnal Mengajar'}</DialogTitle>
                          <DialogDescription className="mt-1">
                              {editingEntry ? 'Perbarui detail jurnal mengajar ini.' : 'Dokumentasikan proses pembelajaran secara lengkap dan reflektif.'}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Tahun Ajaran Aktif</Label>
                            <Input 
                              value={activeSchoolYearName} 
                              disabled 
                              className="font-semibold bg-slate-50 border-slate-200 text-slate-600"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="class_id" className="text-sm font-medium text-slate-700">Kelas</Label>
                                <Select value={newEntry.class_id} onValueChange={(value) => setNewEntry({...newEntry, class_id: value})} required>
                                    <SelectTrigger id="class_id" className="bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
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
                                <Label htmlFor="subject_id" className="text-sm font-medium text-slate-700">Mata Pelajaran</Label>
                                 <Select value={newEntry.subject_id} onValueChange={(value) => setNewEntry({...newEntry, subject_id: value})} required>
                                    <SelectTrigger id="subject_id" className="bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
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
                            <Label htmlFor="meeting_number" className="text-sm font-medium text-slate-700">Pertemuan Ke</Label>
                            <Input 
                                id="meeting_number" 
                                type="number" 
                                placeholder="e.g. 5" 
                                value={newEntry.meeting_number || ""} 
                                onChange={(e) => setNewEntry({...newEntry, meeting_number: e.target.value ? parseInt(e.target.value) : undefined})}
                                className="bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                            />
                        </div>
                         <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-indigo-600" />
                              <Label htmlFor="learning_objectives" className="text-sm font-medium text-slate-700">Tujuan Pembelajaran</Label>
                            </div>
                            <Textarea 
                              id="learning_objectives" 
                              placeholder="Siswa mampu mengidentifikasi..." 
                              value={newEntry.learning_objectives} 
                              onChange={(e) => setNewEntry({...newEntry, learning_objectives: e.target.value})} 
                              required
                              className="min-h-[80px] bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-indigo-600" />
                              <Label htmlFor="learning_activities" className="text-sm font-medium text-slate-700">Kegiatan Pembelajaran (Sintaks)</Label>
                            </div>
                            <Textarea 
                              id="learning_activities" 
                              placeholder="1. Kegiatan Awal: Apersepsi dan doa..." 
                              value={newEntry.learning_activities} 
                              onChange={(e) => setNewEntry({...newEntry, learning_activities: e.target.value})} 
                              required
                              className="min-h-[100px] bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                              <Label htmlFor="assessment" className="text-sm font-medium text-slate-700">Penilaian (Asesmen)</Label>
                            </div>
                            <Textarea 
                              id="assessment" 
                              placeholder="Asesmen formatif melalui tanya jawab, asesmen sumatif melalui..." 
                              value={newEntry.assessment || ''} 
                              onChange={(e) => setNewEntry({...newEntry, assessment: e.target.value})}
                              className="min-h-[80px] bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-indigo-600" />
                              <Label htmlFor="reflection" className="text-sm font-medium text-slate-700">Refleksi & Tindak Lanjut</Label>
                            </div>
                            <Textarea 
                              id="reflection" 
                              placeholder="Sebagian besar siswa sudah paham, namun 3 siswa perlu bimbingan..." 
                              value={newEntry.reflection || ''} 
                              onChange={(e) => setNewEntry({...newEntry, reflection: e.target.value})}
                              className="min-h-[80px] bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-slate-200 bg-slate-50/50 rounded-b-lg">
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsFormDialogOpen(false)} 
                          disabled={loading}
                          className="border-slate-300 hover:bg-slate-50"
                        >
                          Batal
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Simpan Jurnal
                        </Button>
                      </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Riwayat Jurnal</CardTitle>
                    <CardDescription className="mt-1">
                        Entri jurnal mengajar yang telah Anda simpan sebelumnya. Riwayat disaring berdasarkan tahun ajaran aktif: <span className="font-semibold text-emerald-600">{activeSchoolYearName}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <div className="flex items-center gap-2 flex-1">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <Select value={filterClass} onValueChange={setFilterClass}>
                          <SelectTrigger className="bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
                              <SelectValue placeholder="Filter berdasarkan kelas" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Semua Kelas</SelectItem>
                              {classes.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <BookOpen className="h-4 w-4 text-slate-400" />
                      <Select value={filterSubject} onValueChange={setFilterSubject}>
                          <SelectTrigger className="bg-white border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20">
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
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedEntries.map((entry) => (
                        <Card key={entry.id} className="group flex flex-col border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-white hover:bg-slate-50/50">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                            <BookOpen className="h-3.5 w-3.5" />
                                          </div>
                                          <CardTitle className="text-lg font-semibold text-slate-900 truncate">{entry.subjectName}</CardTitle>
                                        </div>
                                        <CardDescription className="text-slate-600 font-medium">{entry.className}</CardDescription>
                                    </div>
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> 
                                      <FormattedDate date={parseISO(entry.date)} formatString="dd MMM yyyy" />
                                    </div>
                                    {entry.meeting_number && (
                                      <div className="flex items-center gap-1.5">
                                        <Hash className="h-3.5 w-3.5 text-slate-400" /> 
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                                          Pertemuan ke-{entry.meeting_number}
                                        </span>
                                      </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow pt-0">
                                 <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Target className="h-4 w-4 text-indigo-600" />
                                      <h4 className="font-semibold text-sm text-slate-700">Tujuan Pembelajaran</h4>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed pl-6">{entry.learning_objectives}</p>
                                 </div>
                            </CardContent>
                            <CardFooter className="pt-3 border-t border-slate-100">
                                <Button 
                                  variant="outline" 
                                  className="w-full border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors duration-200" 
                                  onClick={() => handleViewEntry(entry)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Detail Lengkap
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                 {paginatedEntries.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 rounded-full bg-slate-100">
                            <FileText className="h-8 w-8 text-slate-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-slate-700">Tidak ada entri jurnal yang cocok dengan filter Anda</p>
                            <p className="text-sm text-slate-500">Coba ubah filter atau tambahkan jurnal baru</p>
                          </div>
                        </div>
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
        <DialogContent className="sm:max-w-2xl dialog-content-mobile mobile-safe-area">
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Detail Jurnal Mengajar</DialogTitle>
                  <DialogDescription className="mt-1">
                      {selectedEntry?.subjectName} - {selectedEntry?.className}
                  </DialogDescription>
                  {selectedEntry && (
                      <p className="text-sm text-slate-500 pt-1 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <FormattedDate date={parseISO(selectedEntry.date)} formatString="eeee, dd MMMM yyyy"/>
                          {selectedEntry.meeting_number && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                                Pertemuan ke-{selectedEntry.meeting_number}
                              </span>
                            </>
                          )}
                      </p>
                  )}
                </div>
              </div>
            </DialogHeader>
            {selectedEntry && (
                 <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 pt-2">
                    <div className="space-y-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-semibold text-sm text-slate-700">Tujuan Pembelajaran</h4>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pl-6">{selectedEntry.learning_objectives}</p>
                    </div>
                     <div className="space-y-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-semibold text-sm text-slate-700">Kegiatan Pembelajaran</h4>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pl-6">{selectedEntry.learning_activities}</p>
                    </div>
                     <div className="space-y-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-semibold text-sm text-slate-700">Penilaian (Asesmen)</h4>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pl-6">{selectedEntry.assessment || "Tidak ada penilaian yang dicatat"}</p>
                    </div>
                     <div className="space-y-3 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-semibold text-sm text-slate-700">Refleksi & Tindak Lanjut</h4>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed pl-6">{selectedEntry.reflection || "Tidak ada refleksi yang dicatat"}</p>
                    </div>
                 </div>
            )}
            <DialogFooter className="pt-4 border-t border-slate-200 bg-slate-50/50 rounded-b-lg">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)} 
                  disabled={loading}
                  className="border-slate-300 hover:bg-slate-50"
                >
                    Tutup
                </Button>
                <div className="flex flex-col sm:flex-row gap-2">
                     <Button 
                       variant="outline" 
                       onClick={() => selectedEntry && handleOpenEditDialog(selectedEntry)} 
                       disabled={loading}
                       className="border-slate-300 hover:bg-slate-50"
                     >
                        <Edit className="mr-2 h-4 w-4" />
                        Ubah
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" disabled={loading}>
                                {loading === true ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                                Hapus
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
                </div>
              </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
