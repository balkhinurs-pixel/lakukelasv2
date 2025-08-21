
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
    const teachers = users.filter(u => u.role === 'teacher');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Daftar Guru</h1>
                <p className="text-muted-foreground">Kelola semua akun guru yang terdaftar di sistem.</p>
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Daftar Guru</CardTitle>
                    <CardDescription>Total guru terdaftar: {teachers.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable initialUsers={teachers} />
                </CardContent>
            </Card>
        </div>
    );
}
