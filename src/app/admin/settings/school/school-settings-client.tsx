
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
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";
import { updateSchoolData, uploadProfileImage } from "@/lib/actions/admin";
import { Loader2, Building, Camera, MapPin, User, ShieldCheck, Mail, Globe, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SchoolSettingsClientPage({ profile }: { profile: Profile }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);

    const logoInputRef = React.useRef<HTMLInputElement>(null);

    const [logoUrl, setLogoUrl] = React.useState(profile.school_logo_url);
    
    const [schoolData, setSchoolData] = React.useState({
        schoolName: profile.school_name || '',
        npsn: profile.npsn || '',
        schoolAddress: profile.school_address || '',
        schoolEmail: profile.school_email || '',
        schoolWebsite: profile.school_website || '',
        headmasterName: profile.headmaster_name || '',
        headmasterNip: profile.headmaster_nip || '',
    })

    const handleSchoolDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSchoolData({ ...schoolData, [e.target.name]: e.target.value });
    }
    
    const handleSchoolDataSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await updateSchoolData(schoolData);
        if (result.success) {
            toast({ title: "Data Sekolah Disimpan", description: "Perubahan data sekolah telah berhasil disimpan." });
            router.refresh();
        } else {
            toast({ title: "Gagal Menyimpan", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_LOGO_SIZE = 1 * 1024 * 1024; // 1MB
        const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

        if (file.size > MAX_LOGO_SIZE) {
            toast({
                title: "File Terlalu Besar",
                description: `Ukuran logo maksimal adalah 1MB.`,
                variant: "destructive",
            });
            return;
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
             toast({
                title: "Format Tidak Didukung",
                description: "Gunakan file gambar dengan format JPEG, PNG, atau WEBP.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadProfileImage(formData, 'logo');

            if (result.success && result.url) {
                setLogoUrl(result.url);
                toast({ title: "Sukses", description: "Logo sekolah berhasil diperbarui." });
                router.refresh();
            } else {
                toast({ title: "Gagal Mengunggah", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Terjadi kesalahan sistem saat mengunggah logo.", variant: "destructive" });
        } finally {
            setUploading(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    }

    return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
        <input 
            type="file" 
            ref={logoInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
        />
        
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <Building className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold font-headline text-slate-900 tracking-tight">Identitas Sekolah</h1>
                <p className="text-slate-500 mt-1">Konfigurasi informasi institusi untuk profil dan kop surat resmi.</p>
            </div>
        </div>
        
        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
            <form onSubmit={handleSchoolDataSave}>
                <CardHeader className="bg-slate-50/50 border-b p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <div className="h-32 w-32 bg-white rounded-2xl border-2 border-slate-200 p-2 shadow-inner flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                                <Avatar className="h-full w-full rounded-xl">
                                    <AvatarImage src={logoUrl || ""} alt="Logo Sekolah" className="object-contain" />
                                    <AvatarFallback className="bg-slate-50 text-slate-400">
                                        <Building className="h-10 w-10" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <button 
                                type="button"
                                disabled={uploading}
                                onClick={() => logoInputRef.current?.click()}
                                className={cn(
                                    "absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg border-2 border-white transition-all duration-200",
                                    uploading ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-90"
                                )}
                            >
                                {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Camera className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <CardTitle className="text-2xl font-bold">Logo Institusi</CardTitle>
                            <CardDescription className="max-w-md mt-2 leading-relaxed">
                                Logo ini akan tampil pada setiap laporan PDF yang diunduh. Disarankan gunakan gambar transparan berformat PNG ukuran kotak.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-8 p-8 pt-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="schoolName" className="text-slate-700 font-semibold flex items-center gap-2">
                                <Building className="h-4 w-4 text-slate-400" /> Nama Sekolah
                            </Label>
                            <Input 
                                id="schoolName" 
                                name="schoolName" 
                                value={schoolData.schoolName} 
                                onChange={handleSchoolDataChange} 
                                placeholder="e.g. SMAN 1 Jakarta"
                                className="h-12 border-slate-200 focus:border-emerald-500 rounded-xl"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="npsn" className="text-slate-700 font-semibold flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-slate-400" /> NPSN
                            </Label>
                            <Input 
                                id="npsn" 
                                name="npsn" 
                                value={schoolData.npsn} 
                                onChange={handleSchoolDataChange} 
                                placeholder="8 digit angka"
                                className="h-12 border-slate-200 focus:border-emerald-500 rounded-xl"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="schoolAddress" className="text-slate-700 font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" /> Alamat Lengkap
                        </Label>
                        <Input 
                            id="schoolAddress" 
                            name="schoolAddress" 
                            value={schoolData.schoolAddress} 
                            onChange={handleSchoolDataChange} 
                            placeholder="Jl. Merdeka No. 123, Jakarta Pusat"
                            className="h-12 border-slate-200 focus:border-emerald-500 rounded-xl"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label htmlFor="schoolEmail" className="text-slate-700 font-semibold flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-400" /> Email Sekolah
                            </Label>
                            <Input 
                                id="schoolEmail" 
                                name="schoolEmail" 
                                type="email"
                                value={schoolData.schoolEmail} 
                                onChange={handleSchoolDataChange} 
                                placeholder="info@sman1jakarta.sch.id"
                                className="h-12 border-slate-200 focus:border-emerald-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schoolWebsite" className="text-slate-700 font-semibold flex items-center gap-2">
                                <Globe className="h-4 w-4 text-slate-400" /> Website
                            </Label>
                            <Input 
                                id="schoolWebsite" 
                                name="schoolWebsite" 
                                value={schoolData.schoolWebsite} 
                                onChange={handleSchoolDataChange} 
                                placeholder="www.sman1jakarta.sch.id"
                                className="h-12 border-slate-200 focus:border-emerald-500 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label htmlFor="headmasterName" className="text-slate-700 font-semibold flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-400" /> Nama Kepala Sekolah
                            </Label>
                            <Input 
                                id="headmasterName" 
                                name="headmasterName" 
                                value={schoolData.headmasterName} 
                                onChange={handleSchoolDataChange} 
                                placeholder="Nama Beserta Gelar"
                                className="h-12 border-slate-200 focus:border-emerald-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headmasterNip" className="text-slate-700 font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-slate-400" /> NIP Kepala Sekolah
                            </Label>
                            <Input 
                                id="headmasterNip" 
                                name="headmasterNip" 
                                value={schoolData.headmasterNip} 
                                onChange={handleSchoolDataChange} 
                                placeholder="1980XXXXXXXXX"
                                className="h-12 border-slate-200 focus:border-emerald-500 rounded-xl"
                            />
                        </div>
                    </div>
                </CardContent>
                
                <CardFooter className="bg-slate-50/50 border-t p-8">
                   <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 font-bold"
                   >
                        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Simpan Identitas Sekolah
                   </Button>
                </CardFooter>
            </form>
        </Card>
    </div>
    )
}
