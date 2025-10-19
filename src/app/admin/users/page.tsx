
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
    // Show both teachers and headmasters in the management table
    const staff = users.filter(u => u.role === 'teacher' || u.role === 'headmaster');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Daftar Staf Pengajar</h1>
                <p className="text-muted-foreground">Kelola semua akun guru dan kepala sekolah yang terdaftar di sistem.</p>
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Semua Staf Pengajar</CardTitle>
                    <CardDescription>Total staf terdaftar: {staff.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable initialUsers={staff} />
                </CardContent>
            </Card>
        </div>
    );
}
