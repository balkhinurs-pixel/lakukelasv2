
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";

// In a real app, these values would come from a database.
const semesterPrice = 150000;
const annualPrice = 250000;

export default function PricingSettingsPage() {
    const { toast } = useToast();

    const handleSave = () => {
        // In a real app, this would trigger an API call to update the prices in the database.
        toast({
            title: "Harga Disimpan",
            description: "Harga paket langganan telah berhasil diperbarui.",
        });
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Kelola Harga</h1>
        <p className="text-muted-foreground">
          Atur harga untuk paket langganan semesteran dan tahunan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Paket Semester</CardTitle>
                <CardDescription>Pengaturan untuk langganan per 6 bulan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="semester-price">Harga (Rp)</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input id="semester-price" type="number" defaultValue={semesterPrice} className="pl-8"/>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id="semester-active" defaultChecked={true} />
                    <Label htmlFor="semester-active">Aktifkan Paket Ini</Label>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave}>Simpan Paket Semester</Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Paket Tahunan</CardTitle>
                <CardDescription>Pengaturan untuk langganan per 12 bulan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="annual-price">Harga (Rp)</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input id="annual-price" type="number" defaultValue={annualPrice} className="pl-8"/>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="annual-active" defaultChecked={true} />
                    <Label htmlFor="annual-active">Aktifkan Paket Ini</Label>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave}>Simpan Paket Tahunan</Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
