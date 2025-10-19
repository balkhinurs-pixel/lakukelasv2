
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
import { PlusCircle, Trash2, Loader2, CalendarOff, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from "next/navigation";
import { saveHoliday, deleteHoliday } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

interface Holiday {
  id: string;
  date: string;
  description: string;
}

export default function HolidaysClientPage({ initialHolidays }: { initialHolidays: Holiday[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [holidays, setHolidays] = React.useState<Holiday[]>(initialHolidays);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [holidayToDelete, setHolidayToDelete] = React.useState<Holiday | null>(null);

  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [description, setDescription] = React.useState("");

  const [loading, setLoading] = React.useState(false);

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

    const result = await saveHoliday({ date: format(date, 'yyyy-MM-dd'), description });

    if (result.success) {
      toast({ title: "Sukses", description: "Hari libur berhasil disimpan." });
      setIsDialogOpen(false);
      setDate(undefined);
      setDescription("");
      router.refresh();
    } else {
      toast({ title: "Gagal", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setDate(undefined); setDescription(""); }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Hari Libur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSaveHoliday}>
              <DialogHeader>
                <DialogTitle>Tambah Hari Libur Baru</DialogTitle>
                <DialogDescription>
                  Pilih tanggal dan berikan keterangan untuk hari libur. Guru tidak akan ditandai "Belum Absen" pada tanggal ini.
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
                  <Label htmlFor="description">Keterangan</Label>
                  <Input
                    id="description"
                    placeholder="e.g. Hari Raya Idul Fitri"
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

      <AlertDialog open={!!holidayToDelete} onOpenChange={(open) => !open && setHolidayToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Anda yakin ingin menghapus hari libur ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Hari libur <span className="font-bold">{holidayToDelete?.description}</span> pada tanggal <span className="font-bold">{holidayToDelete ? format(parseISO(holidayToDelete.date), "dd MMMM yyyy", { locale: id }) : ''}</span> akan dihapus.
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
          <CardTitle>Daftar Hari Libur</CardTitle>
          <CardDescription>Total hari libur terdaftar: {holidays.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {holidays.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">{holiday.description}</p>
                  <p className="text-sm text-muted-foreground">{format(parseISO(holiday.date), "EEEE, dd MMMM yyyy", { locale: id })}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setHolidayToDelete(holiday)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {holidays.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <CalendarOff className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">Belum Ada Hari Libur</h3>
              <p className="mt-1 text-sm text-gray-500">Tambahkan hari libur agar sistem absensi lebih akurat.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
