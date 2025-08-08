
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classes, subjects, schedule as initialSchedule } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";
import type { ScheduleItem } from "@/lib/types";

const daysOfWeek: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type NewScheduleEntry = Omit<ScheduleItem, 'id' | 'teacherId' | 'subject' | 'class'>;

export default function SchedulePage() {
    const [schedule, setSchedule] = React.useState<ScheduleItem[]>(initialSchedule);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<ScheduleItem | null>(null);
    const [newEntry, setNewEntry] = React.useState<NewScheduleEntry>({
        day: 'Senin', classId: '', subjectId: '', startTime: '', endTime: ''
    });
    const { toast } = useToast();

    const openAddDialog = () => {
        setEditingItem(null);
        setNewEntry({ day: 'Senin', classId: '', subjectId: '', startTime: '', endTime: '' });
        setIsDialogOpen(true);
    }
    
    const openEditDialog = (item: ScheduleItem) => {
        setEditingItem(item);
        setNewEntry({
          day: item.day,
          classId: item.classId,
          subjectId: item.subjectId,
          startTime: item.startTime,
          endTime: item.endTime,
        });
        setIsDialogOpen(true);
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.day || !newEntry.classId || !newEntry.subjectId || !newEntry.startTime || !newEntry.endTime) {
            toast({ title: "Gagal Menyimpan", description: "Semua kolom harus diisi.", variant: "destructive" });
            return;
        }
        
        const selectedClass = classes.find(c => c.id === newEntry.classId);
        const selectedSubject = subjects.find(s => s.id === newEntry.subjectId);

        if (!selectedClass || !selectedSubject) {
            toast({ title: "Data tidak valid", description: "Kelas atau mapel tidak ditemukan.", variant: "destructive" });
            return;
        }

        const scheduleData = {
          ...newEntry,
          class: selectedClass.name,
          subject: selectedSubject.name
        }

        if (editingItem) {
            // Update existing item
            setSchedule(schedule.map(item => item.id === editingItem.id ? { ...editingItem, ...scheduleData } : item));
            toast({ title: "Jadwal Diperbarui", description: "Jadwal mengajar berhasil diperbarui." });
        } else {
            // Add new item
            const newScheduleItem: ScheduleItem = { 
              id: `SCH${Date.now()}`,
              teacherId: 'user_placeholder',
              ...scheduleData,
            };
            setSchedule([...schedule, newScheduleItem]);
            toast({ title: "Jadwal Disimpan", description: "Jadwal baru berhasil ditambahkan.", className: "bg-green-100 text-green-900 border-green-200" });
        }
        
        setIsDialogOpen(false);
        setEditingItem(null);
    }

    const handleDelete = (id: string) => {
        setSchedule(schedule.filter(item => item.id !== id));
        toast({ title: "Jadwal Dihapus", description: "Satu jadwal telah berhasil dihapus.", variant: 'destructive' });
    }

    const groupedSchedule = schedule.reduce((acc, item) => {
        (acc[item.day] = acc[item.day] || []).push(item);
        return acc;
      }, {} as Record<ScheduleItem['day'], ScheduleItem[]>);
    
    for (const day in groupedSchedule) {
        groupedSchedule[day as ScheduleItem['day']].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">Kelola Jadwal</h1>
          <p className="text-muted-foreground">
            Atur jadwal mengajar mingguan Anda.
          </p>
        </div>
        <Button onClick={openAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Jadwal
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Ubah Jadwal' : 'Tambah Jadwal Baru'}</DialogTitle>
                  <DialogDescription>
                    Isi detail jadwal mengajar yang baru.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">
                      Hari
                    </Label>
                    <Select value={newEntry.day} onValueChange={(value: ScheduleItem['day']) => setNewEntry({...newEntry, day: value})} required>
                      <SelectTrigger id="day">
                        <SelectValue placeholder="Pilih hari" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">
                      Kelas
                    </Label>
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
                    <Label htmlFor="subject">
                      Mata Pelajaran
                    </Label>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">
                        Waktu Mulai
                      </Label>
                      <Input id="startTime" type="time" value={newEntry.startTime} onChange={e => setNewEntry({...newEntry, startTime: e.target.value})} required/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">
                        Waktu Selesai
                      </Label>
                      <Input id="endTime" type="time" value={newEntry.endTime} onChange={e => setNewEntry({...newEntry, endTime: e.target.value})} required/>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOfWeek.map((day) => (
            groupedSchedule[day] && groupedSchedule[day].length > 0 ? (
            <Card key={day}>
              <CardHeader>
                <CardTitle>{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedSchedule[day].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.class}</p>
                      <p className="text-sm text-muted-foreground">{item.startTime} - {item.endTime}</p>
                    </div>
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Ubah</span>
                                </DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Hapus</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tindakan ini akan menghapus jadwal <span className="font-semibold">{item.subject}</span> di kelas <span className="font-semibold">{item.class}</span> pada hari {item.day}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">
                                    Ya, Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null
        ))}
      </div>
    </div>
  );
}

    