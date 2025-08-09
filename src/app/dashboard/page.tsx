
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
import { ClipboardCheck, BookText, Users, Clock, ArrowRight, Check } from "lucide-react";
import Link from 'next/link';
import { format, parseISO } from "date-fns";
import type { ScheduleItem, JournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskStatus = 'pending' | 'presensi_done' | 'nilai_done' | 'jurnal_done';

type DashboardPageProps = {
  todaySchedule: ScheduleItem[];
  journalEntries: JournalEntry[];
}

function DashboardPageComponent({ todaySchedule, journalEntries }: DashboardPageProps) {
    const [taskStatus, setTaskStatus] = React.useState<Record<string, TaskStatus>>({});
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


    const handleTaskCompletion = (scheduleId: string, currentStatus: TaskStatus) => {
        let nextStatus: TaskStatus = 'pending';
        if (currentStatus === 'pending') nextStatus = 'presensi_done';
        else if (currentStatus === 'presensi_done') nextStatus = 'nilai_done';
        else if (currentStatus === 'nilai_done') nextStatus = 'jurnal_done';
        
        setTaskStatus(prev => ({ ...prev, [scheduleId]: nextStatus }));
    }

    const getNextAction = (item: ScheduleItem) => {
        const status = taskStatus[item.id] || 'pending';
        const classId = item.class_id;
        const subjectId = item.subject_id;

        if (!classId || !subjectId) return null;

        const commonButtonProps = {
            size: "sm",
            className: "w-full transition-all duration-300",
        } as const;

        const linkParams = new URLSearchParams({
            classId: classId,
            subjectId: subjectId,
        });

        if (status === 'pending') {
            return (
                <Button {...commonButtonProps} variant="outline" asChild>
                    <Link href={`/dashboard/attendance?${linkParams.toString()}`} onClick={() => handleTaskCompletion(item.id, 'pending')}>
                        Isi Presensi <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                </Button>
            );
        }
        if (status === 'presensi_done') {
            return (
                <Button {...commonButtonProps} asChild>
                    <Link href={`/dashboard/grades?${linkParams.toString()}`} onClick={() => handleTaskCompletion(item.id, 'presensi_done')}>
                        Input Nilai <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                </Button>
            );
        }
        if (status === 'nilai_done') {
             const journalParams = new URLSearchParams({
                classId: classId,
                subjectId: subjectId,
                openDialog: "true"
            });
            return (
                <Button {...commonButtonProps} asChild>
                     <Link href={`/dashboard/journal?${journalParams.toString()}`} onClick={() => handleTaskCompletion(item.id, 'nilai_done')}>
                        Isi Jurnal <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                </Button>
            );
        }
        if (status === 'jurnal_done') {
            return <div className="text-sm text-green-600 font-semibold text-center py-2">Tugas Selesai</div>;
        }

        return null;
    }
    
    const [today, setToday] = React.useState('');
    React.useEffect(() => {
        setToday(new Date().toLocaleDateString('id-ID', { weekday: 'long' }));
    }, []);
    
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Presensi Hari Ini
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">0%</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Belum ada data terekam
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Kelas Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{todaySchedule.length}</div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Total kelas dalam jadwal Anda
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Jurnal Belum Diisi
            </CardTitle>
            <BookText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">0</div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Tidak ada jurnal tertinggal
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-indigo-50 border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Kelas Berikutnya</CardTitle>
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{sortedSchedule.length > 0 ? sortedSchedule[0].start_time : '-'}</div>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
            {sortedSchedule.length > 0 ? `${sortedSchedule[0].subject} - ${sortedSchedule[0].class}` : 'Tidak ada kelas'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
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
                            {format(parseISO(entry.date), "dd MMM yyyy")}
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
                            const isTaskDone = taskStatus[item.id] === 'jurnal_done';
                            const isActionAvailable = activeSchedules[item.id];
                            return (
                                <div key={item.id} className="relative flex items-start gap-4">
                                     <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                                        isTaskDone ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"
                                    )}>
                                        {isTaskDone ? <Check className="h-5 w-5"/> : <Clock className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-grow pt-1.5">
                                        <p className="font-semibold">{item.subject}</p>
                                        <p className="text-sm text-muted-foreground">{item.class} | {item.start_time} - {item.end_time}</p>
                                        {isActionAvailable && (
                                            <div className="mt-3">
                                                {getNextAction(item)}
                                            </div>
                                        )}
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
      </div>
    </div>
  );
}

export default async function DashboardPage() {
    const { getDashboardData } = await import('@/lib/data');
    const { todaySchedule, journalEntries } = await getDashboardData();
    return <DashboardPageComponent todaySchedule={todaySchedule} journalEntries={journalEntries} />;
}

    