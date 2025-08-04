import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { PlusCircle } from "lucide-react";
import { journalEntries } from "@/lib/placeholder-data";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { classes } from "@/lib/placeholder-data";


export default function JournalPage() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold font-headline">Jurnal Mengajar</h1>
            <p className="text-muted-foreground">Catatan kegiatan mengajar harian Anda.</p>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Jurnal Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Tambah Jurnal</DialogTitle>
                <DialogDescription>
                    Catat aktivitas mengajar Anda untuk kelas dan tanggal tertentu.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="class" className="text-right">
                    Kelas
                    </Label>
                    <Select>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                                {c.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right">
                    Materi
                    </Label>
                    <Input id="subject" placeholder="e.g. Matematika" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="material" className="text-right">
                    Bahan Ajar
                    </Label>
                    <Input id="material" placeholder="e.g. Aljabar Linier" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                    Catatan
                    </Label>
                    <Textarea id="notes" placeholder="Catatan opsional tentang pelajaran..." className="col-span-3" />
                </div>
                </div>
                <DialogFooter>
                <Button type="submit">Simpan Jurnal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
       </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Jurnal</CardTitle>
          <CardDescription>
            Entri jurnal mengajar Anda yang telah disimpan sebelumnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Tanggal</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mata Pelajaran & Materi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {format(entry.date, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{entry.class}</TableCell>
                  <TableCell>
                    <div className="font-medium">{entry.subject}</div>
                    <div className="text-sm text-muted-foreground">{entry.material}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Lihat
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline">Muat Lebih Banyak</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
