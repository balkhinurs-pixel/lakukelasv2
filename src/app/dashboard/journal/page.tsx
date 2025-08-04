
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { journalEntries as initialJournalEntries, classes } from "@/lib/placeholder-data";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type NewJournalEntry = Omit<JournalEntry, 'id' | 'date'>;

export default function JournalPage() {
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get('class');
  const preselectedSubject = searchParams.get('subject');
  const openDialog = searchParams.get('openDialog');

  const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>(initialJournalEntries);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = React.useState<JournalEntry | null>(null);

  const initialFormState: NewJournalEntry = {
    class: "",
    subject: "",
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
      if (isFormDialogOpen && preselectedClass && preselectedSubject && !editingEntry) {
          setNewEntry(prev => ({
              ...prev,
              class: preselectedClass || "",
              subject: preselectedSubject || "",
          }));
      }
  }, [isFormDialogOpen, preselectedClass, preselectedSubject, editingEntry]);


  const handleOpenAddDialog = () => {
    setEditingEntry(null);
    setNewEntry(initialFormState);
    setIsFormDialogOpen(true);
  };
  
  const handleOpenEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      class: entry.class,
      subject: entry.subject,
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
  }

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.class || !newEntry.subject || !newEntry.learningObjectives || !newEntry.learningActivities) {
        toast({ title: "Gagal", description: "Mohon isi semua kolom yang wajib diisi.", variant: "destructive" });
        return;
    }

    if (editingEntry) {
        // Update existing entry
        const updatedEntries = journalEntries.map(entry => 
            entry.id === editingEntry.id ? { ...entry, ...newEntry } : entry
        );
        setJournalEntries(updatedEntries);
        toast({ title: "Sukses", description: "Jurnal mengajar berhasil diperbarui." });
    } else {
        // Add new entry
        const newJournalEntry: JournalEntry = {
            id: `J${Date.now()}`,
            date: new Date(),
            ...newEntry,
            meetingNumber: newEntry.meetingNumber || undefined,
        };
        setJournalEntries([newJournalEntry, ...journalEntries]);
        toast({ title: "Sukses", description: "Jurnal mengajar berhasil disimpan.", className: "bg-green-100 text-green-900 border-green-200" });
    }
    
    setNewEntry(initialFormState);
    setIsFormDialogOpen(false);
    setEditingEntry(null);
  }

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsViewDialogOpen(true);
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="class">Kelas</Label>
                                <Select value={newEntry.class} onValueChange={(value) => setNewEntry({...newEntry, class: value})} required>
                                    <SelectTrigger id="class">
                                        <SelectValue placeholder="Pilih kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.name}>
                                            {c.name}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Mata Pelajaran</Label>
                                <Input id="subject" placeholder="e.g. Matematika Wajib" value={newEntry.subject} onChange={(e) => setNewEntry({...newEntry, subject: e.target.value})} required/>
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
        <CardHeader>
          <CardTitle>Riwayat Jurnal</CardTitle>
          <CardDescription>
            Entri jurnal mengajar Anda yang telah disimpan sebelumnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Tanggal</TableHead>
                <TableHead>Info</TableHead>
                <TableHead>Tujuan Pembelajaran</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {format(entry.date, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{entry.subject}</div>
                    <div className="text-sm text-muted-foreground">{entry.class} {entry.meetingNumber ? `(P-${entry.meetingNumber})` : ''}</div>
                  </TableCell>
                  <TableCell>
                     <p className="line-clamp-2 text-sm text-muted-foreground">{entry.learningObjectives}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewEntry(entry)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(entry)}>
                                <Edit className="mr-2 h-4 w-4" /> Ubah
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteEntry(entry.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline">Muat Lebih Banyak</Button>
        </CardFooter>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Detail Jurnal Mengajar</DialogTitle>
                <DialogDescription>
                    {selectedEntry?.subject} - {selectedEntry?.class} ({selectedEntry ? format(selectedEntry.date, "eeee, dd MMMM yyyy") : ''}) {selectedEntry?.meetingNumber ? ` - Pertemuan ${selectedEntry.meetingNumber}` : ''}
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
            <DialogFooter className="justify-between">
                <Button variant="outline" onClick={() => selectedEntry && handleOpenEditDialog(selectedEntry)}>
                    <Edit className="mr-2 h-4 w-4"/> Ubah Jurnal
                </Button>
                <Button variant="secondary" onClick={() => setIsViewDialogOpen(false)}>Tutup</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    