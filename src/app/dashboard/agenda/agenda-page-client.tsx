
"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from "next/navigation";

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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Agenda } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { saveAgenda, deleteAgenda } from "@/lib/actions";

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
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
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

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: false,
    slidesToScroll: 1,
    skipSnaps: false,
    duration: 25,
    startIndex: 0,
  });

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
        emblaApi.off("select", onSelect);
        emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  React.useEffect(() => {
    setAgendas(initialAgendas);
  }, [initialAgendas]);

  const daysInMonth = React.useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  // Add scroll listener to update selected date when user scrolls manually
  const isScrollingRef = React.useRef(false);
  
  React.useEffect(() => {
    if (!emblaApi || !daysInMonth.length) return;
    
    const onScroll = () => {
      if (isScrollingRef.current) return; // Prevent infinite loop
      
      const selectedIndex = emblaApi.selectedScrollSnap();
      const targetDate = daysInMonth[selectedIndex];
      if (targetDate && !isSameDay(targetDate, selectedDate)) {
        isScrollingRef.current = true;
        setSelectedDate(targetDate);
        setNewAgenda(prev => ({ ...prev, date: format(targetDate, 'yyyy-MM-dd') }));
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 100);
      }
    };
    
    emblaApi.on("scroll", onScroll);
    
    return () => {
        emblaApi.off("scroll", onScroll);
    };
  }, [emblaApi, daysInMonth, selectedDate]);

  const scrollPrev = React.useCallback(() => {
    if (!emblaApi) return;
    const currentIndex = daysInMonth.findIndex(day => isSameDay(day, selectedDate));
    const targetIndex = Math.max(0, currentIndex - 1);
    const targetDate = daysInMonth[targetIndex];
    if (targetDate) {
      setSelectedDate(targetDate);
      emblaApi.scrollTo(targetIndex, true);
    } else {
      emblaApi.scrollPrev(true);
    }
  }, [emblaApi, daysInMonth, selectedDate]);

  const scrollNext = React.useCallback(() => {
    if (!emblaApi) return;
    const currentIndex = daysInMonth.findIndex(day => isSameDay(day, selectedDate));
    const targetIndex = Math.min(daysInMonth.length - 1, currentIndex + 1);
    const targetDate = daysInMonth[targetIndex];
    if (targetDate) {
      setSelectedDate(targetDate);
      emblaApi.scrollTo(targetIndex, true);
    } else {
      emblaApi.scrollNext(true);
    }
  }, [emblaApi, daysInMonth, selectedDate]);

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    // If selected date is not in the new month, update it to the first day
    if (!isSameMonth(selectedDate, newMonth)) {
        setSelectedDate(startOfMonth(newMonth));
    }
  };
  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    if (!isSameMonth(selectedDate, newMonth)) {
        setSelectedDate(startOfMonth(newMonth));
    }
  };

  const handleDateSelect = (day: Date) => {
      setSelectedDate(day);
      setNewAgenda(prev => ({ ...prev, date: format(day, 'yyyy-MM-dd') }));
      
      // Scroll to the selected date with smooth animation
      if (emblaApi) {
        const targetIndex = daysInMonth.findIndex(date => isSameDay(date, day));
        if (targetIndex !== -1) {
          emblaApi.scrollTo(targetIndex, true);
        }
      }
  }

  // Scroll to selected date when month changes or date is selected
  React.useEffect(() => {
    if (emblaApi && !isScrollingRef.current) {
        const targetIndex = daysInMonth.findIndex(day => isSameDay(day, selectedDate));
        if (targetIndex !== -1) {
            isScrollingRef.current = true;
            emblaApi.scrollTo(targetIndex, true); // Use snap-to-slide
            setTimeout(() => {
              isScrollingRef.current = false;
            }, 100);
        } else if (daysInMonth.length > 0) {
            isScrollingRef.current = true;
            emblaApi.scrollTo(0, true);
            setTimeout(() => {
              isScrollingRef.current = false;
            }, 100);
        }
        onSelect(); // Update button states after scrolling
    }
  }, [selectedDate, daysInMonth, emblaApi, onSelect]);


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
      start_time: agenda.start_time || '',
      end_time: agenda.end_time || '',
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
                                                    ? 'border-gray-900 scale-110 shadow-md' 
                                                    : 'border-gray-300 hover:scale-105'
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

      <Card className="p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold font-headline" suppressHydrationWarning>
            {format(currentMonth, 'MMMM yyyy', { locale: id })}
          </h2>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 sm:h-10 sm:w-10">
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 sm:h-10 sm:w-10">
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Button 
            variant="outline" 
            size="icon" 
            className={cn("absolute -left-4 top-1/2 -translate-y-1/2 z-10 my-auto h-8 w-8 rounded-full shadow-md", !canScrollPrev && "opacity-0 cursor-default")}
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className={cn("absolute -right-4 top-1/2 -translate-y-1/2 z-10 my-auto h-8 w-8 rounded-full shadow-md", !canScrollNext && "opacity-0 cursor-default")}
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        
          <div className="embla overflow-hidden mx-6 smooth-scroll" ref={emblaRef}>
            <div className="embla__container flex gap-2 pb-1">
              {daysInMonth.map((day, index) => (
                <div key={index} className="embla__slide flex-none w-16 p-1">
                  <button
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      "date-button flex flex-col items-center justify-center rounded-lg sm:rounded-xl w-full h-20 p-2",
                      isSameDay(day, selectedDate)
                        ? "selected bg-primary text-primary-foreground shadow-md"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    <span className="text-xs uppercase font-medium leading-none whitespace-nowrap" suppressHydrationWarning>
                      {format(day, "EEE", { locale: id })}
                    </span>
                    <span className="mt-1 text-2xl leading-none font-bold">
                      {format(day, "d")}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-headline" suppressHydrationWarning>Agenda untuk {format(selectedDate, 'eeee, dd MMMM yyyy', {locale: id})}</h3>
        <div className="space-y-4">
            {eventsForSelectedDate.length > 0 ? (
            eventsForSelectedDate.map((event) => (
                <Card 
                    key={event.id} 
                    className="p-4 flex flex-col gap-3 shadow-sm border-l-4" 
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
                                {event.start_time} {event.end_time && `- ${event.end_time}`}
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
                </Card>
            ))
            ) : (
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <p>Tidak ada agenda untuk tanggal ini.</p>
                <p className="text-sm">Klik tombol "Tambah Agenda" untuk membuat yang baru.</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
