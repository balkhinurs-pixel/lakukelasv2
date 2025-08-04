
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { format } from "date-fns";

const users = [
    { id: 'USR001', name: 'Guru Tangguh', email: 'guru@sekolah.id', subscription: 'Premium', joinDate: new Date('2023-01-15') },
    { id: 'USR002', name: 'Andi Pratama', email: 'andi.p@email.com', subscription: 'Free', joinDate: new Date('2023-02-20') },
    { id: 'USR003', name: 'Siti Aminah', email: 'siti.a@email.com', subscription: 'Premium', joinDate: new Date('2023-03-10') },
    { id: 'USR004', name: 'Budi Setiawan', email: 'budi.s@email.com', subscription: 'Free', joinDate: new Date('2023-04-05') },
    { id: 'USR005', name: 'Dewi Lestari', email: 'dewi.l@email.com', subscription: 'Premium', joinDate: new Date('2023-05-21') },
];


export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterSubscription, setFilterSubscription] = React.useState('all');

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubscription = filterSubscription === 'all' || user.subscription === filterSubscription;
        return matchesSearch && matchesSubscription;
    });

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">Kelola Pengguna</h1>
                <p className="text-muted-foreground">Lihat, cari, dan kelola semua pengguna terdaftar.</p>
            </div>
            <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Tambah Pengguna
            </Button>
        </div>
         <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <CardTitle>Daftar Pengguna</CardTitle>
                        <CardDescription>Total pengguna terdaftar: {users.length}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="Cari nama atau email..." 
                            className="w-full md:w-[250px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select value={filterSubscription} onValueChange={setFilterSubscription}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter Langganan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Langganan</SelectItem>
                                <SelectItem value="Premium">Premium</SelectItem>
                                <SelectItem value="Free">Free</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Pengguna</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Langganan</TableHead>
                            <TableHead>Tanggal Bergabung</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.subscription === 'Premium' ? 'secondary' : 'outline'} className={user.subscription === 'Premium' ? 'text-green-700 bg-green-100' : ''}>
                                        {user.subscription}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(user.joinDate, 'dd MMMM yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
