
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
    AlertCircle,
    CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn, formatTime } from "@/lib/utils";
import type { ScheduleItem } from "@/lib/types";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndonesianDayName, getIndonesianTime } from "@/lib/timezone";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const DAYS_OF_WEEK: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function SchedulePageComponent({
    initialSchedule,
} : {
    initialSchedule: ScheduleItem[],
}) {
    const [now, setNow] = React.useState<Date>(new Date());
    const [activeTab, setActiveTab] = React.useState<string>(getIndonesianDayName());

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

    return (
        <div className="space-y-6 pb-20">
            <HandWrittenTitle 
                title="Jadwal Mengajar" 
                subtitle="Master data jadwal yang telah diatur oleh sistem"
                className="py-4 md:py-8"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Horizontal Scrollable Tabs for Mobile */}
                <div className="px-1 mb-8">
                    <ScrollArea className="w-full whitespace-nowrap rounded-3xl bg-slate-100/80 p-1.5 backdrop-blur-md shadow-inner border border-slate-200/50">
                        <TabsList className="bg-transparent h-12 flex w-full justify-between sm:justify-start">
                            {DAYS_OF_WEEK.map((day) => (
                                <TabsTrigger 
                                    key={day} 
                                    value={day}
                                    className={cn(
                                        "px-4 sm:px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 relative",
                                        "data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-lg",
                                        "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {day}
                                    {day === getIndonesianDayName() && (
                                        <div className="absolute -top-1 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white shadow-sm" />
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <ScrollBar orientation="horizontal" className="hidden" />
                    </ScrollArea>
                </div>

                <AnimatePresence mode="wait">
                    <TabsContent key={activeTab} value={activeTab} className="mt-0 focus-visible:ring-0">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {groupedSchedule[activeTab as ScheduleItem['day']]?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {groupedSchedule[activeTab as ScheduleItem['day']].map((item) => {
                                        const isLive = isCurrentSession(item);

                                        return (
                                            <Card 
                                                key={item.id} 
                                                className={cn(
                                                    "border-0 shadow-sm rounded-[2.5rem] overflow-hidden bg-white hover:shadow-md transition-shadow",
                                                    isLive && "ring-2 ring-indigo-500/20"
                                                )}
                                            >
                                                <CardContent className="p-0">
                                                    <div className="flex items-stretch min-h-[120px] sm:min-h-[140px]">
                                                        {/* Time Column - Fixed Width */}
                                                        <div className={cn(
                                                            "w-24 sm:w-32 flex flex-col items-center justify-center text-center p-4 border-r border-slate-50",
                                                            isLive ? "bg-indigo-600 text-white" : "bg-slate-50/50 text-slate-500"
                                                        )}>
                                                            <span className="text-xs sm:text-sm font-black tracking-tight">{formatTime(item.start_time)}</span>
                                                            <div className={cn("w-4 h-0.5 my-2 rounded-full", isLive ? "bg-white/30" : "bg-slate-200")} />
                                                            <span className="text-xs sm:text-sm font-black tracking-tight">{formatTime(item.end_time)}</span>
                                                            {isLive && (
                                                                <div className="mt-2 flex items-center gap-1.5 animate-pulse">
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                                    <span className="text-[8px] font-black uppercase tracking-widest">LIVE</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Detail Column */}
                                                        <div className="flex-1 p-5 sm:p-8 relative flex flex-col justify-center gap-2 sm:gap-3 min-w-0">
                                                            {isLive && (
                                                                <Badge className="absolute top-4 right-5 sm:right-8 bg-emerald-500 hover:bg-emerald-500 text-white border-0 font-black text-[8px] sm:text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg shadow-emerald-100">
                                                                    Sekarang
                                                                </Badge>
                                                            )}

                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-indigo-600/60">
                                                                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Mata Pelajaran</span>
                                                                </div>
                                                                <h3 className="text-base sm:text-2xl font-black text-slate-900 leading-tight truncate">
                                                                    {item.subject}
                                                                </h3>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                                                        <CalendarCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                                    </div>
                                                                    <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-tight">{item.class}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400">
                                                                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                                    </div>
                                                                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Ruang Kelas</span>
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
                                <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 opacity-30">
                                    <div className="p-10 rounded-[3rem] bg-slate-100 shadow-inner">
                                        <CalendarDays className="h-16 w-16 text-slate-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tidak Ada Jadwal</h3>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Belum ada data input untuk hari ini</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>
                </AnimatePresence>
            </Tabs>

            {/* Bottom Disclaimer */}
            <div className="mx-1 p-5 rounded-[2rem] bg-white border border-slate-100 flex items-start gap-4 shadow-sm">
                <AlertCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi</p>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                        Daftar ini adalah jadwal tetap Anda selama semester ini. Hubungi admin kurikulum jika terdapat kekeliruan data.
                    </p>
                </div>
            </div>
        </div>
    );
}
