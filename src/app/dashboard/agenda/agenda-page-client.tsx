
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

    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <span className={cn(
            "relative z-10 transition-colors duration-200",
            holiday?.type === 'national' ? "text-red-600 font-black" : 
            holiday?.type === 'school' ? "text-indigo-600 font-bold" : ""
        )}>
            {props.date.getDate()}
        </span>
        
        {holiday && (
            <div className={cn(
                "absolute top-1 right-1 w-1.5 h-1.5 rounded-full shadow-sm animate-pulse",
                holiday.type === 'national' ? "bg-red-500 shadow-red-500/50" : "bg-indigo-500 shadow-indigo-500/50"
            )} />
        )}

        {colors.length > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
            {colors.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="h-1 w-1 rounded-full"
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
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 shrink-0 h-12 rounded-xl"
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
                    
                    <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto pr-4 mb-4">
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
                                className="h-12 rounded-xl border-slate-200 focus:border-green-500"
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
                                className="min-h-20 rounded-xl border-slate-200 focus:border-blue-500"
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
                                    className="h-12 rounded-xl border-slate-200 focus:border-orange-500"
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
                                    className="h-12 rounded-xl border-slate-200 focus:border-red-500"
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
                                className="h-12 rounded-xl border-slate-200 focus:border-purple-500"
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Palette className="h-4 w-4 text-pink-600" />
                                Warna Tag
                            </Label>
                            <div className="grid grid-cols-8 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
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
                                        className={`w-10 h-10 rounded-xl border-2 transition-all duration-300 hover:scale-110 ${
                                            newAgenda.color === colorOption.color 
                                                ? 'border-white shadow-lg ring-2 ring-gray-400 ring-offset-2' 
                                                : 'border-transparent hover:shadow-md'
                                        }`}
                                        style={{ backgroundColor: colorOption.color }}
                                        onClick={() => setNewAgenda({...newAgenda, color: colorOption.color})}
                                        title={colorOption.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="pt-4 border-t border-slate-200 bg-slate-50/50 rounded-b-lg">
                      <div className="flex flex-row gap-2 w-full">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)} 
                            disabled={loading}
                            className="flex-1 h-11 border-slate-300 hover:bg-slate-50 rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-md"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingAgenda ? 'Perbarui' : 'Simpan'} Agenda
                        </Button>
                      </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <div className="grid md:grid-cols-7 md:gap-8 md:items-start">
            <Card className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-0 shadow-xl md:col-span-4 lg:col-span-3 rounded-xl">
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
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                        <span>Hari Libur Nasional</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                        <span>Libur Khusus Sekolah</span>
                    </div>
                </div>
            </Card>
      
            <Card className="bg-white dark:bg-gray-900 border-0 shadow-xl md:col-span-3 lg:col-span-4 h-full min-h-[500px] flex flex-col rounded-xl">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full animate-pulse" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100" suppressHydrationWarning>
                            Agenda {format(selectedDate, 'dd MMMM yyyy', {locale: id})}
                        </h3>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                        {holidayForDate && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "p-5 rounded-2xl border flex items-start gap-4 mb-2 shadow-sm",
                                    holidayForDate.type === 'national' 
                                        ? "bg-red-50 border-red-100 text-red-700" 
                                        : "bg-indigo-50 border-indigo-100 text-indigo-700"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-xl text-white shadow-md",
                                    holidayForDate.type === 'national' ? "bg-red-500" : "bg-indigo-500"
                                )}>
                                    {holidayForDate.type === 'national' ? <Flag className="h-5 w-5" /> : <School className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-black text-[10px] uppercase tracking-widest opacity-70">
                                        {holidayForDate.type === 'national' ? 'Libur Nasional' : 'Libur Sekolah'}
                                    </h4>
                                    <p className="font-bold text-lg leading-tight mt-1">{holidayForDate.name}</p>
                                </div>
                            </motion.div>
                        )}

                        {eventsForSelectedDate.length > 0 ? (
                        eventsForSelectedDate.map((event) => (
                            <div 
                                key={event.id} 
                                className="group p-5 rounded-2xl border-l-4 transition-all duration-300 hover:shadow-lg relative overflow-hidden bg-white border border-slate-100"
                                style={{
                                    borderLeftColor: event.color || '#6b7280',
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div 
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: event.color || '#6b7280' }}
                                            />
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                                {event.title}
                                            </h3>
                                        </div>
                                        {event.start_time && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                                                <Clock className="h-4 w-4" />
                                                <span className="font-medium">
                                                    {formatTime(event.start_time)} {event.end_time && `- ${formatTime(event.end_time)}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem onClick={() => handleOpenEditDialog(event)} className="rounded-lg">
                                                    <Edit className="mr-2 h-4 w-4" /> Ubah
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent className="rounded-3xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus Agenda?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini tidak dapat dibatalkan. Hapus agenda "{event.title}"?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteAgenda(event.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                {event.description && <p className="mt-2 text-sm text-slate-600 ml-4 leading-relaxed">{event.description}</p>}
                                {event.tag && (
                                    <div className="mt-3 ml-4">
                                        <Badge 
                                            variant="outline" 
                                            className="border-0 px-2.5 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-sm" 
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
                        ))
                        ) : !holidayForDate ? (
                            <div className="text-center py-20 opacity-50">
                                <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-sm font-medium">Tidak ada agenda hari ini</p>
                            </div>
                        ) : null}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
