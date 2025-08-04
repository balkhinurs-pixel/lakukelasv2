
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
import { Label } from "@/components/ui/label";

export default function SchoolYearPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Tahun Ajaran</h1>
                <p className="text-muted-foreground">Atur tahun ajaran yang sedang aktif untuk seluruh aplikasi.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Tahun Ajaran</CardTitle>
                    <CardDescription>Pilih tahun ajaran dan semester yang sedang berjalan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                     <div className="space-y-2">
                        <Label>Tahun Ajaran Aktif</Label>
                         <Select defaultValue="2023/2024-2">
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tahun ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2023/2024-2">2023/2024 - Semester Genap</SelectItem>
                                <SelectItem value="2024/2025-1">2024/2025 - Semester Ganjil</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Tahun ajaran aktif akan mempengaruhi pencatatan data baru.</p>
                     </div>
                     <Button>Simpan Pengaturan</Button>
                </CardContent>
            </Card>
        </div>
    )
}
