
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";

const coupons = [
    { code: 'GURUBARU', type: 'Persen', value: '15%', used: 25, limit: 100, status: 'Aktif' },
    { code: 'HEMAT50K', type: 'Tetap', value: 'Rp 50.000', used: 80, limit: 100, status: 'Aktif' },
    { code: 'LAUNCHING', type: 'Persen', value: '50%', used: 200, limit: 200, status: 'Tidak Aktif' },
]

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Kelola Kupon</h1>
          <p className="text-muted-foreground">
            Buat dan kelola kode kupon diskon untuk promosi.
          </p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Kupon Baru
        </Button>
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
                                <TableCell className="font-medium">{coupon.value}</TableCell>
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
