"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Trash2, Loader2, Calendar, Mail, User, Users, Search, UserPlus, GraduationCap, Edit, Phone, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/lib/types";
import { deleteUser, inviteTeacher, updateUserRole, updateStaffProfile } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";

const InviteTeacherDialog = ({ onInviteSuccess }: { onInviteSuccess: () => void }) => {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const fullName = formData.get('fullName') as string;
        const email = formData.get('email') as string;

        const result = await inviteTeacher(fullName, email);

        if (result.success) {
            toast({ title: "Undangan Terkirim", description: `Email undangan telah dikirim ke ${email}.` });
            onInviteSuccess();
            setOpen(false);
        } else {
            toast({ title: "Gagal Mengundang", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Tambah Staf
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Undang Staf Baru</DialogTitle>
                        <DialogDescription>Masukkan nama dan email untuk dikirimi undangan login.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <Input id="fullName" name="fullName" placeholder="Contoh: Budi Sanjaya, S.Pd." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Alamat Email</Label>
                            <Input id="email" name="email" type="email" placeholder="contoh@sekolah.id" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kirim Undangan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const EditStaffDialog = ({ user, open, onOpenChange }: { user: Profile, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await updateStaffProfile(user.id, {
            fullName: formData.get('fullName') as string,
            nip: formData.get('nip') as string,
            phoneNumber: formData.get('phoneNumber') as string,
        });

        if (result.success) {
            toast({ title: "Berhasil", description: "Data staf telah diperbarui." });
            onOpenChange(false);
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Ubah Data Staf</DialogTitle>
                        <DialogDescription>Perbarui informasi profil staf pengajar.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <Input id="fullName" name="fullName" defaultValue={user.full_name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nip">NIP / ID Guru</Label>
                            <Input id="nip" name="nip" defaultValue={user.nip} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Nomor WhatsApp (628...)</Label>
                            <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phone_number} placeholder="628123456789" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


export function UsersTable({ initialUsers }: { initialUsers: Profile[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [loading, setLoading] = React.useState<string | boolean>(false);
    const [editingUser, setEditingUser] = React.useState<Profile | null>(null);
    const { toast } = useToast();

    const filteredUsers = initialUsers.filter(user => {
        return (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
               (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    });

    const handleDeleteUser = async (userId: string) => {
        setLoading(userId);
        const result = await deleteUser(userId);
        if (result.success) {
            toast({ title: "Berhasil", description: "Pengguna telah dihapus." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    const handleRoleChange = async (userId: string, newRole: 'teacher' | 'headmaster' | 'admin') => {
        setLoading(userId);
        const result = await updateUserRole(userId, newRole);
        if (result.success) {
            toast({ title: "Role Diperbarui", description: `Pengguna kini menjadi ${newRole === 'admin' ? 'Admin' : newRole === 'headmaster' ? 'Kepala Sekolah' : 'Guru'}.` });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }
    
  return (
    <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="relative w-full sm:w-auto sm:flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari nama atau email..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <InviteTeacherDialog onInviteSuccess={() => router.refresh()} />
        </div>

        <div className="hidden md:block overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Guru</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-semibold">{user.full_name || 'N/A'}</TableCell>
                            <TableCell className="text-slate-500 text-xs">{user.email}</TableCell>
                            <TableCell>
                                {user.role === 'admin' && <Badge className="bg-purple-600">Admin</Badge>}
                                {user.role === 'headmaster' && <Badge className="bg-amber-600">Kepsek</Badge>}
                                {user.role === 'teacher' && <Badge variant="outline">Guru</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={loading === user.id}>
                                                {loading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Kelola Akun</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                <Edit className="mr-2 h-4 w-4" /> Ubah Profil
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {user.role !== 'admin' && (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')} className="text-purple-600 font-bold">
                                                    <ShieldAlert className="mr-2 h-4 w-4" /> Jadikan Admin
                                                </DropdownMenuItem>
                                            )}
                                            {user.role !== 'headmaster' && (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'headmaster')}>
                                                    <GraduationCap className="mr-2 h-4 w-4" /> Jadikan Kepsek
                                                </DropdownMenuItem>
                                            )}
                                            {user.role !== 'teacher' && (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')}>
                                                    <User className="mr-2 h-4 w-4" /> Jadikan Guru
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Akun
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
                                            <AlertDialogDescription>Menghapus {user.full_name} akan menghilangkan akses login mereka secara permanen.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
            {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4 border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="min-w-0">
                            <p className="font-bold truncate">{user.full_name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        </div>
                        {user.role === 'admin' && <Badge className="bg-purple-600 text-[10px]">Admin</Badge>}
                        {user.role === 'headmaster' && <Badge className="bg-amber-600 text-[10px]">Kepsek</Badge>}
                        {user.role === 'teacher' && <Badge variant="outline" className="text-[10px]">Guru</Badge>}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingUser(user)}>
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1">Role</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>Jadikan Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'headmaster')}>Jadikan Kepsek</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')}>Jadikan Guru</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </Card>
            ))}
        </div>

        {editingUser && <EditStaffDialog user={editingUser} open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)} />}
    </>
  );
}
