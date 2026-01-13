
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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsClientPage({ user, profile }: { user: User, profile: Profile }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState<false | 'avatar'>(false);

    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    
    const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
    
    const [profileData, setProfileData] = React.useState({
        fullName: profile.full_name || '',
        nip: profile.nip || '',
        pangkat: profile.pangkat || '',
        jabatan: profile.jabatan || '',
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

        const MAX_AVATAR_SIZE = 1 * 1024 * 1024; // 1MB
        const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

        if (file.size > MAX_AVATAR_SIZE) {
            toast({
                title: "Ukuran File Terlalu Besar",
                description: `Ukuran file maksimal adalah 1MB.`,
                variant: "destructive",
            });
            e.target.value = '';
            return;
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
             toast({
                title: "Format File Tidak Didukung",
                description: "Mohon gunakan file dengan format JPEG, PNG, atau WEBP.",
                variant: "destructive",
            });
            e.target.value = '';
            return;
        }

        setUploading('avatar');
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadProfileImage(formData, 'avatar');

        if (result.success && result.url) {
            toast({ title: "Sukses", description: "Gambar berhasil diunggah." });
            setAvatarUrl(result.url);
            router.refresh();
        } else {
            toast({ title: "Gagal Mengunggah", description: result.error, variant: "destructive" });
        }
        setUploading(false);
        e.target.value = '';
    }

    const handleAccountSave = async (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Fitur Dalam Pengembangan",
            description: "Perubahan email dan kata sandi akan segera tersedia.",
            variant: "default"
        });
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
    <div className="space-y-6">
        <input type="file" ref={avatarInputRef} onChange={(e) => handleImageUpload(e)} accept="image/png, image/jpeg, image/webp" className="hidden" />
        <div>
            <h1 className="text-2xl font-bold font-headline">Pengaturan</h1>
            <p className="text-muted-foreground">Kelola profil dan akun Anda.</p>
        </div>

        <Tabs defaultValue="profile">
            <TabsList>
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="account">Akun</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
                <Card>
                    <form onSubmit={handleProfileSave}>
                        <CardHeader>
                            <CardTitle>Profil Pengguna</CardTitle>
                            <CardDescription>Perbarui foto dan informasi pribadi Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Foto Profil</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={avatarUrl || "https://placehold.co/100x100.png"} alt={profile.full_name || 'Teacher'} data-ai-hint="teacher portrait"/>
                                        <AvatarFallback>{getAvatarFallback(profile.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={uploading === 'avatar'}>
                                        {uploading === 'avatar' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Ganti Foto
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">JPG, PNG, atau WEBP. Ukuran maksimal 1MB.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nama Lengkap (dengan gelar)</Label>
                                    <Input id="fullName" name="fullName" value={profileData.fullName} onChange={handleProfileChange} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="nip">NIP / ID Guru</Label>
                                    <Input id="nip" name="nip" value={profileData.nip} onChange={handleProfileChange} />
                                </div>
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pangkat">Pangkat / Golongan</Label>
                                    <Input id="pangkat" name="pangkat" value={profileData.pangkat} onChange={handleProfileChange}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="jabatan">Jabatan</Label>
                                    <Input id="jabatan" name="jabatan" value={profileData.jabatan} onChange={handleProfileChange}/>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                           <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Perubahan
                           </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
            <TabsContent value="account" className="mt-6">
                 <Card>
                    <form onSubmit={handleAccountSave}>
                        <CardHeader>
                            <CardTitle>Pengaturan Akun</CardTitle>
                            <CardDescription>Ubah email dan kata sandi Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-2">
                                <Label htmlFor="email">Alamat Email</Label>
                                <Input id="email" type="email" defaultValue={user.email} disabled />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                                <Input id="currentPassword" type="password" disabled/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                                <Input id="newPassword" type="password" disabled/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                                <Input id="confirmPassword" type="password" disabled/>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                           <Button type="submit" disabled>Perbarui Akun</Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
    )
}
