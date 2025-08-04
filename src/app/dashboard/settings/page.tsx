
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

export default function SettingsPage() {
    const { toast } = useToast();

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Pengaturan Disimpan",
            description: "Perubahan Anda telah berhasil disimpan.",
        });
    }

    return (
    <div className="space-y-6">
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
                    <form onSubmit={handleSaveChanges}>
                        <CardHeader>
                            <CardTitle>Profil Pengguna</CardTitle>
                            <CardDescription>Perbarui foto dan informasi pribadi Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src="https://placehold.co/100x100.png" alt="Teacher" data-ai-hint="teacher portrait"/>
                                    <AvatarFallback>GT</AvatarFallback>
                                </Avatar>
                                <Button type="button" variant="outline">Ganti Foto</Button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nama Lengkap (dengan gelar)</Label>
                                    <Input id="fullName" defaultValue="Guru Tangguh, S.Pd." />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="nip">NIP / ID Guru</Label>
                                    <Input id="nip" defaultValue="199001012020121001" />
                                </div>
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pangkat">Pangkat / Golongan</Label>
                                    <Input id="pangkat" defaultValue="Penata Muda Tk. I, III/b" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="jabatan">Jabatan</Label>
                                    <Input id="jabatan" defaultValue="Guru Mata Pelajaran" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                           <Button type="submit">Simpan Perubahan</Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
            <TabsContent value="account" className="mt-6">
                 <Card>
                    <form onSubmit={handleSaveChanges}>
                        <CardHeader>
                            <CardTitle>Pengaturan Akun</CardTitle>
                            <CardDescription>Ubah email dan kata sandi Anda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-2">
                                <Label htmlFor="email">Alamat Email</Label>
                                <Input id="email" type="email" defaultValue="guru@sekolah.id" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                                <Input id="currentPassword" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                                <Input id="newPassword" type="password" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                                <Input id="confirmPassword" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                           <Button type="submit">Perbarui Akun</Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
            <TabsContent value="school" className="mt-6">
                <Card>
                    <form onSubmit={handleSaveChanges}>
                        <CardHeader>
                            <CardTitle>Data Sekolah</CardTitle>
                            <CardDescription>Informasi ini akan digunakan pada kop laporan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-2">
                                <Label htmlFor="schoolName">Nama Sekolah</Label>
                                <Input id="schoolName" defaultValue="SMA Negeri 1 Harapan Bangsa" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="schoolAddress">Alamat Sekolah</Label>
                                <Input id="schoolAddress" defaultValue="Jl. Pendidikan No. 1, Kota Cerdas, 12345" />
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="headmasterName">Nama Kepala Sekolah</Label>
                                    <Input id="headmasterName" defaultValue="Dr. H. Bijaksana, M.Pd." />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="headmasterNip">NIP Kepala Sekolah</Label>
                                    <Input id="headmasterNip" defaultValue="198001012010121001" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                           <Button type="submit">Simpan Data Sekolah</Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
    )
}
