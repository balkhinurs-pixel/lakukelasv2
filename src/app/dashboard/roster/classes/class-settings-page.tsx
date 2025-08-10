
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusCircle, Sparkles, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivation } from "@/hooks/use-activation";
import type { Class } from "@/lib/types";
import Link from "next/link";
import { saveClass } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function ClassSettingsPageComponent({ initialClasses }: { initialClasses: Class[] }) {
    const router = useRouter();
    const [classes, setClasses] = React.useState<Class[]>(initialClasses);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [newClassName, setNewClassName] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();
    const { limits, isPro } = useActivation();

    React.useEffect(() => {
        setClasses(initialClasses);
    }, [initialClasses]);

    const canCreateClass = isPro || classes.length < limits.classes;

    const handleSaveClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!canCreateClass) {
            toast({ title: "Batas Tercapai", description: "Anda telah mencapai batas maksimal jumlah kelas untuk akun gratis.", variant: "destructive" });
            setLoading(false);
            return;
        }

        if (!newClassName) {
            toast({ title: "Gagal", description: "Nama kelas tidak boleh kosong.", variant: "destructive" });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('name', newClassName);
        
        const result = await saveClass(formData);

        if (result.success) {
            toast({ title: "Sukses", description: `Kelas ${newClassName} berhasil dibuat.` });
            setNewClassName("");
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
                    <h1 className="text-2xl font-bold font-headline">Pengaturan Kelas</h1>
                    <p className="text-muted-foreground">Kelola daftar kelas yang Anda ajar.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={!canCreateClass}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Buat Kelas Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSaveClass}>
                            <DialogHeader>
                                <DialogTitle>Buat Kelas Baru</DialogTitle>
                                <DialogDescription>Tambahkan kelas baru ke dalam sistem.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="class-name">Nama Kelas</Label>
                                    <Input id="class-name" placeholder="e.g. Kelas 12-A" value={newClassName} onChange={e => setNewClassName(e.target.value)} required/>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Kelas
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {!isPro && (
                 <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>Aktivasi Akun Pro!</AlertTitle>
                    <AlertDescription>
                        Anda menggunakan akun gratis dengan batas **{limits.classes} kelas**.
                        <Button variant="link" className="p-0 h-auto ml-1" asChild>
                           <Link href="/dashboard/activation">Aktivasi sekarang</Link>
                        </Button> untuk membuat kelas tanpa batas.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kelas</CardTitle>
                    <CardDescription>Berikut adalah semua kelas yang terdaftar di sistem. ({classes.length}/{isPro ? '∞' : limits.classes})</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {classes.map((c) => (
                             <div key={c.id} className="border rounded-lg p-4 flex justify-between items-center">
                                <span className="font-semibold">{c.name}</span>
                                <Button variant="outline" size="sm" disabled>
                                    <Edit className="mr-2 h-4 w-4" /> Ubah
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>ID Kelas</TableHead>
                                <TableHead>Nama Kelas</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-mono text-muted-foreground">{c.id}</TableCell>
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" disabled>Ubah (Segera Hadir)</Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     {classes.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            <p>Belum ada kelas yang dibuat.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
