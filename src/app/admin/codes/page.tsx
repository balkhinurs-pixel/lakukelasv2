
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyRound } from 'lucide-react';
import { GenerateCodeButton } from './generate-button';

export default function AdminCodesPage() {

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Kelola Kode Aktivasi</h1>
                    <p className="text-muted-foreground">Fitur ini tidak lagi digunakan karena semua akun otomatis Pro.</p>
                </div>
                <GenerateCodeButton />
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Fitur Dinonaktifkan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-12">
                        <KeyRound className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium">Sistem Kode Aktivasi Dihapus</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Semua pengguna kini mendapatkan akses Pro secara otomatis tanpa perlu kode aktivasi.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
