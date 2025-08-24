
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, LogIn, LogOut, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { recordTeacherAttendance } from "@/lib/actions";

export default function TeacherAttendancePage() {
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [message, setMessage] = React.useState('');
    const [locationSupported, setLocationSupported] = React.useState(true);

    const { toast } = useToast();

    React.useEffect(() => {
        // Check if geolocation is supported
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
                     <div className="text-center text-muted-foreground py-8">
                        <p>Tampilan riwayat absensi akan segera hadir.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
