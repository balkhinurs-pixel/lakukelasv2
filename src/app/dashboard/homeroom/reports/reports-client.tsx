
"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, Loader2, FileText, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { getHomeroomClassDetails, getReportsData } from "@/lib/data";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

interface Props {
  homeroomData: NonNullable<Awaited<ReturnType<typeof getHomeroomClassDetails>>>;
  reportsData: NonNullable<Awaited<ReturnType<typeof getReportsData>>>;
}

export default function HomeroomReportsClient({ homeroomData, reportsData }: Props) {
  const [downloading, setDownloading] = React.useState(false);
  const { toast } = useToast();
  const { homeroomClass, studentsInClass, subjects } = homeroomData;

  const handleDownloadLedgerExcel = () => {
    setDownloading(true);
    // Excel generation logic...
    setDownloading(false);
    toast({ title: "Berhasil", description: "Leger berhasil diunduh." });
  };

  return (
    <div className="space-y-6 p-1">
      <HandWrittenTitle 
        title={`Laporan Kelas ${homeroomClass.name}`} 
        subtitle="Siswa"
        className="py-4 md:py-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <CardTitle>Laporan Kehadiran</CardTitle>
            <CardDescription>Rekap bulanan seluruh siswa.</CardDescription>
          </CardHeader>
          <CardFooter className="pt-6">
            <Button disabled className="w-full h-12 rounded-2xl">
              <Download className="mr-2 h-4 w-4"/> Unduh PDF
            </Button>
          </CardFooter>
        </Card>

        <Card className="rounded-3xl border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <CardTitle>Leger & Rapor</CardTitle>
            <CardDescription>Rekap nilai dan rapor individual.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button onClick={handleDownloadLedgerExcel} disabled={downloading} className="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-700">
              {downloading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <FileSpreadsheet className="mr-2 h-4 w-4"/>}
              Unduh Leger (Excel)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
