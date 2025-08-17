
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';

export default function CheckEmailPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md text-center">
                 <div className="flex flex-col items-center justify-center mb-6">
                    <Image src="/login.png" alt="LakuKelas Illustration" width={280} height={60} className="w-48 h-auto" />
                    <h1 className="text-5xl font-bold tracking-tighter text-foreground">
                        <span>Laku</span>
                        <span className="text-primary">Kelas</span>
                    </h1>
                </div>
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                            <MailCheck className="h-8 w-8 text-green-700" />
                        </div>
                        <CardTitle className="text-2xl">Konfirmasi Email Anda</CardTitle>
                        <CardDescription>
                            Pendaftaran Anda hampir selesai! Kami telah mengirimkan tautan verifikasi ke alamat email Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Silakan buka email Anda dan klik tautan untuk mengaktifkan akun Anda. Jika Anda tidak menemukannya, mohon periksa folder spam atau sampah.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/">Kembali ke Halaman Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
