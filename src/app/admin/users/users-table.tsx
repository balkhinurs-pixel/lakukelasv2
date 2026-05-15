
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
import { MoreHorizontal, Trash2, Loader2, Calendar, Mail, User, Users, Search, UserPlus, GraduationCap, Edit, Phone, ShieldCheck } from "lucide-react";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/lib/types";
import { deleteUser, inviteTeacher, updateUserRole, updateStaffProfile } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function FormattedDate({ dateString }: { dateString: string }) {
    const [date, setDate] = React.useState('');
    React.useEffect(() => {
        if (dateString) {
            setDate(format(new Date(dateString), 'dd MMMM yyyy', { locale: id }));
        }
    }, [dateString]);
    
    if (!dateString) return null;
    return <>{date}</>;
}

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
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tambah Guru
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Undang Guru Baru</DialogTitle>
                        <DialogDescription>Masukkan nama dan email guru untuk dikirimkan undangan aktivasi.</DialogDescription>
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
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kirim Undangan
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
                            <Label htmlFor="phoneNumber">Nomor WhatsApp</Label>
                            <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phone_number} placeholder="628..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
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
        const name = user.full_name?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    const handleDeleteUser = async (userId: string) => {
        setLoading(userId);
        const result = await deleteUser(userId);
        if (result.success) {
            toast({ title: "Berhasil", description: "Guru telah dihapus." });
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
            toast({ title: "Berhasil", description: `Peran diperbarui menjadi ${newRole}.` });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }
    
  return (
    <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-auto sm:flex-grow max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                  placeholder="Cari nama atau email guru..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <InviteTeacherDialog onInviteSuccess={() => router.refresh()} />
        </div>

        <div className="hidden md:block overflow-x-auto rounded-xl border">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead>Nama Guru</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-semibold text-slate-900">{user.full_name || 'N/A'}</TableCell>
                            <TableCell className="text-slate-500 text-xs">{user.email}</TableCell>
                            <TableCell>
                                {user.role === 'admin' && <Badge variant="secondary" className="bg-purple-100 text-purple-800">Admin</Badge>}
                                {user.role === 'headmaster' && <Badge variant="secondary" className="bg-amber-100 text-amber-800">Kepala Sekolah</Badge>}
                                {user.role === 'teacher' && <Badge variant="outline">Guru</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={loading === user.id}>
                                            {loading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl border-0 shadow-2xl">
                                        <DropdownMenuLabel>Kelola Akun</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                            <Edit className="mr-2 h-4 w-4" /> Ubah Profil
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Ubah Peran</DropdownMenuLabel>
                                        
                                        {user.role !== 'admin' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')} className="text-purple-600 font-bold">
                                                <ShieldCheck className="mr-2 h-4 w-4" /> Jadikan Admin
                                            </DropdownMenuItem>
                                        )}
                                        {user.role !== 'headmaster' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'headmaster')}>
                                                <GraduationCap className="mr-2 h-4 w-4" /> Jadikan Kepala Sekolah
                                            </DropdownMenuItem>
                                        )}
                                        {user.role !== 'teacher' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')}>
                                                <User className="mr-2 h-4 w-4" /> Jadikan Guru Biasa
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Guru
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Hapus Staf?</AlertDialogTitle>
                                                    <AlertDialogDescription>Data guru <b>{user.full_name}</b> akan dihapus permanen.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">Hapus</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
            {filteredUsers.map((user) => (
                 <div key={user.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{user.full_name || 'N/A'}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <Badge variant="secondary" className={cn(
                            "shrink-0 text-[10px] uppercase font-bold",
                            user.role === 'admin' ? "bg-purple-100 text-purple-700" :
                            user.role === 'headmaster' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                        )}>
                            {user.role}
                        </Badge>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl h-10 font-bold" onClick={() => setEditingUser(user)}>Ubah</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm" className="flex-1 rounded-xl h-10 font-bold">Peran</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-0 shadow-2xl">
                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')} className="font-bold text-purple-600">Jadikan Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'headmaster')}>Jadikan Kepala Sekolah</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')}>Jadikan Guru Biasa</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                 </div>
            ))}
        </div>

        {editingUser && (
            <EditStaffDialog user={editingUser} open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)} />
        )}
    </>
  );
}
