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
  School,
  Flag,
} from "lucide-react";
import { format, isSameDay, parseISO } from 'date-fns';
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
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

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
    color: "#6b7280",
    start_time: "",
    end_time: "",
  };
  const [newAgenda, setNewAgenda] = React.useState<NewAgendaEntry>(initialFormState);

  React.useEffect(() => {
    setAgendas(initialAgendas);
  }, [initialAgendas]);

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
            "relative z-10 transition-colors duration-200 font-bold",
            // Override holiday colors if selected to prevent clashing with primary background
            isSelected ? "text-white" : 
            holiday?.type === 'national' ? "text-red-600" : 
            holiday?.type === 'school' ? "text-indigo-600" : ""
        )}>
            {props.date.getDate()}
        </span>
        
        {holiday && (
            <div className={cn(
                "absolute top-1 right-1 w-1.5 h-1.5 rounded-full shadow-sm",
                isSelected ? "bg-white" : (holiday.type === 'national' ? "bg-red-500 shadow-red-500/50" : "bg-indigo-500 shadow-indigo-500/50")
            )} />
        )}

        {colors.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
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
    <div className="space-y-6 p-1">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <HandWrittenTitle 
                title="Agenda" 
                subtitle="Guru"
                className="py-4 md:py-6"
            />
            <Button 
                onClick={handleOpenAddDialog}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all duration-300 h-12 rounded-xl font-bold tracking-tight"
            >
                <PlusCircle className="mr-2 h-5 w-5" />
                Tambah Agenda
            </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl dialog-content-mobile mobile-safe-area bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
                <form onSubmit={handleSaveAgenda}>
                    <DialogHeader className="pb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-100 text-green-600">
                          {editingAgenda ? <Edit className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <DialogTitle className="text-xl font-bold">{editingAgenda ? 'Ubah Agenda' : 'Tambah Agenda Baru'}</DialogTitle>
                          <DialogDescription className="mt-1">
                              {editingAgenda ? 'Perbarui detail acara atau pengingat Anda.' : 'Isi detail acara atau pengingat Anda di bawah ini.'}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto pr-4 mb-4 custom-scrollbar">
                        <div className="space-y-3">
                            <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-green-600" />
                                Judul Agenda
                            </Label>
                            <Input 
                                id="title" 
                                value={newAgenda.title} 
                                onChange={e => setNewAgenda({...newAgenda, title: e.target.value})} 
                                placeholder="e.g. Rapat Persiapan Ujian"
                                className="h-12 rounded-xl border-slate-200 focus:border-green-500 shadow-sm"
                                required 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                                <AlignLeft className="h-4 w-4 text-blue-600" />
                                Deskripsi (Opsional)
                            </Label>
                            <Textarea 
                                id="description" 
                                value={newAgenda.description || ''} 
                                onChange={e => setNewAgenda({...newAgenda, description: e.target.value})} 
                                placeholder="e.g. Membahas teknis pelaksanaan ujian akhir semester."
                                className="min-h-[100px] rounded-xl border-slate-200 focus:border-blue-500 shadow-sm resize-none"
                            />
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
                                    value={newAgenda.start_time || ''} 
                                    onChange={e => setNewAgenda({...newAgenda, start_time: e.target.value})}
                                    className="h-12 rounded-xl border-slate-200 focus:border-orange-500 shadow-sm"
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
                                    value={newAgenda.end_time || ''} 
                                    onChange={e => setNewAgenda({...newAgenda, end_time: e.target.value})}
                                    className="h-12 rounded-xl border-slate-200 focus:border-red-500 shadow-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <Label htmlFor="tag" className="text-sm font-semibold flex items-center gap-2">
                                <Tag className="h-4 w-4 text-purple-600" />
                                Tag/Kategori (Opsional)
                            </Label>
                            <Input 
                                id="tag" 
                                value={newAgenda.tag || ''} 
                                onChange={e => setNewAgenda({...newAgenda, tag: e.target.value})} 
                                placeholder="e.g. RAPAT"
                                className="h-12 rounded-xl border-slate-200 focus:border-purple-500 shadow-sm"
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Palette className="h-4 w-4 text-pink-600" />
                                Warna Tag
                            </Label>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100">
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
                                        className={cn(
                                            "w-full aspect-square rounded-xl border-2 transition-all duration-300 hover:scale-110",
                                            newAgenda.color === colorOption.color 
                                                ? "border-white shadow-xl ring-2 ring-primary ring-offset-2 scale-110" 
                                                : "border-transparent opacity-80 hover:opacity-100"
                                        )}
                                        style={{ backgroundColor: colorOption.color }}
                                        onClick={() => setNewAgenda({...newAgenda, color: colorOption.color})}
                                        title={colorOption.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="pt-4 border-t border-slate-100">
                      <div className="flex flex-row gap-3 w-full">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)} 
                            disabled={loading}
                            className="flex-1 h-12 border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 font-bold"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingAgenda ? 'Simpan Perubahan' : 'Simpan Agenda'}
                        </Button>
                      </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 lg:gap-8 items-start">
            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-0 shadow-xl md:col-span-3 lg:col-span-3 rounded-[2rem]">
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
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                        month: "space-y-6 w-full",
                        caption: "flex justify-between pt-1 relative items-center px-2",
                        caption_label: "text-xl font-bold font-headline text-slate-900 dark:text-white",
                        nav: "space-x-1 flex items-center",
                        nav_button: cn(
                           "h-9 w-9 bg-slate-50 hover:bg-slate-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center justify-center"
                        ),
                        nav_button_previous: "",
                        nav_button_next: "",
                        table: "w-full border-collapse",
                        head_row: "flex w-full justify-between mb-4",
                        head_cell: "text-slate-400 rounded-md w-9 font-bold text-[0.7rem] uppercase tracking-widest text-center flex-1",
                        row: "flex w-full mt-2 justify-between",
                        cell: "h-11 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20 flex-1 flex justify-center items-center",
                        day: cn(
                          "h-10 w-10 p-0 font-bold text-slate-700 dark:text-slate-300 transition-all duration-200 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800"
                        ),
                        day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white rounded-xl shadow-lg shadow-primary/30 scale-110",
                        day_today: "bg-accent text-accent-foreground rounded-xl border-2 border-primary/20",
                        day_outside: "text-slate-300 dark:text-slate-600 opacity-50",
                        day_disabled: "text-slate-300 dark:text-slate-600 opacity-50",
                    }}
                />
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-gray-800 space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm shadow-red-500/40" />
                          <span>Libur Nasional</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-sm shadow-indigo-500/40" />
                          <span>Libur Sekolah</span>
                      </div>
                    </div>
                </div>
            </Card>
      
            <Card className="bg-white dark:bg-gray-900 border-0 shadow-xl md:col-span-4 lg:col-span-4 h-full min-h-[500px] flex flex-col rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-4 pt-6 px-6 sm:px-8 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full animate-pulse shadow-lg shadow-emerald-500/40" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 tracking-tight" suppressHydrationWarning>
                            {format(selectedDate, 'eeee, dd MMMM yyyy', {locale: id})}
                        </h3>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow p-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 sm:p-8 space-y-6">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={format(selectedDate, 'yyyy-MM-dd')}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                          >
                            {holidayForDate && (
                                <div 
                                    className={cn(
                                        "p-4 rounded-[1.2rem] border-2 flex items-center gap-4 shadow-sm",
                                        holidayForDate.type === 'national' 
                                            ? "bg-red-50/50 border-red-100 text-red-700" 
                                            : "bg-indigo-50/50 border-indigo-100 text-indigo-700"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-xl text-white shadow-md",
                                        holidayForDate.type === 'national' ? "bg-red-500 shadow-red-500/20" : "bg-indigo-500 shadow-indigo-500/20"
                                    )}>
                                        {holidayForDate.type === 'national' ? <Flag className="h-5 w-5" /> : <School className="h-5 w-5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-[9px] uppercase tracking-wider opacity-60">
                                            {holidayForDate.type === 'national' ? 'Libur Nasional' : 'Libur Sekolah'}
                                        </h4>
                                        <p className="font-bold text-base leading-tight mt-0.5">{holidayForDate.name}</p>
                                    </div>
                                </div>
                            )}

                            {eventsForSelectedDate.length > 0 ? (
                            <div className="space-y-4">
                              {eventsForSelectedDate.map((event) => (
                                <div 
                                    key={event.id} 
                                    className="group p-6 rounded-[1.8rem] border-l-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700"
                                    style={{
                                        borderLeftColor: event.color || '#6b7280',
                                    }}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2.5 mb-3">
                                                <div 
                                                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                                                    style={{ backgroundColor: event.color || '#6b7280' }}
                                                />
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-gray-100 truncate">
                                                    {event.title}
                                                </h3>
                                            </div>
                                            {event.start_time && (
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-gray-900/50 w-fit px-3 py-1 rounded-full border border-slate-100 dark:border-gray-800">
                                                    <Clock className="h-4 w-4 text-primary/70" />
                                                    <span>
                                                        {formatTime(event.start_time)} {event.end_time && `- ${formatTime(event.end_time)}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors shrink-0">
                                                        <MoreHorizontal className="h-5 w-5 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 border-0 shadow-2xl w-48">
                                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(event)} className="rounded-xl h-11 font-medium gap-2">
                                                        <Edit className="h-4 w-4 text-blue-500" /> Ubah Agenda
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 mx-2" />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="rounded-xl h-11 font-medium text-red-600 focus:text-red-600 focus:bg-red-50 gap-2">
                                                            <Trash2 className="h-4 w-4" /> Hapus
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent className="rounded-[2.5rem] p-8 border-0 shadow-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-2xl font-bold">Hapus Agenda?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-base">
                                                        Agenda "<span className="font-bold text-slate-900">{event.title}</span>" akan dihapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="pt-6 gap-3">
                                                    <AlertDialogCancel className="rounded-2xl h-12 font-semibold">Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteAgenda(event.id)} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-12 font-bold shadow-lg shadow-red-600/20">Ya, Hapus Agenda</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    
                                    {event.description && (
                                      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-5 border-l border-slate-100 dark:border-gray-700">
                                        {event.description}
                                      </p>
                                    )}
                                    
                                    {event.tag && (
                                        <div className="mt-5 flex justify-end">
                                            <Badge 
                                                variant="outline" 
                                                className="border-0 px-4 py-1 rounded-xl font-black text-[9px] uppercase tracking-[0.15em] shadow-sm" 
                                                style={{
                                                    backgroundColor: event.color || '#6b7280',
                                                    color: getTextColor(event.color || '#6b7280')
                                                }}
                                            >
                                                {event.tag}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                              ))}
                            </div>
                            ) : !holidayForDate ? (
                                <div className="text-center py-24 flex flex-col items-center justify-center opacity-40">
                                    <div className="bg-slate-100 dark:bg-gray-800 p-6 rounded-[2rem] mb-6">
                                      <CalendarDays className="w-16 h-16 text-slate-400" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Hari ini Kosong</p>
                                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-[200px]">Belum ada agenda atau pengingat untuk hari ini.</p>
                                </div>
                            ) : null}
                          </motion.div>
                        </AnimatePresence>
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
        </div>
        
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 10px;
          }
        `}</style>
    </div>
  );
}
