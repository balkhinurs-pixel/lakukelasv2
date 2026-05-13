"use client"

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Loader2, CheckCircle, ExternalLink, Zap, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { saveWhatsAppSettings, testFonnteConnection } from "@/lib/actions/admin";

export default function WhatsAppSettingsClient({ initialToken }: { initialToken: string }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [testing, setTesting] = React.useState(false);
    const [token, setToken] = React.useState(initialToken);
    const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await saveWhatsAppSettings(token);

        if (result.success) {
            toast({
                title: "Berhasil Disimpan",
                description: "Token API Fonnte telah diperbarui.",
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

        const result = await testFonnteConnection(token);

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
                                <CardTitle>Fonnte API Gateway</CardTitle>
                                <CardDescription>
                                    Masukkan token API Fonnte Anda untuk mengaktifkan fitur pengingat otomatis.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="token">Fonnte API Token</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            id="token" 
                                            type="password"
                                            placeholder="Masukkan token dari fonnte.com" 
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            required
                                        />
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            onClick={handleTestConnection}
                                            disabled={testing || !token}
                                            className="shrink-0"
                                        >
                                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                                            Test Koneksi
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Anda bisa mendapatkan token di dashboard <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">fonnte.com <ExternalLink className="h-3 w-3 ml-1" /></a>
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
                                <Button type="submit" disabled={loading || !token}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Pengaturan
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-500" /> Keamanan & Privasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>Sistem ini hanya akan mengirimkan pesan otomatis jika:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Nomor telepon guru sudah terdaftar di profil masing-masing.</li>
                                <li>Guru memiliki jadwal mengajar pada hari tersebut.</li>
                                <li>Token API Fonnte valid dan status perangkat (device) sedang online.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-50 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-base">Status Pengingat (V4.7)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Pengingat Pagi</span>
                                <Badge variant="outline" className="bg-amber-100 text-amber-800">Menunggu Cron</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Notifikasi Alpha</span>
                                <Badge variant="outline" className="bg-slate-200">Nonaktif</Badge>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Fitur otomatisasi (Cron Jobs) akan diaktifkan setelah database mendukung kolom nomor telepon.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
