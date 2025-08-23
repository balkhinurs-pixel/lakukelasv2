
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LocationSettingsPage() {

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
            
            <Card>
                <CardHeader>
                    <CardTitle>Konfigurasi Absensi</CardTitle>
                    <CardDescription>
                        Pengaturan ini akan menjadi acuan untuk semua absensi guru. Gunakan situs seperti Google Maps untuk mendapatkan koordinat yang akurat.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-500" /> Pengaturan Lokasi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="latitude">Latitude</Label>
                                <Input id="latitude" placeholder="-6.2088" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude</Label>
                                <Input id="longitude" placeholder="106.8456" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="radius">Radius Toleransi (dalam meter)</Label>
                            <Input id="radius" type="number" placeholder="50" />
                            <p className="text-xs text-muted-foreground">
                                Jarak maksimal dari titik pusat di mana guru masih dianggap berada di lokasi.
                            </p>
                        </div>
                    </div>

                    <div className="border-t pt-8 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-green-500" /> Pengaturan Waktu</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="check_in_start">Waktu Mulai Absen Masuk</Label>
                                <Input id="check_in_start" type="time" defaultValue="06:30" />
                                <p className="text-xs text-muted-foreground">Waktu paling pagi guru bisa melakukan absen masuk.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="check_in_deadline">Batas Waktu Absen Masuk</Label>
                                <Input id="check_in_deadline" type="time" defaultValue="07:15" />
                                <p className="text-xs text-muted-foreground">Batas waktu untuk dianggap "Tepat Waktu". Lewat dari jam ini akan dianggap "Terlambat".</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <Button disabled>
                        Simpan Pengaturan
                    </Button>
                </CardFooter>
            </Card>

            <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Informasi Penting</AlertTitle>
                <AlertDescription>
                    Fitur penyimpanan untuk pengaturan ini sedang dalam pengembangan. Pengaturan yang Anda masukkan belum akan diterapkan pada sistem absensi.
                </AlertDescription>
            </Alert>
        </div>
    )
}
