"use client"
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { updateProfile, uploadProfileImage } from "@/lib/actions";
import { Loader2, Phone, Camera, User as UserIcon, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SettingsClientPage({ user, profile }: { user: User, profile: Profile }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);

    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    
    const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
    
    const [profileData, setProfileData] = React.useState({
        fullName: profile.full_name || '',
        nip: profile.nip || '',
        pangkat: profile.pangkat || '',
        jabatan: profile.jabatan || '',
        phoneNumber: profile.phone_number || '',
    });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    }

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await updateProfile(profileData);
        if (result.success) {
            toast({ title: "Profil Disimpan", description: "Perubahan profil Anda telah berhasil disimpan." });
            router.refresh();
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_SIZE) {
            toast({
                title: "File Terlalu Besar",
                description: "Ukuran foto maksimal adalah 2MB.",
                variant: "destructive"
            });
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast({
                title: "Format Tidak Sesuai",
                description: "Mohon pilih file gambar (JPG, PNG, WEBP).",
                variant: "destructive"
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadProfileImage(formData, 'avatar');

            if (result.success && result.url) {
                setAvatarUrl(result.url);
                toast({ title: "Sukses", description: "Foto profil berhasil diperbarui." });
                router.refresh();
            } else {
                toast({ 
                    title: "Gagal Mengunggah", 
                    description: result.error || "Gagal mengunggah foto. Pastikan koneksi stabil.", 
                    variant: "destructive" 
                });
            }
        } catch (error) {
            toast({ 
                title: "Error", 
                description: "Terjadi kesalahan saat mengunggah foto.", 
                variant: "destructive" 
            });
        } finally {
            setUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    }

    const getAvatarFallback = (name: string | null) => {
        if (!name || typeof name !== 'string' || name.trim() === '') return 'G';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <input 
            type="file" 
            ref={avatarInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
        />
        
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <UserIcon className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold font-headline text-slate-900 tracking-tight">Pengaturan Profil</h1>
                <p className="text-slate-500 mt-1">Kelola identitas diri dan informasi akun Anda.</p>
            </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:shadow-sm">Identitas Diri</TabsTrigger>
                <TabsTrigger value="account" className="rounded-lg data-[state=active]:shadow-sm">Informasi Akun</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-8 space-y-6">
                <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <form onSubmit={handleProfileSave}>
                        <CardHeader className="bg-slate-50/50 border-b pb-8 pt-10">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="relative group">
                                    <Avatar className="h-32 w-32 border-4 border-white shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                        <AvatarImage src={avatarUrl || ""} alt={profile.full_name || 'Teacher'} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-indigo-50 text-indigo-600 font-bold">
                                            {getAvatarFallback(profile.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button 
                                        type="button"
                                        disabled={uploading}
                                        onClick={() => avatarInputRef.current?.click()}
                                        className={cn(
                                            "absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg border-2 border-white transition-all duration-200",
                                            uploading ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-90"
                                        )}
                                    >
                                        {uploading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Camera className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <div className="text-center">
                                    <CardTitle className="text-xl font-bold">Foto Profil</CardTitle>
                                    <CardDescription>Format JPG, PNG, atau WEBP. Maksimal 2MB.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 p-8 pt-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-slate-700 font-semibold">Nama Lengkap (dengan gelar)</Label>
                                    <Input 
                                        id="fullName" 
                                        name="fullName" 
                                        value={profileData.fullName} 
                                        onChange={handleProfileChange} 
                                        className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl"
                                        placeholder="Budi Sanjaya, S.Pd."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nip" className="text-slate-700 font-semibold">NIP / ID Guru</Label>
                                    <Input 
                                        id="nip" 
                                        name="nip" 
                                        value={profileData.nip} 
                                        onChange={handleProfileChange} 
                                        className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl"
                                        placeholder="1987654321..."
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label htmlFor="pangkat" className="text-slate-700 font-semibold">Pangkat / Golongan</Label>
                                    <Input 
                                        id="pangkat" 
                                        name="pangkat" 
                                        value={profileData.pangkat} 
                                        onChange={handleProfileChange}
                                        className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl"
                                        placeholder="Penata Muda / III.a"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="jabatan" className="text-slate-700 font-semibold">Jabatan</Label>
                                    <Input 
                                        id="jabatan" 
                                        name="jabatan" 
                                        value={profileData.jabatan} 
                                        onChange={handleProfileChange}
                                        className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl"
                                        placeholder="Guru Madya"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="text-slate-700 font-semibold">Nomor WhatsApp (Aktif)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input 
                                        id="phoneNumber" 
                                        name="phoneNumber" 
                                        placeholder="Contoh: 628123456789" 
                                        className="h-12 pl-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl"
                                        value={profileData.phoneNumber} 
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 italic pl-1">Penting: Gunakan kode negara (62) tanpa tanda + agar notifikasi berjalan lancar.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t p-8">
                           <Button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full sm:w-auto h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200"
                           >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                Simpan Perubahan Profil
                           </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
            
            <TabsContent value="account" className="mt-8 space-y-6">
                 <Card className="border-0 shadow-xl shadow-slate-200/50">
                    <CardHeader className="p-8 border-b">
                        <CardTitle className="text-xl font-bold">Keamanan Akun</CardTitle>
                        <CardDescription>Email Anda terikat pada akun login dan tidak dapat diubah sendiri.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-semibold opacity-70">Alamat Email</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                defaultValue={user.email} 
                                disabled 
                                className="h-12 bg-slate-50 border-slate-100 rounded-xl cursor-not-allowed"
                            />
                            <p className="text-xs text-amber-600 font-medium bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
                                💡 Hubungi administrator jika Anda perlu mengubah alamat email terdaftar.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 opacity-50 select-none">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Ubah Kata Sandi</h4>
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-400">Kata Sandi Baru</Label>
                                    <Input type="password" disabled className="h-12 border-slate-100 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-400">Konfirmasi Kata Sandi Baru</Label>
                                    <Input type="password" disabled className="h-12 border-slate-100 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t p-8">
                       <Button disabled className="w-full sm:w-auto h-12 px-10 rounded-xl opacity-50">
                           Perbarui Akun
                       </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
    )
}