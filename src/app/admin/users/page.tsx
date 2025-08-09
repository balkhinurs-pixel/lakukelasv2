
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/lib/types";

function FormattedDate({ dateString }: { dateString: string }) {
    if (!dateString) return null;
    try {
        return <>{format(new Date(dateString), 'dd MMMM yyyy')}</>;
    } catch (error) {
        return null;
    }
}


export default function AdminUsersPage({ users: initialUsers }: { users: Profile[] }) {
    const [users, setUsers] = React.useState<Profile[]>(initialUsers);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [isManageDialogOpen, setIsManageDialogOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<Profile | null>(null);
    const [newStatus, setNewStatus] = React.useState<'Pro' | 'Free'>('Free');
    const { toast } = useToast();

    React.useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || user.account_status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleManageClick = (user: Profile) => {
        setSelectedUser(user);
        setNewStatus(user.account_status);
        setIsManageDialogOpen(true);
    };

    const handleStatusChange = () => {
        if (!selectedUser) return;
        
        // This part would be a server action in a real app
        // setUsers(users.map(u => u.id === selectedUser.id ? { ...u, account_status: newStatus } : u));
        
        toast({
            title: "Status Diperbarui (Simulasi)",
            description: `Status untuk ${selectedUser.full_name} akan diubah menjadi ${newStatus}. Implementasikan server action untuk menyimpan ini.`,
        });

        setIsManageDialogOpen(false);
        setSelectedUser(null);
    }
    
    const handleDeleteUser = (userId: string) => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;
        
        // This part would be a server action in a real app
        // setUsers(users.filter(u => u.id !== userId));
        toast({
            title: "Pengguna Dihapus (Simulasi)",
            description: `Pengguna ${userToDelete.full_name} akan dihapus. Implementasikan server action untuk menyimpan ini.`,
            variant: "destructive"
        });
    }

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
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <CardTitle>Daftar Pengguna</CardTitle>
                        <CardDescription>Total pengguna terdaftar: {users.length}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Input 
                            placeholder="Cari nama atau email..." 
                            className="w-full md:w-auto flex-grow"
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
                <div className="overflow-x-auto">
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
                                    <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.account_status === 'Pro' ? 'default' : 'secondary'} className={user.account_status === 'Pro' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                                            {user.account_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <FormattedDate dateString={user.created_at} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => handleManageClick(user)} disabled>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Ubah Status
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Hapus Pengguna
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus pengguna <span className="font-semibold">{user.full_name}</span> secara permanen dari server.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                                        Ya, Hapus Pengguna
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

         <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kelola Status Pengguna</DialogTitle>
                    <DialogDescription>
                        Ubah status aktivasi untuk <span className="font-semibold">{selectedUser?.full_name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subscription-plan">Status Akun</Label>
                        <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ('Pro' | 'Free'))}>
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
                    <Button onClick={handleStatusChange} disabled>Simpan Perubahan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

// This wrapper fetches the data on the server and passes it to the client component.
export default async function AdminUsersPageWrapper() {
    const { getAllUsers } = await import('@/lib/data');
    const users = await getAllUsers();
    return <AdminUsersPage users={users} />;
}
