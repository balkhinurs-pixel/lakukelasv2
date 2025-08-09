
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import type { ScheduleItem, Class, Subject } from "@/lib/types";
import { saveSchedule, deleteSchedule } from "@/lib/actions";

const daysOfWeek: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

type NewScheduleEntry = Omit<ScheduleItem, 'id' | 'teacher_id' | 'subject' | 'class'>;

function SchedulePageComponent({
    initialSchedule,
    classes,
    subjects,
} : {
    initialSchedule: ScheduleItem[],
    classes: Class[],
    subjects: Subject[]
}) {
    const router = useRouter();
    const [schedule, setSchedule] = React.useState<ScheduleItem[]>(initialSchedule);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<ScheduleItem | null>(null);
    const [newEntry, setNewEntry] = React.useState<NewScheduleEntry>({
        day: 'Senin', class_id: '', subject_id: '', start_time: '', end_time: ''
    });
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        setSchedule(initialSchedule);
    }, [initialSchedule]);

    const openAddDialog = () => {
        setEditingItem(null);
        setNewEntry({ day: 'Senin', class_id: '', subject_id: '', start_time: '', end_time: '' });
        setIsDialogOpen(true);
    }
    
    const openEditDialog = (item: ScheduleItem) => {
        setEditingItem(item);
        setNewEntry({
          day: item.day,
          class_id: item.class_id,
          subject_id: item.subject_id,
          start_time: item.start_time,
          end_time: item.end_time,
        });
        setIsDialogOpen(true);
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.day || !newEntry.class_id || !newEntry.subject_id || !newEntry.start_time || !newEntry.end_time) {
            toast({ title: "Gagal Menyimpan", description: "Semua kolom harus diisi.", variant: "destructive" });
            return;
        }
        setLoading(true);

        const formData = new FormData();
        if(editingItem) formData.append('id', editingItem.id);
        formData.append('day', newEntry.day);
        formData.append('class_id', newEntry.class_id);
        formData.append('subject_id', newEntry.subject_id);
        formData.append('start_time', newEntry.start_time);
        formData.append('end_time', newEntry.end_time);

        const result = await saveSchedule(formData);

        if(result.success) {
            toast({ title: "Jadwal Disimpan", description: "Jadwal baru berhasil ditambahkan."});
            setIsDialogOpen(false);
            setEditingItem(null);
            router.refresh();
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    const handleDelete = async (id: string) => {
        setLoading(true);
        const result = await deleteSchedule(id);
        if(result.success) {
            toast({ title: "Jadwal Dihapus", description: "Satu jadwal telah berhasil dihapus."});
            router.refresh();
        } else {
            toast({ title: "Gagal Menghapus", description: result.error, variant: 'destructive' });
        }
        setLoading(false);
    }

    const groupedSchedule = schedule.reduce((acc, item) => {
        (acc[item.day] = acc[item.day] || []).push(item);
        return acc;
      }, {} as Record<ScheduleItem['day'], ScheduleItem[]>);
    
    for (const day in groupedSchedule) {
        groupedSchedule[day as ScheduleItem['day']].sort((a, b) => a.start_time.localeCompare(b.start_time));
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
                    <Label htmlFor="class_id">
                      Kelas
                    </Label>
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
                    <Label htmlFor="subject_id">
                      Mata Pelajaran
                    </Label>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">
                        Waktu Mulai
                      </Label>
                      <Input id="start_time" type="time" value={newEntry.start_time} onChange={e => setNewEntry({...newEntry, start_time: e.target.value})} required/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">
                        Waktu Selesai
                      </Label>
                      <Input id="end_time" type="time" value={newEntry.end_time} onChange={e => setNewEntry({...newEntry, end_time: e.target.value})} required/>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                  </Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOfWeek.map((day) => (
            (groupedSchedule[day] && groupedSchedule[day].length > 0) ? (
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
                      <p className="text-sm text-muted-foreground">{item.start_time} - {item.end_time}</p>
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
       {schedule.length === 0 && (
            <div className="text-center text-muted-foreground py-12 col-span-full">
                <p>Belum ada jadwal yang dibuat.</p>
                <p className="text-sm">Silakan tambahkan jadwal mengajar Anda.</p>
            </div>
        )}
    </div>
  );
}

export default async function SchedulePage() {
    const { getSchedule, getClasses, getSubjects } = await import("@/lib/data");
    const [schedule, classes, subjects] = await Promise.all([
        getSchedule(),
        getClasses(),
        getSubjects()
    ]);
    return <SchedulePageComponent initialSchedule={schedule} classes={classes} subjects={subjects} />;
}

    