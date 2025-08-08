
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, UserPlus, Edit, Trash2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type UserStatus = 'Pro' | 'Free';

type User = {
    id: string;
    name: string;
    email: string;
    status: UserStatus;
    joinDate: Date;
};

const initialUsers: User[] = [
    { id: 'USR001', name: 'Guru Tangguh', email: 'guru@sekolah.id', status: 'Pro', joinDate: new Date('2023-01-15') },
    { id: 'USR002', name: 'Andi Pratama', email: 'andi.p@email.com', status: 'Free', joinDate: new Date('2023-02-20') },
    { id: 'USR003', name: 'Siti Aminah', email: 'siti.a@email.com', status: 'Pro', joinDate: new Date('2023-03-10') },
    { id: 'USR004', name: 'Budi Setiawan', email: 'budi.s@email.com', status: 'Free', joinDate: new Date('2023-04-05') },
    { id: 'USR005', name: 'Dewi Lestari', email: 'dewi.l@email.com', status: 'Pro', joinDate: new Date('2023-05-21') },
];


export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<User[]>(initialUsers);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [isManageDialogOpen, setIsManageDialogOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
    const [newStatus, setNewStatus] = React.useState<UserStatus>('Free');
    const { toast } = useToast();

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleManageClick = (user: User) => {
        setSelectedUser(user);
        setNewStatus(user.status);
        setIsManageDialogOpen(true);
    };

    const handleStatusChange = () => {
        if (!selectedUser) return;
        
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u));
        
        toast({
            title: "Status Diperbarui",
            description: `Status untuk ${selectedUser.name} telah diubah menjadi ${newStatus}.`,
        });

        setIsManageDialogOpen(false);
        setSelectedUser(null);
    }

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
         <Card className="shadow-sm">
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
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="Pro">Pro</SelectItem>
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
                            <TableHead>Status</TableHead>
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
                                    <Badge variant={user.status === 'Pro' ? 'default' : 'secondary'} className={user.status === 'Pro' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(user.joinDate, 'dd MMMM yyyy')}</TableCell>
                                <TableCell className="text-right">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => handleManageClick(user)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Ubah Status
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Hapus Pengguna
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

         <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kelola Status Pengguna</DialogTitle>
                    <DialogDescription>
                        Ubah status aktivasi untuk <span className="font-semibold">{selectedUser?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subscription-plan">Status Akun</Label>
                        <Select value={newStatus} onValueChange={(value) => setNewStatus(value as UserStatus)}>
                            <SelectTrigger id="subscription-plan">
                                <SelectValue placeholder="Pilih status baru" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Free">Free</SelectItem>
                                <SelectItem value="Pro">Pro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsManageDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleStatusChange}>Simpan Perubahan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
