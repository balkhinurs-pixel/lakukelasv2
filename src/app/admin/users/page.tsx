
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold font-headline">Kelola Pengguna</h1>
            <p className="text-muted-foreground">Lihat dan kelola semua pengguna terdaftar.</p>
        </div>
         <Card>
            <CardHeader>
                <CardTitle>Daftar Pengguna</CardTitle>
                <CardDescription>Placeholder untuk daftar pengguna.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Fitur manajemen pengguna akan tersedia di sini.</p>
            </CardContent>
        </Card>
    </div>
  );
}
