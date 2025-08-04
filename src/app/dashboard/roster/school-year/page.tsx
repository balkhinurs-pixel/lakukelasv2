
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
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

type SchoolYear = {
    id: string;
    name: string;
}

const initialSchoolYears: SchoolYear[] = [
    { id: "2023/2024-2", name: "2023/2024 - Semester Genap" },
    { id: "2024/2025-1", name: "2024/2025 - Semester Ganjil" },
]

export default function SchoolYearPage() {
    const [schoolYears, setSchoolYears] = React.useState<SchoolYear[]>(initialSchoolYears);
    const [activeSchoolYear, setActiveSchoolYear] = React.useState("2023/2024-2");
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [newYear, setNewYear] = React.useState("");
    const [newSemester, setNewSemester] = React.useState("");
    const { toast } = useToast();

    const handleSaveActiveYear = () => {
        // In a real app, this would be saved to a persistent store (e.g., database or user settings)
        toast({
            title: "Pengaturan Disimpan",
            description: `Tahun ajaran aktif telah diubah.`
        });
    }
    
    const handleAddNewYear = (e: React.FormEvent) => {
        e.preventDefault();
        const startYear = parseInt(newYear);
        if (!newYear || isNaN(startYear) || !newSemester) {
             toast({ title: "Gagal", description: "Mohon isi semua kolom dengan benar.", variant: "destructive" });
            return;
        }

        const endYear = startYear + 1;
        const newSchoolYear: SchoolYear = {
            id: `${startYear}/${endYear}-${newSemester === 'Ganjil' ? 1 : 2}`,
            name: `${startYear}/${endYear} - Semester ${newSemester}`
        };

        setSchoolYears([...schoolYears, newSchoolYear]);
        toast({ title: "Sukses", description: "Tahun ajaran baru berhasil ditambahkan." });
        setNewYear("");
        setNewSemester("");
        setIsDialogOpen(false);
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
                                    Definisikan tahun ajaran dan semester baru.
                                </DialogDescription>
                            </DialogHeader>
                             <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-year">Tahun Mulai Ajaran</Label>
                                    <Input id="start-year" type="number" placeholder="e.g. 2024" value={newYear} onChange={e => setNewYear(e.target.value)} required/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="semester">Semester</Label>
                                    <Select value={newSemester} onValueChange={setNewSemester} required>
                                        <SelectTrigger id="semester">
                                            <SelectValue placeholder="Pilih semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ganjil">Semester Ganjil</SelectItem>
                                            <SelectItem value="Genap">Semester Genap</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Simpan</Button>
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
                         <Select value={activeSchoolYear} onValueChange={setActiveSchoolYear}>
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
                    <Button onClick={handleSaveActiveYear}>Simpan Pengaturan</Button>
                 </CardFooter>
            </Card>
        </div>
    )
}
