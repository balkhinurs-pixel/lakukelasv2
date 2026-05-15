"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flag, School, ChevronRight, Calendar as CalendarIcon, Filter, Clock, Briefcase, Coffee, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { recordTeacherAttendance } from "@/lib/actions";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { cn, formatTime } from "@/lib/utils";
import type { TeacherAttendance, Profile, Holiday } from "@/lib/types";
import DigitalClock from "./DigitalClock";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LottieCalendar } from "@/components/ui/lottie-calendar";
import { LottieSchoolHoliday } from "@/components/ui/lottie-school-holiday";

const months = [
    { value: "1", label: 'Januari' }, { value: "2", label: 'Februari' },
    { value: "3", label: 'Maret' }, { value: "4", label: 'April' },
    { value: "5", label: 'Mei' }, { value: "6", label: 'Juni' },
    { value: "7", label: 'Juli' }, { value: "8", label: 'Agustus' },
    { value: "9", label: 'September' }, { value: "10", label: 'Oktober' },
    { value: "11", label: 'November' }, { value: "12", label: 'Desember' }
];

function LeaveRequestDialog({ onLeaveSubmitted, loading: parentLoading }: { onLeaveSubmitted: () => void, parentLoading: boolean }) {
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
            setReason('');
        } else {
            toast({ title: "Gagal", description: result.error || "Gagal mengirim pengajuan.", variant: "destructive" });
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button 
                    disabled={parentLoading}
                    className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-white shadow-md border border-slate-100 transition-all active:scale-95 group hover:shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-slate-900">Ajukan Izin / Sakit</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Formulir Ketidakhadiran</span>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                </button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] max-w-[92vw] sm:max-w-md border-0 shadow-2xl p-6 sm:p-10">
                <DialogHeader className="pb-6">
                    <DialogTitle className="text-2xl font-bold text-center">Izin Tidak Masuk</DialogTitle>
                    <DialogDescription className="text-center">Berikan alasan yang jelas untuk dokumentasi sistem.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <RadioGroup value={leaveType} onValueChange={(v: any) => setLeaveType(v)} className="grid grid-cols-2 gap-4">
                        <label htmlFor="sakit" className={cn("flex flex-col items-center p-4 border-2 rounded-3xl cursor-pointer transition-all", leaveType === 'Sakit' ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white")}>
                            <RadioGroupItem value="Sakit" id="sakit" className="sr-only" />
                            <span className="text-3xl mb-1">🤒</span>
                            <span className="font-bold text-sm text-slate-700">Sakit</span>
                        </label>
                        <label htmlFor="izin" className={cn("flex flex-col items-center p-4 border-2 rounded-3xl cursor-pointer transition-all", leaveType === 'Izin' ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white")}>
                            <RadioGroupItem value="Izin" id="izin" className="sr-only" />
                            <span className="text-3xl mb-1">📩</span>
                            <span className="font-bold text-sm text-slate-700">Izin</span>
                        </label>
                    </RadioGroup>
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs font-bold uppercase text-slate-400 ml-1">Alasan Detail</Label>
                        <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Contoh: Sakit demam, keperluan keluarga..." className="rounded-2xl min-h-[120px] bg-slate-50 border-0 focus:ring-2 focus:ring-primary/20" />
                    </div>
                </div>
                <DialogFooter className="pt-6">
                    <Button onClick={handleLeaveRequest} disabled={loading} className="w-full h-14 rounded-2xl bg-slate-900 font-bold text-lg">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kirim Pengajuan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function TeacherAttendanceClient({ 
    initialHistory, 
    profile,
    todayHoliday 
}: { 
    initialHistory: TeacherAttendance[], 
    profile: Profile | null,
    todayHoliday: Holiday | null
}) {
    const [loading, setLoading] = React.useState(false);
    const [selectedMonth, setSelectedMonth] = React.useState<string>((new Date().getMonth() + 1).toString());
    const [isClient, setIsClient] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const handleAttendance = async (type: 'in' | 'out') => {
        setLoading(true);
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
                toast({ title: "Berhasil", description: result.message });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast({ title: "Gagal", description: result.error, variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Kesalahan", description: "Gagal mengambil lokasi GPS. Harap izinkan akses lokasi di browser/HP Anda.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const todayStr = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
    const todayRecord = initialHistory.find(r => r.date === todayStr);

    const filteredHistory = React.useMemo(() => {
        return initialHistory.filter(h => {
            const date = new Date(h.date);
            return (date.getMonth() + 1).toString() === selectedMonth;
        });
    }, [initialHistory, selectedMonth]);

    const getInfoCardContent = () => {
        if (todayHoliday) {
            return {
                title: todayHoliday.description,
                subtitle: "Informasi Hari Libur",
                icon: todayHoliday.type === 'national' ? Flag : School,
                isLottie: true,
                lottieType: todayHoliday.type
            };
        }
        
        const day = new Date().getDay();
        if (day === 0) { // Minggu
            return {
                title: "Hari Minggu",
                subtitle: "Waktunya Istirahat - Libur Rutin",
                icon: Coffee,
                iconBg: "bg-amber-500",
                isLottie: false
            };
        }

        return {
            title: "Silakan Melakukan Presensi",
            subtitle: todayRecord ? "Status: " + todayRecord.status : "Jangan lupa absen masuk & pulang tepat waktu",
            icon: todayRecord ? CheckCircle2 : Briefcase,
            iconBg: todayRecord ? "bg-emerald-500" : "bg-blue-500",
            isLottie: false
        };
    };

    if (!isClient) return null;

    const info = getInfoCardContent();
    const InfoIcon = info.icon;

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header Purple Gradient Theme - Centered profile */}
            <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-blue-500 text-white pt-10 pb-16 px-6 rounded-b-[3.5rem] shadow-2xl relative">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-white/20 text-white font-bold text-2xl">{profile?.full_name?.charAt(0) || 'G'}</AvatarFallback>
                    </Avatar>
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-black tracking-tight leading-tight">{profile?.full_name || 'Guru LakuKelas'}</h1>
                        <p className="text-white/70 text-sm font-medium">{profile?.nip || '-'}</p>
                        
                        <div className="pt-2">
                          {todayHoliday ? (
                            <Badge className={cn(
                              "text-[10px] font-black uppercase tracking-[0.1em] border-0 px-3 py-1",
                              todayHoliday.type === 'national' ? "bg-red-500 text-white" : "bg-indigo-500 text-white"
                            )}>
                              {todayHoliday.type === 'national' ? 'Libur Nasional' : 'Libur Sekolah'}
                            </Badge>
                          ) : todayRecord ? (
                            <Badge className="bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.1em] border-0 px-3 py-1">
                              {todayRecord.status}
                            </Badge>
                          ) : (
                            <Badge className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-[0.1em] border border-white/30 px-3 py-1">
                              <Briefcase className="w-3 h-3 mr-1.5 inline-block" />
                              Hari Kerja Aktif
                            </Badge>
                          )}
                        </div>
                    </div>
                </div>

                <div className="mb-2">
                    <DigitalClock />
                </div>
            </div>

            {/* Content Area */}
            <div className="px-6 -mt-10 space-y-6 pb-32">
                {/* Info Card (Always Visible) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="rounded-xl border-0 shadow-xl overflow-hidden bg-white/95 backdrop-blur border border-slate-100">
                        <CardContent className="p-5 flex items-center gap-4">
                            {info.isLottie ? (
                                <div className="shrink-0 flex items-center justify-center">
                                    {info.lottieType === 'national' ? (
                                        <LottieCalendar size={60} />
                                    ) : (
                                        <LottieSchoolHoliday size={60} />
                                    )}
                                </div>
                            ) : (
                                <div className={cn(
                                    "p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110 flex items-center justify-center overflow-hidden",
                                    info.iconBg
                                )}>
                                    <InfoIcon className="h-6 w-6" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <h4 className={cn(
                                    "font-bold leading-tight break-words",
                                    todayHoliday ? "text-rose-600" : "text-slate-900"
                                )}>
                                    {info.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                                    {info.subtitle}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Main Attendance Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleAttendance('in')}
                        disabled={loading || !!todayRecord?.checkIn || !!todayHoliday}
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-[2.5rem] shadow-lg transition-all active:scale-95 border-0 h-32",
                            (todayRecord?.checkIn || todayHoliday) 
                                ? "bg-emerald-50 text-emerald-600 opacity-60" 
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                        )}
                    >
                        {loading && <Loader2 className="h-6 w-6 animate-spin mb-2" />}
                        <span className="font-black text-base tracking-tight">JAM MASUK</span>
                        <span className="font-mono text-xs opacity-80 mt-1 font-bold">{todayRecord?.checkIn ? todayRecord.checkIn.substring(0, 5) : '--:--'}</span>
                    </button>

                    <button 
                        onClick={() => handleAttendance('out')}
                        disabled={loading || !todayRecord?.checkIn || !!todayRecord?.checkOut || !!todayHoliday}
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-[2.5rem] shadow-lg transition-all active:scale-95 border-0 h-32",
                            (todayRecord?.checkOut || todayHoliday) 
                                ? "bg-red-50 text-red-600 opacity-60" 
                                : (!todayRecord?.checkIn ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700")
                        )}
                    >
                        {loading && <Loader2 className="h-6 w-6 animate-spin mb-2" />}
                        <span className="font-black text-base tracking-tight">JAM PULANG</span>
                        <span className="font-mono text-xs opacity-80 mt-1 font-bold">{todayRecord?.checkOut ? todayRecord.checkOut.substring(0, 5) : '--:--'}</span>
                    </button>
                </div>

                {/* Wide Leave Button */}
                <LeaveRequestDialog onLeaveSubmitted={() => {}} loading={loading} />

                {/* History Section */}
                <div className="pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 px-1">
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Riwayat Presensi</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Catatan Kehadiran Anda</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:min-w-[180px]">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="h-12 pl-10 text-sm font-bold uppercase tracking-wider rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 shadow-2xl">
                                        {months.map(m => (
                                            <SelectItem key={m.value} value={m.value} className="text-sm font-bold py-3 uppercase">{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((r) => (
                                <div key={r.id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between shadow-sm border border-slate-100/80 hover:shadow-md transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-2xl shrink-0",
                                            r.status === 'Tepat Waktu' ? "bg-emerald-50 text-emerald-600" :
                                            r.status === 'Terlambat' ? "bg-amber-50 text-amber-600" :
                                            r.status === 'Sakit' ? "bg-orange-50 text-orange-600" :
                                            "bg-blue-50 text-blue-600"
                                        )}>
                                            <CalendarIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 leading-tight">{format(parseISO(r.date), 'dd MMMM yyyy', { locale: id })}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={cn(
                                                    "text-[8px] font-semibold uppercase tracking-wider border-0 px-2 py-0",
                                                    r.status === 'Tepat Waktu' ? "bg-emerald-100 text-emerald-700" :
                                                    r.status === 'Terlambat' ? "bg-amber-100 text-amber-700" :
                                                    r.status === 'Sakit' ? "bg-orange-100 text-orange-700" :
                                                    "bg-blue-100 text-blue-700"
                                                )}>
                                                    {r.status}
                                                </Badge>
                                                {r.reason && <span className="text-[9px] text-slate-400 font-medium italic truncate max-w-[80px]">({r.reason})</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs font-mono font-bold text-slate-700 leading-none">{r.checkIn?.substring(0, 5) || '--:--'}</p>
                                                <p className="text-[8px] text-slate-300 font-bold uppercase mt-1">In</p>
                                            </div>
                                            <div className="h-6 w-px bg-slate-100" />
                                            <div className="text-right">
                                                <p className="text-xs font-mono font-bold text-slate-700 leading-none">{r.checkOut?.substring(0, 5) || '--:--'}</p>
                                                <p className="text-[8px] text-slate-300 font-bold uppercase mt-1">Out</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center flex flex-col items-center">
                                <Clock className="h-10 w-10 text-slate-200 mb-3" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tidak ada data untuk bulan ini</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
