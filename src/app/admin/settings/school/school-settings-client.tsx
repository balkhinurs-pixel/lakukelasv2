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
import { Loader2, Building } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SchoolSettingsClientPage({ profile }: { profile: Profile }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);

    const logoInputRef = React.useRef<HTMLInputElement>(null);

    const [logoUrl, setLogoUrl] = React.useState(profile.school_logo_url);
    
    const [schoolData, setSchoolData] = React.useState({
        schoolName: profile.school_name || '',
        schoolAddress: profile.school_address || '',
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

        const MAX_LOGO_SIZE = 500 * 1024; // 500KB
        const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

        if (file.size > MAX_LOGO_SIZE) {
            toast({
                title: "Ukuran File Terlalu Besar",
                description: `Ukuran file maksimal adalah 500KB.`,
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

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadProfileImage(formData, 'logo');

        if (result.success && result.url) {
            toast({ title: "Sukses", description: "Logo berhasil diunggah." });
            setLogoUrl(result.url);
            router.refresh();
        } else {
            toast({ title: "Gagal Mengunggah", description: result.error, variant: "destructive" });
        }
        setUploading(false);
        e.target.value = '';
    }

    return (
    <div className="space-y-6">
        <input type="file" ref={logoInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <Building className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold font-headline">Data Sekolah</h1>
                <p className="text-muted-foreground">Kelola informasi sekolah yang akan tampil di kop surat laporan.</p>
            </div>
        </div>
        
        <Card>
            <form onSubmit={handleSchoolDataSave}>
                <CardHeader>
                    <CardTitle>Informasi Institusi</CardTitle>
                    <CardDescription>Informasi ini akan digunakan pada kop surat di semua laporan yang dicetak.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Logo Sekolah</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 rounded-md">
                                <AvatarImage src={logoUrl || "https://placehold.co/100x100.png"} alt="Logo Sekolah" data-ai-hint="school building" />
                                <AvatarFallback>LOGO</AvatarFallback>
                            </Avatar>
                            <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploading}>
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Ganti Logo
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">JPG, PNG, atau WEBP. Ukuran maksimal 500KB.</p>
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
    </div>
    )
}
