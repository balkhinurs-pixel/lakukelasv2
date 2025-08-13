
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
    <Card className={cn("relative overflow-hidden text-white shadow-lg", color)}>
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/20 opacity-50" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 opacity-50" />
        <CardContent className="relative z-10 flex flex-col justify-between p-4 h-full">
            <div className="flex items-center justify-between">
                <div className="rounded-full bg-black/20 p-2">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div>
                <p className="text-sm font-light">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs font-extralight opacity-80">{subtitle}</p>
            </div>
        </CardContent>
    </Card>
);


export default function DashboardClientPage({ 
    todaySchedule, 
    journalEntries,
    initialAttendancePercentage,
    initialUnfilledJournalsCount 
}: DashboardPageProps) {
    const [activeSchedules, setActiveSchedules] = React.useState<Record<string, boolean>>({});
    
    const sortedSchedule = React.useMemo(() => {
        return todaySchedule.sort((a,b) => a.start_time.localeCompare(b.start_time));
    }, [todaySchedule]);

    React.useEffect(() => {
        const now = new Date();
        const newActiveSchedules: Record<string, boolean> = {};
        sortedSchedule.forEach(item => {
            const [hours, minutes] = item.start_time.split(':').map(Number);
            const scheduleDate = new Date();
            scheduleDate.setHours(hours, minutes, 0, 0);
            if (now >= scheduleDate) {
                newActiveSchedules[item.id] = true;
            }
        });
        setActiveSchedules(newActiveSchedules);

        const interval = setInterval(() => {
             const now = new Date();
             const updatedSchedules: Record<string, boolean> = {};
             sortedSchedule.forEach(item => {
                const [hours, minutes] = item.start_time.split(':').map(Number);
                const scheduleDate = new Date();
                scheduleDate.setHours(hours, minutes, 0, 0);
                if (now >= scheduleDate) {
                    updatedSchedules[item.id] = true;
                }
            });
            setActiveSchedules(current => ({...current, ...updatedSchedules}));
        }, 60000); // Check every minute

        return () => clearInterval(interval);

    }, [sortedSchedule]);
    
    const [today, setToday] = React.useState('');
    React.useEffect(() => {
        setToday(new Date().toLocaleDateString('id-ID', { weekday: 'long' }));
    }, []);

    const QuickActionButton = ({ href, icon: Icon, tooltipText }: { href: string, icon: React.ElementType, tooltipText: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" asChild>
                        <Link href={href}>
                           <Icon className="h-5 w-5"/>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    const getActionButtons = (item: ScheduleItem) => {
        const classId = item.class_id;
        const subjectId = item.subject_id;
        if (!classId || !subjectId) return null;
        
        const attendanceParams = new URLSearchParams({ classId, subjectId }).toString();
        const gradesParams = new URLSearchParams({ classId, subjectId }).toString();
        const journalParams = new URLSearchParams({ classId, subjectId, openDialog: "true" }).toString();

        return (
             <div className="mt-3 flex items-center gap-2">
                <QuickActionButton href={`/dashboard/attendance?${attendanceParams}`} icon={ClipboardCheck} tooltipText="Isi Presensi"/>
                <QuickActionButton href={`/dashboard/grades?${gradesParams}`} icon={ClipboardEdit} tooltipText="Input Nilai"/>
                <QuickActionButton href={`/dashboard/journal?${journalParams}`} icon={BookText} tooltipText="Isi Jurnal"/>
             </div>
        );
    }
    
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ClipboardCheck}
            title="Presensi Hari Ini"
            value={`${initialAttendancePercentage}%`}
            subtitle={initialAttendancePercentage > 0 ? "Kehadiran terekam" : "Belum ada data"}
            color="bg-gradient-to-br from-green-500 to-green-400"
          />
          <StatCard
            icon={Users}
            title="Kelas Hari Ini"
            value={String(todaySchedule.length)}
            subtitle="Total kelas dalam jadwal"
            color="bg-gradient-to-br from-blue-600 to-blue-500"
          />
          <StatCard
            icon={BookText}
            title="Jurnal Belum Diisi"
            value={String(initialUnfilledJournalsCount)}
            subtitle={initialUnfilledJournalsCount > 0 ? "Jadwal perlu diisi" : "Semua jurnal terisi"}
            color="bg-gradient-to-br from-red-500 to-orange-400"
          />
          <StatCard
            icon={Clock}
            title="Kelas Berikutnya"
            value={sortedSchedule.length > 0 ? formatTime(sortedSchedule[0].start_time) : '-'}
            subtitle={sortedSchedule.length > 0 ? `${sortedSchedule[0].subject} - ${sortedSchedule[0].class}` : 'Tidak ada kelas'}
            color="bg-gradient-to-br from-amber-500 to-yellow-400"
          />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Jadwal Hari Ini ({today})</CardTitle>
            <CardDescription>Alur kerja cepat untuk mengajar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedSchedule.length > 0 ? (
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border -z-10" aria-hidden="true" />
                    
                    <div className="space-y-8">
                         {sortedSchedule.map((item) => {
                            const isActionAvailable = activeSchedules[item.id];
                            return (
                                <div key={item.id} className="relative flex items-start gap-4">
                                     <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                                        "bg-primary text-primary-foreground"
                                    )}>
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div className="flex-grow pt-1.5">
                                        <p className="font-semibold">{item.subject}</p>
                                        <p className="text-sm text-muted-foreground">{item.class} | {formatTime(item.start_time)} - {formatTime(item.end_time)}</p>
                                        {isActionAvailable && getActionButtons(item)}
                                    </div>
                                </div>
                            )
                         })}
                    </div>
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Tidak ada jadwal mengajar hari ini.</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Jurnal Terbaru</CardTitle>
            <CardDescription>
              Catatan aktivitas mengajar Anda baru-baru ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {journalEntries.length > 0 ? (
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead className="text-right">Tanggal</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {journalEntries.map((entry) => (
                        <TableRow key={entry.id}>
                        <TableCell>
                            <div className="font-medium">{entry.subjectName}</div>
                        </TableCell>
                        <TableCell>{entry.className}</TableCell>
                        <TableCell className="text-right">
                            {format(parseISO(entry.date), "EEEE, dd MMM yyyy", { locale: id })}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
             ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Belum ada jurnal yang dibuat.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

