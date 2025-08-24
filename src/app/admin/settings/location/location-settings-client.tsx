"use client"

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { saveAttendanceSettings } from "@/lib/actions/admin";

type AttendanceSettings = {
    latitude: string;
    longitude: string;
    radius: number;
    check_in_start: string;
    check_in_deadline: string;
};

export default function LocationSettingsClient({ initialSettings }: { initialSettings: AttendanceSettings }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [settings, setSettings] = React.useState<AttendanceSettings>(initialSettings);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: name === 'radius' ? parseInt(value) || 0 : value
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Client-side validation
        if (!settings.latitude || !settings.longitude || !settings.radius || !settings.check_in_start || !settings.check_in_deadline) {
            toast({
                title: "Gagal Menyimpan",
                description: "Semua field wajib diisi.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('latitude', settings.latitude);
        formData.append('longitude', settings.longitude);
        formData.append('radius', settings.radius.toString());
        formData.append('check_in_start', settings.check_in_start);
        formData.append('check_in_deadline', settings.check_in_deadline);

        const result = await saveAttendanceSettings(formData);

        if (result.success) {
            toast({
                title: "Pengaturan Disimpan",
                description: "Pengaturan absensi guru berhasil disimpan dan akan diterapkan pada sistem.",
            });
            router.refresh();
        } else {
            toast({
                title: "Gagal Menyimpan",
                description: result.error,
                variant: "destructive"
            });
        }
        setLoading(false);
    };

    const isFormValid = settings.latitude && settings.longitude && settings.radius > 0 && settings.check_in_start && settings.check_in_deadline;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg">
                    <MapPin className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Pengaturan Absensi Guru</h1>
                    <p className="text-slate-600 mt-1">Atur titik koordinat, radius, dan jadwal waktu untuk absensi guru.</p>
                </div>
            </div>
            
            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>Konfigurasi Absensi</CardTitle>
                        <CardDescription>
                            Pengaturan ini akan menjadi acuan untuk semua absensi guru. Gunakan situs seperti Google Maps untuk mendapatkan koordinat yang akurat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-500" /> Pengaturan Lokasi
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="latitude">Latitude</Label>
                                    <Input 
                                        id="latitude" 
                                        name="latitude"
                                        placeholder="-6.2088" 
                                        value={settings.latitude}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="longitude">Longitude</Label>
                                    <Input 
                                        id="longitude" 
                                        name="longitude"
                                        placeholder="106.8456" 
                                        value={settings.longitude}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="radius">Radius Toleransi (dalam meter)</Label>
                                <Input 
                                    id="radius" 
                                    name="radius"
                                    type="number" 
                                    min="1"
                                    max="1000"
                                    placeholder="30" 
                                    value={settings.radius}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Jarak maksimal dari titik pusat di mana guru masih dianggap berada di lokasi.
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-8 space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-green-500" /> Pengaturan Waktu
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="check_in_start">Waktu Mulai Absen Masuk</Label>
                                    <Input 
                                        id="check_in_start" 
                                        name="check_in_start"
                                        type="time" 
                                        value={settings.check_in_start}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Waktu paling pagi guru bisa melakukan absen masuk.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="check_in_deadline">Batas Waktu Absen Masuk</Label>
                                    <Input 
                                        id="check_in_deadline" 
                                        name="check_in_deadline"
                                        type="time" 
                                        value={settings.check_in_deadline}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Batas waktu untuk dianggap "Tepat Waktu". Lewat dari jam ini akan dianggap "Terlambat".
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button type="submit" disabled={loading || !isFormValid}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Pengaturan
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            {initialSettings.latitude && initialSettings.longitude ? (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Pengaturan Aktif</AlertTitle>
                    <AlertDescription>
                        Pengaturan absensi sudah dikonfigurasi dan aktif digunakan untuk validasi lokasi guru.
                        Koordinat: {initialSettings.latitude}, {initialSettings.longitude} (Radius: {initialSettings.radius}m)
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Belum Dikonfigurasi</AlertTitle>
                    <AlertDescription>
                        Pengaturan absensi belum dikonfigurasi. Harap isi semua field di atas dan simpan untuk mengaktifkan sistem absensi berbasis lokasi.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}