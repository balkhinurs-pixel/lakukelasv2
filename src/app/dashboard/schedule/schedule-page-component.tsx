
"use client";

import * as React from "react";
import { 
    Clock, 
    BookOpen, 
    MapPin, 
    CalendarCheck, 
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    Timer,
    Info,
    Calendar
} from "lucide-react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

import { cn, formatTime } from "@/lib/utils";
import type { ScheduleItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getIndonesianDayName, getIndonesianTime } from "@/lib/timezone";

const DAYS_OF_WEEK: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// Warna Aksen untuk Mapel
const subjectColors = [
    { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", badge: "bg-indigo-600" },
    { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", badge: "bg-emerald-600" },
    { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", badge: "bg-blue-600" },
    { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", badge: "bg-amber-600" },
    { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", badge: "bg-rose-600" },
    { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", badge: "bg-purple-600" },
];

const getSubjectInitial = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function SchedulePageComponent({
    initialSchedule,
} : {
    initialSchedule: ScheduleItem[],
}) {
    const [now] = React.useState<Date>(getIndonesianTime());
    const [selectedDay, setSelectedDay] = React.useState<string>(getIndonesianDayName());
    
    // Menghasilkan daftar tanggal untuk satu minggu (Senin - Minggu)
    const weekDates = React.useMemo(() => {
        const start = startOfWeek(now, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(start, i);
            return {
                date,
                dayName: DAYS_OF_WEEK[i],
                dayLabel: format(date, 'E', { locale: id }),
                dateNum: format(date, 'd')
            };
        });
    }, [now]);

    const groupedSchedule = React.useMemo(() => {
        const groups = initialSchedule.reduce((acc, item) => {
            (acc[item.day] = acc[item.day] || []).push(item);
            return acc;
        }, {} as Record<ScheduleItem['day'], ScheduleItem[]>);
        
        for (const day in groups) {
            groups[day as ScheduleItem['day']].sort((a, b) => a.start_time.localeCompare(b.start_time));
        }
        return groups;
    }, [initialSchedule]);

    const activeSchedule = groupedSchedule[selectedDay as ScheduleItem['day']] || [];
    const firstClassTime = activeSchedule.length > 0 ? formatTime(activeSchedule[0].start_time) : "-";

    return (
        <div className="space-y-6 pb-24 -mt-2">
            {/* 1. Hero Summary Section */}
            <div className="px-1">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-100">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em]">Summary</p>
                            <h1 className="text-2xl font-black tracking-tight">Jadwal Mengajar</h1>
                        </div>
                        <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center gap-1.5 mb-1 text-indigo-200">
                                <Icon icon="solar:users-group-rounded-bold-duotone" className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-black uppercase tracking-wider">Total</span>
                            </div>
                            <p className="text-lg font-black">{activeSchedule.length} Kelas</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center gap-1.5 mb-1 text-indigo-200">
                                <Icon icon="solar:clock-circle-bold-duotone" className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-black uppercase tracking-wider">Mulai</span>
                            </div>
                            <p className="text-lg font-black">{firstClassTime}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                            <div className="flex items-center gap-1.5 mb-1 text-indigo-200">
                                <Icon icon="solar:chart-square-bold-duotone" className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-black uppercase tracking-wider">Status</span>
                            </div>
                            <p className="text-[10px] font-black uppercase leading-tight mt-1">
                                {activeSchedule.length > 0 ? "Hari Aktif" : "Bebas Tugas"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Date Navigator (Horizontal Calendar) */}
            <div className="px-1">
                <ScrollArea className="w-full whitespace-nowrap rounded-[2rem] bg-white p-2 shadow-sm border border-slate-100">
                    <div className="flex w-full justify-between px-1">
                        {weekDates.map((item) => {
                            const isSelected = selectedDay === item.dayName;
                            const isToday = isSameDay(item.date, now);
                            
                            return (
                                <button
                                    key={item.dayName}
                                    onClick={() => setSelectedDay(item.dayName)}
                                    className={cn(
                                        "flex flex-col items-center justify-center min-w-[45px] py-3 rounded-2xl transition-all duration-300",
                                        isSelected 
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105" 
                                            : "text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest mb-1",
                                        isSelected ? "text-indigo-100" : "text-slate-400"
                                    )}>
                                        {item.dayLabel}
                                    </span>
                                    <span className="text-sm font-black tracking-tight">{item.dateNum}</span>
                                    {isToday && !isSelected && (
                                        <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
            </div>

            {/* 3. Timeline Schedule List */}
            <div className="px-1 space-y-2">
                <div className="flex items-center justify-between px-3 mb-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Agenda Hari Ini</h3>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-slate-200">
                        Semester Genap
                    </Badge>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedDay}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="relative pl-6 ml-4 border-l-2 border-slate-100 space-y-6 pb-10"
                    >
                        {activeSchedule.length > 0 ? (
                            activeSchedule.map((item, idx) => {
                                const color = subjectColors[idx % subjectColors.length];
                                
                                return (
                                    <div key={item.id} className="relative">
                                        {/* Timeline Dot */}
                                        <div className={cn(
                                            "absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10",
                                            color.badge
                                        )} />

                                        <Card className="border-0 shadow-sm rounded-[2rem] overflow-hidden bg-white hover:shadow-md transition-shadow group">
                                            <CardContent className="p-0">
                                                <div className="flex items-stretch">
                                                    {/* Color Accent Strip */}
                                                    <div className={cn("w-1.5", color.badge)} />
                                                    
                                                    <div className="flex-1 p-5 sm:p-6 flex items-center gap-4">
                                                        {/* Subject Circle Icon */}
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                                                            color.bg
                                                        )}>
                                                            <span className={cn("text-xs font-black", color.text)}>
                                                                {getSubjectInitial(item.subject || "")}
                                                            </span>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <Clock className="w-3 h-3" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                                                                    {formatTime(item.start_time)} — {formatTime(item.end_time)}
                                                                </span>
                                                            </div>
                                                            
                                                            <h4 className="font-black text-slate-900 text-base sm:text-lg leading-tight truncate tracking-tight">
                                                                {item.subject}
                                                            </h4>

                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100">
                                                                    <Icon icon="solar:minimalistic-magnifer-bold-duotone" className="w-3 h-3 text-slate-400" />
                                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">{item.class}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <MapPin className="w-3 h-3 text-slate-300" />
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RUANG UTAMA</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Arrow */}
                                                        <div className="p-2 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-24 pr-6 opacity-30 flex flex-col items-center justify-center">
                                <div className="p-8 rounded-[3rem] bg-slate-50 shadow-inner mb-6">
                                    <Icon icon="solar:sleeping-bold-duotone" className="w-16 h-16 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hari Libur</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Tidak ada jadwal untuk hari {selectedDay}</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Tip Section */}
            <div className="mx-1 p-5 rounded-[2rem] bg-white border border-slate-100 flex items-start gap-4 shadow-sm">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                    <Info className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tips Administrasi</p>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                        Pastikan Anda telah mengisi presensi dan jurnal tepat setelah kelas berakhir untuk akurasi data monitoring.
                    </p>
                </div>
            </div>
        </div>
    );
}

