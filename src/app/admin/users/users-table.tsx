
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, Trash2, Loader2, Search, UserPlus, GraduationCap, Edit, User, ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";
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

    const activeUsers = filteredUsers.filter(u => u.is_activated);
    const pendingUsers = filteredUsers.filter(u => !u.is_activated);

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
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:w-auto sm:flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari nama atau email..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <InviteTeacherDialog onInviteSuccess={() => router.refresh()} />
        </div>

        <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6">
                <TabsTrigger value="active" className="rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Staf Aktif ({activeUsers.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pending/Asing ({pendingUsers.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold">Nama Guru</TableHead>
                                <TableHead className="font-bold">Email</TableHead>
                                <TableHead className="font-bold">Peran</TableHead>
                                <TableHead className="text-right font-bold">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-semibold text-slate-900">{user.full_name || 'N/A'}</TableCell>
                                    <TableCell className="text-slate-500 text-xs">{user.email}</TableCell>
                                    <TableCell>
                                        {user.role === 'admin' && <Badge className="bg-purple-600">Admin</Badge>}
                                        {user.role === 'headmaster' && <Badge className="bg-amber-600">Kepsek</Badge>}
                                        {user.role === 'teacher' && <Badge variant="outline">Guru</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AdminUserActions user={user} loading={loading === user.id} onEdit={() => setEditingUser(user)} onRoleChange={handleRoleChange} onDelete={() => handleDeleteUser(user.id)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {activeUsers.length === 0 && (
                                <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">Tidak ada staf aktif.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {activeUsers.map(user => (
                        <UserMobileCard key={user.id} user={user} onEdit={() => setEditingUser(user)} onRoleChange={handleRoleChange} onDelete={() => handleDeleteUser(user.id)} />
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 mb-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>Daftar di bawah ini adalah pengguna yang sudah login namun **belum memasukkan token aktivasi**. Akun ini tidak masuk dalam hitungan statistik sekolah. Segera hapus jika Anda tidak mengenali akun tersebut.</p>
                </div>
                <div className="hidden md:block overflow-x-auto rounded-xl border">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold">Nama/Meta Google</TableHead>
                                <TableHead className="font-bold">Email</TableHead>
                                <TableHead className="text-right font-bold">Tindakan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-red-50/30 transition-colors">
                                    <TableCell className="font-semibold text-slate-900">{user.full_name || 'Tanpa Nama'}</TableCell>
                                    <TableCell className="text-slate-500 text-xs">{user.email}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4 mr-2" /> Hapus Akses
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-2xl font-black">Hapus User Asing?</AlertDialogTitle>
                                                    <AlertDialogDescription>Akun ini akan diblokir dari akses pendaftaran selanjutnya.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="pt-4 gap-2">
                                                    <AlertDialogCancel className="rounded-xl h-12 flex-1">Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="rounded-xl h-12 flex-1 bg-red-600">Hapus Permanen</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pendingUsers.length === 0 && (
                                <TableRow><TableCell colSpan={3} className="text-center py-10 text-slate-400">Database bersih dari akses asing.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="md:hidden space-y-4">
                     {pendingUsers.map(user => (
                        <Card key={user.id} className="p-4 border-red-100 bg-red-50/10 rounded-2xl">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-slate-900">{user.full_name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{user.email}</p>
                                </div>
                                <Badge variant="destructive" className="text-[8px] uppercase font-black">Ilegal/Pending</Badge>
                            </div>
                            <Button variant="destructive" size="sm" className="w-full rounded-xl h-10 font-bold" onClick={() => handleDeleteUser(user.id)}>Hapus Permanen</Button>
                        </Card>
                    ))}
                </div>
            </TabsContent>
        </Tabs>

        {editingUser && <EditStaffDialog user={editingUser} open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)} />}
    </div>
  );
}

function AdminUserActions({ user, loading, onEdit, onRoleChange, onDelete }: { user: Profile, loading: boolean, onEdit: () => void, onRoleChange: any, onDelete: () => void }) {
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={loading} className="rounded-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-0 p-2 w-56">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest text-slate-400 font-black">Kelola Akun</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onEdit} className="rounded-xl h-11 font-bold">
                        <Edit className="mr-2 h-4 w-4" /> Ubah Profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.role !== 'admin' && (
                        <DropdownMenuItem onClick={() => onRoleChange(user.id, 'admin')} className="text-purple-600 font-bold rounded-xl h-11">
                            <ShieldAlert className="mr-2 h-4 w-4" /> Jadikan Admin
                        </DropdownMenuItem>
                    )}
                    {user.role !== 'headmaster' && (
                        <DropdownMenuItem onClick={() => onRoleChange(user.id, 'headmaster')} className="rounded-xl h-11 font-bold">
                            <GraduationCap className="mr-2 h-4 w-4" /> Jadikan Kepsek
                        </DropdownMenuItem>
                    )}
                    {user.role !== 'teacher' && (
                        <DropdownMenuItem onClick={() => onRoleChange(user.id, 'teacher')} className="rounded-xl h-11 font-bold">
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
                    <AlertDialogDescription className="text-base font-medium">Tindakan ini akan menghapus akses <span className="font-black text-slate-900">{user.full_name}</span> dari sistem.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-4 gap-2 flex flex-row">
                    <AlertDialogCancel className="flex-1 rounded-xl h-12 border-slate-200 font-bold">Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="flex-1 rounded-xl h-12 bg-red-600 hover:bg-red-700 font-bold">Ya, Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function UserMobileCard({ user, onEdit, onRoleChange, onDelete }: any) {
    return (
        <Card className="p-4 border-slate-100 shadow-sm rounded-2xl">
            <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                    <p className="font-bold truncate text-slate-900">{user.full_name || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest font-bold">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {user.role === 'admin' && <Badge className="bg-purple-600 text-[9px] uppercase font-black px-2">Admin</Badge>}
                    {user.role === 'headmaster' && <Badge className="bg-amber-600 text-[9px] uppercase font-black px-2">Kepsek</Badge>}
                    {user.role === 'teacher' && <Badge variant="outline" className="text-[9px] uppercase font-black px-2">Guru</Badge>}
                </div>
            </div>
            <div className="flex gap-2 border-t pt-3 mt-3">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold h-10" onClick={onEdit}>
                    <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
                <AdminUserActions user={user} loading={false} onEdit={onEdit} onRoleChange={onRoleChange} onDelete={onDelete} />
            </div>
        </Card>
    );
}
