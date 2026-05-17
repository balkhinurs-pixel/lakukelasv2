
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
import { Badge } from "@/components/ui/badge";
import type { Profile, GoogleDriveIntegration } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { updateProfile, uploadProfileImage } from "@/lib/actions";
import { disconnectGoogleDrive, setupGoogleDriveFolder, createTestDocument } from "@/lib/actions/google-drive";
import { Loader2, Phone, Camera, User as UserIcon, ShieldCheck, Globe, Database, Share2, LogOut, RefreshCw, FolderPlus, CheckCircle, FileText, AlertTriangle, Key, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function SettingsClientPage({ 
    user, 
    profile, 
    driveIntegration 
}: { 
    user: User, 
    profile: Profile,
    driveIntegration: GoogleDriveIntegration | null
}) {
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [driveLoading, setDriveLoading] = React.useState(false);
    const [testLoading, setTestLoading] = React.useState(false);

    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    
    const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
    
    const [profileData, setProfileData] = React.useState({
        fullName: profile.full_name || '',
        nip: profile.nip || '',
        pangkat: profile.pangkat || '',
        jabatan: profile.jabatan || '',
        phoneNumber: profile.phone_number || '',
        geminiApiKey: profile.gemini_api_key || '',
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

    const handleConnectDrive = async () => {
        setDriveLoading(true);
        
        // 1. Coba inisialisasi folder (kasus jika token sudah ada di sesi)
        const setupResult = await setupGoogleDriveFolder();
        
        if (setupResult.success) {
            toast({ title: "Berhasil Terhubung", description: "Integrasi Google Drive telah diaktifkan." });
            router.refresh();
            setDriveLoading(false);
            return;
        }

        // 2. Jika gagal karena token tidak ada, arahkan ke Google OAuth
        if (!supabase) return;
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                scopes: "https://www.googleapis.com/auth/drive.file",
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });

        if (error) {
            toast({ 
                title: "Gagal Menghubungkan", 
                description: "Terjadi kesalahan saat menghubungkan akun Google.",
                variant: "destructive"
            });
            setDriveLoading(false);
        }
    }

    const handleSetupFolder = async () => {
        setDriveLoading(true);
        const result = await setupGoogleDriveFolder();
        if (result.success) {
            toast({ title: "Sukses", description: result.message || "Folder Drive siap digunakan." });
            router.refresh();
        } else {
            toast({ 
                title: "Gagal Setup", 
                description: result.error, 
                variant: "destructive",
                action: (
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Muat Ulang</Button>
                )
            });
        }
        setDriveLoading(false);
    }

    const handleTestUpload = async () => {
        setTestLoading(true);
        const result = await createTestDocument();
        if (result.success) {
            toast({ 
                title: "Uji Coba Sukses", 
                description: result.message,
                action: result.file_url ? (
                    <Button variant="outline" size="sm" asChild>
                        <a href={result.file_url} target="_blank" rel="noopener noreferrer">Buka File</a>
                    </Button>
                ) : undefined
            });
        } else {
            toast({ title: "Uji Coba Gagal", description: result.error, variant: "destructive" });
        }
        setTestLoading(false);
    }

    const handleDisconnectDrive = async () => {
        setDriveLoading(true);
        const result = await disconnectGoogleDrive();
        if (result.success) {
            toast({ title: "Terputus", description: "Integrasi Google Drive telah dinonaktifkan." });
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setDriveLoading(false);
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
                <h1 className="text-3xl font-bold font-headline text-slate-900 tracking-tight">Pengaturan</h1>
                <p className="text-slate-500 mt-1">Kelola identitas, akun, dan integrasi Anda.</p>
            </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:shadow-sm font-bold">Profil</TabsTrigger>
                <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:shadow-sm font-bold">Integrasi</TabsTrigger>
                <TabsTrigger value="account" className="rounded-lg data-[state=active]:shadow-sm font-bold">Akun</TabsTrigger>
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
                            className="w-full sm:w-auto h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-bold"
                           >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                Simpan Perubahan Profil
                           </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            <TabsContent value="integrations" className="mt-8 space-y-6">
                {/* 1. Google Drive Card */}
                <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" className="h-6 w-6">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                    </div>
                                    <CardTitle className="text-2xl font-bold">Google Drive</CardTitle>
                                </div>
                                <CardDescription className="max-w-md">
                                    Simpan dokumen hasil AI Pembelajaran secara otomatis ke Google Drive Anda.
                                </CardDescription>
                            </div>
                            <div>
                                {driveIntegration?.status === 'connected' ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                                        Terhubung
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-slate-400 border-slate-200 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                                        Belum Terhubung
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        {driveIntegration?.status === 'connected' ? (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Akun Terhubung</span>
                                        <p className="font-bold text-slate-700">{user.email}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folder Penyimpanan</span>
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-700">{driveIntegration.folder_name || 'LakuKelas AI'}</p>
                                            {!driveIntegration.folder_id && (
                                                <Badge variant="destructive" className="text-[8px] px-1.5">Belum Diatur</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    {driveIntegration.folder_id ? (
                                        <>
                                            <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold border-indigo-200 text-indigo-700" asChild>
                                                <a href={driveIntegration.folder_url || "#"} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="mr-2 h-4 w-4" /> Buka Folder Drive
                                                </a>
                                            </Button>
                                            <Button 
                                                onClick={handleTestUpload} 
                                                disabled={testLoading}
                                                variant="secondary"
                                                className="flex-1 rounded-xl h-12 font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            >
                                                {testLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                                Kirim File Uji Coba
                                            </Button>
                                        </>
                                    ) : (
                                        <Button 
                                            onClick={handleSetupFolder} 
                                            disabled={driveLoading}
                                            className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                        >
                                            {driveLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                                            Buat Folder Aplikasi
                                        </Button>
                                    )}
                                    <Button 
                                        variant="ghost" 
                                        className="flex-1 rounded-xl h-12 font-bold text-red-500 hover:bg-red-50"
                                        onClick={handleDisconnectDrive}
                                        disabled={driveLoading}
                                    >
                                        {driveLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                        Putuskan Integrasi
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 space-y-6">
                                <div className="mx-auto w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <Database className="h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-bold text-slate-900">Mulai Integrasi Google Drive</h4>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                        Hubungkan akun Google Anda untuk mengaktifkan fitur simpan otomatis dokumen AI.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleConnectDrive} 
                                    disabled={driveLoading}
                                    className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-200 font-bold text-lg"
                                >
                                    {driveLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                                    Hubungkan Akun Google
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Gemini API Card */}
                <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <form onSubmit={handleProfileSave}>
                        <CardHeader className="bg-slate-50/50 border-b p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm flex items-center justify-center">
                                            <Key className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-2xl font-bold">Google Gemini AI</CardTitle>
                                    </div>
                                    <CardDescription className="max-w-md">
                                        Gunakan kunci API Anda sendiri untuk menjalankan fitur AI Pembelajaran. Ini memastikan Anda memiliki kontrol penuh atas penggunaan AI.
                                    </CardDescription>
                                </div>
                                {profileData.geminiApiKey ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                                        Tersimpan
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                                        Belum Ada Key
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="geminiApiKey" className="text-slate-700 font-bold flex items-center gap-2">
                                        API Key Gemini
                                    </Label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input 
                                            id="geminiApiKey" 
                                            name="geminiApiKey" 
                                            type="password"
                                            value={profileData.geminiApiKey} 
                                            onChange={handleProfileChange} 
                                            className="h-12 pl-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-xl font-mono"
                                            placeholder="Masukkan API Key Anda..."
                                        />
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        <span>Cara Mendapatkan API Key</span>
                                    </div>
                                    <p className="text-sm text-amber-800 leading-relaxed">
                                        Kunjungi Google AI Studio untuk membuat API Key secara gratis. Salin kunci yang Anda dapatkan dan tempelkan di atas.
                                    </p>
                                    <Button variant="outline" className="w-full bg-white border-amber-200 text-amber-700 font-bold hover:bg-amber-100 h-11 rounded-xl shadow-sm" asChild>
                                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                                            Buka Google AI Studio <ExternalLink className="ml-2 h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/50 border-t p-8">
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full sm:w-auto h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-bold"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                Simpan API Key
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
                            <p className="text-xs text-amber-600 font-medium bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2 font-bold">
                                💡 Hubungi administrator jika Anda perlu mengubah alamat email terdaftar.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
    )
}
