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
import { MoreHorizontal, Trash2, Loader2, Calendar, Mail, User, Users, Search, UserPlus, GraduationCap, Edit, Phone } from "lucide-react";
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
            toast({
                title: "Undangan Terkirim",
                description: `Email undangan telah dikirim ke ${email}.`,
            });
            onInviteSuccess();
            setOpen(false);
        } else {
            toast({
                title: "Gagal Mengundang",
                description: result.error,
                variant: "destructive"
            });
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
                        <DialogDescription>
                           Masukkan nama dan email guru. Sistem akan mengirim email undangan agar mereka dapat mengatur kata sandi dan login.
                        </DialogDescription>
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
                        <DialogDescription>Perbarui informasi profil dan nomor WhatsApp staf.</DialogDescription>
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
                            <p className="text-[10px] text-muted-foreground">Penting: Gunakan format internasional tanpa tanda + untuk fitur notifikasi.</p>
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
    const [users, setUsers] = React.useState<Profile[]>(initialUsers);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [loading, setLoading] = React.useState<string | boolean>(false); // Can be userId or boolean
    const [editingUser, setEditingUser] = React.useState<Profile | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleDeleteUser = async (userId: string) => {
        setLoading(userId);
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;

        const result = await deleteUser(userId);

        if (result.success) {
            toast({
                title: "Guru Dihapus",
                description: `Guru ${userToDelete.full_name} telah berhasil dihapus.`,
            });
            router.refresh();
        } else {
            toast({
                title: "Gagal Menghapus",
                description: result.error,
                variant: "destructive"
            });
        }
        setLoading(false);
    }

    const handleRoleChange = async (userId: string, newRole: 'teacher' | 'headmaster') => {
        setLoading(userId);
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;
        
        const result = await updateUserRole(userId, newRole);

        if (result.success) {
            toast({
                title: "Peran Diperbarui",
                description: `${userToUpdate.full_name} sekarang adalah seorang ${newRole === 'headmaster' ? 'Kepala Sekolah' : 'Guru'}.`
            });
            router.refresh(); // Refresh the page to show the new role
        } else {
            toast({
                title: "Gagal Memperbarui Peran",
                description: result.error,
                variant: "destructive"
            });
        }
        setLoading(false);
    }
    
  return (
    <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
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

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
            {filteredUsers.map((user) => (
                 <div key={user.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{user.full_name || 'N/A'}</p>
                            {user.role === 'headmaster' && (
                                <Badge variant="secondary" className="mt-1 bg-amber-200 text-amber-800">Kepala Sekolah</Badge>
                            )}
                        </div>
                         <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={loading === user.id} className="h-8 w-8 -mt-2 -mr-2">
                                        {loading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                        <Edit className="mr-2 h-4 w-4" /> Ubah Data
                                    </DropdownMenuItem>
                                     {user.role === 'teacher' ? (
                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'headmaster')}>
                                            <GraduationCap className="mr-2 h-4 w-4" /> Jadikan Kepala Sekolah
                                        </DropdownMenuItem>
                                     ) : (
                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')}>
                                            <User className="mr-2 h-4 w-4" /> Jadikan Guru Biasa
                                        </DropdownMenuItem>
                                     )}
                                    <DropdownMenuSeparator />
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Hapus Guru
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus guru <span className="font-semibold">{user.full_name}</span> secara permanen dari server.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90" disabled={loading === user.id}>
                                        {loading === user.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Ya, Hapus Guru
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                     </div>
                     <div className="text-sm text-muted-foreground space-y-2 border-t pt-3 mt-3">
                         <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary"/>
                            <span>{user.email}</span>
                        </div>
                        {user.phone_number && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-green-600"/>
                                <span>{user.phone_number}</span>
                            </div>
                        )}
                         <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary"/>
                            <span>Bergabung: <FormattedDate dateString={user.created_at} /></span>
                        </div>
                     </div>
                </div>
            ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Guru</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>WhatsApp</TableHead>
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
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={loading === user.id}>
                                                {loading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                <Edit className="mr-2 h-4 w-4" /> Ubah Data
                                            </DropdownMenuItem>
                                            {user.role === 'teacher' ? (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'headmaster')}>
                                                    <GraduationCap className="mr-2 h-4 w-4" /> Jadikan Kepala Sekolah
                                                </DropdownMenuItem>
                                             ) : (
                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')}>
                                                    <User className="mr-2 h-4 w-4" /> Jadikan Guru Biasa
                                                </DropdownMenuItem>
                                             )}
                                            <DropdownMenuSeparator />
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Hapus Guru
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus guru <span className="font-semibold">{user.full_name}</span> secara permanen dari server.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90" disabled={loading === user.id}>
                                                {loading === user.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Ya, Hapus Guru
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

        {filteredUsers.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">Guru Tidak Ditemukan</h3>
                <p className="mt-1 text-sm text-gray-500">Coba ubah filter atau kata kunci pencarian Anda.</p>
            </div>
        )}

        {editingUser && (
            <EditStaffDialog 
                user={editingUser} 
                open={!!editingUser} 
                onOpenChange={(open) => !open && setEditingUser(null)} 
            />
        )}
    </>
  );
}