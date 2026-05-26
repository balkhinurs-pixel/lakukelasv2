
"use client";

import * as React from "react";
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Clock,
  Tag,
  AlignLeft,
  Palette,
  Sparkles,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronRight,
  Info
} from "lucide-react";
import { format, isSameDay, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { DayPicker, DayContentProps } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatTime } from "@/lib/utils";
import type { Agenda } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { saveAgenda, deleteAgenda } from "@/lib/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LottieCalendar } from "@/components/ui/lottie-calendar";
import { LottieSchoolHoliday } from "@/components/ui/lottie-school-holiday";

interface IndonesianHoliday {
    date: string;
    name: string;
    type: 'national' | 'school';
    is_holiday: boolean;
}

type NewAgendaEntry = Omit<Agenda, 'id' | 'teacher_id' | 'created_at'>;

const getTextColor = (hexColor: string): string => {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }: any) => (
    <Card className="border-0 shadow-sm rounded-[2rem] bg-white group hover:shadow-md transition-all">
        <CardContent className="p-5 flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl shrink-0 group-hover:scale-110 transition-transform", bgColor, color)}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <p className="text-xl font-black text-slate-900 leading-none mt-1">{value}</p>
                <p className="text-[9px] text-slate-500 font-bold mt-1 truncate">{subtitle}</p>
            </div>
        </CardContent>
    </Card>
);

