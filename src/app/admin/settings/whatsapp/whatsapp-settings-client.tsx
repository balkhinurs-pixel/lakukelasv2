
"use client"

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2, ExternalLink, ShieldCheck, BellRing, Clock, Send, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { saveWhatsAppSettings, sendTestWhatsApp } from "@/lib/actions/admin";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type WASettings = {
    token: string;
    enabled: boolean;
    time: string;
};

export default function WhatsAppSettingsClient({ initialSettings }: { initialSettings: WASettings }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [sendingTest, setSendingTest] = React.useState(false);
    const [settings, setSettings] = React.useState<WASettings>(initialSettings);
    const [testPhone, setTestPhone] = React.useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await saveWhatsAppSettings(settings.token, settings.enabled, settings.time);

        if (result.success) {
            toast({
                title: "Berhasil Disimpan",
                description: "Pengaturan WhatsApp telah diperbarui.",
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

    const handleSendTestMessage = async () => {
        if (!testPhone) {
            toast({ title: "Input Dibutuhkan", description: "Masukkan nomor WhatsApp tujuan untuk tes.", variant: "destructive" });
            return;
        }

        setSendingTest(true);
        const result = await sendTestWhatsApp(settings.token, testPhone);

        if (result.success) {
            toast({
                title: "Pesan Terkirim",
                description: result.message,
            });
        } else {
            toast({
                title: "Gagal Mengirim",
                description: result.error,
                variant: "destructive"
            });
        }
        setSendingTest(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                    <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Pengaturan WhatsApp</h1>
                    <p className="text-slate-600 mt-1">Konfigurasi WhatsApp Gateway menggunakan Fonnte untuk notifikasi otomatis.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSave}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Konfigurasi Gateway</CardTitle>
                                <CardDescription>
                                    Gunakan Device Token untuk stabilitas pengiriman pesan yang lebih baik.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="token">Fonnte Token</Label>
                                    <Input 
                                        id="token" 
                                        type="password"
                                        placeholder="Masukkan Token" 
                                        value={settings.token}
                                        onChange={(e) => setSettings({...settings, token: e.target.value})}
                                        required
                                    />
                                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                                        <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                        <div className="text-xs text-amber-800 leading-relaxed">
                                            <p className="font-bold mb-1">PANDUAN TOKEN:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                <li>Sangat disarankan menggunakan <strong>Device Token</strong> (Klik tombol hitam 'Token' di menu Device pada dashboard Fonnte).</li>
                                                <li>Pastikan status perangkat adalah <strong>Connected</strong>.</li>
                                                <li>Verifikasi konfigurasi dengan tombol <strong>Kirim Tes</strong> di bawah.</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Dapatkan token di <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">fonnte.com <ExternalLink className="h-3 w-3 ml-1" /></a>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg border bg-slate-50/50">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <BellRing className="h-4 w-4 text-primary" />
                                            <Label className="text-base font-semibold">Pengingat Otomatis</Label>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Kirim jadwal mengajar ke guru setiap pagi pukul 06:00 WIB.</p>
                                    </div>
                                    <Switch 
                                        checked={settings.enabled}
                                        onCheckedChange={(val) => setSettings({...settings, enabled: val})}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-6">
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Pengaturan
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>

                    <Card className="border-blue-100 bg-blue-50/30">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Send className="h-5 w-5 text-blue-600" /> Uji Kirim Pesan
                            </CardTitle>
                            <CardDescription>
                                Masukkan nomor tujuan untuk memastikan pesan bisa terkirim dengan token di atas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="test_phone">Nomor WhatsApp Tujuan</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="test_phone" 
                                        placeholder="Contoh: 628123456789" 
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={handleSendTestMessage}
                                        disabled={sendingTest || !settings.token || !testPhone}
                                        className="shrink-0 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                        Kirim Tes
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-50 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-base">Informasi Cron Job</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Status Penjadwalan</span>
                                <Badge variant="outline" className={settings.enabled ? "bg-green-100 text-green-800 border-green-200" : "bg-slate-200"}>
                                    {settings.enabled ? "Terjadwal Aktif" : "Nonaktif"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Waktu Eksekusi</span>
                                <span className="text-xs font-bold text-primary px-2 py-1 rounded border bg-white">06:00 WIB</span>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Sistem akan otomatis mengirimkan daftar mata pelajaran dan kelas yang harus diajar kepada masing-masing guru setiap pagi.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-500" /> Syarat Berhasil
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>Agar pengingat otomatis sampai ke guru:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Admin harus mengaktifkan toggle <strong>Pengingat Otomatis</strong>.</li>
                                <li>Data <strong>Nomor WhatsApp</strong> guru wajib diisi lengkap (diawali 62).</li>
                                <li>Guru harus memiliki <strong>Jadwal Mengajar</strong> pada hari tersebut.</li>
                                <li>Perangkat Fonnte harus tetap dalam status <strong>Connected</strong>.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
