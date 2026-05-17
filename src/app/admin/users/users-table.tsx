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
import { MoreHorizontal, Trash2, Loader2, Search, UserPlus, GraduationCap, Edit, User, ShieldAlert, AlertCircle, CheckCircle2, UserCheck, Info, ShieldX } from "lucide-react";
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
                <Button className="w-full sm:w-auto rounded-xl shadow-lg h-12 font-bold"><UserPlus className="mr-2 h-4 w-4" /> Tambah Staf</Button>
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
            toast({ title: "Peran Diperbarui" });
            router.refresh();
        }
        setLoading(false);
    }
    
  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:w-auto flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Cari staf..." className="pl-10 h-12 rounded-xl bg-slate-50 border-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <InviteTeacherDialog onInviteSuccess={() => router.refresh()} />
        </div>

        <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6 h-12">
                <TabsTrigger value="active" className="rounded-lg gap-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <CheckCircle2 className="h-4 w-4" /> Aktif ({activeUsers.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg gap-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <AlertCircle className="h-4 w-4" /> Menunggu ({pendingUsers.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
                    <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-bold">Nama</TableHead>
                            <TableHead className="font-bold">Email</TableHead>
                            <TableHead className="font-bold">Peran</TableHead>
                            <TableHead className="text-right font-bold">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeUsers.map((u) => (
                                <TableRow key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-bold text-slate-900">{u.full_name || 'N/A'}</TableCell>
                                    <TableCell className="text-slate-500 text-xs font-medium">{u.email}</TableCell>
                                    <TableCell>
                                        {u.role === 'admin' && <Badge className="bg-purple-600 font-bold uppercase text-[9px] tracking-wider">Admin</Badge>}
                                        {u.role === 'headmaster' && <Badge className="bg-amber-600 font-bold uppercase text-[9px] tracking-wider">Kepala</Badge>}
                                        {u.role === 'teacher' && <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider">Guru</Badge>}
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
                    {activeUsers.map(u => (
                        <UserMobileCard 
                            key={u.id} 
                            user={u} 
                            onEdit={() => setEditingUser(u)}
                            loading={loading === u.id}
                            onRoleChange={handleRoleChange}
                            onDelete={() => handleDeleteUser(u.id)}
                        />
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-700 flex items-start gap-3 font-medium leading-relaxed">
                    <span className="p-1.5 bg-blue-100 rounded-lg"><Info className="h-4 w-4 text-blue-600" /></span>
                    <p>Klik <strong>Setujui</strong> untuk memberikan akses penuh ke Dashboard Guru bagi akun-akun yang baru mendaftar.</p>
                </div>
                {pendingUsers.map((u) => (
                    <Card key={u.id} className="p-5 border-blue-100 bg-white rounded-3xl shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 font-black uppercase shadow-inner">{u.full_name?.charAt(0) || 'U'}</div>
                                <div>
                                    <p className="font-bold text-slate-900 leading-tight uppercase tracking-tight break-words whitespace-normal">{u.full_name || 'User Baru'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button onClick={() => handleApprove(u.id)} disabled={loading === u.id} className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 px-6 font-bold shadow-lg shadow-emerald-100">
                                    {loading === u.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />} Setujui
                                </Button>
                                <Button onClick={() => handleDeleteUser(u.id)} disabled={loading === u.id} variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl h-11 font-bold">Tolak</Button>
                            </div>
                        </div>
                    </Card>
                ))}
                {pendingUsers.length === 0 && <div className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs">Belum ada antrean baru.</div>}
            </TabsContent>
        </Tabs>

        {editingUser && <EditStaffDialog user={editingUser} open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)} />}
    </div>
  );
}

function AdminUserActions({ user, loading, onEdit, onRoleChange, onDelete, trigger }: any) {
    const [confirmText, setConfirmText] = React.useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const isConfirmed = confirmText.toLowerCase() === "hapus akun";

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {trigger || (
                        <Button variant="ghost" size="icon" disabled={loading} className="rounded-full hover:bg-slate-100 h-10 w-10">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-5 w-5 text-slate-400" />}
                        </Button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl shadow-2xl border-0 p-2 w-56">
                    <DropdownMenuItem onClick={onEdit} className="rounded-xl h-11 font-bold gap-3 text-slate-700"><Edit className="h-4 w-4 text-blue-500" /> Ubah Profil</DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 mx-2" />
                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'admin')} className="text-purple-600 font-bold rounded-xl h-11 gap-3"><ShieldAlert className="h-4 w-4" /> Jadikan Admin</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'headmaster')} className="rounded-xl h-11 font-bold gap-3 text-slate-700"><GraduationCap className="h-4 w-4 text-amber-500" /> Jadikan Kepala</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'teacher')} className="rounded-xl h-11 font-bold gap-3 text-slate-700"><User className="h-4 w-4 text-emerald-500" /> Jadikan Guru</DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 mx-2" />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-600 focus:bg-red-50 font-bold rounded-xl h-11 gap-3">
                            <Trash2 className="h-4 w-4" /> Hapus Akun
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-8 max-w-md">
                <AlertDialogHeader className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                        <ShieldX className="h-10 w-10" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-black tracking-tight text-center">Hapus Akun Staf?</AlertDialogTitle>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Identitas Akun</p>
                        <p className="font-bold text-slate-900 leading-tight">{user.full_name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-600 text-center">
                            Ketik <span className="font-black text-red-600 uppercase">&quot;hapus akun&quot;</span> di bawah ini untuk mengonfirmasi penghapusan permanen.
                        </p>
                        <Input 
                            value={confirmText} 
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Ketik di sini..."
                            className="h-12 rounded-xl text-center font-bold border-red-100 focus:border-red-500 focus:ring-red-500/10"
                        />
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-6 gap-3 flex flex-row">
                    <AlertDialogCancel 
                        className="flex-1 rounded-xl h-12 font-bold border-slate-200"
                        onClick={() => setConfirmText("")}
                    >
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => {
                            if (isConfirmed) {
                                onDelete();
                                setConfirmText("");
                            }
                        }} 
                        disabled={!isConfirmed}
                        className="flex-1 rounded-xl h-12 bg-red-600 font-bold shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-30"
                    >
                        Ya, Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function UserMobileCard({ user, onEdit, loading, onRoleChange, onDelete }: any) {
    const roleLabel = user.role === 'admin' ? "Admin" : user.role === 'headmaster' ? "Kepala" : "Guru";
    
    return (
        <Card className="p-5 border-slate-100 shadow-sm rounded-3xl bg-white hover:shadow-md transition-shadow relative">
            {/* Tiga Titik di Pojok Kanan Atas */}
            <div className="absolute top-4 right-4">
                <AdminUserActions 
                    user={user} 
                    loading={loading} 
                    onEdit={onEdit} 
                    onRoleChange={onRoleChange} 
                    onDelete={onDelete} 
                />
            </div>

            <div className="flex justify-between items-start mb-4 gap-3">
                <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 leading-tight text-lg uppercase tracking-tight break-words whitespace-normal pr-8">
                        {user.full_name || 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user.email}</p>
                    <div className="mt-2">
                        <Badge className={cn(
                            user.role === 'admin' ? "bg-purple-600" : user.role === 'headmaster' ? "bg-amber-600" : "bg-slate-500", 
                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-0 shadow-sm"
                        )}>
                            {roleLabel}
                        </Badge>
                    </div>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-50">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full rounded-xl font-bold h-11 bg-slate-50 border-0 hover:bg-slate-100 text-slate-700 shadow-inner" 
                    onClick={onEdit}
                >
                    Ubah Data
                </Button>
            </div>
        </Card>
    );
}
