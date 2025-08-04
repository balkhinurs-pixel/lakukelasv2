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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { classes } from "@/lib/placeholder-data";
import type { Student, Class } from "@/lib/types";

export default function RosterPage() {
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(classes[0]);
  const [students, setStudents] = React.useState<Student[]>(classes[0].students);

  const handleClassChange = (classId: string) => {
    const newClass = classes.find((c) => c.id === classId) || null;
    setSelectedClass(newClass);
    setStudents(newClass ? newClass.students : []);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">Class Roster</h1>
          <p className="text-muted-foreground">View and manage student lists for each class.</p>
        </div>
        <div className="flex gap-2">
            <Select onValueChange={handleClassChange} defaultValue={selectedClass?.id}>
                <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                    {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                        {c.name}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
        </div>
      </div>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Students in {selectedClass.name}</CardTitle>
            <CardDescription>
              A total of {students.length} students are in this class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-muted-foreground">{student.id}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
