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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, BookText, Users, Clock } from "lucide-react";
import Link from 'next/link';
import { journalEntries, schedule } from "@/lib/placeholder-data";
import { format } from "date-fns";
import type { ScheduleItem } from "@/lib/types";

export default function DashboardPage() {

    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' }) as ScheduleItem['day'];
    const todaySchedule = schedule.filter(item => item.day === today).sort((a,b) => a.startTime.localeCompare(b.startTime));

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
            <CardDescription>Jadwal mengajar Anda untuk hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaySchedule.length > 0 ? todaySchedule.map((item) => (
                 <div key={item.id} className="flex items-center p-2 rounded-lg hover:bg-muted">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.class}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{item.startTime} - {item.endTime}</div>
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
