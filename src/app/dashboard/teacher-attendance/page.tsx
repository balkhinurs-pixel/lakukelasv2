
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, LogIn, LogOut, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { recordTeacherAttendance } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TeacherAttendance } from "@/lib/types";

export default function TeacherAttendancePage() {
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [message, setMessage] = React.useState('');
    const [locationSupported, setLocationSupported] = React.useState(true);
    const [attendanceHistory, setAttendanceHistory] = React.useState<TeacherAttendance[]>([]);
    const [historyLoading, setHistoryLoading] = React.useState(true);

    const { toast } = useToast();

    React.useEffect(() => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            setLocationSupported(false);
            setStatus('error');
            setMessage('Browser Anda tidak mendukung fitur lokasi.');
        }
        
        // Load attendance history
        loadAttendanceHistory();
    }, []);

    const loadAttendanceHistory = async () => {
        try {
            setHistoryLoading(true);
            const supabase = createClient();
            
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setAttendanceHistory([]);
                return;
            }
            
            // Fetch attendance history for current user
            const { data, error } = await supabase
                .from('teacher_attendance')
                .select('*')
                .eq('teacher_id', user.id)
                .order('date', { ascending: false })
                .limit(30);
            
            if (error) {
                console.error('Error loading attendance history:', error);
                setAttendanceHistory([]);
                return;
            }
            
            // Transform data to match TeacherAttendance interface
            const transformedData: TeacherAttendance[] = data.map((item: any) => ({
                id: item.id,
                teacherId: item.teacher_id,
                teacherName: '',
                date: item.date,
                checkIn: item.check_in,
                checkOut: item.check_out,
                status: item.status
            }));
            
            setAttendanceHistory(transformedData);
        } catch (error) {
            console.error('Error loading attendance history:', error);
            setAttendanceHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

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
                            errorMessage = 'Akses lokasi ditolak. Mohon izinkan akses lokasi.';
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
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    };

    const handleAttendance = async (type: 'in' | 'out') => {
        if (!locationSupported) {
            toast({
                title: "Fitur Tidak Didukung",
                description: "Browser Anda tidak mendukung fitur lokasi.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setStatus('checking');
        setMessage(`Mencari lokasi Anda untuk absen ${type === 'in' ? 'masuk' : 'pulang'}...`);

        try {
            // Get user's current location
            const location = await getCurrentLocation();
            
            // Prepare form data
            const formData = new FormData();
            formData.append('type', type);
            formData.append('latitude', location.latitude.toString());
            formData.append('longitude', location.longitude.toString());
            formData.append('time', new Date().toISOString());

            // Call server action
            const result = await recordTeacherAttendance(formData);

            if (result.success) {
                setStatus('success');
                const successMessage = result.message || `Absen ${type === 'in' ? 'masuk' : 'pulang'} berhasil!`;
                const detailMessage = `${successMessage} (${result.distance}m dari sekolah)${result.status ? ` - Status: ${result.status}` : ''}`;
                setMessage(detailMessage);
                toast({
                    title: "Absensi Berhasil",
                    description: detailMessage,
                });
                // Reload attendance history
                loadAttendanceHistory();
            } else {
                setStatus('error');
                setMessage(result.error || 'Terjadi kesalahan saat melakukan absensi.');
                toast({
                    title: "Absensi Gagal",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            setStatus('error');
            const errorMessage = error instanceof Error ? error.message : 'Gagal mendapatkan lokasi Anda.';
            setMessage(errorMessage);
            toast({
                title: "Absensi Gagal",
                description: errorMessage,
                variant: "destructive",
            });
        }

        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Tepat Waktu':
                return 'text-green-700 bg-green-50 border-green-200';
            case 'Terlambat':
                return 'text-yellow-700 bg-yellow-50 border-yellow-200';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                    <MapPin className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Absensi Kehadiran Guru</h1>
                    <p className="text-slate-600 mt-1">Catat kehadiran Anda berdasarkan lokasi sekolah.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Absen Hari Ini</CardTitle>
                    <CardDescription>
                        Pastikan layanan lokasi di perangkat Anda aktif untuk melakukan absensi.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="space-y-4">
                        <Button 
                            size="lg" 
                            className="w-full max-w-xs h-14 text-lg"
                            onClick={() => handleAttendance('in')}
                            disabled={loading || !locationSupported}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                            Absen Masuk
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline"
                            className="w-full max-w-xs h-14 text-lg"
                            onClick={() => handleAttendance('out')}
                            disabled={loading || !locationSupported}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
                            Absen Pulang
                        </Button>
                    </div>

                    {!locationSupported && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Fitur Tidak Didukung</AlertTitle>
                            <AlertDescription>
                                Browser Anda tidak mendukung fitur lokasi. Mohon gunakan browser yang lebih modern.
                            </AlertDescription>
                        </Alert>
                    )}

                    {status !== 'idle' && locationSupported && (
                        <Alert variant={status === 'error' ? 'destructive' : 'default'} className={
                            status === 'success' ? 'bg-green-50 border-green-200 text-green-800 [&>svg]:text-green-600' : ''
                        }>
                            {status === 'success' && <CheckCircle className="h-4 w-4" />}
                            {status === 'error' && <XCircle className="h-4 w-4" />}
                            {status === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
                            <AlertTitle>
                                {status === 'success' && 'Berhasil'}
                                {status === 'error' && 'Gagal'}
                                {status === 'checking' && 'Memeriksa...'}
                            </AlertTitle>
                            <AlertDescription>
                                {message}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Absensi Anda</CardTitle>
                    <CardDescription>
                        Catatan kehadiran Anda selama sebulan terakhir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {historyLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">Memuat riwayat absensi...</p>
                        </div>
                    ) : attendanceHistory.length > 0 ? (
                        <div className="space-y-4">
                            {/* Mobile view */}
                            <div className="md:hidden space-y-3">
                                {attendanceHistory.map((record: TeacherAttendance) => (
                                    <div key={record.id} className="border rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">
                                                    {format(new Date(record.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                                                </p>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    <p>Masuk: {record.checkIn || '-'}</p>
                                                    <p>Pulang: {record.checkOut || '-'}</p>
                                                </div>
                                            </div>
                                            <Badge 
                                                variant="outline" 
                                                className={cn("font-semibold text-xs", getStatusBadge(record.status || 'Belum Absen'))}
                                            >
                                                {record.status || 'Belum Absen'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Desktop view */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead className="text-center">Jam Masuk</TableHead>
                                            <TableHead className="text-center">Jam Pulang</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendanceHistory.map((record: TeacherAttendance) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    {format(new Date(record.date), 'EEEE, dd MMM yyyy', { locale: id })}
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {record.checkIn || '-'}
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {record.checkOut || '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={cn("font-semibold", getStatusBadge(record.status || 'Belum Absen'))}
                                                    >
                                                        {record.status || 'Belum Absen'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Belum Ada Riwayat Absensi</h3>
                            <p className="mt-2 text-muted-foreground">
                                Riwayat absensi Anda akan muncul di sini setelah Anda melakukan absen masuk.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
