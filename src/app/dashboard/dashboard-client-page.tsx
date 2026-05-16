"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookText, 
  ClipboardCheck, 
  Users, 
  Clock, 
  CalendarDays, 
  MapPin,
  CheckCircle2,
  Calendar,
  ChevronRight,
  TrendingUp,
  MessageSquareQuote,
  ClipboardEdit
} from "lucide-react";
import Link from 'next/link';
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { ScheduleItem, Agenda, Holiday } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { LottieWelcome } from "@/components/ui/lottie-welcome";
import { MiniCalendar } from "@/components/ui/mini-calendar";
import { motion, AnimatePresence } from "framer-motion";

type DashboardPageProps = {
  todaySchedule: ScheduleItem[];
  agendas: Agenda[];
  initialAttendancePercentage: number;
  initialUnfilledJournalsCount: number;
  todayHoliday: Holiday | null;
  allHolidays?: Holiday[];
  profileName?: string;
}

// Komponen Pembantu untuk Hitung Mundur Sisa Waktu Mengajar
const CountdownDisplay = ({ startTimeStr, endTimeStr, now }: { startTimeStr: string, endTimeStr: string, now: Date }) => {
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    
    const startTime = new Date(now);
    startTime.setHours(startH, startM, 0, 0);
    
    const endTime = new Date(now);
    endTime.setHours(endH, endM, 0, 0);

    // Jika jam mengajar belum dimulai
    if (now < startTime) {
        return <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Segera</span>;
    }

    // Jika jam mengajar sudah selesai
    if (now > endTime) {
        return <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">Selesai</span>;
    }

    const diffInSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);
    if (diffInSeconds <= 0) return null;

    const totalMinutes = Math.floor(diffInSeconds / 60);
    const remainingSeconds = diffInSeconds % 60;
    
    return (
        <span className="text-[10px] font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {totalMinutes}:{remainingSeconds.toString().padStart(2, '0')}
        </span>
    );
};

const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    colorClass,
    bgColor,
    trendIcon: TrendIcon
}: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle: string;
    colorClass: string;
    bgColor: string;
    trendIcon?: React.ElementType;
}) => (
    <Card className={cn("relative overflow-hidden border-0 shadow-sm rounded-[28px] transition-all duration-300 hover:shadow-md group", bgColor)}>
        <div className="absolute -right-4 -bottom-4 opacity-[0.12] group-hover:scale-110 transition-transform duration-500">
            <Icon className={cn("w-24 h-24", colorClass)} />
        </div>
        
        <CardContent className="p-5 flex flex-col h-full relative z-10">
            <div className="flex items-start justify-between mb-4">
                <p className={cn("text-[10px] font-black uppercase tracking-[0.15em]", colorClass)}>{title}</p>
                {TrendIcon && <TrendIcon className={cn("h-4 w-4 opacity-40", colorClass)} />}
            </div>
            <div className="space-y-0.5">
                <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
                <p className="text-[11px] text-slate-500 font-bold leading-tight">{subtitle}</p>
            </div>
        </CardContent>
    </Card>
);

