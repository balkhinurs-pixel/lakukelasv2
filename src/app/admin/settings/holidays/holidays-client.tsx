
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { PlusCircle, Trash2, Loader2, CalendarOff, Calendar as CalendarIcon, Flag, School, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { saveHoliday, deleteHoliday, syncNationalHolidaysManual } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Holiday } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function HolidaysClientPage({ initialHolidays }: { initialHolidays: Holiday[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [holidays, setHolidays] = React.useState<Holiday[]>(initialHolidays);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [holidayToDelete, setHolidayToDelete] = React.useState<Holiday | null>(null);

  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [description, setDescription] = React.useState("");
  const [holidayType, setHolidayType] = React.useState<'national' | 'school'>('school');

  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    setHolidays(initialHolidays);
  }, [initialHolidays]);

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description) {
      toast({ title: "Gagal", description: "Tanggal dan keterangan harus diisi.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const result = await saveHoliday({ 
        date: format(date, 'yyyy-MM-dd'), 
        description,
        type: holidayType 
    });

    if (result.success) {
      toast({ title: "Sukses", description: "Hari libur berhasil disimpan." });
      setIsDialogOpen(false);
      setDate(undefined);
      setDescription("");
      setHolidayType('school');
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSyncManual = async () => {
      setSyncing(true);
      toast({ title: "Memulai Sinkronisasi", description: "Sedang menarik data libur nasional 2025-2026..." });
      
      const result = await syncNationalHolidaysManual();
      
      if (result.success) {
          toast({ title: "Berhasil", description: result.message });
          router.refresh();
      } else {
          toast({ title: "Gagal", description: result.error, variant: "destructive" });
      }
      setSyncing(false);
  }

  const handleDelete = async () => {
    if (!holidayToDelete) return;
    setLoading(true);

    const result = await deleteHoliday(holidayToDelete.id);

    if (result.success) {
        toast({ title: "Sukses", description: "Hari libur berhasil dihapus." });
        setHolidayToDelete(null);
        router.refresh();
    } else {
        toast({ title: "Gagal", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
            <CalendarOff className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline">Pengaturan Hari Libur</h1>
            <p className="text-muted-foreground">Kelola daftar hari libur nasional atau libur sekolah.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
                variant="outline" 
                onClick={handleSyncManual} 
                disabled={syncing}
                className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            >
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sync Libur Nasional
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => { setDate(undefined); setDescription(""); setHolidayType('school'); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Libur Manual
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <form onSubmit={handleSaveHoliday}>
                    <DialogHeader>
                        <DialogTitle>Tambah Hari Libur Baru</DialogTitle>
                        <DialogDescription>
                        Pilih tanggal dan tipe libur. Guru tidak wajib absen pada tanggal ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="holiday-type">Tipe Hari Libur</Label>
                        <Select value={holidayType} onValueChange={(v: any) => setHolidayType(v)}>
                            <SelectTrigger id="holiday-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="school">Libur Khusus Sekolah</SelectItem>
                                <SelectItem value="national">Libur Nasional</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="description">Keterangan</Label>
                        <Input
                            id="description"
                            placeholder="e.g. Libur Akhir Semester Genap"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Hari Libur
                        </Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <AlertDialog open={!!holidayToDelete} onOpenChange={(open) => !open && setHolidayToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Anda yakin ingin menghapus hari libur ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Hari libur <span className="font-bold">{holidayToDelete?.description}</span> akan dihapus.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Ya, Hapus
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Hari Libur Terdaftar</CardTitle>
          <CardDescription>Menampilkan semua libur (Nasional & Sekolah).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {holidays.length > 0 ? (
                holidays.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className={cn(
                              "p-2 rounded-lg",
                              holiday.type === 'national' ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
                          )}>
                              {holiday.type === 'national' ? <Flag className="h-4 w-4" /> : <School className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{holiday.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">{format(parseISO(holiday.date), "EEEE, dd MMMM yyyy", { locale: id })}</p>
                                <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4">
                                    {holiday.type === 'national' ? 'Nasional' : 'Sekolah'}
                                </Badge>
                            </div>
                          </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setHolidayToDelete(holiday)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
            ) : (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
                    <CalendarOff className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                    <h3 className="mt-2 text-sm font-medium">Belum Ada Hari Libur</h3>
                    <p className="text-xs text-slate-400">Gunakan tombol <strong>Sync Libur Nasional</strong> di atas untuk menarik data otomatis dari pemerintah.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
