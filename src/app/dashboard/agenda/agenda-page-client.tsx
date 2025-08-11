
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
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
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
    start_time: "",
    end_time: "",
  };
  const [newAgenda, setNewAgenda] = React.useState<NewAgendaEntry>(initialFormState);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
        emblaApi.off('select', onSelect);
    }
  }, [emblaApi, onSelect]);

  React.useEffect(() => {
    setAgendas(initialAgendas);
  }, [initialAgendas]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const daysInMonth = React.useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  // Auto scroll to selected date when embla is ready or month changes
  React.useEffect(() => {
    if (!emblaApi) return;
    
    const targetIndex = daysInMonth.findIndex(day => isSameDay(day, selectedDate));
    if (targetIndex !== -1) {
      emblaApi.scrollTo(targetIndex, true); // instant scroll
    } else {
      emblaApi.scrollTo(0, true); // scroll to beginning if selected date not in month
    }
    onSelect(); // Recalculate canScroll
  }, [emblaApi, daysInMonth, selectedDate, onSelect]);


  // Update currentMonth when selectedDate changes to different month
  React.useEffect(() => {
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    const currentMonthValue = currentMonth.getMonth();
    const currentYear = currentMonth.getFullYear();
    
    if (selectedMonth !== currentMonthValue || selectedYear !== currentYear) {
      setCurrentMonth(new Date(selectedYear, selectedMonth, 1));
    }
  }, [selectedDate, currentMonth]);

  const handleDateSelect = (day: Date) => {
      setSelectedDate(day);
      setNewAgenda(prev => ({ ...prev, date: format(day, 'yyyy-MM-dd') }));
  }

  const handleOpenAddDialog = () => {
    setEditingAgenda(null);
    setNewAgenda({
      ...initialFormState,
      date: format(selectedDate, 'yyyy-MM-dd'),
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (agenda: Agenda) => {
    setEditingAgenda(agenda);
    setNewAgenda({
      date: agenda.date,
      title: agenda.title,
      description: agenda.description || "",
      tag: agenda.tag || "",
      start_time: agenda.start_time || "",
      end_time: agenda.end_time || "",
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
                <DialogContent>
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

      <Card className="p-3 sm:p-4 shadow-sm max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 sm:h-10 sm:w-10">
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h2 className="text-base sm:text-lg font-semibold font-headline text-center" suppressHydrationWarning>
            {format(currentMonth, 'MMMM yyyy', { locale: id })}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 sm:h-10 sm:w-10">
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        <div className="relative w-full px-8 sm:px-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border flex items-center justify-center",
              !canScrollPrev && "opacity-30 cursor-not-allowed"
            )}
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border flex items-center justify-center",
              !canScrollNext && "opacity-30 cursor-not-allowed"
            )}
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          <div className="overflow-hidden w-full max-w-full" ref={emblaRef}>
            <div className="flex gap-1 sm:gap-2 -ml-2">
              {daysInMonth.map((day) => (
                <div 
                  key={day.toString()} 
                  className="pl-2 basis-[16%] sm:basis-[14%] md:basis-[11%] lg:basis-[9%] shrink-0 grow-0"
                >
                  <button
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 w-full",
                      "h-12 sm:h-14 md:h-16 p-1 sm:p-2",
                      isSameDay(day, selectedDate)
                        ? "bg-primary text-white shadow-md transform-gpu scale-105"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:scale-102"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs uppercase font-medium leading-none whitespace-nowrap",
                        isSameDay(day, selectedDate) ? "text-white/80" : "text-muted-foreground"
                      )}
                      suppressHydrationWarning
                    >
                      {format(day, "EEE", { locale: id })}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 sm:mt-1 leading-none font-semibold",
                        "text-xs sm:text-sm md:text-base",
                        isSameDay(day, selectedDate) ? "text-sm sm:text-base md:text-lg" : "text-xs sm:text-sm md:text-base"
                      )}
                    >
                      {format(day, "dd")}
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
                <Card key={event.id} className="p-4 flex flex-col gap-3 shadow-sm bg-muted/30">
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
                    {event.tag && <Badge variant="outline" className="w-fit">{event.tag}</Badge>}
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
