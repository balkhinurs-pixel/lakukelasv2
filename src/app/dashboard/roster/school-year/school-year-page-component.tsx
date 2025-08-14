
"use client"
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SchoolYear } from "@/lib/types";
import { createSchoolYear, setActiveSchoolYear } from "@/lib/actions";

export default function SchoolYearPageComponent({
    initialSchoolYears,
    initialActiveSchoolYearId
}: {
    initialSchoolYears: SchoolYear[],
    initialActiveSchoolYearId: string | null
}) {
    const router = useRouter();
    const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>(initialSchoolYears);
    const [activeSchoolYearId, setActiveSchoolYearId] = React.useState(initialActiveSchoolYearId || "");
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [newStartYear, setNewStartYear] = React.useState<number | "">("");
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    
    React.useEffect(() => {
        setSchoolYears(initialSchoolYears);
        setActiveSchoolYearId(initialActiveSchoolYearId || (initialSchoolYears.length > 0 ? initialSchoolYears[0].id : ""));
    }, [initialSchoolYears, initialActiveSchoolYearId]);

    const handleSaveActiveYear = async () => {
        setLoading(true);
        const result = await setActiveSchoolYear(activeSchoolYearId);
        if (result.success) {
            toast({
                title: "Pengaturan Disimpan",
                description: `Tahun ajaran aktif telah diubah.`
            });
            router.refresh();
        } else {
             toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }
    
    const handleAddNewYear = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newStartYear) {
             toast({ title: "Gagal", description: "Mohon isi tahun mulai ajaran.", variant: "destructive" });
            return;
        }

        setLoading(true);
        const result = await createSchoolYear(Number(newStartYear));
        
        if (result.success) {
            toast({ title: "Sukses", description: "Tahun ajaran baru berhasil ditambahkan." });
            setNewStartYear("");
            setIsDialogOpen(false);
            router.refresh();
        } else {
            toast({ title: "Gagal", description: result.error, variant: "destructive" });
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Tahun Ajaran</h1>
                    <p className="text-muted-foreground">Atur tahun ajaran yang sedang aktif untuk seluruh aplikasi.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Tahun Ajaran
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAddNewYear}>
                            <DialogHeader>
                                <DialogTitle>Tambah Tahun Ajaran Baru</DialogTitle>
                                <DialogDescription>
                                    Cukup masukkan tahun awal. Sistem akan otomatis membuat Semester Ganjil dan Genap.
                                </DialogDescription>
                            </DialogHeader>
                             <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-year">Tahun Mulai Ajaran</Label>
                                    <Input 
                                        id="start-year" 
                                        type="number" 
                                        placeholder="e.g. 2024" 
                                        value={newStartYear} 
                                        onChange={e => setNewStartYear(Number(e.target.value))} 
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Contoh: Masukkan `2024` untuk membuat `2024/2025 - Ganjil` dan `2024/2025 - Genap`.</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Pengaturan Tahun Ajaran Aktif</CardTitle>
                    <CardDescription>Pilih tahun ajaran dan semester yang sedang berjalan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                     <div className="space-y-2">
                        <Label>Tahun Ajaran Aktif</Label>
                         <Select value={activeSchoolYearId} onValueChange={setActiveSchoolYearId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tahun ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                {schoolYears.map(year => (
                                     <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Tahun ajaran aktif akan mempengaruhi pencatatan data baru.</p>
                     </div>
                </CardContent>
                 <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSaveActiveYear} disabled={loading || !activeSchoolYearId}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Simpan Pengaturan
                    </Button>
                 </CardFooter>
            </Card>
        </div>
    )
}
