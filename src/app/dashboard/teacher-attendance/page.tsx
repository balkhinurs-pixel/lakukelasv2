
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, LogIn, LogOut, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TeacherAttendancePage() {
    const [loading, setLoading] = React.useState(false);
    const [status, setStatus] = React.useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [message, setMessage] = React.useState('');

    const { toast } = useToast();

    // Dummy function to simulate geolocation check
    const handleAttendance = async (type: 'in' | 'out') => {
        setLoading(true);
        setStatus('checking');
        setMessage(`Mencari lokasi Anda untuk absen ${type === 'in' ? 'masuk' : 'pulang'}...`);

        // Simulate getting geolocation and checking against admin settings
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate a successful check
        const isSuccess = Math.random() > 0.3; // 70% chance of success for demo

        if (isSuccess) {
            setStatus('success');
            const successMessage = `Absen ${type === 'in' ? 'masuk' : 'pulang'} berhasil pada ${new Date().toLocaleTimeString('id-ID')}!`;
            setMessage(successMessage);
            toast({
                title: "Absensi Berhasil",
                description: successMessage,
            });
        } else {
            setStatus('error');
            const errorMessage = "Anda berada di luar radius lokasi yang diizinkan.";
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
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                            Absen Masuk
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline"
                            className="w-full max-w-xs h-14 text-lg"
                            onClick={() => handleAttendance('out')}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
                            Absen Pulang
                        </Button>
                    </div>

                    {status !== 'idle' && (
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
