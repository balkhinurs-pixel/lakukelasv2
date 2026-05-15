"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  BookText, 
  Users, 
  Clock, 
  CalendarDays, 
  Tag, 
  ClipboardEdit, 
  CheckCircle, 
  Flag, 
  School, 
  CalendarOff,
  ArrowRight,
  Coffee
} from "lucide-react";
import Link from 'next/link';
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { ScheduleItem, Agenda, Holiday } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LottieCalendar } from "@/components/ui/lottie-calendar";
import { LottieSchoolHoliday } from "@/components/ui/lottie-school-holiday";

type DashboardPageProps = {
  todaySchedule: ScheduleItem[];
  agendas: Agenda[];
  initialAttendancePercentage: number;
  initialUnfilledJournalsCount: number;
  todayHoliday: Holiday | null;
}

const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
}: {
    icon: React.ElementType;
    title: string;
    value: string;
    subtitle: string;
    color: string;
}) => (
    <Card className={cn("relative overflow-hidden text-white shadow-2xl border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl group", color)}>
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/20 opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 opacity-50 transition-opacity duration-300 group-hover:opacity-30" />
        
        <CardContent className="relative z-10 flex flex-col justify-between p-4 sm:p-6 h-full">
            <div className="hidden sm:flex items-center justify-between mb-4">
                <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                    <Icon className="h-6 w-6 drop-shadow-sm" />
                </div>
                <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            </div>
            
            <div className="space-y-1">
                <p className="text-[10px] sm:text-sm font-medium text-white/90 tracking-wide uppercase sm:normal-case">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold drop-shadow-sm tracking-tight">{value}</p>
                <p className="text-[10px] sm:text-xs text-white/80 leading-tight sm:leading-relaxed line-clamp-1">{subtitle}</p>
            </div>
        </CardContent>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </Card>
);