export default function AgendaPageClient({ 
    initialAgendas,
    indonesianHolidays = []
}: { 
    initialAgendas: Agenda[],
    indonesianHolidays?: IndonesianHoliday[]
}) {
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
    color: "#4f46e5",
    start_time: "",
    end_time: "",
  };
  const [newAgenda, setNewAgenda] = React.useState<NewJournalEntry>(initialFormState);

  React.useEffect(() => {
    setAgendas(initialAgendas);
  }, [initialAgendas]);

  // Statistics Calculation
  const stats = React.useMemo(() => {
      const now = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const thisMonth = agendas.filter(a => {
          const d = parseISO(a.date);
          return d >= monthStart && d <= monthEnd;
      });

      const upcoming = agendas.filter(a => isAfter(parseISO(a.date), now) || isSameDay(parseISO(a.date), now));
      const finished = agendas.filter(a => isBefore(parseISO(a.date), now) && !isSameDay(parseISO(a.date), now));

      return {
          total: agendas.length,
          thisMonth: thisMonth.length,
          upcoming: upcoming.length,
          finished: finished.length
      };
  }, [agendas, currentMonth]);

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, string[]>();
    agendas.forEach(agenda => {
        const dateKey = agenda.date;
        if (!map.has(dateKey)) {
            map.set(dateKey, []);
        }
        if (agenda.color) {
           const colors = map.get(dateKey);
           if (colors && !colors.includes(agenda.color)) {
               colors.push(agenda.color);
           }
        }
    });
    return map;
  }, [agendas]);

  const CustomDayContent = (props: DayContentProps) => {
    const dateKey = format(props.date, 'yyyy-MM-dd');
    const colors = eventsByDate.get(dateKey) || [];
    const holiday = indonesianHolidays.find(h => h.date === dateKey);
    const isSelected = isSameDay(props.date, selectedDate);

    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <span className={cn(
            "relative z-10 transition-colors duration-200 font-bold text-sm",
            isSelected ? "text-white" : 
            holiday?.type === 'national' ? "text-rose-600" : 
            holiday?.type === 'school' ? "text-indigo-600" : "text-slate-700"
        )}>
            {props.date.getDate()}
        </span>
        
        {holiday && (
            <div className={cn(
                "absolute top-1 right-1 w-1.5 h-1.5 rounded-full shadow-sm",
                isSelected ? "bg-white" : (holiday.type === 'national' ? "bg-rose-500" : "bg-indigo-500")
            )} />
        )}

        {colors.length > 0 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
            {colors.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className={cn("h-1 w-1 rounded-full", isSelected && "bg-white/80")}
                style={{ backgroundColor: isSelected ? undefined : color }}
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
      color: '#4f46e5'
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (agenda: Agenda) => {
    setEditingAgenda(agenda);
    setNewAgenda({
      title: agenda.title,
      description: agenda.description || '',
      tag: agenda.tag || '',
      color: agenda.color || '#4f46e5',
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
        toast({ title: "Sukses", description: `Agenda berhasil ${editingAgenda ? 'diperbarui' : 'didisimpan'}.` });
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

  const eventsForSelectedDate = agendas.filter(agenda => agenda.date === format(selectedDate, 'yyyy-MM-dd'));
  const holidayForDate = indonesianHolidays.find(h => h.date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="space-y-6 pb-24">
        {/* 1. Hero Header Section */}
        <div className="relative overflow-hidden bg-white rounded-[32px] p-6 sm:p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-3xl rounded-full -mr-20 -mt-20" />
            <div className="space-y-4 text-center md:text-left flex-1 relative z-10">
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">
                    <span>🗓️</span>
                    <span>Sistem Penjadwalan</span>
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Agenda Guru
                    </h1>
                    <p className="text-slate-500 text-sm sm:text-base font-bold leading-relaxed max-w-lg">
                        Pantau hari libur dan kelola pengingat agenda Anda dalam satu kalender cerdas.
                    </p>
                </div>
                <div className="pt-4">
                    <Button 
                        onClick={handleOpenAddDialog}
                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 gap-2"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Tambah Agenda
                    </Button>
                </div>
            </div>
            <div className="w-40 h-40 sm:w-56 sm:h-56 shrink-0 relative flex items-center justify-center">
                 <div className="absolute inset-0 bg-indigo-100/40 rounded-full blur-3xl animate-pulse" />
                 <LottieCalendar size={200} />
            </div>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
            <StatCard 
                title="Total Agenda" 
                value={stats.total} 
                subtitle="Seluruh tahun ajaran" 
                icon={CalendarIcon} 
                color="text-indigo-600" 
                bgColor="bg-indigo-50" 
            />
            <StatCard 
                title="Bulan Ini" 
                value={stats.thisMonth} 
                subtitle={format(currentMonth, 'MMMM yyyy', { locale: id })} 
                icon={TrendingUp} 
                color="text-emerald-600" 
                bgColor="bg-emerald-50" 
            />
            <StatCard 
                title="Akan Datang" 
                value={stats.upcoming} 
                subtitle="Terjadwal di depan" 
                icon={Sparkles} 
                color="text-blue-600" 
                bgColor="bg-blue-50" 
            />
            <StatCard 
                title="Selesai" 
                value={stats.finished} 
                subtitle="Arsip agenda lampau" 
                icon={CheckCircle2} 
                color="text-amber-600" 
                bgColor="bg-amber-50" 
            />
        </div>

        {/* 3. Main Content: Calendar & List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-1">
            {/* Calendar Column */}
            <Card className="lg:col-span-5 p-6 bg-white border-0 shadow-xl rounded-[2.5rem] overflow-hidden">
                <DayPicker
                    locale={id}
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    components={{ DayContent: CustomDayContent }}
                    className="w-full flex justify-center"
                    classNames={{
                        root: "w-full",
                        months: "w-full",
                        month: "space-y-6 w-full",
                        caption: "flex justify-between pt-1 relative items-center px-2 mb-4",
                        caption_label: "text-xl font-black text-slate-800",
                        nav: "flex items-center gap-1",
                        nav_button: cn(
                           "h-9 w-9 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-center border-0 shadow-sm"
                        ),
                        table: "w-full border-collapse",
                        head_row: "flex w-full justify-between mb-4 border-b border-slate-50 pb-4",
                        head_cell: "text-slate-300 rounded-md w-9 font-black text-[0.65rem] uppercase tracking-[0.2em] text-center flex-1",
                        row: "flex w-full mt-2 justify-between",
                        cell: "h-12 w-full text-center p-0 relative flex-1 flex justify-center items-center",
                        day: cn(
                          "h-11 w-11 p-0 font-bold transition-all duration-200 rounded-2xl hover:bg-indigo-50/50"
                        ),
                        day_selected: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 scale-110 z-10",
                        day_today: "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100 ring-offset-2",
                        day_outside: "text-slate-200 opacity-50",
                        day_disabled: "text-slate-200 opacity-50",
                    }}
                />

                {/* Legend Section */}
                <div className="mt-10 pt-6 border-t border-slate-50 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Keterangan Kalender</p>
                    <div className="grid grid-cols-2 gap-y-3 px-2">
                      <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-sm shadow-rose-500/30" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Libur Nasional</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm shadow-indigo-500/30" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Libur Sekolah</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-sm shadow-indigo-100 border border-white" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agenda Anda</span>
                      </div>
                    </div>
                </div>
            </Card>
      
            {/* Agenda List Column */}
            <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center justify-between px-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight" suppressHydrationWarning>
                                {format(selectedDate, 'eeee, d MMMM yyyy', {locale: id})}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Daftar Kegiatan</p>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={format(selectedDate, 'yyyy-MM-dd')}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {holidayForDate && (
                        <div className={cn(
                            "p-5 rounded-[2rem] border-2 flex items-center gap-5 shadow-sm transition-all hover:shadow-md",
                            holidayForDate.type === 'national' ? "bg-rose-50/50 border-rose-100" : "bg-indigo-50/50 border-indigo-100"
                        )}>
                            <div className="shrink-0 flex items-center justify-center">
                                {holidayForDate.type === 'national' ? <LottieCalendar size={60} /> : <LottieSchoolHoliday size={60} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <Badge variant="outline" className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-0 mb-1.5",
                                    holidayForDate.type === 'national' ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
                                )}>
                                    {holidayForDate.type === 'national' ? 'Libur Nasional' : 'Libur Sekolah'}
                                </Badge>
                                <h4 className={cn(
                                    "font-black text-xl leading-tight tracking-tight",
                                    holidayForDate.type === 'national' ? "text-rose-600" : "text-indigo-600"
                                )}>
                                    {holidayForDate.name}
                                </h4>
                            </div>
                        </div>
                    )}

                    {eventsForSelectedDate.length > 0 ? (
                      <div className="space-y-4">
                        {eventsForSelectedDate.map((event) => (
                          <Card key={event.id} className="border-0 shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
                              <CardContent className="p-0 flex items-stretch">
                                  {/* Side Accent */}
                                  <div className="w-1.5 shrink-0" style={{ backgroundColor: event.color || '#4f46e5' }} />
                                  
                                  <div className="p-6 sm:p-8 flex-1 flex flex-col sm:flex-row gap-6 items-start">
                                      <div className="flex-1 min-w-0 space-y-4">
                                          <div className="space-y-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                  {event.tag && (
                                                      <Badge 
                                                          variant="outline" 
                                                          className="border-0 px-3 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm" 
                                                          style={{
                                                              backgroundColor: event.color || '#4f46e5',
                                                              color: getTextColor(event.color || '#4f46e5')
                                                          }}
                                                      >
                                                          {event.tag}
                                                      </Badge>
                                                  )}
                                                  {event.start_time && (
                                                      <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-mono text-[10px] font-bold rounded-lg border border-slate-100">
                                                          <Clock className="w-3 h-3 mr-1.5 text-indigo-400" />
                                                          {formatTime(event.start_time)} {event.end_time && ` - ${formatTime(event.end_time)}`}
                                                      </Badge>
                                                  )}
                                              </div>
                                              <h4 className="font-black text-slate-900 text-xl tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                                          </div>
                                          
                                          {event.description && (
                                              <div className="flex gap-3 items-start p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                  <AlignLeft className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                                  <p className="text-sm font-medium text-slate-600 leading-relaxed italic">{event.description}</p>
                                              </div>
                                          )}
                                      </div>

                                      <div className="flex sm:flex-col gap-2 shrink-0">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleOpenEditDialog(event)}
                                            className="h-10 w-10 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 shadow-sm bg-slate-50 transition-all"
                                          >
                                              <Edit className="w-4 h-4" />
                                          </Button>
                                          <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 shadow-sm bg-slate-50 transition-all"
                                                  >
                                                      <Trash2 className="w-4 h-4" />
                                                  </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent className="rounded-[2rem] border-0 shadow-2xl p-10">
                                                  <AlertDialogHeader className="space-y-4">
                                                      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                                                          <CalendarOff className="w-8 h-8" />
                                                      </div>
                                                      <AlertDialogTitle className="text-2xl font-black text-center tracking-tight">Hapus Agenda?</AlertDialogTitle>
                                                      <AlertDialogDescription className="text-center font-medium">
                                                          Agenda "<span className="font-black text-slate-900">{event.title}</span>" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                                      </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter className="pt-6 gap-3 flex flex-row">
                                                      <AlertDialogCancel className="flex-1 rounded-xl h-12 font-bold text-slate-600">Batal</AlertDialogCancel>
                                                      <AlertDialogAction onClick={() => handleDeleteAgenda(event.id)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-600/20">Hapus</AlertDialogAction>
                                                  </AlertDialogFooter>
                                              </AlertDialogContent>
                                          </AlertDialog>
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : !holidayForDate ? (
                        <div className="text-center py-24 flex flex-col items-center justify-center opacity-40">
                            <div className="p-12 rounded-[3.5rem] bg-white shadow-inner mb-8 group transition-all hover:bg-indigo-50">
                              <CalendarDays className="w-20 h-20 text-slate-200 group-hover:text-indigo-200 transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Hari ini Kosong</h3>
                            <p className="text-sm font-bold text-slate-400 mt-2 max-w-[250px]">Belum ada agenda personal atau hari libur resmi untuk tanggal ini.</p>
                        </div>
                    ) : null}
                  </motion.div>
                </AnimatePresence>

                {/* Bottom Tip */}
                <div className="p-6 rounded-[2rem] bg-white border border-slate-100 flex items-start gap-4 shadow-sm">
                    <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                        <Info className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tips Agenda</p>
                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                            Gunakan warna yang berbeda untuk setiap kategori agenda agar lebih mudah dikenali dalam tampilan kalender.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Dialog Add/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl dialog-content-mobile mobile-safe-area bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-[2.5rem]">
                <form onSubmit={handleSaveAgenda}>
                    <DialogHeader className="pb-8">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-2xl shadow-lg",
                            editingAgenda ? "bg-amber-100 text-amber-600 shadow-amber-100" : "bg-indigo-100 text-indigo-600 shadow-indigo-100"
                        )}>
                          {editingAgenda ? <Edit className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-black tracking-tight">{editingAgenda ? 'Ubah Agenda' : 'Tambah Agenda Baru'}</DialogTitle>
                          <DialogDescription className="mt-1 font-medium text-slate-500">
                              {editingAgenda ? 'Perbarui detail rencana kegiatan Anda.' : 'Dokumentasikan rencana atau pengingat penting Anda.'}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    
                    <div className="grid gap-8 py-4 max-h-[60vh] overflow-y-auto pr-4 mb-4 custom-scrollbar">
                        <div className="space-y-3">
                            <Label htmlFor="title" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Judul Agenda</Label>
                            <Input 
                                id="title" 
                                value={newAgenda.title} 
                                onChange={e => setNewAgenda({...newAgenda, title: e.target.value})} 
                                placeholder="Misal: Rapat Guru, Penyerahan Raport..."
                                className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 shadow-sm font-bold text-lg"
                                required 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Deskripsi (Opsional)</Label>
                            <Textarea 
                                id="description" 
                                value={newAgenda.description || ''} 
                                onChange={e => setNewAgenda({...newAgenda, description: e.target.value})} 
                                placeholder="Detail tambahan untuk agenda ini..."
                                className="min-h-[120px] rounded-2xl border-slate-200 focus:border-indigo-500 shadow-sm resize-none font-medium"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label htmlFor="start_time" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Jam Mulai</Label>
                                <Input 
                                    id="start_time" 
                                    type="time" 
                                    value={newAgenda.start_time || ''} 
                                    onChange={e => setNewAgenda({...newAgenda, start_time: e.target.value})}
                                    className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 shadow-sm font-mono font-black"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="end_time" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Jam Selesai</Label>
                                <Input 
                                    id="end_time" 
                                    type="time" 
                                    value={newAgenda.end_time || ''} 
                                    onChange={e => setNewAgenda({...newAgenda, end_time: e.target.value})}
                                    className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 shadow-sm font-mono font-black"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="tag" className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Label / Tag</Label>
                                <Input 
                                    id="tag" 
                                    value={newAgenda.tag || ''} 
                                    onChange={e => setNewAgenda({...newAgenda, tag: e.target.value})} 
                                    placeholder="Misal: DINAS, RAPAT, PENTING"
                                    className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 shadow-sm font-black uppercase tracking-[0.15em] text-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Warna Label</Label>
                                <div className="grid grid-cols-5 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 h-14 items-center">
                                    {[
                                        '#4f46e5', // Indigo
                                        '#10b981', // Emerald
                                        '#ef4444', // Red
                                        '#f59e0b', // Amber
                                        '#6b7280'  // Gray
                                    ].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            className={cn(
                                                "w-full aspect-square rounded-lg border-2 transition-all active:scale-90",
                                                newAgenda.color === c ? "border-white ring-2 ring-indigo-500 ring-offset-1 scale-110" : "border-transparent opacity-60"
                                            )}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setNewAgenda({...newAgenda, color: c})}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="pt-6 border-t border-slate-100 flex flex-row gap-3">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsDialogOpen(false)} 
                            disabled={loading}
                            className="flex-1 h-14 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                            {editingAgenda ? 'Simpan Perubahan' : 'Buat Agenda'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        `}</style>
    </div>
  );
}
