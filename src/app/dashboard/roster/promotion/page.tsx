
"use client"
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft } from "lucide-react";
import { classes } from "@/lib/placeholder-data";

export default function PromotionPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Promosi & Mutasi Siswa</h1>
                <p className="text-muted-foreground">Pindahkan siswa secara kolektif di akhir tahun ajaran.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Alat Bantu Akhir Tahun Ajaran</CardTitle>
                    <CardDescription>Gunakan fitur ini untuk kenaikan kelas atau menandai kelulusan siswa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                        <h3 className="font-semibold text-amber-900">Penting: Proses Akhir Tahun Ajaran</h3>
                        <p className="text-sm text-amber-800 mt-1">Gunakan fitur ini di akhir semester genap. Pastikan semua nilai dan laporan telah final sebelum melakukan promosi atau kelulusan.</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">1. Kenaikan Kelas</h3>
                        <p className="text-sm text-muted-foreground mb-4">Pindahkan semua siswa dari satu kelas ke kelas lainnya. Contoh: Semua siswa Kelas 10-A naik ke Kelas 11-A.</p>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 space-y-1 min-w-[180px]">
                                <Label>Dari Kelas</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kelas asal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <ArrowRightLeft className="mt-6 text-muted-foreground"/>
                            <div className="flex-1 space-y-1 min-w-[180px]">
                                <Label>Ke Kelas</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kelas tujuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="mt-6">Proses</Button>
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">2. Luluskan Siswa</h3>
                        <p className="text-sm text-muted-foreground mb-4">Tandai semua siswa di kelas tertentu sebagai lulus. Data mereka akan diarsipkan dan tidak aktif lagi.</p>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 space-y-1 min-w-[180px]">
                                <Label>Kelas yang Lulus</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.filter(c => c.name.startsWith("Kelas 11")).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="mt-6" variant="destructive">Luluskan Siswa</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
