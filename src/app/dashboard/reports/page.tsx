
"use client"

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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, CheckCircle, Award } from "lucide-react";
import { classes } from "@/lib/placeholder-data";

const attendanceData = [
  { name: 'Kelas 10-A', Hadir: 95, Sakit: 2, Izin: 3, Alpha: 0 },
  { name: 'Kelas 10-B', Hadir: 92, Sakit: 4, Izin: 2, Alpha: 2 },
  { name: 'Kelas 11-A', Hadir: 98, Sakit: 1, Izin: 1, Alpha: 0 },
  { name: 'Kelas 11-B', Hadir: 90, Sakit: 5, Izin: 3, Alpha: 2 },
];

const gradeData = [
    { name: 'Ulangan 1', 'Kelas 10-A': 82, 'Kelas 10-B': 78, 'Kelas 11-A': 85, 'Kelas 11-B': 75 },
    { name: 'Ulangan 2', 'Kelas 10-A': 85, 'Kelas 10-B': 80, 'Kelas 11-A': 88, 'Kelas 11-B': 79 },
    { name: 'Tugas', 'Kelas 10-A': 90, 'Kelas 10-B': 85, 'Kelas 11-A': 92, 'Kelas 11-B': 88 },
];

const overallAttendance = {
    Hadir: 375,
    Sakit: 12,
    Izin: 9,
    Alpha: 4
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const studentPerformance = [
    { id: 'S001', name: 'Budi Santoso', class: '10-A', average_grade: 92, attendance: 100, status: 'Meningkat' },
    { id: 'S006', name: 'Gilang Ramadhan', class: '10-B', average_grade: 85, attendance: 95, status: 'Stabil' },
    { id: 'S003', name: 'Dewi Anggraini', class: '11-A', average_grade: 78, attendance: 98, status: 'Menurun' },
    { id: 'S004', name: 'Eko Prasetyo', class: '11-A', average_grade: 95, attendance: 100, status: 'Sangat Baik' },
]


export default function ReportsPage() {
  const [selectedClass, setSelectedClass] = React.useState("all");

  const pieData = Object.entries(overallAttendance).map(([name, value]) => ({name, value}));

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">Laporan Akademik</h1>
                <p className="text-muted-foreground">Analisis komprehensif tentang kehadiran dan nilai siswa.</p>
            </div>
             <Select onValueChange={setSelectedClass} defaultValue="all">
                <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter berdasarkan kelas" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">94.2%</div>
                    <p className="text-xs text-muted-foreground">Rata-rata kehadiran semua kelas</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rata-rata Nilai</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">84.5</div>
                    <p className="text-xs text-muted-foreground">Skor rata-rata semua penilaian</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Siswa Berprestasi</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Eko P.</div>
                    <p className="text-xs text-muted-foreground">Nilai rata-rata tertinggi (95)</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Siswa Aktif</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{students.length}</div>
                    <p className="text-xs text-muted-foreground">Di semua kelas yang Anda ajar</p>
                </CardContent>
            </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Perbandingan Kehadiran Antar Kelas</CardTitle>
                <CardDescription>Visualisasi persentase kehadiran untuk setiap status di berbagai kelas.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        <Bar dataKey="Hadir" stackId="a" fill="#22c55e" name="Hadir" />
                        <Bar dataKey="Sakit" stackId="a" fill="#f97316" name="Sakit"/>
                        <Bar dataKey="Izin" stackId="a" fill="#0ea5e9" name="Izin"/>
                        <Bar dataKey="Alpha" stackId="a" fill="#ef4444" name="Alpha"/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Distribusi Kehadiran Umum</CardTitle>
                <CardDescription>Proporsi setiap status kehadiran secara keseluruhan.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={110}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
      
       <Card>
          <CardHeader>
            <CardTitle>Performa Siswa Teratas</CardTitle>
            <CardDescription>
              Daftar siswa dengan performa terbaik berdasarkan nilai dan kehadiran.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-center">Rata-rata Nilai</TableHead>
                  <TableHead className="text-center">Kehadiran</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPerformance.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell className="text-center">{student.average_grade}</TableCell>
                    <TableCell className="text-center">{student.attendance}%</TableCell>
                    <TableCell className="text-right">
                        <Badge 
                            variant={student.status === 'Meningkat' || student.status === 'Sangat Baik' ? 'default' : student.status === 'Menurun' ? 'destructive' : 'secondary'}
                            className={student.status === 'Meningkat' || student.status === 'Sangat Baik' ? 'bg-green-100 text-green-800' : ''}
                        >
                           {student.status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
