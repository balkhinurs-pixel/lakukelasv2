
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
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2, Calendar, Clock, BookOpen } from "lucide-react";
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
import { formatTime } from "@/lib/utils";

const daysOfWeek: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

type NewScheduleEntry = Omit<ScheduleItem, 'id' | 'teacher_id' | 'subject' | 'class'>;

export default function SchedulePageComponent({
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
    <div className="space-y-8 p-1">
      {/* Enhanced Header Section */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-3xl -z-10" />
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Kelola Jadwal
                </h1>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-1" />
              </div>
            </div>
            <p className="text-muted-foreground/80 ml-14">
              Atur dan kelola jadwal mengajar mingguan Anda dengan mudah dan efisien.
            </p>
          </div>
          
          <Button 
            onClick={openAddDialog}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            size="lg"
          >
            <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Tambah Jadwal
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg dialog-content-mobile mobile-safe-area bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <form onSubmit={handleSave}>
            <DialogHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 via-purple-100 to-blue-100 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-blue-950/30 rounded-2xl flex items-center justify-center shadow-lg">
                {editingItem ? (
                  <Edit className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                ) : (
                  <PlusCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingItem ? 'Ubah Jadwal' : 'Tambah Jadwal Baru'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                  {editingItem ? 'Perbarui informasi jadwal mengajar.' : 'Isi detail jadwal mengajar yang baru.'}
                </DialogDescription>
              </div>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="space-y-3">
                <Label htmlFor="day" className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Hari
                </Label>
                <Select value={newEntry.day} onValueChange={(value: ScheduleItem['day']) => setNewEntry({...newEntry, day: value})} required>
                  <SelectTrigger id="day" className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-500 transition-all duration-200">
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-2xl">
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day} className="rounded-lg m-1">
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="class_id" className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  Kelas
                </Label>
                <Select value={newEntry.class_id} onValueChange={(value) => setNewEntry({...newEntry, class_id: value})} required>
                  <SelectTrigger id="class_id" className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 focus:border-purple-500 transition-all duration-200">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-2xl">
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="rounded-lg m-1">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="subject_id" className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  Mata Pelajaran
                </Label>
                <Select value={newEntry.subject_id} onValueChange={(value) => setNewEntry({...newEntry, subject_id: value})} required>
                  <SelectTrigger id="subject_id" className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 focus:border-green-500 transition-all duration-200">
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-2xl">
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg m-1">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="start_time" className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Waktu Mulai
                  </Label>
                  <Input 
                    id="start_time" 
                    type="time" 
                    value={newEntry.start_time} 
                    onChange={e => setNewEntry({...newEntry, start_time: e.target.value})} 
                    required
                    className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 focus:border-orange-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="end_time" className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    Waktu Selesai
                  </Label>
                  <Input 
                    id="end_time" 
                    type="time" 
                    value={newEntry.end_time} 
                    onChange={e => setNewEntry({...newEntry, end_time: e.target.value})} 
                    required
                    className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 focus:border-red-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="sm:flex-1 h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 rounded-xl"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="sm:flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {daysOfWeek.map((day, dayIndex) => (
            (groupedSchedule[day] && groupedSchedule[day].length > 0) ? (
            <Card 
              key={day} 
              className="group bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden"
              style={{
                animationDelay: `${dayIndex * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Card gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    {day}
                  </CardTitle>
                </div>
                <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </CardHeader>
              
              <CardContent className="space-y-3 relative z-10">
                {groupedSchedule[day].map((item, itemIndex) => (
                  <div 
                    key={item.id} 
                    className="group/item relative p-4 rounded-2xl bg-gradient-to-br from-white/80 to-gray-50/50 dark:from-gray-800/80 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm"
                    style={{
                      animationDelay: `${dayIndex * 100 + itemIndex * 50}ms`,
                      animation: 'slideInLeft 0.5s ease-out forwards'
                    }}
                  >
                    {/* Item gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="font-bold text-gray-900 dark:text-gray-100 group-hover/item:text-blue-700 dark:group-hover/item:text-blue-300 transition-colors duration-300">
                            {item.subject}
                          </p>
                        </div>
                        
                        <div className="space-y-1 ml-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-purple-500 rounded-full" />
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                              {item.class}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover/item:text-foreground transition-colors duration-300">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                          </div>
                        </div>
                      </div>
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 hover:scale-110 hover:shadow-md backdrop-blur-sm opacity-0 group-hover/item:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="w-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl p-2"
                          >
                            <DropdownMenuItem 
                              onClick={() => openEditDialog(item)}
                              className="rounded-xl p-3 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200 cursor-pointer group/edit"
                            >
                              <Edit className="mr-3 h-4 w-4 text-blue-600 dark:text-blue-400 group-hover/edit:scale-110 transition-transform duration-200" />
                              <span className="font-medium">Ubah</span>
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="rounded-xl p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200 cursor-pointer group/delete">
                                <Trash2 className="mr-3 h-4 w-4 group-hover/delete:scale-110 transition-transform duration-200" />
                                <span className="font-medium">Hapus</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <AlertDialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
                          <AlertDialogHeader className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-950/30 dark:to-orange-950/30 rounded-2xl flex items-center justify-center">
                              <Trash2 className="h-8 w-8 text-red-500" />
                            </div>
                            <AlertDialogTitle className="text-xl font-bold">Konfirmasi Penghapusan</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
                              Apakah Anda yakin ingin menghapus jadwal <span className="font-semibold text-foreground">{item.subject}</span> di kelas <span className="font-semibold text-foreground">{item.class}</span> pada hari <span className="font-semibold text-foreground">{item.day}</span>?
                              <br />
                              <span className="text-sm text-red-500 dark:text-red-400 mt-2 block">Tindakan ini tidak dapat dibatalkan.</span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                            <AlertDialogCancel className="sm:flex-1 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(item.id)} 
                              className="sm:flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              Ya, Hapus
                            </AlertDialogAction>
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
      
      {/* Enhanced Empty State */}
      {schedule.length === 0 && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 via-purple-100 to-blue-100 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-blue-950/30 rounded-3xl flex items-center justify-center shadow-lg">
              <Calendar className="w-12 h-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Belum Ada Jadwal
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Mulai buat jadwal mengajar Anda untuk mengatur aktivitas pembelajaran dengan lebih efisien.
            </p>
            <Button 
              onClick={openAddDialog}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Buat Jadwal Pertama
            </Button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
