
"use client";

import * as React from "react";
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, addMonths, subMonths, isSameDay, parseISO, startOfDay, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { DayContent, DayPicker } from "react-day-picker";

import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatTime } from "@/lib/utils";
import type { Agenda } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { saveAgenda, deleteAgenda } from "@/lib/actions";
import { ScrollArea } from "@/components/ui/scroll-area";

type NewAgendaEntry = Omit<Agenda, 'id' | 'teacher_id' | 'created_at'>;

// Helper function to determine text color based on background brightness
const getTextColor = (hexColor: string): string => {
  if (!hexColor) return '#ffffff';
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate brightness using luminance formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return white for dark colors, black for light colors
  return brightness > 128 ? '#000000' : '#ffffff';
};

export default function AgendaPageClient({ initialAgendas }: { initialAgendas: Agenda[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [agendas, setAgendas] = React.useState(initialAgendas);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAgenda, setEditingAgenda] = React.useState<Agenda | null>(null);
  const [loading, setLoading] = React.useState(false);
  
  const initialFormState: NewAgendaEntry = {
    date: format(selectedDate, 'yyyy-MM-dd'),
    title: "",
    description: "",
    tag: "",
    color: "#6b7280",
    start_time: "",
    end_time: "",
  };
  const [newAgenda, setNewAgenda] = React.useState<NewAgendaEntry>(initialFormState);

  React.useEffect(() => {
    setAgendas(initialAgendas);
  }, [initialAgendas]);

  // Create a map of dates to their event colors for quick lookup
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, string[]>();
    agendas.forEach(agenda => {
        const dateKey = format(startOfDay(parseISO(agenda.date)), 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
            map.set(dateKey, []);
        }
        // Only add color if it's not null/undefined
        if (agenda.color) {
           const colors = map.get(dateKey);
           // Add color only if it's not already in the array for that day
           if (colors && !colors.includes(agenda.color)) {
               colors.push(agenda.color);
           }
        }
    });
    return map;
  }, [agendas]);

  const CustomDayContent: React.FC<DayContentProps> = (props) => {
    const dateKey = format(startOfDay(props.date), 'yyyy-MM-dd');
    const colors = eventsByDate.get(dateKey) || [];
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <span>{props.date.getDate()}</span>
        {colors.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
            {colors.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };


  const handleOpenAddDialog = () => {
    setEditingAgenda(null);
    setNewAgenda({
      ...initialFormState,
      date: format(selectedDate, 'yyyy-MM-dd'),
      color: '#6b7280'
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (agenda: Agenda) => {
    setEditingAgenda(agenda);
    setNewAgenda({
      title: agenda.title,
      description: agenda.description || '',
      tag: agenda.tag || '',
      color: agenda.color || '#6b7280',
      start_time: formatTime(agenda.start_time || ''),
      end_time: formatTime(agenda.end_time || ''),
      date: agenda.date,
    });
    setIsDialogOpen(true);
  };
  
  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgenda.title || !newAgenda.date) {
        toast({ title: "Gagal", description: "Judul dan Tanggal wajib diisi.", variant: "destructive"});
        return;
    }
    setLoading(true);

    const formData = new FormData();
    if (editingAgenda) formData.append('id', editingAgenda.id);
    formData.append('date', newAgenda.date);
    formData.append('title', newAgenda.title);
    if (newAgenda.description) formData.append('description', newAgenda.description);
    if (newAgenda.tag) formData.append('tag', newAgenda.tag);
    if (newAgenda.color) formData.append('color', newAgenda.color);
    if (newAgenda.start_time) formData.append('start_time', newAgenda.start_time);
    if (newAgenda.end_time) formData.append('end_time', newAgenda.end_time);

    const result = await saveAgenda(formData);

    if (result.success) {
        toast({ title: "Sukses", description: `Agenda berhasil ${editingAgenda ? 'diperbarui' : 'disimpan'}.` });
        setIsDialogOpen(false);
        router.refresh();
    } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  }

  const handleDeleteAgenda = async (agendaId: string) => {
    setLoading(true);
    const result = await deleteAgenda(agendaId);
    if (result.success) {
        toast({ title: "Sukses", description: "Agenda berhasil dihapus." });
        router.refresh();
    } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  }
  
  const handleDateSelect = (day: Date | undefined) => {
    if (day) {
        setSelectedDate(day);
        setNewAgenda(prev => ({...prev, date: format(day, 'yyyy-MM-dd')}));
    }
  }

  const eventsForSelectedDate = agendas.filter(agenda => isSameDay(parseISO(agenda.date), selectedDate));

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-2xl font-bold font-headline">Agenda</h1>
                <p className="text-muted-foreground">Kelola jadwal, rapat, dan pengingat pribadi Anda.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleOpenAddDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Agenda
                    </Button>
                </DialogTrigger>
                <DialogContent className="dialog-content-mobile mobile-safe-area">
                    <form onSubmit={handleSaveAgenda}>
                        <DialogHeader>
                            <DialogTitle>{editingAgenda ? 'Ubah Agenda' : 'Tambah Agenda Baru'}</DialogTitle>
                            <DialogDescription>
                                Isi detail acara atau pengingat Anda di bawah ini.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Judul Agenda</Label>
                                <Input id="title" value={newAgenda.title} onChange={e => setNewAgenda({...newAgenda, title: e.target.value})} placeholder="e.g. Rapat Persiapan Ujian" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                                <Textarea id="description" value={newAgenda.description || ''} onChange={e => setNewAgenda({...newAgenda, description: e.target.value})} placeholder="e.g. Membahas teknis pelaksanaan ujian akhir semester."/>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_time">Waktu Mulai</Label>
                                    <Input id="start_time" type="time" value={newAgenda.start_time || ''} onChange={e => setNewAgenda({...newAgenda, start_time: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_time">Waktu Selesai</Label>
                                    <Input id="end_time" type="time" value={newAgenda.end_time || ''} onChange={e => setNewAgenda({...newAgenda, end_time: e.target.value})} />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="tag">Tag/Kategori (Opsional)</Label>
                                <Input id="tag" value={newAgenda.tag || ''} onChange={e => setNewAgenda({...newAgenda, tag: e.target.value})} placeholder="e.g. RAPAT"/>
                            </div>
                            <div className="space-y-2">
                                <Label>Warna Tag</Label>
                                <div className="grid grid-cols-8 gap-2">
                                    {[
                                        { color: '#6b7280', name: 'Abu-abu' },
                                        { color: '#3b82f6', name: 'Biru' },
                                        { color: '#ef4444', name: 'Merah' },
                                        { color: '#10b981', name: 'Hijau' },
                                        { color: '#f59e0b', name: 'Kuning' },
                                        { color: '#8b5cf6', name: 'Ungu' },
                                        { color: '#ec4899', name: 'Pink' },
                                        { color: '#6366f1', name: 'Indigo' }
                                    ].map((colorOption) => (
                                        <button
                                            key={colorOption.color}
                                            type="button"
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                newAgenda.color === colorOption.color 
                                                    ? 'border-primary shadow-md ring-2 ring-primary ring-offset-2' 
                                                    : 'border-transparent hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: colorOption.color }}
                                            onClick={() => setNewAgenda({...newAgenda, color: colorOption.color})}
                                            title={colorOption.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={loading}>Batal</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Agenda
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid md:grid-cols-7 md:gap-6 md:items-start">
            <Card className="p-3 sm:p-4 shadow-sm md:col-span-4 lg:col-span-3">
                <DayPicker
                    locale={id}
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    components={{ DayContent: CustomDayContent }}
                    classNames={{
                      root: "w-full",
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-lg font-bold font-headline",
                      nav: "space-x-1 flex items-center",
                      nav_button: cn(
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                      ),
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                      day: "h-9 w-full p-0 font-normal aria-selected:opacity-100",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
                      day_today: "bg-accent text-accent-foreground rounded-full",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                    }}
                />
            </Card>
      
            <Card className="shadow-sm md:col-span-3 lg:col-span-4 mt-6 md:mt-0 h-full max-h-[500px] flex flex-col">
                 <CardHeader>
                    <h3 className="text-xl font-bold font-headline" suppressHydrationWarning>Agenda untuk {format(selectedDate, 'eeee, dd MMMM yyyy', {locale: id})}</h3>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                        {eventsForSelectedDate.length > 0 ? (
                        eventsForSelectedDate.map((event) => (
                            <div 
                                key={event.id} 
                                className="p-4 flex flex-col gap-3 rounded-lg border-l-4" 
                                style={{
                                    backgroundColor: `${event.color || '#6b7280'}1A`, // 10% opacity
                                    borderLeftColor: event.color || '#6b7280'
                                }}
                            >
                                <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{event.title}</h3>
                                    {event.start_time && 
                                        <p className="text-sm text-muted-foreground">
                                            {formatTime(event.start_time)} {event.end_time && `- ${formatTime(event.end_time)}`}
                                        </p>
                                    }
                                </div>
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenEditDialog(event)}>
                                                <Edit className="mr-2 h-4 w-4" /> Ubah
                                            </DropdownMenuItem>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Agenda?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Anda yakin ingin menghapus agenda <span className="font-semibold">&quot;{event.title}&quot;</span>? Tindakan ini tidak dapat dibatalkan.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteAgenda(event.id)} className="bg-destructive hover:bg-destructive/90">
                                                Ya, Hapus
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                                {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                                {event.tag && (
                                    <Badge 
                                        variant="outline" 
                                        className="w-fit border-0" 
                                        style={{
                                            backgroundColor: event.color || '#6b7280',
                                            color: getTextColor(event.color || '#6b7280')
                                        }}
                                    >
                                        {event.tag}
                                    </Badge>
                                )}
                            </div>
                        ))
                        ) : (
                        <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center py-16 border-2 border-dashed rounded-lg">
                            <p>Tidak ada agenda untuk tanggal ini.</p>
                            <p className="text-sm">Klik tombol "Tambah Agenda" untuk membuat yang baru.</p>
                        </div>
                        )}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
      </div>
    </div>
  );
}
