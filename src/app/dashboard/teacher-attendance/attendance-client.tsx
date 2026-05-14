
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full text-slate-500 font-bold h-12 rounded-2xl">Ajukan Izin / Sakit</Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Izin Tidak Masuk</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <RadioGroup value={leaveType} onValueChange={(v: any) => setLeaveType(v)} className="flex gap-4">
                        <div className="flex items-center space-x-2 border p-3 rounded-xl flex-1"><RadioGroupItem value="Sakit" id="sakit" /><Label htmlFor="sakit">Sakit</Label></div>
                        <div className="flex items-center space-x-2 border p-3 rounded-xl flex-1"><RadioGroupItem value="Izin" id="izin" /><Label htmlFor="izin">Izin</Label></div>
                    </RadioGroup>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Alasan..." className="rounded-xl" />
                </div>
                <DialogFooter><Button onClick={handleLeaveRequest} disabled={loading} className="w-full h-12 rounded-xl">Kirim Pengajuan</Button></DialogFooter>
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
            const pos: any = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
            const formData = new FormData();
            formData.append('type', type);
            formData.append('latitude', pos.coords.latitude.toString());
            formData.append('longitude', pos.coords.longitude.toString());
            const result = await recordTeacherAttendance(formData);
            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                window.location.reload();
            } else {
                setStatus('error');
                setMessage(result.error || 'Gagal');
            }
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message || 'Kesalahan GPS');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 p-1">
            <HandWrittenTitle title="Presensi Lokasi" subtitle="Guru" className="py-4 md:py-6" />

            <DigitalClock />

            <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-8 pb-6 text-center sm:text-left">
                    <CardTitle className="text-xl font-bold">Lakukan Absen Sekarang</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="h-20 sm:h-24 px-8 text-xl font-black rounded-3xl bg-slate-900 text-white flex-1" onClick={() => handleAttendance('in')} disabled={loading}>
                            ABSEN MASUK
                        </Button>
                        <Button size="lg" variant="outline" className="h-20 sm:h-24 px-8 text-xl font-black rounded-3xl border-2 border-slate-200 text-slate-600 flex-1" onClick={() => handleAttendance('out')} disabled={loading}>
                            ABSEN PULANG
                        </Button>
                    </div>
                    <div className="flex justify-center border-t pt-6"><LeaveRequestDialog onLeaveSubmitted={() => window.location.reload()} /></div>
                    <AnimatePresence>
                        {status !== 'idle' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Alert className="rounded-3xl bg-slate-50">{message}</Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-8">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-bold">Riwayat</CardTitle>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {filteredHistory.length > 0 ? (
                        <div className="space-y-4">
                            {filteredHistory.map((r) => (
                                <div key={r.id} className="border p-4 rounded-3xl flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{format(parseISO(r.date), 'dd MMM yyyy', {locale: id})}</p>
                                        <p className="text-xs text-muted-foreground uppercase">{format(parseISO(r.date), 'eeee', {locale: id})}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-sm">{r.checkIn || '--'} / {r.checkOut || '--'}</p>
                                        <Badge variant="outline" className="mt-1">{r.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 opacity-50"><Clock className="mx-auto mb-2 h-10 w-10"/><p>Tidak ada data</p></div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
