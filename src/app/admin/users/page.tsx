
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllUsers } from '@/lib/data';
import { UsersTable } from './users-table';


export default async function AdminUsersPage() {
    const users = await getAllUsers();
    // Menampilkan semua staf (Guru, Kepsek, Admin) agar bisa dikelola
    const staff = users.filter(u => u.role === 'teacher' || u.role === 'headmaster' || u.role === 'admin');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Manajemen Akun Staf</h1>
                <p className="text-muted-foreground">Kelola hak akses dan profil seluruh staf pengajar dan administrator.</p>
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Daftar Pengguna Sistem</CardTitle>
                    <CardDescription>Total staf terdaftar: {staff.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable initialUsers={staff} />
                </CardContent>
            </Card>
        </div>
    );
}
