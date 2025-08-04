
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
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classes, schedule as initialSchedule } from "@/lib/placeholder-data";
import type { ScheduleItem } from "@/lib/types";

const daysOfWeek: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function SchedulePage() {
    const [schedule, setSchedule] = React.useState<ScheduleItem[]>(initialSchedule);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const groupedSchedule = schedule.reduce((acc, item) => {
        (acc[item.day] = acc[item.day] || []).push(item);
        return acc;
      }, {} as Record<ScheduleItem['day'], ScheduleItem[]>);
    
    // Sort items by startTime
    for (const day in groupedSchedule) {
        groupedSchedule[day as ScheduleItem['day']].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Kelola Jadwal</h1>
          <p className="text-muted-foreground">
            Atur jadwal mengajar mingguan Anda.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Jadwal Baru</DialogTitle>
              <DialogDescription>
                Isi detail jadwal mengajar yang baru.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="day" className="text-right">
                  Hari
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  Kelas
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Mata Pelajaran
                </Label>
                <Input id="subject" placeholder="e.g. Kimia" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startTime" className="text-right">
                  Waktu Mulai
                </Label>
                <Input id="startTime" type="time" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endTime" className="text-right">
                  Waktu Selesai
                </Label>
                <Input id="endTime" type="time" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsDialogOpen(false)}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOfWeek.map((day) => (
            groupedSchedule[day] && groupedSchedule[day].length > 0 && (
            <Card key={day}>
              <CardHeader>
                <CardTitle>{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedSchedule[day].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-semibold">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.class}</p>
                      <p className="text-sm text-muted-foreground">{item.startTime} - {item.endTime}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Ubah</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Hapus</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        ))}
      </div>
    </div>
  );
}
