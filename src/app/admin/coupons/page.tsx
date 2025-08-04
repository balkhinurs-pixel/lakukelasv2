
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Coupon = {
    code: string;
    type: 'Persen' | 'Tetap';
    value: string;
    used: number;
    limit: number;
    status: 'Aktif' | 'Tidak Aktif';
}

const initialCoupons: Coupon[] = [
    { code: 'GURUBARU', type: 'Persen', value: '15', used: 25, limit: 100, status: 'Aktif' },
    { code: 'HEMAT50K', type: 'Tetap', value: '50000', used: 80, limit: 100, status: 'Aktif' },
    { code: 'LAUNCHING', type: 'Persen', value: '50', used: 200, limit: 200, status: 'Tidak Aktif' },
];

const initialNewCouponState = {
    code: '',
    type: 'Persen' as 'Persen' | 'Tetap',
    value: '',
    limit: 100,
};

export default function CouponsPage() {
    const [coupons, setCoupons] = React.useState<Coupon[]>(initialCoupons);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [newCoupon, setNewCoupon] = React.useState(initialNewCouponState);
    const { toast } = useToast();

    const handleSaveCoupon = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCoupon.code || !newCoupon.value || !newCoupon.limit) {
            toast({ title: "Gagal", description: "Mohon isi semua kolom.", variant: "destructive" });
            return;
        }

        const newCouponData: Coupon = {
            ...newCoupon,
            used: 0,
            status: 'Aktif',
            value: newCoupon.value, // value is already string
        };

        setCoupons([newCouponData, ...coupons]);
        toast({ title: "Sukses", description: "Kupon baru berhasil dibuat." });
        setNewCoupon(initialNewCouponState);
        setIsDialogOpen(false);
    };

    const formatValue = (coupon: Coupon) => {
        if (coupon.type === 'Persen') {
            return `${coupon.value}%`;
        }
        return `Rp ${parseInt(coupon.value).toLocaleString('id-ID')}`;
    }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Kelola Kupon</h1>
          <p className="text-muted-foreground">
            Buat dan kelola kode kupon diskon untuk promosi.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Buat Kupon Baru
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSaveCoupon}>
                    <DialogHeader>
                        <DialogTitle>Buat Kupon Baru</DialogTitle>
                        <DialogDescription>Masukkan detail kupon untuk promosi baru.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Kode Kupon</Label>
                            <Input id="code" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="e.g. GURUMERDEKA" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Tipe Kupon</Label>
                                <Select value={newCoupon.type} onValueChange={(value: Coupon['type']) => setNewCoupon({ ...newCoupon, type: value })}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Pilih tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Persen">Persen (%)</SelectItem>
                                        <SelectItem value="Tetap">Potongan Tetap (Rp)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Nilai</Label>
                                <Input id="value" type="number" value={newCoupon.value} onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })} placeholder={newCoupon.type === 'Persen' ? 'e.g. 10' : 'e.g. 25000'} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="limit">Batas Penggunaan</Label>
                            <Input id="limit" type="number" value={newCoupon.limit} onChange={(e) => setNewCoupon({ ...newCoupon, limit: parseInt(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Simpan Kupon</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

        <Card>
            <CardHeader>
                <CardTitle>Daftar Kupon</CardTitle>
                <CardDescription>Semua kupon yang pernah dibuat.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kode Kupon</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Nilai</TableHead>
                            <TableHead className="text-center">Penggunaan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {coupons.map((coupon) => (
                            <TableRow key={coupon.code}>
                                <TableCell className="font-mono">{coupon.code}</TableCell>
                                <TableCell>{coupon.type}</TableCell>
                                <TableCell className="font-medium">{formatValue(coupon)}</TableCell>
                                <TableCell className="text-center">{coupon.used}/{coupon.limit}</TableCell>
                                <TableCell>
                                    <Badge variant={coupon.status === 'Aktif' ? 'secondary' : 'outline'} className={coupon.status === 'Aktif' ? 'text-green-700 bg-green-100' : ''}>
                                        {coupon.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
