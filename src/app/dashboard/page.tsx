
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
import { ClipboardCheck, BookText, Users, Clock, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { journalEntries, schedule, classes } from "@/lib/placeholder-data";
import { format } from "date-fns";
import type { ScheduleItem } from "@/lib/types";

// Helper function to check if current time is past schedule start time
const isScheduleActive = (scheduleTime: string) => {
    if (typeof window === "undefined") return false; // Avoid SSR issues
    const now = new Date();
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduleDate = new Date();
    scheduleDate.setHours(hours, minutes, 0, 0);
    return now >= scheduleDate;
}

type TaskStatus = 'pending' | 'presensi_done' | 'nilai_done' | 'jurnal_done';

export default function DashboardPage() {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' }) as ScheduleItem['day'];
    const todaySchedule = schedule.filter(item => item.day === today).sort((a,b) => a.startTime.localeCompare(b.startTime));

    // State to track task completion for each schedule item
    const [taskStatus, setTaskStatus] = React.useState<Record<string, TaskStatus>>({});

    const handleTaskCompletion = (scheduleId: string, currentStatus: TaskStatus) => {
        let nextStatus: TaskStatus = 'pending';
        if (currentStatus === 'pending') nextStatus = 'presensi_done';
        else if (currentStatus === 'presensi_done') nextStatus = 'nilai_done';
        else if (currentStatus === 'nilai_done') nextStatus = 'jurnal_done';
        
        setTaskStatus(prev => ({ ...prev, [scheduleId]: nextStatus }));
    }

    const getNextAction = (item: ScheduleItem) => {
        const status = taskStatus[item.id] || 'pending';
        const classData = classes.find(c => c.name === item.class);
        const classId = classData?.id;

        if (!classId) return null;

        const commonButtonProps = {
            size: "sm",
            className: "w-full md:w-auto",
        } as const;

        const linkParams = new URLSearchParams({
            classId: classId,
            subject: item.subject,
        });

        if (status === 'pending') {
            return (
                <Button {...commonButtonProps} asChild>
                    <Link href={`/dashboard/attendance?${linkParams.toString()}`} onClick={() => handleTaskCompletion(item.id, 'pending')}>
                        Isi Presensi <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            );
        }
        if (status === 'presensi_done') {
            return (
                <Button {...commonButtonProps} asChild>
                    <Link href={`/dashboard/grades?${linkParams.toString()}`} onClick={() => handleTaskCompletion(item.id, 'presensi_done')}>
                        Input Nilai <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            );
        }
        if (status === 'nilai_done') {
             const journalParams = new URLSearchParams({
                class: item.class,
                subject: item.subject,
                openDialog: "true"
            });
            return (
                <Button {...commonButtonProps} asChild>
                     <Link href={`/dashboard/journal?${journalParams.toString()}`} onClick={() => handleTaskCompletion(item.id, 'nilai_done')}>
                        Isi Jurnal <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            );
        }
        if (status === 'jurnal_done') {
            return <div className="text-sm text-green-600 font-semibold flex items-center justify-end"><ClipboardCheck className="mr-2 h-4 w-4"/> Selesai</div>;
        }

        return null;
    }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Presensi Hari Ini
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95.8%</div>
            <p className="text-xs text-muted-foreground">
              2 dari 3 kelas telah direkam
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule.length}</div>
            <p className="text-xs text-muted-foreground">
              Total kelas dalam jadwal Anda
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jurnal Belum Diisi
            </CardTitle>
            <BookText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Dari jadwal kemarin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Berikutnya</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule.length > 0 ? todaySchedule[0].startTime : '-'}</div>
            <p className="text-xs text-muted-foreground">
            {todaySchedule.length > 0 ? `${todaySchedule[0].subject} - ${todaySchedule[0].class}` : 'Tidak ada kelas'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Jurnal Terbaru</CardTitle>
            <CardDescription>
              Catatan aktivitas mengajar Anda baru-baru ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries.slice(0, 5).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="font-medium">{entry.subject}</div>
                      <div className="text-sm text-muted-foreground hidden md:inline">
                        {entry.material}
                      </div>
                    </TableCell>
                    <TableCell>{entry.class}</TableCell>
                    <TableCell className="text-right">
                      {format(entry.date, "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Jadwal Hari Ini ({today})</CardTitle>
            <CardDescription>Alur kerja cepat untuk mengisi data mengajar Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaySchedule.length > 0 ? todaySchedule.map((item) => (
                 <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 p-3 rounded-lg hover:bg-muted/50 border">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight">{item.subject}</p>
                          <p className="text-sm text-muted-foreground leading-tight">{item.class} | {item.startTime} - {item.endTime}</p>
                        </div>
                    </div>
                    <div className="w-full md:w-auto mt-2 md:mt-0">
                        {isScheduleActive(item.startTime) && getNextAction(item)}
                    </div>
                </div>
            )) : (
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
