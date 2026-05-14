"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, LogIn, LogOut, Loader2, CheckCircle, XCircle, Clock, FileText, Navigation, History, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { recordTeacherAttendance } from "@/lib/actions";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TeacherAttendance, Profile } from "@/lib/types";
import DigitalClock from "./DigitalClock";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

function LeaveRequestDialog({ onLeaveSubmitted }: { onLeaveSubmitted: () => void }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [leaveType, setLeaveType] = React.useState<'Sakit' | 'Izin'>('Sakit');
    const [reason, setReason] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const handleLeaveRequest = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('type', 'leave');
        formData.append('leave_type', leaveType);
        formData.append('reason', reason);

        const result = await recordTeacherAttendance(formData);

        if (result.success) {
            toast({
                title: "Pengajuan Izin Berhasil",
                description: `Anda telah tercatat ${leaveType} hari ini.`,
            });
            onLeaveSubmitted();
            setIsOpen(false);
        } else {
            toast({
                title: "Gagal Mengajukan Izin",
                description: result.error,
                variant: "destructive",
            });
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full text-slate-500 hover:text-primary hover:bg-primary/5 font-bold h-12 rounded-2xl transition-all">
                    <FileText className="mr-2 h-5 w-5" />
                    Ajukan Izin / Sakit
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Formulir Izin Tidak Masuk</DialogTitle>
                    <DialogDescription>
                        Pilih jenis izin dan berikan keterangan jika diperlukan.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <Label className="font-bold text-slate-700">Jenis Izin</Label>
                        <RadioGroup value={leaveType} onValueChange={(value: 'Sakit' | 'Izin') => setLeaveType(value)} className="flex gap-6">
                            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-2xl border flex-1 hover:border-primary transition-colors cursor-pointer">
                                <RadioGroupItem value="Sakit" id="r-sakit" />
                                <Label htmlFor="r-sakit" className="font-bold cursor-pointer">🤒 Sakit</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-2xl border flex-1 hover:border-primary transition-colors cursor-pointer">
                                <RadioGroupItem value="Izin" id="r-izin" />
                                <Label htmlFor="r-izin" className="font-bold cursor-pointer">📩 Izin</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="font-bold text-slate-700">Keterangan</Label>
                        <Textarea 
                            id="reason" 
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            placeholder="Contoh: Ada kegiatan dinas di kantor cabang..." 
                            className="rounded-2xl min-h-[100px] border-slate-200 focus:border-primary"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleLeaveRequest} disabled={loading} className="w-full h-12 rounded-2xl font-bold text-base">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Kirim Pengajuan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function TeacherAttendanceClient({ 
    initialHistory,
    users
}: { 
    initialHistory: TeacherAttendance[],
    users: Profile[] 
}) {
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [message, setMessage] = React.useState('');
    const [locationSupported, setLocationSupported] = React.useState(true);
    const [attendanceHistory, setAttendanceHistory] = React.useState<TeacherAttendance[]>(initialHistory);

    const { toast } = useToast();

    React.useEffect(() => {
        if (!navigator.geolocation) {
            setLocationSupported(false);
            setStatus('error');
            setMessage('Browser Anda tidak mendukung fitur lokasi.');
        }
    }, []);

    const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation tidak didukung'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    let errorMessage = 'Gagal mendapatkan lokasi';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Izin lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser/HP Anda.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Informasi lokasi tidak tersedia.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Waktu habis saat mencari lokasi.';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    const handleAttendance = async (type: 'in' | 'out') => {
        if (!locationSupported) {
            toast({ title: "Fitur Tidak Didukung", description: "Browser Anda tidak mendukung fitur lokasi.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setStatus('checking');
        setMessage(`Mencari koordinat GPS Anda...`);

        try {
            const location = await getCurrentLocation();
            
            const formData = new FormData();
            formData.append('type', type);
            formData.append('latitude', location.latitude.toString());
            formData.append('longitude', location.longitude.toString());

            const result = await recordTeacherAttendance(formData);

            if (result.success) {
                setStatus('success');
                const detailMessage = `${result.message} (${result.distance}m dari sekolah)${result.status ? ` - Status: ${result.status}` : ''}`;
                setMessage(detailMessage);
                toast({ title: "Absensi Berhasil", description: detailMessage });
                
                // Refresh history without full reload
                window.location.reload();
            } else {
                setStatus('error');
                setMessage(result.error || 'Gagal melakukan absensi.');
                toast({ title: "Absensi Gagal", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            setStatus('error');
            const errorMessage = error instanceof Error ? error.message : 'Gagal mendapatkan lokasi Anda.';
            setMessage(errorMessage);
            toast({ title: "Kesalahan Lokasi", description: errorMessage, variant: "destructive" });
        }

        setLoading(false);
    };

    const getStatusBadge = (status: TeacherAttendance["status"]) => {
        switch (status) {
            case "Tepat Waktu":
                return "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10";
            case "Terlambat":
                return "bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-500/10";
            case "Sakit":
                return "bg-orange-100 text-orange-700 border-orange-200 shadow-sm shadow-orange-500/10";
            case "Izin":
                return "bg-blue-100 text-blue-700 border-blue-200 shadow-sm shadow-blue-500/10";
            default:
                return "bg-rose-100 text-rose-700 border-rose-200 shadow-sm shadow-rose-500/10";
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10 px-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-200">
                        <Navigation className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black font-headline text-slate-900 tracking-tight">Presensi Lokasi</h1>
                        <p className="text-slate-500 font-medium">Lakukan absensi mandiri berbasis GPS sekolah.</p>
                    </div>
                </div>
            </div>

            <DigitalClock />

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <Card className="border-0 shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b p-8 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <LogIn className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Lakukan Absen Sekarang</CardTitle>
                                <CardDescription className="font-medium">Tekan tombol di bawah saat Anda berada di area sekolah.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button 
                                size="lg" 
                                className="h-20 sm:h-24 px-8 text-xl font-black rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-95 group flex-1"
                                onClick={() => handleAttendance('in')}
                                disabled={loading || !locationSupported}
                            >
                                <LogIn className="mr-3 h-8 w-8 group-hover:translate-x-1 transition-transform" />
                                <div className="flex flex-col items-start text-left">
                                    <span>ABSEN MASUK</span>
                                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Klik di sini</span>
                                </div>
                            </Button>
                            
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="h-20 sm:h-24 px-8 text-xl font-black rounded-3xl border-2 border-rose-500 text-rose-600 hover:bg-rose-50 shadow-xl shadow-rose-500/5 transition-all active:scale-95 group flex-1"
                                onClick={() => handleAttendance('out')}
                                disabled={loading || !locationSupported}
                            >
                                <LogOut className="mr-3 h-8 w-8 group-hover:-translate-x-1 transition-transform" />
                                <div className="flex flex-col items-start text-left">
                                    <span>ABSEN PULANG</span>
                                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Selesai Tugas</span>
                                </div>
                            </Button>
                        </div>

                        <div className="flex justify-center border-t border-slate-100 pt-6">
                            <LeaveRequestDialog onLeaveSubmitted={() => window.location.reload()} />
                        </div>

                        <AnimatePresence mode="wait">
                            {status !== 'idle' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Alert variant={status === 'error' ? 'destructive' : 'default'} className={cn(
                                        "rounded-3xl p-6 border-2",
                                        status === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800 [&>svg]:text-emerald-600" : 
                                        status === 'checking' ? "bg-blue-50 border-blue-200 text-blue-800 [&>svg]:text-blue-600" : ""
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className="shrink-0 p-3 bg-white/50 rounded-full shadow-sm">
                                                {status === 'success' && <CheckCircle className="h-6 w-6" />}
                                                {status === 'error' && <XCircle className="h-6 w-6" />}
                                                {status === 'checking' && <Loader2 className="h-6 w-6 animate-spin" />}
                                            </div>
                                            <div className="flex-1">
                                                <AlertTitle className="text-lg font-bold mb-1">
                                                    {status === 'success' && 'Absensi Berhasil!'}
                                                    {status === 'error' && 'Gagal Melakukan Absen'}
                                                    {status === 'checking' && 'Sistem Memproses...'}
                                                </AlertTitle>
                                                <AlertDescription className="text-base font-medium opacity-90 leading-tight">
                                                    {message}
                                                </AlertDescription>
                                            </div>
                                        </div>
                                    </Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!locationSupported && (
                            <Alert variant="destructive" className="rounded-3xl border-2">
                                <ShieldAlert className="h-5 w-5" />
                                <AlertTitle className="font-bold">GPS Bermasalah</AlertTitle>
                                <AlertDescription className="font-medium">
                                    Browser atau perangkat Anda memblokir akses lokasi. Harap aktifkan GPS Anda.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-8 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Riwayat Absensi</CardTitle>
                                <CardDescription className="font-medium">Rekaman kehadiran Anda 30 hari terakhir.</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {attendanceHistory.length > 0 ? (
                        <div className="space-y-4">
                            {/* Mobile list */}
                            <div className="md:hidden space-y-4">
                                {attendanceHistory.map((record) => (
                                    <div key={record.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-0.5">
                                                <p className="font-black text-slate-900 text-lg">
                                                    {format(new Date(record.date), 'dd MMMM', { locale: id })}
                                                </p>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    {format(new Date(record.date), 'eeee', { locale: id })}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={cn("px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider", getStatusBadge(record.status || 'Tidak Hadir'))}>
                                                {record.status || 'Tidak Hadir'}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-emerald-50 rounded-lg">
                                                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Masuk</p>
                                                    <p className="font-mono font-bold text-sm text-slate-700">{record.checkIn || '--:--'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-rose-50 rounded-lg">
                                                    <Clock className="h-3.5 w-3.5 text-rose-600" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pulang</p>
                                                    <p className="font-mono font-bold text-sm text-slate-700">{record.checkOut || '--:--'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-100">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="font-bold text-slate-700 h-14 pl-6">Hari, Tanggal</TableHead>
                                            <TableHead className="text-center font-bold text-slate-700">Jam Masuk</TableHead>
                                            <TableHead className="text-center font-bold text-slate-700">Jam Pulang</TableHead>
                                            <TableHead className="text-center font-bold text-slate-700">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceHistory.map((record) => (
                                            <TableRow key={record.id} className="hover:bg-slate-50/30 transition-colors">
                                                <TableCell className="font-bold text-slate-900 py-5 pl-6">
                                                    {format(new Date(record.date), 'eeee, dd MMMM yyyy', { locale: id })}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={cn(
                                                        "font-mono font-black px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100",
                                                        record.checkIn && "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    )}>
                                                        {record.checkIn || '--:--'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={cn(
                                                        "font-mono font-black px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100",
                                                        record.checkOut && "bg-blue-50 text-blue-700 border-blue-100"
                                                    )}>
                                                        {record.checkOut || '--:--'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={cn("px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider", getStatusBadge(record.status || 'Tidak Hadir'))}>
                                                        {record.status || 'Tidak Hadir'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-5 bg-white rounded-full shadow-lg">
                                    <Clock className="h-12 w-12 text-slate-200" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-400">Belum Ada Riwayat</h3>
                                    <p className="text-slate-400 font-medium">Absensi harian Anda akan muncul di sini.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

