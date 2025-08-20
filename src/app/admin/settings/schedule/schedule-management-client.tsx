
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
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2, Calendar, Clock, BookOpen, Users, User, CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { ScheduleItem, Class, Subject, Profile } from "@/lib/types";
import { saveSchedule, deleteSchedule } from "@/lib/actions/admin";
import { formatTime } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const daysOfWeek: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

type NewScheduleEntry = Omit<ScheduleItem, 'id' | 'subject' | 'class'>;

export default function ScheduleManagementClient({
    teachers,
    classes,
    subjects,
    initialSchedule,
} : {
    teachers: Profile[],
    classes: Class[],
    subjects: Subject[],
    initialSchedule: ScheduleItem[],
}) {
    const router = useRouter();
    const [schedule, setSchedule] = React.useState<ScheduleItem[]>(initialSchedule);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<ScheduleItem | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = React.useState<string>(teachers.length > 0 ? teachers[0].id : "");
    const [newEntry, setNewEntry] = React.useState<NewScheduleEntry>({
        day: 'Senin', class_id: '', subject_id: '', start_time: '', end_time: '', teacher_id: ''
    });
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        setSchedule(initialSchedule);
    }, [initialSchedule]);

    const openAddDialog = () => {
        if (!selectedTeacherId) {
            toast({ title: "Pilih Guru", description: "Silakan pilih guru terlebih dahulu sebelum menambahkan jadwal.", variant: "destructive" });
            return;
        }
        setEditingItem(null);
        setNewEntry({ day: 'Senin', class_id: '', subject_id: '', start_time: '', end_time: '', teacher_id: selectedTeacherId });
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
          teacher_id: item.teacher_id,
        });
        setIsDialogOpen(true);
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.day || !newEntry.class_id || !newEntry.subject_id || !newEntry.start_time || !newEntry.end_time || !newEntry.teacher_id) {
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
        formData.append('teacher_id', newEntry.teacher_id);

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

    const filteredSchedule = React.useMemo(() => {
        return schedule.filter(item => item.teacher_id === selectedTeacherId);
    }, [schedule, selectedTeacherId]);

    const groupedSchedule = filteredSchedule.reduce((acc, item) => {
        const classInfo = classes.find(c => c.id === item.class_id);
        const subjectInfo = subjects.find(s => s.id === item.subject_id);
        
        const scheduleWithNames = {
            ...item,
            class: classInfo?.name || 'N/A',
            subject: subjectInfo?.name || 'N/A',
        };

        (acc[item.day] = acc[item.day] || []).push(scheduleWithNames);
        return acc;
      }, {} as Record<ScheduleItem['day'], ScheduleItem[]>);
    
    for (const day in groupedSchedule) {
        groupedSchedule[day as ScheduleItem['day']].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline">Kelola Jadwal Guru</h1>
            <p className="text-muted-foreground">Atur jadwal mengajar untuk setiap guru secara terpusat.</p>
          </div>
        </div>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Pilih Guru</CardTitle>
            <CardDescription>Pilih guru untuk melihat atau mengubah jadwal mengajarnya.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Pilih seorang guru..." />
                    </SelectTrigger>
                    <SelectContent>
                        {teachers.map(teacher => (
                             <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button onClick={openAddDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Jadwal untuk Guru Ini
                </Button>
            </div>
        </CardContent>
       </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg dialog-content-mobile mobile-safe-area">
          <form onSubmit={handleSave}>
            <DialogHeader>
                <DialogTitle>{editingItem ? 'Ubah Jadwal' : 'Tambah Jadwal Baru'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Perbarui informasi jadwal mengajar.' : 'Isi detail jadwal mengajar yang baru.'}
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
                <div className="grid gap-4 py-4">
                   <div className="space-y-2">
                        <Label>Guru</Label>
                        <Input value={teachers.find(t => t.id === selectedTeacherId)?.full_name} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="day">Hari</Label>
                        <Select value={newEntry.day} onValueChange={(value: ScheduleItem['day']) => setNewEntry({...newEntry, day: value})} required>
                            <SelectTrigger id="day"><SelectValue placeholder="Pilih hari" /></SelectTrigger>
                            <SelectContent>{daysOfWeek.map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="class_id">Kelas</Label>
                        <Select value={newEntry.class_id} onValueChange={(value) => setNewEntry({...newEntry, class_id: value})} required>
                            <SelectTrigger id="class_id"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
                            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject_id">Mata Pelajaran</Label>
                        <Select value={newEntry.subject_id} onValueChange={(value) => setNewEntry({...newEntry, subject_id: value})} required>
                            <SelectTrigger id="subject_id"><SelectValue placeholder="Pilih mata pelajaran" /></SelectTrigger>
                            <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Waktu Mulai</Label>
                            <Input id="start_time" type="time" value={newEntry.start_time} onChange={e => setNewEntry({...newEntry, start_time: e.target.value})} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_time">Waktu Selesai</Label>
                            <Input id="end_time" type="time" value={newEntry.end_time} onChange={e => setNewEntry({...newEntry, end_time: e.target.value})} required/>
                        </div>
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? 'Perbarui' : 'Simpan'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {daysOfWeek.map((day) => (
            (groupedSchedule[day] && groupedSchedule[day].length > 0) ? (
            <Card key={day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedSchedule[day].map((item) => (
                  <div key={item.id} className="relative p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{item.subject}</p>
                        <p className="text-sm text-muted-foreground">{item.class}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(item.start_time)} - {formatTime(item.end_time)}</p>
                      </div>
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}><Edit className="mr-2 h-4 w-4"/> Ubah</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/> Hapus</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Anda yakin ingin menghapus jadwal ini?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null
        ))}
      </div>
      
      {filteredSchedule.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
            <p>Belum ada jadwal untuk guru ini.</p>
        </div>
      )}
    </div>
  );
}
