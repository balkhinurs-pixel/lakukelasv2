"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { classes } from "@/lib/placeholder-data";
import type { Student, Class } from "@/lib/types";

export default function GradesPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [grades, setGrades] = React.useState<Map<string, number | string>>(new Map());
  const [assessmentType, setAssessmentType] = React.useState<string>("");
  const [meetingNumber, setMeetingNumber] = React.useState<number | "">("");
  const { toast } = useToast();

  const handleClassChange = (classId: string) => {
    const newClass = classes.find((c) => c.id === classId) || null;
    setSelectedClass(newClass);
    setStudents(newClass ? newClass.students : []);
    const newGrades = new Map();
    newClass?.students.forEach(student => {
      newGrades.set(student.id, "");
    });
    setGrades(newGrades);
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const score = value === "" ? "" : Math.max(0, Math.min(100, Number(value)));
    setGrades(new Map(grades.set(studentId, score)));
  };

  const saveGrades = () => {
    console.log({
      date,
      classId: selectedClass?.id,
      assessmentType,
      meetingNumber,
      records: Array.from(grades.entries()).map(([studentId, score]) => ({ studentId, score })),
    });
    toast({
      title: "Nilai Disimpan",
      description: `Nilai untuk ${selectedClass?.name} pada ${date ? format(date, "PPP") : ''} telah berhasil disimpan.`,
      variant: "default",
      className: "bg-green-100 text-green-900 border-green-200",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Input Nilai Harian</CardTitle>
          <CardDescription>
            Pilih kelas, tanggal, dan jenis penilaian untuk menginput nilai siswa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label>Kelas</Label>
                <Select onValueChange={handleClassChange}>
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
                <Label>Tanggal Penilaian</Label>
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
                <Label htmlFor="assessmentType">Jenis Penilaian</Label>
                <Input id="assessmentType" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} placeholder="e.g. Ulangan Harian 1" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="meetingNumber">Pertemuan Ke (Opsional)</Label>
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
            <CardTitle>Daftar Nilai - {selectedClass.name}</CardTitle>
            <CardDescription>
              Input nilai (0-100) untuk setiap siswa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="w-[120px] text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={grades.get(student.id) ?? ""}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className="w-24 text-right"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={saveGrades} disabled={!assessmentType}>Simpan Nilai</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
