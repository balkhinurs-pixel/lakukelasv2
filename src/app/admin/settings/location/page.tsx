
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

export default function LocationSettingsPage() {

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg">
                    <MapPin className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Pengaturan Lokasi Absensi</h1>
                    <p className="text-slate-600 mt-1">Atur titik koordinat dan radius untuk absensi guru.</p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Konfigurasi Geografis</CardTitle>
                    <CardDescription>
                        Lokasi ini akan menjadi acuan untuk semua absensi guru. Gunakan situs seperti Google Maps untuk mendapatkan koordinat yang akurat.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    <Button disabled>Simpan Pengaturan</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Peta Lokasi</CardTitle>
                    <CardDescription>
                        Visualisasi titik lokasi dan radius yang telah Anda tetapkan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Tampilan peta akan muncul di sini (Fitur segera hadir)</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
