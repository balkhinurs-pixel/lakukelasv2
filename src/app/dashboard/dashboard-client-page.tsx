
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
  ArrowRight,
  MapPin,
  CheckCircle2,
  Calendar,
  ChevronRight,
  TrendingUp,
  MessageSquareQuote
} from "lucide-react";
import Link from 'next/link';
import { format, parseISO, startOfWeek, addDays, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import type { ScheduleItem, Agenda, Holiday } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { LottieCalendar } from "@/components/ui/lottie-calendar";
import { LottieWelcome } from "@/components/ui/lottie-welcome";

type DashboardPageProps = {
  todaySchedule: ScheduleItem[];
  agendas: Agenda[];
  initialAttendancePercentage: number;
  initialUnfilledJournalsCount: number;
  todayHoliday: Holiday | null;
  profileName?: string;
}

const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    colorClass,
    iconBg,
    trendIcon: TrendIcon
}: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle: string;
    colorClass: string;
    iconBg: string;
    trendIcon?: React.ElementType;
}) => (
    <Card className="relative overflow-hidden border-0 shadow-sm rounded-[24px] bg-white transition-all duration-300 hover:shadow-md group">
        <CardContent className="p-5 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2.5 rounded-xl text-white shadow-sm", iconBg)}>
                    <Icon className="h-5 w-5" />
                </div>
                {TrendIcon && <TrendIcon className={cn("h-4 w-4", colorClass)} />}
            </div>
            <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium">{subtitle}</p>
            </div>
        </CardContent>
    </Card>
);

export default function DashboardClientPage({ 
    todaySchedule, 
    agendas,
    initialAttendancePercentage,
    initialUnfilledJournalsCount,
    todayHoliday,
    profileName = "Bapak/Ibu Guru"
}: DashboardPageProps) {
    const [now, setNow] = React.useState<Date>(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const sortedSchedule = React.useMemo(() => {
        return [...todaySchedule].sort((a,b) => a.start_time.localeCompare(b.start_time));
    }, [todaySchedule]);

    const upcomingClass = React.useMemo(() => {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        return sortedSchedule.find(item => {
            const [endH, endM] = item.end_time.split(':').map(Number);
            return currentHour < endH || (currentHour === endH && currentMinute < endM);
        });
    }, [sortedSchedule, now]);

    // Calendar helper
    const weekDays = React.useMemo(() => {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [now]);

    return (
        <div className="space-y-6 pb-24">
            {/* 1. Hero Welcome Section */}
            <div className="relative overflow-hidden bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                            <span>👋</span>
                            <span>Selamat Datang,</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {profileName} <span className="text-amber-400">👋</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium">Semangat mengajar hari ini!</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex items-center gap-3 bg-indigo-50 p-2.5 rounded-2xl border border-indigo-100 min-w-[120px]">
                            <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-sm">
                                <BookText className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 leading-none">{todaySchedule.length} Kelas</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Hari ini</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-amber-50 p-2.5 rounded-2xl border border-amber-100 min-w-[120px]">
                            <div className="p-2 bg-amber-500 rounded-xl text-white shadow-sm">
                                <ClipboardCheck className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 leading-none">{initialUnfilledJournalsCount} Jurnal</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Belum diisi</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-48 h-48 shrink-0 relative hidden sm:block">
                     <div className="absolute inset-0 bg-indigo-100/50 rounded-full blur-3xl animate-pulse" />
                     <LottieWelcome />
                </div>
            </div>

            {/* 2. Grid Stats Section */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    icon={CheckCircle2}
                    title="Presensi Hari Ini"
                    value={`${initialAttendancePercentage}%`}
                    subtitle="Kehadiran terekam"
                    colorClass="text-emerald-500"
                    iconBg="bg-emerald-500"
                    trendIcon={TrendingUp}
                />
                <StatCard 
                    icon={Users}
                    title="Kelas Hari Ini"
                    value={todayHoliday ? "0" : String(todaySchedule.length)}
                    subtitle="Total kelas terjadwal"
                    colorClass="text-blue-500"
                    iconBg="bg-blue-500"
                />
                <StatCard 
                    icon={BookText}
                    title="Jurnal Belum Diisi"
                    value={initialUnfilledJournalsCount}
                    subtitle="Semua jurnal terisi"
                    colorClass="text-rose-500"
                    iconBg="bg-rose-500"
                />
                <StatCard 
                    icon={Calendar}
                    title="Jadwal Hari Ini"
                    value={todayHoliday ? "Libur" : (upcomingClass ? "Aktif" : "Selesai")}
                    subtitle={todayHoliday ? todayHoliday.description : "Semua kelas telah berakhir"}
                    colorClass="text-amber-500"
                    iconBg="bg-amber-500"
                />
            </div>

            {/* 3. Next Schedule Section */}
            <Card className="border-0 shadow-sm rounded-[24px] overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-indigo-600" />
                        <CardTitle className="text-base font-black text-slate-800">Jadwal Berikutnya</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="text-indigo-600 font-bold text-xs" asChild>
                        <Link href="/dashboard/schedule">Lihat Semua <ChevronRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                    {upcomingClass ? (
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-slate-100/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-600 text-white p-3 rounded-2xl flex flex-col items-center justify-center min-w-[70px] shadow-lg shadow-indigo-200">
                                    <span className="text-xs font-bold leading-none">{formatTime(upcomingClass.start_time)}</span>
                                    <div className="w-4 h-0.5 bg-white/30 my-1.5" />
                                    <span className="text-xs font-bold leading-none">{formatTime(upcomingClass.end_time)}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-black">{upcomingClass.class}</Badge>
                                        <p className="font-black text-slate-900 tracking-tight">{upcomingClass.subject}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <MapPin className="h-3 w-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Ruang Kelas</span>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden sm:flex flex-col items-end gap-1">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Mulai dalam</p>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                    <span className="text-sm font-black text-slate-900">Segera</span>
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-500">Semua tugas mengajar selesai untuk hari ini!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 4. Progress & Calendar Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teaching Progress */}
                <Card className="border-0 shadow-sm rounded-[24px] bg-white p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        <CardTitle className="text-base font-black text-slate-800">Progress Mengajar</CardTitle>
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

                {/* Mini Calendar */}
                <Card className="border-0 shadow-sm rounded-[24px] bg-white p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-base font-black text-slate-800">Kalender</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>{format(now, 'MMMM yyyy', { locale: id })}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase">{d}</div>
                        ))}
                        {weekDays.map((day, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all",
                                    isSameDay(day, now) 
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                {day.getDate()}
                            </div>
                        ))}
                    </div>
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
