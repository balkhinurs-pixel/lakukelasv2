
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

type SubscriptionPlan = 'Free' | 'Semester' | 'Tahunan';

type User = {
    id: string;
    name: string;
    email: string;
    subscription: {
        status: 'Premium' | 'Free';
        planName: SubscriptionPlan;
        expiresAt: Date | null;
    };
    joinDate: Date;
};

const initialUsers: User[] = [
    { id: 'USR001', name: 'Guru Tangguh', email: 'guru@sekolah.id', subscription: { status: 'Premium', planName: 'Tahunan', expiresAt: new Date('2025-01-15') }, joinDate: new Date('2023-01-15') },
    { id: 'USR002', name: 'Andi Pratama', email: 'andi.p@email.com', subscription: { status: 'Free', planName: 'Free', expiresAt: null }, joinDate: new Date('2023-02-20') },
    { id: 'USR003', name: 'Siti Aminah', email: 'siti.a@email.com', subscription: { status: 'Premium', planName: 'Semester', expiresAt: new Date('2024-09-10') }, joinDate: new Date('2023-03-10') },
    { id: 'USR004', name: 'Budi Setiawan', email: 'budi.s@email.com', subscription: { status: 'Free', planName: 'Free', expiresAt: null }, joinDate: new Date('2023-04-05') },
    { id: 'USR005', name: 'Dewi Lestari', email: 'dewi.l@email.com', subscription: { status: 'Premium', planName: 'Tahunan', expiresAt: new Date('2024-11-21') }, joinDate: new Date('2023-05-21') },
];


export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<User[]>(initialUsers);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterSubscription, setFilterSubscription] = React.useState('all');
    const [isManageDialogOpen, setIsManageDialogOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
    const [newPlan, setNewPlan] = React.useState<SubscriptionPlan>('Free');
    const { toast } = useToast();

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubscription = filterSubscription === 'all' || user.subscription.status === filterSubscription;
        return matchesSearch && matchesSubscription;
    });

    const handleManageClick = (user: User) => {
        setSelectedUser(user);
        setNewPlan(user.subscription.planName);
        setIsManageDialogOpen(true);
    };

    const handleSubscriptionChange = () => {
        if (!selectedUser) return;

        let newSubscription: User['subscription'];
        if (newPlan === 'Free') {
            newSubscription = { status: 'Free', planName: 'Free', expiresAt: null };
        } else {
            const now = new Date();
            const expiresAt = newPlan === 'Semester' ? addMonths(now, 6) : addMonths(now, 12);
            newSubscription = { status: 'Premium', planName: newPlan, expiresAt };
        }

        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, subscription: newSubscription } : u));
        
        toast({
            title: "Langganan Diperbarui",
            description: `Status langganan untuk ${selectedUser.name} telah diubah menjadi ${newPlan}.`,
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
                                    <Badge variant={user.subscription.status === 'Premium' ? 'default' : 'secondary'} className={user.subscription.status === 'Premium' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                                        {user.subscription.status}
                                    </Badge>
                                    {user.subscription.status === 'Premium' && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {user.subscription.planName} - Aktif s.d. {user.subscription.expiresAt ? format(user.subscription.expiresAt, 'dd MMM yyyy') : '-'}
                                        </div>
                                    )}
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
                                                Ubah Langganan
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
                    <DialogTitle>Kelola Langganan Pengguna</DialogTitle>
                    <DialogDescription>
                        Ubah status langganan untuk <span className="font-semibold">{selectedUser?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subscription-plan">Paket Langganan</Label>
                        <Select value={newPlan} onValueChange={(value) => setNewPlan(value as SubscriptionPlan)}>
                            <SelectTrigger id="subscription-plan">
                                <SelectValue placeholder="Pilih paket baru" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Free">Free</SelectItem>
                                <SelectItem value="Semester">Premium - Semester</SelectItem>
                                <SelectItem value="Tahunan">Premium - Tahunan</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Memilih paket premium akan mengatur tanggal kedaluwarsa baru dari hari ini.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsManageDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleSubscriptionChange}>Simpan Perubahan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