const ScheduleItemCard = ({ item, now, isProminent = false }: { item: ScheduleItem, now: Date, isProminent?: boolean }) => {
    const [startH, startM] = item.start_time.split(':').map(Number);
    const [endH, endM] = item.end_time.split(':').map(Number);
    
    const startTime = new Date(now);
    startTime.setHours(startH, startM, 0, 0);
    
    const endTime = new Date(now);
    endTime.setHours(endH, endM, 0, 0);

    const isActive = now >= startTime && now <= endTime;
    const isPast = now > endTime;

    return (
        <div className={cn(
            "relative p-4 rounded-[32px] border transition-all duration-300 flex flex-col gap-4 mb-4 last:mb-0",
            isActive 
                ? "bg-white border-indigo-100 shadow-xl shadow-indigo-50" 
                : isPast 
                    ? "bg-slate-50/50 border-slate-100 opacity-60"
                    : "bg-slate-50/30 border-slate-100 opacity-80"
        )}>
            {/* Indikator Pojok Kanan Atas */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-20">
                <CountdownDisplay 
                    startTimeStr={item.start_time} 
                    endTimeStr={item.end_time} 
                    now={now} 
                />
            </div>

            <div className="flex items-center">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn(
                        "py-3 px-3 rounded-[24px] flex flex-col items-center justify-center min-w-[65px] sm:min-w-[80px] shadow-lg shrink-0",
                        isActive ? "bg-indigo-600 text-white shadow-indigo-100" : 
                        isPast ? "bg-rose-100 text-rose-600 shadow-none border border-rose-200" :
                        "bg-slate-200 text-slate-600 shadow-none"
                    )}>
                        <span className="text-[11px] sm:text-xs font-black leading-none">{formatTime(item.start_time)}</span>
                        <div className={cn("w-4 h-0.5 my-2 rounded-full", isActive ? "bg-white/30" : "bg-current/10")} />
                        <span className="text-[11px] sm:text-xs font-black leading-none">{formatTime(item.end_time)}</span>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 pr-4">
                        <Badge variant="secondary" className="w-fit bg-indigo-50 text-indigo-700 border-indigo-100 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mb-0.5">
                            {item.class}
                        </Badge>
                        <h4 className="font-black text-slate-900 tracking-tight text-base sm:text-lg leading-tight break-words">
                            {item.subject}
                        </h4>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">RUANG KELAS</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-200/50">
                <Button variant="ghost" size="sm" className="flex-1 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 gap-1.5" asChild>
                    <Link href={`/dashboard/attendance?classId=${item.class_id}&subjectId=${item.subject_id}`}>
                        <ClipboardCheck className="w-4 h-4" />
                        Absen
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 hover:text-blue-700 gap-1.5" asChild>
                    <Link href={`/dashboard/grades?classId=${item.class_id}&subjectId=${item.subject_id}`}>
                        <ClipboardEdit className="w-4 h-4" />
                        Nilai
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-purple-600 hover:bg-purple-50 hover:text-purple-700 gap-1.5" asChild>
                    <Link href={`/dashboard/journal?classId=${item.class_id}&subjectId=${item.subject_id}&openDialog=true`}>
                        <BookText className="w-4 h-4" />
                        Jurnal
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export default function DashboardClientPage({ 
    todaySchedule, 
    agendas,
    initialAttendancePercentage,
    initialUnfilledJournalsCount,
    todayHoliday,
    allHolidays = [],
    profileName = "Bapak/Ibu Guru"
}: DashboardPageProps) {
    const [now, setNow] = React.useState<Date>(new Date());
    const [showAll, setShowAll] = React.useState(false);

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const sortedSchedule = React.useMemo(() => {
        return [...todaySchedule].sort((a,b) => a.start_time.localeCompare(b.start_time));
    }, [todaySchedule]);

    const upcomingClass = React.useMemo(() => {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        // Cari yang sedang berlangsung atau yang akan datang
        return sortedSchedule.find(item => {
            const [endH, endM] = item.end_time.split(':').map(Number);
            return currentHour < endH || (currentHour === endH && currentMinute < endM);
        }) || sortedSchedule[0]; // Fallback ke jam pertama jika semua sudah selesai
    }, [sortedSchedule, now]);

    const dayName = format(now, 'EEEE', { locale: id });

    return (
        <div className="space-y-6 pb-24">
            {/* 1. Hero Welcome Section */}
            <div className="relative overflow-hidden bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-row items-center justify-between gap-4">
                <div className="space-y-3 flex-1 text-left min-w-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
                            <span>👋</span>
                            <span>Selamat Datang</span>
                        </div>
                        <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight line-clamp-2">
                            {profileName}
                        </h1>
                        <p className="text-slate-400 text-[11px] sm:text-sm font-bold leading-relaxed max-w-md">
                            Semangat mengabdi dan mendidik generasi bangsa hari ini!
                        </p>
                    </div>
                </div>
                <div className="w-24 h-24 sm:w-40 sm:h-40 shrink-0 relative">
                     <div className="absolute inset-0 bg-indigo-100/40 rounded-full blur-2xl animate-pulse" />
                     <LottieWelcome />
                </div>
            </div>

            {/* 2. Grid Stats Section */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    icon={CheckCircle2}
                    title="Presensi"
                    value={`${initialAttendancePercentage}%`}
                    subtitle="Kehadiran terekam"
                    colorClass="text-emerald-700"
                    bgColor="bg-emerald-50/80"
                    trendIcon={TrendingUp}
                />
                <StatCard 
                    icon={Users}
                    title="Kelas"
                    value={todayHoliday ? "0" : String(todaySchedule.length)}
                    subtitle="Jadwal hari ini"
                    colorClass="text-blue-700"
                    bgColor="bg-blue-50/80"
                />
                <StatCard 
                    icon={BookText}
                    title="Jurnal"
                    value={initialUnfilledJournalsCount}
                    subtitle="Belum terisi"
                    colorClass="text-rose-700"
                    bgColor="bg-rose-50/80"
                />
                <StatCard 
                    icon={Calendar}
                    title="Agenda"
                    value={todayHoliday ? "Libur" : (upcomingClass ? "Aktif" : "Selesai")}
                    subtitle={todayHoliday ? todayHoliday.description : "Status mengajar"}
                    colorClass="text-amber-700"
                    bgColor="bg-amber-50/80"
                />
            </div>

            {/* 3. Next Schedule Section */}
            <Card className="border-0 shadow-sm rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="flex flex-col items-start pb-2 px-6 pt-6 gap-2">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-indigo-600" />
                        <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none flex flex-col sm:flex-row sm:gap-2">
                            <span>JADWAL HARI</span>
                            <span className="text-indigo-600">{dayName.toUpperCase()}</span>
                        </CardTitle>
                    </div>
                    <button 
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center text-indigo-600 font-bold text-xs p-0 h-auto hover:bg-transparent transition-all"
                    >
                        {showAll ? 'Sembunyikan Daftar' : 'Lihat Semua Jadwal'} 
                        <ChevronRight className={cn("h-4 w-4 ml-1 transition-transform duration-300", showAll && "rotate-90")} />
                    </button>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                    {todayHoliday ? (
                        <div className="text-center py-10 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Hari Libur</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{todayHoliday.description}</p>
                        </div>
                    ) : sortedSchedule.length > 0 ? (
                        <div className="relative">
                            <AnimatePresence initial={false} mode="wait">
                                {!showAll ? (
                                    <motion.div
                                        key="highlight"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {upcomingClass && <ScheduleItemCard item={upcomingClass} now={now} isProminent />}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                    >
                                        <div className="space-y-4 pt-2">
                                            {sortedSchedule.map((item) => (
                                                <ScheduleItemCard key={item.id} item={item} now={now} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                            <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Tidak Ada Jadwal</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Anda tidak memiliki jam mengajar hari ini.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 4. Progress & Calendar Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm rounded-[32px] bg-white p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Progress Mengajar</CardTitle>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative h-24 w-24 shrink-0">
                            <svg className="h-full w-full" viewBox="0 0 36 36">
                                <circle className="stroke-slate-100 fill-none" strokeWidth="3" cx="18" cy="18" r="15.91549430918954" />
                                <circle className="stroke-indigo-600 fill-none transition-all duration-1000" strokeWidth="3" strokeDasharray="72 28" strokeDashoffset="25" strokeLinecap="round" cx="18" cy="18" r="15.91549430918954" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-black text-slate-900">72%</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Minggu Ini</p>
                            <p className="text-sm font-bold text-slate-700 leading-tight">8 dari 11 kelas telah diselesaikan</p>
                            <Button variant="link" size="sm" className="p-0 h-auto text-indigo-600 font-black text-[11px] uppercase tracking-wider">Lihat detail ></Button>
                        </div>
                    </div>
                </Card>

                <Card className="border-0 shadow-sm rounded-[32px] bg-white p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Kalender</CardTitle>
                        </div>
                    </div>
                    <MiniCalendar holidays={allHolidays} />
                </Card>
            </div>

            {/* 5. Motivation Banner */}
            <div className="relative rounded-[32px] bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 border border-indigo-100/50 flex items-center gap-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                <div className="relative shrink-0 w-24 h-24 hidden sm:block">
                     <LottieWelcome />
                </div>
                <div className="flex-1">
                    <div className="flex items-start gap-3">
                        <MessageSquareQuote className="h-6 w-6 text-indigo-400 shrink-0" />
                        <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                            "Mengajar bukan hanya pekerjaan, tetapi cara untuk memberi kehidupan pada pengetahuan."
                        </p>
                    </div>
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                    <div className="p-2 bg-amber-100 rounded-xl">
                        <Badge variant="outline" className="border-0 bg-transparent text-amber-600 p-0"><TrendingUp className="h-5 w-5" /></Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}