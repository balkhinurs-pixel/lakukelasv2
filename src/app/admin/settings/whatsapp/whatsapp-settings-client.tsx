
"use client"

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2, CheckCircle, ExternalLink, Zap, ShieldCheck, BellRing, Clock, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { saveWhatsAppSettings, testFonnteConnection, sendTestWhatsApp } from "@/lib/actions/admin";
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
    const [testing, setTesting] = React.useState(false);
    const [sendingTest, setSendingTest] = React.useState(false);
    const [settings, setSettings] = React.useState<WASettings>(initialSettings);
    const [testPhone, setTestPhone] = React.useState('');
    const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);

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

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);

        const result = await testFonnteConnection(settings.token);

        if (result.success) {
            setTestResult({ success: true, message: result.message || 'Koneksi berhasil.' });
            toast({
                title: "Koneksi Berhasil",
                description: result.message,
            });
        } else {
            setTestResult({ success: false, message: result.error || 'Koneksi gagal.' });
            toast({
                title: "Koneksi Gagal",
                description: result.error,
                variant: "destructive"
            });
        }
        setTesting(false);
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
                                    Atur token API dan kebijakan pengiriman pesan pengingat.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="token">Fonnte API Token</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            id="token" 
                                            type="password"
                                            placeholder="Masukkan token dari fonnte.com" 
                                            value={settings.token}
                                            onChange={(e) => setSettings({...settings, token: e.target.value})}
                                            required
                                        />
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            onClick={handleTestConnection}
                                            disabled={testing || !settings.token}
                                            className="shrink-0"
                                        >
                                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                                            Test
                                        </Button>
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
                                        <p className="text-sm text-muted-foreground">Kirim jadwal mengajar ke guru setiap pagi.</p>
                                    </div>
                                    <Switch 
                                        checked={settings.enabled}
                                        onCheckedChange={(val) => setSettings({...settings, enabled: val})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="time" className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        Waktu Pengiriman (WIB)
                                    </Label>
                                    <Input 
                                        id="time" 
                                        type="time"
                                        value={settings.time}
                                        onChange={(e) => setSettings({...settings, time: e.target.value})}
                                        className="w-full md:w-[200px]"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground italic">
                                        Saran: Atur antara pukul 06:00 s/d 07:00 WIB.
                                    </p>
                                </div>

                                {testResult && (
                                    <Alert className={testResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
                                        {testResult.success ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Zap className="h-4 w-4 text-red-600" />}
                                        <AlertTitle className={testResult.success ? "text-emerald-800" : "text-red-800"}>
                                            Status Koneksi: {testResult.success ? 'Berhasil' : 'Gagal'}
                                        </AlertTitle>
                                        <AlertDescription className={testResult.success ? "text-emerald-700" : "text-red-700"}>
                                            {testResult.message}
                                        </AlertDescription>
                                    </Alert>
                                )}
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
                                Uji apakah pesan benar-benar sampai ke nomor tujuan.
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
                                <span className="text-sm">Status Cron</span>
                                <Badge variant="outline" className={settings.enabled ? "bg-green-100 text-green-800 border-green-200" : "bg-slate-200"}>
                                    {settings.enabled ? "Terjadwal" : "Nonaktif"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Jadwal Vercel</span>
                                <span className="text-xs font-mono bg-white px-2 py-1 rounded border">0 23 * * * (UTC)</span>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Cron Job akan memanggil endpoint <code>/api/cron/wa-reminder</code> setiap hari pada pukul 06:00 WIB untuk memproses antrean pesan.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-500" /> Keamanan & Syarat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>Agar pengingat otomatis berfungsi, pastikan:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Nomor telepon guru sudah diawali kode negara (contoh: 62812xxx).</li>
                                <li>Device di dashboard Fonnte dalam status <strong>Connected</strong>.</li>
                                <li>Admin telah mengatur Tahun Ajaran Aktif.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
