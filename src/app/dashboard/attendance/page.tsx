
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useSearchParams } from 'next/navigation';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { classes } from "@/lib/placeholder-data";
import type { Student, AttendanceRecord, Class } from "@/lib/types";

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId');

  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [meetingNumber, setMeetingNumber] = React.useState<number | "">("");
  const [attendance, setAttendance] = React.useState<Map<string, AttendanceRecord['status']>>(new Map());
  const { toast } = useToast();

  React.useEffect(() => {
    if (preselectedClassId) {
      handleClassChange(preselectedClassId);
    }
  }, [preselectedClassId]);

  const handleClassChange = (classId: string) => {
    const newClass = classes.find((c) => c.id === classId) || null;
    setSelectedClass(newClass);
    setStudents(newClass ? newClass.students : []);
    // Reset attendance when class changes
    const newAttendance = new Map();
    newClass?.students.forEach(student => {
      newAttendance.set(student.id, 'Hadir');
    });
    setAttendance(newAttendance);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendance(new Map(attendance.set(studentId, status)));
  };

  const saveAttendance = () => {
    if (!selectedClass || !date || !meetingNumber) {
        toast({
            title: "Gagal Menyimpan",
            description: "Harap pilih kelas, tanggal, dan isi nomor pertemuan.",
            variant: "destructive",
        });
        return;
    }
    console.log({
      date,
      classId: selectedClass?.id,
      meetingNumber,
      records: Array.from(attendance.entries()).map(([studentId, status]) => ({ studentId, status })),
    });
    toast({
      title: "Presensi Disimpan",
      description: `Presensi untuk ${selectedClass?.name} pada ${date ? format(date, "PPP") : ''} (Pertemuan ke-${meetingNumber}) telah berhasil disimpan.`,
      variant: "default",
      className: "bg-green-100 text-green-900 border-green-200",
    });
  };
  
  const attendanceOptions: AttendanceRecord['status'][] = ['Hadir', 'Sakit', 'Izin', 'Alpha'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Isi Presensi</CardTitle>
          <CardDescription>
            Pilih kelas, tanggal, dan pertemuan untuk mengisi presensi siswa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="space-y-2">
                <Label>Kelas</Label>
                 <Select onValueChange={handleClassChange} value={selectedClass?.id}>
                    <SelectTrigger>
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
            <div className="space-y-2">
                <Label>Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="meetingNumber">Pertemuan Ke</Label>
                <Input 
                    id="meetingNumber" 
                    type="number"
                    value={meetingNumber} 
                    onChange={(e) => setMeetingNumber(e.target.value === '' ? '' : parseInt(e.target.value))} 
                    placeholder="e.g. 1" 
                    min="1"
                />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Siswa - {selectedClass.name}</CardTitle>
            <CardDescription>
              Tandai status kehadiran setiap siswa untuk tanggal {date ? format(date, "PPP") : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-right">
                        <RadioGroup
                          value={attendance.get(student.id) || 'Hadir'}
                          onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceRecord['status'])}
                          className="flex justify-end gap-2 md:gap-4"
                        >
                          {attendanceOptions.map(option => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${student.id}-${option}`} />
                                <Label htmlFor={`${student.id}-${option}`}>{option}</Label>
                              </div>
                          ))}
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={saveAttendance} disabled={!meetingNumber}>Simpan Presensi</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
