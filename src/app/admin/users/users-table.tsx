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
import { MoreHorizontal, Trash2, Loader2, Search, UserPlus, GraduationCap, Edit, User, ShieldAlert, AlertCircle, CheckCircle2, UserCheck, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/lib/types";
import { deleteUser, inviteTeacher, updateUserRole, updateStaffProfile, approveUser } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const InviteTeacherDialog = ({ onInviteSuccess }: { onInviteSuccess: () => void }) => {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await inviteTeacher(formData.get('fullName') as string, formData.get('email') as string);
        if (result.success) {
            toast({ title: "Terkirim", description: "Undangan login telah dikirim." });
            onInviteSuccess();
            setOpen(false);
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg"><UserPlus className="mr-2 h-4 w-4" /> Tambah Staf</Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Undang Staf Baru</DialogTitle>
                        <DialogDescription>Masukkan detail untuk dikirimi undangan login.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nama Lengkap</Label>
                            <Input name="fullName" placeholder="Nama Beserta Gelar" required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" placeholder="contoh@sekolah.id" required className="rounded-xl" />
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
            toast({ title: "Sukses", description: "Profil diperbarui." });
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
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nama Lengkap</Label>
                            <Input name="fullName" defaultValue={user.full_name} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>NIP / ID Guru</Label>
                            <Input name="nip" defaultValue={user.nip} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>WhatsApp</Label>
                            <Input name="phoneNumber" defaultValue={user.phone_number} placeholder="62812..." className="rounded-xl" />
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

    const filteredUsers = initialUsers.filter(u => 
        (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const activeUsers = filteredUsers.filter(u => u.is_activated);
    const pendingUsers = filteredUsers.filter(u => !u.is_activated);

    const handleDeleteUser = async (userId: string) => {
        setLoading(userId);
        const result = await deleteUser(userId);
        if (result.success) {
            toast({ title: "Dihapus", description: "Pengguna berhasil dihapus." });
            router.refresh();
        }
        setLoading(false);
    }

    const handleApprove = async (userId: string) => {
        setLoading(userId);
        const result = await approveUser(userId);
        if (result.success) {
            toast({ title: "Disetujui!", description: "Pengguna kini memiliki akses penuh." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    const handleRoleChange = async (userId: string, newRole: any) => {
        setLoading(userId);
        const result = await updateUserRole(userId, newRole);
        if (result.success) {
            toast({ title: "Role Diperbarui" });
            router.refresh();
        }
        setLoading(false);
    }
    
  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:w-auto flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari staf..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <InviteTeacherDialog onInviteSuccess={() => router.refresh()} />
        </div>

        <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6">
                <TabsTrigger value="active" className="rounded-lg gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Staf Aktif ({activeUsers.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg gap-2">
                    <AlertCircle className="h-4 w-4" /> Menunggu ({pendingUsers.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
                <div className="hidden md:block overflow-x-auto rounded-xl border">
                    <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Peran</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeUsers.map((u) => (
                                <TableRow key={u.id} className="hover:bg-slate-50">
                                    <TableCell className="font-semibold text-slate-900">{u.full_name || 'N/A'}</TableCell>
                                    <TableCell className="text-slate-500 text-xs">{u.email}</TableCell>
                                    <TableCell>
                                        {u.role === 'admin' && <Badge className="bg-purple-600">Admin</Badge>}
                                        {u.role === 'headmaster' && <Badge className="bg-amber-600">Kepsek</Badge>}
                                        {u.role === 'teacher' && <Badge variant="outline">Guru</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AdminUserActions user={u} loading={loading === u.id} onEdit={() => setEditingUser(u)} onRoleChange={handleRoleChange} onDelete={() => handleDeleteUser(u.id)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="md:hidden space-y-4">
                    {activeUsers.map(u => <UserMobileCard key={u.id} user={u} onEdit={() => setEditingUser(u)} onRoleChange={handleRoleChange} onDelete={() => handleDeleteUser(u.id)} />)}
                </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700 flex items-start gap-3">
                    <Info className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>Akun-akun di bawah ini baru saja mendaftar dan <strong>belum disetujui</strong>. Klik tombol "Setujui" untuk memberikan akses ke Dashboard Guru.</p>
                </div>
                {pendingUsers.map((u) => (
                    <Card key={u.id} className="p-5 border-blue-100 bg-white rounded-2xl shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 font-black uppercase">{u.full_name?.charAt(0) || 'U'}</div>
                                <div>
                                    <p className="font-bold text-slate-900 leading-tight">{u.full_name || 'User Baru'}</p>
                                    <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => handleApprove(u.id)} disabled={loading === u.id} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 px-6 font-bold shadow-lg shadow-emerald-200">
                                    {loading === u.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />} Setujui Akses
                                </Button>
                                <Button onClick={() => handleDeleteUser(u.id)} disabled={loading === u.id} variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl h-11 font-bold">Tolak</Button>
                            </div>
                        </div>
                    </Card>
                ))}
                {pendingUsers.length === 0 && <div className="text-center py-20 text-slate-400 font-medium">Tidak ada permohonan akses baru.</div>}
            </TabsContent>
        </Tabs>

        {editingUser && <EditStaffDialog user={editingUser} open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)} />}
    </div>
  );
}

function AdminUserActions({ user, loading, onEdit, onRoleChange, onDelete }: any) {
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={loading} className="rounded-full">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-0 p-2 w-56">
                    <DropdownMenuItem onClick={onEdit} className="rounded-xl h-11 font-bold gap-2 text-slate-700"><Edit className="h-4 w-4 text-blue-500" /> Ubah Profil</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'admin')} className="text-purple-600 font-bold rounded-xl h-11 gap-2"><ShieldAlert className="h-4 w-4" /> Jadikan Admin</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'headmaster')} className="rounded-xl h-11 font-bold gap-2 text-slate-700"><GraduationCap className="h-4 w-4 text-amber-500" /> Jadikan Kepsek</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'teacher')} className="rounded-xl h-11 font-bold gap-2 text-slate-700"><User className="h-4 w-4 text-emerald-500" /> Jadikan Guru</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600 focus:bg-red-50 font-bold rounded-xl h-11 gap-2"><Trash2 className="h-4 w-4" /> Hapus Akun</DropdownMenuItem></AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                <AlertDialogHeader><AlertDialogTitle className="text-2xl font-black">Hapus Akun?</AlertDialogTitle><AlertDialogDescription>Akses staf ini akan dihentikan secara permanen.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter className="pt-4 gap-2 flex flex-row">
                    <AlertDialogCancel className="flex-1 rounded-xl h-12 font-bold">Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="flex-1 rounded-xl h-12 bg-red-600 font-bold">Hapus</AlertDialogAction>
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
                    <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                </div>
                <Badge className={cn(user.role === 'admin' ? "bg-purple-600" : user.role === 'headmaster' ? "bg-amber-600" : "bg-slate-500", "text-[8px] uppercase px-2 py-0.5")}>{user.role}</Badge>
            </div>
            <div className="flex gap-2 border-t pt-3 mt-3">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold h-10" onClick={onEdit}>Ubah</Button>
                <AdminUserActions user={user} loading={false} onEdit={onEdit} onRoleChange={onRoleChange} onDelete={onDelete} />
            </div>
        </Card>
    );
}
