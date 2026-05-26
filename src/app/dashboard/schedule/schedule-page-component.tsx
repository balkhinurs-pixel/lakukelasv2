
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { 
    Clock, 
    BookOpen, 
    MapPin, 
    CalendarCheck, 
    ArrowRight,
    Timer,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { cn, formatTime } from "@/lib/utils";
import type { ScheduleItem } from "@/lib/types";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndonesianDayName, getIndonesianTime } from "@/lib/timezone";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const DAYS_OF_WEEK: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function SchedulePageComponent({
    initialSchedule,
} : {
    initialSchedule: ScheduleItem[],
}) {
    const [now, setNow] = React.useState<Date>(new Date());
    const [activeTab, setActiveTab] = React.useState<string>(getIndonesianDayName());

    // Timer untuk update waktu sesi aktif setiap menit
    React.useEffect(() => {
        setNow(getIndonesianTime());
        const timer = setInterval(() => setNow(getIndonesianTime()), 60000);
        return () => clearInterval(timer);
    }, []);

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

    const isCurrentSession = (item: ScheduleItem) => {
        if (item.day !== getIndonesianDayName()) return false;
        
        const [startH, startM] = item.start_time.split(':').map(Number);
        const [endH, endM] = item.end_time.split(':').map(Number);
        
        const startTime = new Date(now);
        startTime.setHours(startH, startM, 0, 0);
        
        const endTime = new Date(now);
        endTime.setHours(endH, endM, 0, 0);
        
        return now >= startTime && now <= endTime;
    };

    const isPastSession = (item: ScheduleItem) => {
        if (item.day !== getIndonesianDayName()) return false;
        const [endH, endM] = item.end_time.split(':').map(Number);
        const endTime = new Date(now);
        endTime.setHours(endH, endM, 0, 0);
        return now > endTime;
    };

    return (
        <div className="space-y-6 pb-20">
            <HandWrittenTitle 
                title="Jadwal Mengajar" 
                subtitle="Atur waktu dan persiapan kelas Anda"
                className="py-4 md:py-8"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Horizontal Scrollable Tabs for Mobile */}
                <div className="relative mb-8 px-1">
                    <ScrollArea className="w-full whitespace-nowrap rounded-[2rem] bg-slate-100/80 p-1.5 backdrop-blur-md shadow-inner border border-slate-200/50">
                        <TabsList className="bg-transparent h-12 inline-flex w-full sm:flex">
                            {DAYS_OF_WEEK.map((day) => (
                                <TabsTrigger 
                                    key={day} 
                                    value={day}
                                    className={cn(
                                        "flex-1 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300",
                                        "data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-lg",
                                        "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {day}
                                    {day === getIndonesianDayName() && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </ScrollArea>
                </div>

                <AnimatePresence mode="wait">
                    <TabsContent key={activeTab} value={activeTab} className="mt-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {groupedSchedule[activeTab as ScheduleItem['day']]?.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {groupedSchedule[activeTab as ScheduleItem['day']].map((item, idx) => {
                                        const active = isCurrentSession(item);
                                        const past = isPastSession(item);

                                        return (
                                            <Card 
                                                key={item.id} 
                                                className={cn(
                                                    "border-0 shadow-sm rounded-[2.5rem] overflow-hidden transition-all duration-500",
                                                    active ? "bg-white ring-2 ring-indigo-500 shadow-xl shadow-indigo-100 scale-[1.02]" : 
                                                    past ? "bg-slate-50 opacity-60 grayscale-[0.5]" : "bg-white"
                                                )}
                                            >
                                                <CardContent className="p-0">
                                                    <div className="flex items-stretch min-h-[140px]">
                                                        {/* Time Column */}
                                                        <div className={cn(
                                                            "w-24 sm:w-32 flex flex-col items-center justify-center text-center p-4 border-r border-slate-100 transition-colors duration-500",
                                                            active ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500"
                                                        )}>
                                                            <span className="text-xs sm:text-sm font-black tracking-tight">{formatTime(item.start_time)}</span>
                                                            <div className={cn("w-4 h-0.5 my-2 rounded-full", active ? "bg-white/30" : "bg-slate-200")} />
                                                            <span className="text-xs sm:text-sm font-black tracking-tight">{formatTime(item.end_time)}</span>
                                                            {active && (
                                                                <div className="mt-3 flex items-center gap-1.5 animate-pulse">
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                                    <span className="text-[8px] font-black uppercase tracking-widest">Live</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Detail Column */}
                                                        <div className="flex-1 p-5 sm:p-8 relative flex flex-col justify-center gap-3">
                                                            {active && (
                                                                <Badge className="absolute top-4 right-6 bg-emerald-500 text-white border-0 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-emerald-100">
                                                                    Sedang Berlangsung
                                                                </Badge>
                                                            )}

                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-indigo-600">
                                                                    <BookOpen className="h-4 w-4" />
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Mata Pelajaran</span>
                                                                </div>
                                                                <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                                                                    {item.subject}
                                                                </h3>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                                                        <CalendarCheck className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{item.class}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                                                                        <MapPin className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruang Kelas</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-30">
                                    <div className="p-8 rounded-[3rem] bg-slate-100">
                                        <Timer className="h-16 w-16 text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tidak Ada Jadwal</h3>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nikmati waktu istirahat Anda hari ini</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>
                </AnimatePresence>
            </Tabs>

            {/* Bottom Info Tip */}
            <div className="mx-1 p-5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-indigo-700/70 leading-relaxed uppercase tracking-wide">
                    Sistem secara otomatis menyoroti jadwal yang sedang berlangsung berdasarkan waktu di perangkat Anda. Gunakan navigasi hari di atas untuk melihat jadwal lainnya.
                </p>
            </div>
        </div>
    );
}