export default function DashboardClientPage({ 
    todaySchedule, 
    agendas,
    initialAttendancePercentage,
    initialUnfilledJournalsCount,
    todayHoliday
}: DashboardPageProps) {
    const [isMounted, setIsMounted] = React.useState(false);
    const [now, setNow] = React.useState<Date | null>(null);
    const [activeSchedules, setActiveSchedules] = React.useState<Record<string, boolean>>({});
    const [endedSchedules, setEndedSchedules] = React.useState<Record<string, boolean>>({});

    const sortedSchedule = React.useMemo(() => {
        return todaySchedule.sort((a,b) => a.start_time.localeCompare(b.start_time));
    }, [todaySchedule]);

    React.useEffect(() => {
        setIsMounted(true);
        const updateScheduleStatus = () => {
            const currentTime = new Date();
            setNow(currentTime); 

            const newActiveSchedules: Record<string, boolean> = {};
            const newEndedSchedules: Record<string, boolean> = {};
            
            sortedSchedule.forEach(item => {
                const [startHours, startMinutes] = item.start_time.split(':').map(Number);
                const [endHours, endMinutes] = item.end_time.split(':').map(Number);
                
                const startTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), startHours, startMinutes, 0);
                const endTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), endHours, endMinutes, 0);
                
                if (currentTime >= endTime) {
                    newEndedSchedules[item.id] = true;
                    newActiveSchedules[item.id] = true;
                } else if (currentTime >= startTime) {
                    newActiveSchedules[item.id] = true;
                }
            });
            
            setActiveSchedules(newActiveSchedules);
            setEndedSchedules(newEndedSchedules);
        };

        updateScheduleStatus();
        const interval = setInterval(updateScheduleStatus, 60000); 
        return () => clearInterval(interval);

    }, [sortedSchedule]);

    const getNextClassInfo = () => {
        if (!now) return { title: "Jadwal Hari Ini", value: todayHoliday ? "Libur" : "...", subtitle: "Memuat informasi..." };

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const upcomingOrCurrentClass = sortedSchedule.find(item => {
             const [endHours, endMinutes] = item.end_time.split(':').map(Number);
             return currentHour < endHours || (currentHour === endHours && currentMinute < endMinutes);
        });

        if (upcomingOrCurrentClass && !todayHoliday) {
            const [startHours, startMinutes] = upcomingOrCurrentClass.start_time.split(':').map(Number);
            const isOngoing = now.getHours() > startHours || (now.getHours() === startHours && now.getMinutes() >= startMinutes);
            
            return {
                title: isOngoing ? "Sedang Berlangsung" : "Kelas Berikutnya",
                value: formatTime(upcomingOrCurrentClass.start_time),
                subtitle: `${upcomingOrCurrentClass.subject} - ${upcomingOrCurrentClass.class}`
            };
        }
        
        return {
            title: "Jadwal Hari Ini",
            value: todayHoliday ? "Libur" : "Selesai",
            subtitle: todayHoliday ? todayHoliday.description : "Semua kelas telah berakhir"
        };
    };

    const nextClassInfo = getNextClassInfo();
    
    const [todayName, setTodayName] = React.useState('');
    React.useEffect(() => {
        setTodayName(format(new Date(), 'eeee', { locale: id }));
    }, []);

    const QuickActionButton = ({ 
        href, 
        icon: Icon, 
        tooltipText, 
        variant = "default" 
    }: { 
        href: string, 
        icon: React.ElementType, 
        tooltipText: string,
        variant?: "attendance" | "grades" | "journal" | "default"
    }) => {
        const getVariantStyles = () => {
            switch (variant) {
                case "attendance":
                    return "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25 hover:shadow-green-500/40";
                case "grades":
                    return "bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-blue-500/25 hover:shadow-blue-500/40";
                case "journal":
                    return "bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-purple-500/25 hover:shadow-purple-500/40";
                default:
                    return "bg-gradient-to-br from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 shadow-gray-500/25 hover:shadow-gray-500/40";
            }
        };

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            size="icon" 
                            className={cn(
                                "h-11 w-11 shrink-0 border-0 text-white shadow-lg transition-all duration-300 ease-out relative group overflow-hidden",
                                "hover:scale-110 active:scale-95 hover:shadow-xl",
                                getVariantStyles()
                            )}
                            asChild
                        >
                            <Link href={href} className="relative z-10">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <Icon className="h-5 w-5 drop-shadow-sm transition-all duration-300 group-hover:scale-110"/>
                                <div className="absolute inset-0 rounded-md bg-white/10 scale-0 group-hover:scale-100 group-hover:opacity-0 opacity-100 transition-all duration-300" />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 text-white border-none shadow-xl">
                        <p className="font-medium">{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    const getActionButtons = (item: ScheduleItem) => {
        const classId = item.class_id;
        const subjectId = item.subject_id;
        if (!classId || !subjectId) return null;
        
        const attendanceParams = new URLSearchParams({ classId, subjectId }).toString();
        const gradesParams = new URLSearchParams({ classId, subjectId }).toString();
        const journalParams = new URLSearchParams({ classId, subjectId, openDialog: "true" }).toString();

        return (
             <div className="mt-4 flex items-center gap-3">
                <QuickActionButton 
                    href={`/dashboard/attendance?${attendanceParams}`} 
                    icon={ClipboardCheck} 
                    tooltipText="Isi Presensi"
                    variant="attendance"
                />
                <QuickActionButton 
                    href={`/dashboard/grades?${gradesParams}`} 
                    icon={ClipboardEdit} 
                    tooltipText="Input Nilai"
                    variant="grades"
                />
                <QuickActionButton 
                    href={`/dashboard/journal?${journalParams}`} 
                    icon={BookText} 
                    tooltipText="Isi Jurnal"
                    variant="journal"
                />
             </div>
        );
    }
  
  return (
    <div className="space-y-8 p-1">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard
            icon={ClipboardCheck}
            title="Presensi Hari Ini"
            value={!isMounted ? "..." : `${initialAttendancePercentage}%`}
            subtitle={initialAttendancePercentage > 0 ? "Kehadiran terekam" : "Belum ada data"}
            color="bg-gradient-to-br from-green-500 via-green-500 to-emerald-600"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <StatCard
                    icon={Users}
                    title="Kelas Hari Ini"
                    value={!isMounted ? "..." : (todayHoliday ? "0" : String(todaySchedule.length))}
                    subtitle={todayHoliday ? "Hari Libur" : "Total kelas terjadwal"}
                    color="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-600"
                  />
                </div>
              </TooltipTrigger>
              {todayHoliday && (
                <TooltipContent>
                  <p>Aktivitas mengajar ditiadakan karena libur</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <StatCard
            icon={BookText}
            title="Jurnal Belum Diisi"
            value={!isMounted ? "..." : (todayHoliday ? "0" : String(initialUnfilledJournalsCount))}
            subtitle={todayHoliday ? "Semua jurnal terisi" : (initialUnfilledJournalsCount > 0 ? "Perlu segera diisi" : "Semua jurnal terisi")}
            color="bg-gradient-to-br from-red-500 via-red-500 to-orange-500"
          />
          <StatCard
            icon={Clock}
            title={nextClassInfo.title}
            value={nextClassInfo.value}
            subtitle={nextClassInfo.subtitle}
            color="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-400"
          />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3 shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Jadwal Hari Ini ({todayName || '...'})
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground/80">
              Alur kerja cepat untuk mengajar dengan aksi real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayHoliday ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                    <div className={cn(
                        "p-8 rounded-xl border-2 flex flex-col items-center text-center gap-4 shadow-xl animate-in zoom-in-95 duration-500 w-full bg-white",
                        todayHoliday.type === 'national' 
                            ? "border-red-100 text-red-700" 
                            : "border-indigo-100 text-indigo-700"
                    )}>
                        <div className="shrink-0 -mt-16">
                            {todayHoliday.type === 'national' ? (
                                <LottieCalendar size={100} />
                            ) : (
                                <LottieSchoolHoliday size={100} />
                            )}
                        </div>
                        <div className="pt-2">
                            <Badge variant="outline" className={cn(
                                "text-xs uppercase font-black tracking-[0.2em] px-3 py-1 mb-2 border-0",
                                todayHoliday.type === 'national' ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
                            )}>
                                {todayHoliday.type === 'national' ? 'Libur Nasional' : 'Libur Sekolah'}
                            </Badge>
                            <h3 className="font-black text-2xl leading-tight tracking-tight text-rose-600">{todayHoliday.description}</h3>
                            <p className="text-sm opacity-70 mt-3 font-medium">Selamat menikmati waktu istirahat Bapak/Ibu Guru. <br /> Daftar jadwal dan presensi ditiadakan hari ini.</p>
                        </div>
                        <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-white/50 rounded-2xl border border-white/50">
                            <Coffee className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Happy Holiday!</span>
                        </div>
                    </div>
                </div>
            ) : sortedSchedule.length > 0 ? (
                <div className="relative">
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent -z-10" aria-hidden="true" />
                    
                    <div className="space-y-6">
                         {sortedSchedule.map((item, index) => {
                            const isActionAvailable = activeSchedules[item.id];
                            const hasEnded = endedSchedules[item.id];
                            return (
                                <div 
                                    key={item.id} 
                                    className={cn(
                                        "relative flex items-start gap-6 p-4 rounded-2xl transition-all duration-300 group",
                                        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/2 hover:shadow-md hover:scale-[1.02]",
                                        hasEnded 
                                            ? "bg-gradient-to-r from-red-50/50 to-rose-50/30 border border-red-200/30"
                                            : isActionAvailable 
                                                ? "bg-gradient-to-r from-green-50/50 to-emerald-50/30 border border-green-200/30" 
                                                : "hover:bg-muted/30"
                                    )}
                                    style={{ 
                                        animationDelay: `${index * 100}ms`,
                                        animation: 'fadeInUp 0.6s ease-out forwards'
                                    }}
                                >
                                    <div className="relative">
                                        <div className={cn(
                                            "flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-lg transition-all duration-300",
                                            "bg-gradient-to-br from-primary/90 to-primary text-white",
                                            "group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/25",
                                            hasEnded 
                                                ? "bg-gradient-to-br from-red-500 to-rose-600"
                                                : isActionAvailable && "bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse"
                                        )}>
                                            <Clock className="h-6 w-6 drop-shadow-sm" />
                                        </div>
                                        
                                        {isActionAvailable && !hasEnded && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-bounce shadow-sm">
                                                <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-75" />
                                            </div>
                                        )}
                                        
                                        {hasEnded && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm">
                                                <div className="w-full h-full bg-red-600 rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-grow">
                                        <div className="mb-2">
                                            <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                                                {item.subject}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    {item.class}
                                                </span>
                                                <span className="text-sm text-muted-foreground font-medium">
                                                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {isActionAvailable && (
                                            <div className="relative">
                                                {hasEnded ? (
                                                    <div className="text-xs text-red-600 font-semibold mb-2 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Kelas sudah berakhir
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-green-600 font-semibold mb-2 flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                        Kelas sudah dimulai - Aksi tersedia
                                                    </div>
                                                )}
                                                {getActionButtons(item)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                         })}
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    <div className="space-y-3">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <div>
                            <p className="text-lg font-medium">Tidak ada jadwal mengajar hari ini</p>
                            <p className="text-sm text-muted-foreground/70">Nikmati waktu istirahat Anda atau periksa jadwal untuk hari lain.</p>
                        </div>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-4 shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Agenda Mendatang
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground/80">
              Rencana kegiatan dan pengingat yang akan datang.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {agendas.length > 0 ? (
                <div className="space-y-3">
                {agendas.map((item, index) => (
                    <div 
                        key={item.id} 
                        className="group p-4 rounded-xl border border-border/50 bg-white/50 dark:bg-gray-800/50 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                        style={{
                            animationDelay: `${index * 100}ms`,
                            animation: 'fadeInRight 0.6s ease-out forwards'
                        }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-3 h-3 rounded-full shadow-sm shrink-0"
                                        style={{ backgroundColor: item.color || '#6b7280' }}
                                    />
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors duration-300">
                                        {item.title}
                                    </h4>
                                </div>
                                <div className="flex items-center gap-3 mt-2 ml-6">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        <span>{format(parseISO(item.date), "dd MMM", { locale: id })}</span>
                                    </div>
                                    {item.start_time && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{formatTime(item.start_time)}</span>
                                        </div>
                                    )}
                                    {item.tag && (
                                        <Badge 
                                            variant="outline" 
                                            className="px-2 py-0 h-4 text-[9px] uppercase font-bold tracking-wider border-0"
                                            style={{ 
                                                backgroundColor: `${item.color}15` || '#6b728015',
                                                color: item.color || '#6b7280'
                                            }}
                                        >
                                            {item.tag}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                <Link href={`/dashboard/agenda?date=${item.date}`}>
                                    <ArrowRight className="h-4 w-4 text-indigo-600" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                ))}
                <div className="pt-2">
                    <Button variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs" asChild>
                        <Link href="/dashboard/agenda">
                            Lihat Semua Agenda
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
                </div>
             ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
                        <CalendarDays className="w-8 h-8 text-indigo-500" />
                    </div>
                    <p className="text-muted-foreground font-medium">Belum ada agenda terdaftar</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Catat rapat atau pengingat di menu Agenda
                    </p>
                    <Button variant="outline" className="mt-4 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50" asChild>
                        <Link href="/dashboard/agenda">Buat Agenda Baru</Link>
                    </Button>
                </div>
             )}
          </CardContent>
          
          <style jsx>{`
            @keyframes fadeInRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
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
          `}</style>
        </Card>
      </div>
    </div>
  );
}
