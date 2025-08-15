
"use client";

import * as React from "react";
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Tag,
  AlignLeft,
  Palette,
  Sparkles
} from "lucide-react";
import { format, addMonths, subMonths, isSameDay, parseISO, startOfDay, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { DayContent, DayPicker, DayContentProps } from "react-day-picker";

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

  const CustomDayContent = (props: DayContentProps) => {
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
    <div className="space-y-8 p-1">
        {/* Enhanced Header Section */}
        <div className="relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-3xl -z-10" />
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 p-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                            <CalendarDays className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-800 bg-clip-text text-transparent">
                                Agenda
                            </h1>
                            <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-1" />
                        </div>
                    </div>
                    <p className="text-muted-foreground/80 ml-14">
                        Kelola jadwal, rapat, dan pengingat pribadi Anda dengan mudah dan terorganisir.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            onClick={handleOpenAddDialog}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                            size="lg"
                        >
                            <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                            Tambah Agenda
                        </Button>
                    </DialogTrigger>
                </Dialog>
            </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-2xl dialog-content-mobile mobile-safe-area bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
                <form onSubmit={handleSaveAgenda}>
                    <DialogHeader className="text-center space-y-4 pb-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 via-emerald-100 to-green-100 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-green-950/30 rounded-2xl flex items-center justify-center shadow-lg">
                            {editingAgenda ? (
                                <Edit className="h-8 w-8 text-green-600 dark:text-green-400" />
                            ) : (
                                <PlusCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {editingAgenda ? 'Ubah Agenda' : 'Tambah Agenda Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-2">
                                {editingAgenda ? 'Perbarui detail acara atau pengingat Anda.' : 'Isi detail acara atau pengingat Anda di bawah ini.'}
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
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
                                className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 focus:border-green-500 transition-all duration-200"
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
                                className="min-h-20 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-500 transition-all duration-200"
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
                                    value={newAgenda.end_time || ''} 
                                    onChange={e => setNewAgenda({...newAgenda, end_time: e.target.value})}
                                    className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 focus:border-red-500 transition-all duration-200"
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
                                className="h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 focus:border-purple-500 transition-all duration-200"
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
                    
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-6">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)} 
                            disabled={loading}
                            className="sm:flex-1 h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="sm:flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingAgenda ? 'Perbarui' : 'Simpan'} Agenda
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <div className="grid md:grid-cols-7 md:gap-8 md:items-start">
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 md:col-span-4 lg:col-span-3 relative overflow-hidden">
                {/* Card gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-50" />
                <div className="relative z-10">
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
                </div>
            </Card>
      
            <Card className="bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-gray-900 dark:via-emerald-950/30 dark:to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 md:col-span-3 lg:col-span-4 mt-6 md:mt-0 h-full max-h-[500px] flex flex-col relative overflow-hidden">
                {/* Card gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 opacity-50" />
                
                <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full animate-pulse" />
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-emerald-600 dark:from-gray-100 dark:to-emerald-300 bg-clip-text text-transparent" suppressHydrationWarning>
                            Agenda untuk {format(selectedDate, 'eeee, dd MMMM yyyy', {locale: id})}
                        </h3>
                    </div>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full mt-2" />
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden relative z-10">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                        {eventsForSelectedDate.length > 0 ? (
                        eventsForSelectedDate.map((event, index) => (
                            <div 
                                key={event.id} 
                                className="group p-5 rounded-2xl backdrop-blur-sm border-l-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg relative overflow-hidden"
                                style={{
                                    backgroundColor: `${event.color || '#6b7280'}15`, // 8% opacity
                                    borderLeftColor: event.color || '#6b7280',
                                    animationDelay: `${index * 100}ms`,
                                    animation: 'slideInLeft 0.5s ease-out forwards'
                                }}
                            >
                                {/* Item gradient overlay */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                                    style={{
                                        background: `linear-gradient(135deg, ${event.color || '#6b7280'}08, transparent)`
                                    }}
                                />
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div 
                                                className="w-3 h-3 rounded-full shadow-sm"
                                                style={{ backgroundColor: event.color || '#6b7280' }}
                                            />
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
                                                {event.title}
                                            </h3>
                                        </div>
                                        {event.start_time && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300 ml-5">
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
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-200/50 dark:border-gray-700/50 hover:border-emerald-300/50 dark:hover:border-emerald-600/50 transition-all duration-300 hover:scale-110 hover:shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent 
                                                align="end" 
                                                className="w-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl p-2"
                                            >
                                                <DropdownMenuItem 
                                                    onClick={() => handleOpenEditDialog(event)}
                                                    className="rounded-xl p-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all duration-200 cursor-pointer group/edit"
                                                >
                                                    <Edit className="mr-3 h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover/edit:scale-110 transition-transform duration-200" />
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
                                                    Apakah Anda yakin ingin menghapus agenda <span className="font-semibold text-foreground">&quot;{event.title}&quot;</span>?
                                                    <br />
                                                    <span className="text-sm text-red-500 dark:text-red-400 mt-2 block">Tindakan ini tidak dapat dibatalkan.</span>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                                                <AlertDialogCancel className="sm:flex-1 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
                                                    Batal
                                                </AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={() => handleDeleteAgenda(event.id)} 
                                                    className="sm:flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                                                >
                                                    Ya, Hapus
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                
                                {event.description && (
                                    <div className="mt-3 ml-5">
                                        <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed">
                                            {event.description}
                                        </p>
                                    </div>
                                )}
                                
                                {event.tag && (
                                    <div className="mt-3 ml-5">
                                        <Badge 
                                            variant="outline" 
                                            className="border-0 px-3 py-1 rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-300" 
                                            style={{
                                                backgroundColor: event.color || '#6b7280',
                                                color: getTextColor(event.color || '#6b7280')
                                            }}
                                        >
                                            <Tag className="h-3 w-3 mr-1" />
                                            {event.tag}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        ))
                        ) : (
                            <div className="text-center py-16">
                                <div className="max-w-sm mx-auto">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-100 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-emerald-950/30 rounded-3xl flex items-center justify-center shadow-lg">
                                        <CalendarDays className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                                        Tidak ada agenda
                                    </h3>
                                    <p className="text-muted-foreground mb-6 leading-relaxed">
                                        Belum ada agenda untuk tanggal ini. Klik tombol "Tambah Agenda" untuk membuat yang baru.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                  </ScrollArea>
                </CardContent>
            </Card>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-15px);
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
