
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
import { updateProfile, updateSchoolData, uploadProfileImage } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsClientPage({ user, profile }: { user: User, profile: Profile }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState<false | 'avatar' | 'logo'>(false);

    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    const logoInputRef = React.useRef<HTMLInputElement>(null);

    const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
    const [logoUrl, setLogoUrl] = React.useState(profile.school_logo_url);
    
    const [profileData, setProfileData] = React.useState({
        fullName: profile.full_name || '',
        nip: profile.nip || '',
        pangkat: profile.pangkat || '',
        jabatan: profile.jabatan || '',
    });

    const [schoolData, setSchoolData] = React.useState({
        schoolName: profile.school_name || '',
        schoolAddress: profile.school_address || '',
        headmasterName: profile.headmaster_name || '',
        headmasterNip: profile.headmaster_nip || '',
    })

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    }

    const handleSchoolDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSchoolData({ ...schoolData, [e.target.name]: e.target.value });
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
    
    const handleSchoolDataSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await updateSchoolData(schoolData);
        if (result.success) {
            toast({ title: "Data Sekolah Disimpan", description: "Perubahan data sekolah Anda telah berhasil disimpan." });
            router.refresh();
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(type);
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadProfileImage(formData, type);

        if (result.success && result.url) {
            toast({ title: "Sukses", description: "Gambar berhasil diunggah." });
            if (type === 'avatar') {
                setAvatarUrl(result.url);
            } else {
                setLogoUrl(result.url);
            }
            router.refresh();
        } else {
            toast({ title: "Gagal Mengunggah", description: result.error, variant: "destructive" });
        }
        setUploading(false);
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
        <input type="file" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, 'avatar')} accept="image/*" className="hidden" />
        <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} accept="image/*" className="hidden" />
        <div>
            <h1 className="text-2xl font-bold font-headline">Pengaturan</h1>
            <p className="text-muted-foreground">Kelola profil, akun, dan data sekolah Anda.</p>
        </div>

        <Tabs defaultValue="profile">
            <TabsList>
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="account">Akun</TabsTrigger>
                <TabsTrigger value="school">Data Sekolah</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
                <Card>
                    <form onSubmit={handleProfileSave}>
                        <CardHeader>
                            <CardTitle>Profil Pengguna</CardTitle>
                            <CardDescription>Perbarui foto dan informasi pribadi Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
            <TabsContent value="school" className="mt-6">
                <Card>
                    <form onSubmit={handleSchoolDataSave}>
                        <CardHeader>
                            <CardTitle>Data Sekolah</CardTitle>
                            <CardDescription>Informasi ini akan digunakan pada kop laporan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Logo Sekolah</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20 rounded-md">
                                        <AvatarImage src={logoUrl || "https://placehold.co/100x100.png"} alt="Logo Sekolah" data-ai-hint="school building" />
                                        <AvatarFallback>LOGO</AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploading === 'logo'}>
                                        {uploading === 'logo' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Ganti Logo
                                    </Button>
                                </div>
                            </div>
                           <div className="space-y-2">
                                <Label htmlFor="schoolName">Nama Sekolah</Label>
                                <Input id="schoolName" name="schoolName" value={schoolData.schoolName} onChange={handleSchoolDataChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schoolAddress">Alamat Sekolah</Label>
                                <Input id="schoolAddress" name="schoolAddress" value={schoolData.schoolAddress} onChange={handleSchoolDataChange} />
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="headmasterName">Nama Kepala Sekolah</Label>
                                    <Input id="headmasterName" name="headmasterName" value={schoolData.headmasterName} onChange={handleSchoolDataChange} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="headmasterNip">NIP Kepala Sekolah</Label>
                                    <Input id="headmasterNip" name="headmasterNip" value={schoolData.headmasterNip} onChange={handleSchoolDataChange} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                           <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Data Sekolah
                           </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
    )
}

    