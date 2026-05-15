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
import { MoreHorizontal, Trash2, Loader2, Search, UserPlus, GraduationCap, Edit, User, ShieldAlert } from "lucide-react";
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
                <Button className="rounded-xl shadow-lg">
                    <UserPlus className="mr-2 h-4 w-4" /> Tambah Staf
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Undang Staf Baru</DialogTitle>
                        <DialogDescription>Masukkan nama dan email untuk dikirimi undangan login.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <Input id="fullName" name="fullName" placeholder="Contoh: Budi Sanjaya, S.Pd." required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Alamat Email</Label>
                            <Input id="email" name="email" type="email" placeholder="contoh@sekolah.id" required className="rounded-xl" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
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
            <DialogContent className="rounded-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Ubah Data Staf</DialogTitle>
                        <DialogDescription>Perbarui informasi profil staf pengajar.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nama Lengkap</Label>
                            <Input id="fullName" name="fullName" defaultValue={user.full_name} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nip">NIP / ID Guru</Label>
                            <Input id="nip" name="nip" defaultValue={user.nip} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Nomor WhatsApp (628...)</Label>
                            <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phone_number} placeholder="628123456789" className="rounded-xl" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
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
              <Input placeholder="Cari nama atau email..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <InviteTeacherDialog onInviteSuccess={() => router.refresh()} />
        </div>

        <div className="hidden md:block overflow-x-auto rounded-xl border">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="font-bold">Nama Guru</TableHead>
                        <TableHead className="font-bold">Email</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold">Peran</TableHead>
                        <TableHead className="text-right font-bold">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-semibold text-slate-900">{user.full_name || 'N/A'}</TableCell>
                            <TableCell className="text-slate-500 text-xs">{user.email}</TableCell>
                            <TableCell>
                                {user.is_activated ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">Aktif</Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">Belum Aktif</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                {user.role === 'admin' && <Badge className="bg-purple-600">Admin</Badge>}
                                {user.role === 'headmaster' && <Badge className="bg-amber-600">Kepsek</Badge>}
                                {user.role === 'teacher' && <Badge variant="outline">Guru</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={loading === user.id} className="rounded-full">
                                                {loading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-0 p-2 w-56">
                                            <DropdownMenuLabel className="text-xs uppercase tracking-widest text-slate-400 font-black">Kelola Akun</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => setEditingUser(user)} className="rounded-xl h-11 font-bold">
                                                <Edit className="mr-2 h-4 w-4" /> Ubah Profil
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {user.role !== 'admin' && (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')} className="text-purple-600 font-bold rounded-xl h-11">
                                                    <ShieldAlert className="mr-2 h-4 w-4" /> Jadikan Admin
                                                </DropdownMenuItem>
                                            )}
                                            {user.role !== 'headmaster' && (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'headmaster')} className="rounded-xl h-11 font-bold">
                                                    <GraduationCap className="mr-2 h-4 w-4" /> Jadikan Kepsek
                                                </DropdownMenuItem>
                                            )}
                                            {user.role !== 'teacher' && (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')} className="rounded-xl h-11 font-bold">
                                                    <User className="mr-2 h-4 w-4" /> Jadikan Guru
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 font-bold rounded-xl h-11">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Akun
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-2xl font-black">Hapus Pengguna?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-base font-medium">
                                                Tindakan ini akan menghapus akses <span className="font-black text-slate-900">{user.full_name}</span> dari sistem. 
                                                Hanya Admin lain yang bisa memulihkan akses ini nanti.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="pt-4 gap-2 flex flex-row">
                                            <AlertDialogCancel className="flex-1 rounded-xl h-12 border-slate-200 font-bold">Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="flex-1 rounded-xl h-12 bg-red-600 hover:bg-red-700 font-bold">Ya, Hapus</AlertDialogAction>
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
                <Card key={user.id} className="p-4 border-slate-100 shadow-sm rounded-2xl">
                    <div className="flex justify-between items-start mb-3">
                        <div className="min-w-0">
                            <p className="font-bold truncate text-slate-900">{user.full_name || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest font-bold">{user.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {user.role === 'admin' && <Badge className="bg-purple-600 text-[9px] uppercase font-black px-2">Admin</Badge>}
                            {user.role === 'headmaster' && <Badge className="bg-amber-600 text-[9px] uppercase font-black px-2">Kepsek</Badge>}
                            {user.role === 'teacher' && <Badge variant="outline" className="text-[9px] uppercase font-black px-2">Guru</Badge>}
                            {!user.is_activated && <Badge variant="destructive" className="text-[8px] uppercase font-black px-1.5 py-0">Belum Aktif</Badge>}
                        </div>
                    </div>
                    <div className="flex gap-2 border-t pt-3 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold h-10" onClick={() => setEditingUser(user)}>
                            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                        </Button>
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold h-10">Opsi Akun</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl">
                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')} className="font-bold text-purple-600">Jadikan Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'headmaster')} className="font-bold">Jadikan Kepsek</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')} className="font-bold">Jadikan Guru</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="font-bold text-red-600 focus:text-red-600 focus:bg-red-50">Hapus Akun</DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent className="rounded-[2rem] border-0 mx-4">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-black">Hapus Akun?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm font-medium">Hapus akses {user.full_name} dari sistem.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex flex-row gap-2">
                                    <AlertDialogCancel className="flex-1 rounded-xl">Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="flex-1 bg-red-600 rounded-xl">Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </Card>
            ))}
        </div>

        {editingUser && <EditStaffDialog user={editingUser} open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)} />}
    </>
  );
}
