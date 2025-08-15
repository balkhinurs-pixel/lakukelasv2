
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, BookText, Users, Clock, ArrowRight, Check, ClipboardEdit } from "lucide-react";
import Link from 'next/link';
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { ScheduleItem, JournalEntry } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type DashboardPageProps = {
  todaySchedule: ScheduleItem[];
  journalEntries: JournalEntry[];
  initialAttendancePercentage: number;
  initialUnfilledJournalsCount: number;
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
        {/* Enhanced background elements */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/20 opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 opacity-50 transition-opacity duration-300 group-hover:opacity-30" />
        <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardContent className="relative z-10 flex flex-col justify-between p-6 h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                    <Icon className="h-6 w-6 drop-shadow-sm" />
                </div>
                <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-white/90 tracking-wide">{title}</p>
                <p className="text-3xl font-bold drop-shadow-sm tracking-tight">{value}</p>
                <p className="text-xs text-white/80 leading-relaxed">{subtitle}</p>
            </div>
        </CardContent>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </Card>
);


export default function DashboardClientPage({ 
    todaySchedule, 
    journalEntries,
    initialAttendancePercentage,
    initialUnfilledJournalsCount 
}: DashboardPageProps) {
    const [activeSchedules, setActiveSchedules] = React.useState<Record<string, boolean>>({});
    const [endedSchedules, setEndedSchedules] = React.useState<Record<string, boolean>>({});
    
    const sortedSchedule = React.useMemo(() => {
        return todaySchedule.sort((a,b) => a.start_time.localeCompare(b.start_time));
    }, [todaySchedule]);

    React.useEffect(() => {
        const updateScheduleStatus = () => {
            const now = new Date();
            const newActiveSchedules: Record<string, boolean> = {};
            const newEndedSchedules: Record<string, boolean> = {};
            
            sortedSchedule.forEach(item => {
                const [startHours, startMinutes] = item.start_time.split(':').map(Number);
                const [endHours, endMinutes] = item.end_time.split(':').map(Number);
                
                const startTime = new Date();
                startTime.setHours(startHours, startMinutes, 0, 0);
                
                const endTime = new Date();
                endTime.setHours(endHours, endMinutes, 0, 0);
                
                if (now >= endTime) {
                    // Class has ended
                    newEndedSchedules[item.id] = true;
                    newActiveSchedules[item.id] = true; // Keep actions available
                } else if (now >= startTime) {
                    // Class is ongoing
                    newActiveSchedules[item.id] = true;
                }
            });
            
            setActiveSchedules(newActiveSchedules);
            setEndedSchedules(newEndedSchedules);
        };

        // Initial check
        updateScheduleStatus();

        // Check every minute
        const interval = setInterval(updateScheduleStatus, 60000);

        return () => clearInterval(interval);

    }, [sortedSchedule]);
    
    const [today, setToday] = React.useState('');
    React.useEffect(() => {
        setToday(new Date().toLocaleDateString('id-ID', { weekday: 'long' }));
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
                                {/* Background shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                
                                {/* Icon with glow effect */}
                                <Icon className="h-5 w-5 drop-shadow-sm transition-all duration-300 group-hover:scale-110"/>
                                
                                {/* Ripple effect on hover */}
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
      {/* Enhanced stats grid with better spacing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={ClipboardCheck}
            title="Presensi Hari Ini"
            value={`${initialAttendancePercentage}%`}
            subtitle={initialAttendancePercentage > 0 ? "Kehadiran terekam" : "Belum ada data"}
            color="bg-gradient-to-br from-green-500 via-green-500 to-emerald-600"
          />
          <StatCard
            icon={Users}
            title="Kelas Hari Ini"
            value={String(todaySchedule.length)}
            subtitle="Total kelas dalam jadwal"
            color="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-600"
          />
          <StatCard
            icon={BookText}
            title="Jurnal Belum Diisi"
            value={String(initialUnfilledJournalsCount)}
            subtitle={initialUnfilledJournalsCount > 0 ? "Jadwal perlu diisi" : "Semua jurnal terisi"}
            color="bg-gradient-to-br from-red-500 via-red-500 to-orange-500"
          />
          <StatCard
            icon={Clock}
            title="Kelas Berikutnya"
            value={sortedSchedule.length > 0 ? formatTime(sortedSchedule[0].start_time) : '-'}
            subtitle={sortedSchedule.length > 0 ? `${sortedSchedule[0].subject} - ${sortedSchedule[0].class}` : 'Tidak ada kelas'}
            color="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-400"
          />
      </div>

      {/* Enhanced main content grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3 shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <CardTitle className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Jadwal Hari Ini ({today})
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground/80">
              Alur kerja cepat untuk mengajar dengan aksi real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedSchedule.length > 0 ? (
                <div className="relative">
                    {/* Enhanced vertical line with gradient */}
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
                                    {/* Enhanced time indicator */}
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
                                        
                                        {/* Status indicator */}
                                        {isActionAvailable && !hasEnded && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-bounce shadow-sm">
                                                <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-75" />
                                            </div>
                                        )}
                                        
                                        {/* Ended status indicator */}
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
                                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
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
                    
                    {/* CSS Animation keyframes */}
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
                    `}</style>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Tidak ada jadwal mengajar hari ini.</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-4 shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Jurnal Terbaru
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground/80">
              Catatan aktivitas mengajar Anda yang terekam dalam sistem.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {journalEntries.length > 0 ? (
                <div className="space-y-3">
                {journalEntries.map((entry, index) => (
                    <div 
                        key={entry.id} 
                        className="group p-4 rounded-xl border border-border/50 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                        style={{
                            animationDelay: `${index * 100}ms`,
                            animation: 'fadeInRight 0.6s ease-out forwards'
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-sm group-hover:animate-pulse" />
                                    <h4 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                                        {entry.subjectName}
                                    </h4>
                                </div>
                                <div className="flex items-center gap-2 mt-1 ml-6">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {entry.className}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                    {format(parseISO(entry.date), "dd MMM", { locale: id })}
                                </div>
                                <div className="text-xs text-muted-foreground/70">
                                    {format(parseISO(entry.date), "EEEE", { locale: id })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
             ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                        <BookText className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-muted-foreground font-medium">Belum ada jurnal yang dibuat</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Jurnal akan muncul setelah Anda mengisi aktivitas mengajar
                    </p>
                </div>
             )}
          </CardContent>
          
          {/* CSS Animation for journal entries */}
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
          `}</style>
        </Card>
      </div>
    </div>
  );
}
