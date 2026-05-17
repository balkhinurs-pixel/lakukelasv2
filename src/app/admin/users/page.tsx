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
    // Menampilkan semua staf (Guru, Kepala, Admin) agar bisa dikelola
    const staff = users.filter(u => u.role === 'teacher' || u.role === 'headmaster' || u.role === 'admin');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Manajemen Akun Staf</h1>
                <p className="text-muted-foreground text-sm">Kelola hak akses dan profil staf pengajar.</p>
            </div>
            <Card className="shadow-sm border-0 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle className="text-lg font-bold">Daftar Pengguna Sistem</CardTitle>
                    <CardDescription className="text-xs">Total staf terdaftar: {staff.length}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <UsersTable initialUsers={staff} />
                </CardContent>
            </Card>
        </div>
    );
}
