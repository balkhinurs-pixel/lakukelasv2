
"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Calendar as CalendarIcon, User as UserIcon, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TeacherAttendance, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllUsers, getTeacherAttendanceHistory } from "@/lib/data";

export default function TeacherAttendanceRecapPage() {
    const [history, setHistory] = React.useState<TeacherAttendance[]>([]);
    const [users, setUsers] = React.useState<Profile[]>([]);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
    const [selectedTeacher, setSelectedTeacher] = React.useState<string>("all");
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [attendanceData, userData] = await Promise.all([
                getTeacherAttendanceHistory(),
                getAllUsers()
            ]);
            setHistory(attendanceData);
            setUsers(userData.filter(u => u.role === 'teacher'));
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredHistory = React.useMemo(() => {
        return history.filter(item => {
            const dateMatch = !selectedDate || format(new Date(item.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const teacherMatch = selectedTeacher === 'all' || item.teacherId === selectedTeacher;
            return dateMatch && teacherMatch;
        });
    }, [history, selectedDate, selectedTeacher]);

    const getStatusBadge = (status: TeacherAttendance['status']) => {
        switch (status) {
            case 'Tepat Waktu':
                return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
            case 'Terlambat':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
            case 'Tidak Hadir':
                return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                    <UserCheck className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Rekap Kehadiran Guru</h1>
                    <p className="text-slate-600 mt-1">Pantau catatan kehadiran semua guru di sekolah.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter Laporan</CardTitle>
                    <CardDescription>
                        Saring data absensi berdasarkan guru atau tanggal tertentu.
                    </CardDescription>
                     <div className="pt-4 flex flex-col md:flex-row gap-2">
                        <div className="flex items-center gap-2 w-full">
                           <UserIcon className="h-4 w-4 text-muted-foreground" />
                           <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter berdasarkan guru" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Guru</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                           </Select>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                             {selectedDate && (
                                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Guru</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Absen Masuk</TableHead>
                                <TableHead>Absen Pulang</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16">
                                        <p>Memuat data...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredHistory.length > 0 ? (
                                filteredHistory.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.teacherName}</TableCell>
                                        <TableCell>{format(new Date(item.date), 'EEEE, dd MMM yyyy', { locale: id })}</TableCell>
                                        <TableCell>{item.checkIn || '-'}</TableCell>
                                        <TableCell>{item.checkOut || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("font-semibold", getStatusBadge(item.status))}>{item.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16">
                                        <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium">Belum Ada Data</h3>
                                        <p className="mt-1 text-sm text-gray-500">Tidak ada data kehadiran yang cocok dengan filter Anda.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
