
import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { getAllUsers } from '@/lib/data';
import { UsersTable } from './users-table';


export default async function AdminUsersPage() {
    const users = await getAllUsers();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Kelola Pengguna</h1>
                    <p className="text-muted-foreground">Lihat, cari, dan kelola semua pengguna terdaftar.</p>
                </div>
                <Button disabled>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tambah Pengguna
                </Button>
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Daftar Pengguna</CardTitle>
                    <CardDescription>Total pengguna terdaftar: {users.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable initialUsers={users} />
                </CardContent>
            </Card>
        </div>
    );
}
