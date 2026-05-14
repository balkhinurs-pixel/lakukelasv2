
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert } from "@/components/ui/alert";
import { recordTeacherAttendance } from "@/lib/actions";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { cn, formatTime } from "@/lib/utils";
import type { TeacherAttendance, Profile } from "@/lib/types";
import DigitalClock from "./DigitalClock";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

const months = [
    { value: "all", label: 'Semua Bulan' },
    { value: "1", label: 'Januari' }, { value: "2", label: 'Februari' },
    { value: "3", label: 'Maret' }, { value: "4", label: 'April' },
    { value: "5", label: 'Mei' }, { value: "6", label: 'Juni' },
    { value: "7", label: 'Juli' }, { value: "8", label: 'Agustus' },
    { value: "9", label: 'September' }, { value: "10", label: 'Oktober' },
    { value: "11", label: 'November' }, { value: "12", label: 'Desember' }
];

function LeaveRequestDialog({ onLeaveSubmitted }: { onLeaveSubmitted: () => void }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [leaveType, setLeaveType] = React.useState<'Sakit' | 'Izin'>('Sakit');
    const [reason, setReason] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    const handleLeaveRequest = async () => {
        if (!reason) {
            toast({ title: "Gagal", description: "Alasan harus diisi.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('type', 'leave');
        formData.append('leave_type', leaveType);
        formData.append('reason', reason);
        const result = await recordTeacherAttendance(formData);
        if (result.success) {
            toast({ title: "Berhasil", description: `Tercatat ${leaveType}.` });
            onLeaveSubmitted();
            setIsOpen(false);
        } else {
            toast({ title: "Gagal", description: result.error || "Gagal mengirim pengajuan.", variant: "destructive" });
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-orange-200 bg-orange-50/50 text-orange-700 hover:bg-orange-100 font-medium h-14 rounded-xl transition-all active:scale-95 text-base tracking-wide shadow-sm">
                    Ajukan Izin / Sakit
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
                <DialogHeader>
                    <DialogTitle>Izin Tidak Masuk</DialogTitle>
                    <DialogDescription>Pilih jenis ketidakhadiran dan berikan alasan yang jelas.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <RadioGroup value={leaveType} onValueChange={(v: any) => setLeaveType(v)} className="flex gap-4">
                        <div className="flex items-center space-x-2 border p-3 rounded-xl flex-1 bg-white cursor-pointer hover:bg-slate-50">
                            <RadioGroupItem value="Sakit" id="sakit" />
                            <Label htmlFor="sakit" className="cursor-pointer font-medium">Sakit</Label>
                        </div>
                        <div className="flex items-center space-x-2 border p-3 rounded-xl flex-1 bg-white cursor-pointer hover:bg-slate-50">
                            <RadioGroupItem value="Izin" id="izin" />
                            <Label htmlFor="izin" className="cursor-pointer font-medium">Izin</Label>
                        </div>
                    </RadioGroup>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Alasan Ketidakhadiran</Label>
                        <Textarea 
                            id="reason"
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            placeholder="Tulis alasan lengkap di sini..." 
                            className="rounded-xl min-h-[100px]" 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleLeaveRequest} disabled={loading} className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kirim Pengajuan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function TeacherAttendanceClient({ initialHistory }: { initialHistory: TeacherAttendance[], users: Profile[] }) {
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [message, setMessage] = React.useState('');
    const [selectedMonth, setSelectedMonth] = React.useState<string>((new Date().getMonth() + 1).toString());
    const { toast } = useToast();

    const filteredHistory = React.useMemo(() => {
        if (selectedMonth === 'all') return initialHistory;
        return initialHistory.filter(record => (parseISO(record.date).getMonth() + 1).toString() === selectedMonth);
    }, [initialHistory, selectedMonth]);

    const handleAttendance = async (type: 'in' | 'out') => {
        setLoading(true);
        setStatus('checking');
        setMessage('Mencari lokasi...');
        try {
            const pos: any = await new Promise((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true });
            });
            const formData = new FormData();
            formData.append('type', type);
            formData.append('latitude', pos.coords.latitude.toString());
            formData.append('longitude', pos.coords.longitude.toString());
            
            const result = await recordTeacherAttendance(formData);
            
            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                toast({ title: "Berhasil", description: result.message });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setStatus('error');
                setMessage(result.error || 'Gagal melakukan absensi.');
                toast({ title: "Gagal", description: result.error, variant: "destructive" });
            }
        } catch (e: any) {
            setStatus('error');
            let msg = 'Kesalahan GPS: Pastikan izin lokasi aktif.';
            if (e.code === 1) msg = "Izin lokasi ditolak oleh pengguna.";
            setMessage(msg);
            toast({ title: "Kesalahan", description: msg, variant: "destructive" });
        }
        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Tepat Waktu': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Terlambat': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Sakit': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Izin': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Tidak Hadir': return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    }

    return (
        <div className="space-y-6 p-1">
            <HandWrittenTitle title="Presensi Lokasi" subtitle="Guru" className="py-4 md:py-6" />

            <DigitalClock />

            <Card className="border-0 shadow-xl rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b p-6 text-center">
                    <CardTitle className="text-xl font-medium text-slate-800">Lakukan Absen Sekarang</CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-10 space-y-6">
                    <div className="flex flex-col gap-5">
                        <Button 
                            className="h-16 md:h-20 text-lg md:text-xl font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95 tracking-wider" 
                            onClick={() => handleAttendance('in')} 
                            disabled={loading}
                        >
                            {loading && status === 'checking' ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "ABSEN MASUK"}
                        </Button>
                        <Button 
                            className="h-16 md:h-20 text-lg md:text-xl font-medium rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 transition-all active:scale-95 tracking-wider" 
                            onClick={() => handleAttendance('out')} 
                            disabled={loading}
                        >
                             {loading && status === 'checking' ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "ABSEN PULANG"}
                        </Button>
                    </div>
                    
                    <div className="flex justify-center pt-6 border-t border-slate-100">
                        <LeaveRequestDialog onLeaveSubmitted={() => window.location.reload()} />
                    </div>

                    <AnimatePresence>
                        {status !== 'idle' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-4"
                            >
                                <Alert className={cn(
                                    "rounded-xl border border-slate-200 shadow-sm",
                                    status === 'success' ? "bg-emerald-50 text-emerald-800 border-emerald-200" : 
                                    status === 'error' ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-blue-50 text-blue-800 border-blue-200"
                                )}>
                                    <div className="flex items-center gap-3">
                                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <p className="text-sm font-medium">{message}</p>
                                    </div>
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-slate-400" />
                            <CardTitle className="text-lg font-semibold text-slate-800 uppercase tracking-wide">Riwayat Kehadiran</CardTitle>
                        </div>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-48 rounded-xl bg-white border-slate-200">
                                <SelectValue placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredHistory.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredHistory.map((r) => (
                                <div key={r.id} className="p-5 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 truncate text-base">
                                            {format(parseISO(r.date), 'dd MMMM yyyy', {locale: id})}
                                        </p>
                                        <p className="text-[11px] text-slate-400 uppercase tracking-widest font-medium mt-1">
                                            {format(parseISO(r.date), 'eeee', {locale: id})}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <div className="text-center">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-1">In</p>
                                                <p className="font-mono font-medium text-sm text-slate-700 leading-none">{r.checkIn || '--:--'}</p>
                                            </div>
                                            <div className="w-px h-6 bg-slate-200" />
                                            <div className="text-center">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-1">Out</p>
                                                <p className="font-mono font-medium text-sm text-slate-700 leading-none">{r.checkOut || '--:--'}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn("px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getStatusBadge(r.status))}>
                                            {r.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 opacity-40">
                            <Clock className="mx-auto mb-4 h-12 w-12 text-slate-300"/>
                            <p className="text-sm font-medium tracking-wide">Tidak ada riwayat absensi bulan ini</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
