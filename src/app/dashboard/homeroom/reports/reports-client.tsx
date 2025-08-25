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
import { BarChart3, Download, Printer, FileSpreadsheet, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { getHomeroomClassDetails, getReportsData } from "@/lib/data";

interface Props {
  homeroomData: NonNullable<Awaited<ReturnType<typeof getHomeroomClassDetails>>>;
  reportsData: NonNullable<Awaited<ReturnType<typeof getReportsData>>>;
}

export default function HomeroomReportsClient({ homeroomData, reportsData }: Props) {
  const [downloading, setDownloading] = React.useState(false);
  const { toast } = useToast();

  const { homeroomClass, studentsInClass, subjects } = homeroomData;
  const { gradeHistory, summaryCards } = reportsData;

  const handleDownloadLedgerExcel = () => {
    setDownloading(true);

    // Filter grade history for the current homeroom class
    const homeroomGradeHistory = gradeHistory.filter(gh => gh.class_id === homeroomClass.id);
    
    const data: (string | number)[][] = [];

    // --- Header ---
    data.push([`LEGER NILAI KELAS ${homeroomClass.name.toUpperCase()}`]);
    data.push([`TAHUN AJARAN: ${summaryCards.activeSchoolYearName}`]);
    data.push([]); // Spacer

    // --- Table Header ---
    const tableHeader: (string | number)[] = ['No', 'NIS', 'Nama Siswa'];
    subjects.forEach(subject => {
        const subjectAssessments = [...new Set(homeroomGradeHistory.filter(gh => gh.subject_id === subject.id).map(gh => gh.assessment_type))];
        tableHeader.push(subject.name);
        // Add empty cells for merging
        for (let i = 1; i < Math.max(1, subjectAssessments.length); i++) {
            tableHeader.push('');
        }
    });
    tableHeader.push('Rata-Rata Total');
    data.push(tableHeader);

    const subHeader: (string | number)[] = ['', '', ''];
    subjects.forEach(subject => {
         const subjectAssessments = [...new Set(homeroomGradeHistory.filter(gh => gh.subject_id === subject.id).map(gh => gh.assessment_type))];
         if (subjectAssessments.length > 0) {
             subjectAssessments.forEach(ass => subHeader.push(ass));
         } else {
             subHeader.push('Nilai'); // Fallback if no assessments
         }
    });
    subHeader.push(''); // For average
    data.push(subHeader);

    // --- Table Body ---
    studentsInClass.forEach((student, index) => {
        const row: (string | number)[] = [index + 1, student.nis, student.name];
        let totalScore = 0;
        let scoreCount = 0;

        subjects.forEach(subject => {
            const subjectAssessments = [...new Set(homeroomGradeHistory.filter(gh => gh.subject_id === subject.id).map(gh => gh.assessment_type))];
            if (subjectAssessments.length > 0) {
                subjectAssessments.forEach(assessment => {
                    const gradeEntry = homeroomGradeHistory.find(h => h.subject_id === subject.id && h.assessment_type === assessment);
                    const studentRecord = gradeEntry?.records.find(r => r.studentId === student.id);
                    const score = studentRecord ? Number(studentRecord.score) : '';
                    row.push(score);
                    if (typeof score === 'number') {
                        totalScore += score;
                        scoreCount++;
                    }
                });
            } else {
                 row.push(''); // No assessments for this subject
            }
        });

        const average = scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(2)) : '';
        row.push(average);
        data.push(row);
    });

    // --- Create Worksheet and Workbook ---
    const ws = XLSX.utils.aoa_to_sheet(data);

    // --- Merging cells ---
    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: tableHeader.length - 1 } }]; // Title
    let col_idx = 3;
    subjects.forEach(subject => {
        const subjectAssessments = [...new Set(homeroomGradeHistory.filter(gh => gh.subject_id === subject.id).map(gh => gh.assessment_type))];
        const span = Math.max(1, subjectAssessments.length);
        if (span > 1) {
            merges.push({ s: { r: 3, c: col_idx }, e: { r: 3, c: col_idx + span - 1 } });
        }
        col_idx += span;
    });
    ws['!merges'] = merges;
    
    // --- Styling ---
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F81BD" } }, alignment: { horizontal: "center", vertical: "center" } };
    const subHeaderStyle = { font: { bold: true }, fill: { fgColor: { rgb: "DDEBF7" } }, alignment: { horizontal: "center", vertical: "center" } };
    const titleStyle = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } };
    const subtitleStyle = { font: { bold: true }, alignment: { horizontal: "center" } };

    ws['A1'].s = titleStyle;
    ws['A2'].s = subtitleStyle;

    for(let c = 0; c < tableHeader.length; c++) {
        ws[XLSX.utils.encode_cell({r:3, c})].s = headerStyle;
        ws[XLSX.utils.encode_cell({r:4, c})].s = subHeaderStyle;
    }

    // --- Column Widths ---
    const cols = [{ wch: 5 }, { wch: 15 }, { wch: 35 }]; // No, NIS, Nama
    let current_col = 3;
    subjects.forEach(subject => {
        const subjectAssessments = [...new Set(homeroomGradeHistory.filter(gh => gh.subject_id === subject.id).map(gh => gh.assessment_type))];
        const span = Math.max(1, subjectAssessments.length);
        for(let i=0; i<span; i++) {
            cols.push({wch: 15});
        }
        current_col += span;
    });
    cols.push({wch: 15}); // Average
    ws['!cols'] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leger Nilai");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    
    function s2ab(s: any) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), `leger_kelas_${homeroomClass.name}.xlsx`);

    toast({
      title: "Berhasil",
      description: `Leger kelas ${homeroomClass.name} berhasil diunduh.`,
    });

    setDownloading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline text-slate-900">
            Laporan Kelas - {homeroomClass.name}
          </h1>
          <p className="text-slate-600 mt-1">
            Cetak rekapitulasi dan dokumen resmi untuk seluruh kelas perwalian Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Attendance Report Card */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Laporan Kehadiran Kelas</CardTitle>
                <CardDescription>Rekap absensi bulanan atau semester.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Periode</label>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Bulan atau Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ganjil">Semester Ganjil</SelectItem>
                  <SelectItem value="genap">Semester Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button disabled className="w-full">
              <Download className="mr-2 h-4 w-4"/> 
              Unduh Laporan Kehadiran (PDF)
            </Button>
          </CardFooter>
        </Card>

        {/* Student Report Card */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Cetak Leger & Rapor Siswa</CardTitle>
                <CardDescription>Hasilkan leger atau rapor individual.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Semester</label>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ganjil">Semester Ganjil</SelectItem>
                  <SelectItem value="genap">Semester Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button 
              onClick={handleDownloadLedgerExcel} 
              disabled={downloading} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4"/>
              )}
              Unduh Leger Kelas (Excel)
            </Button>
            <Button disabled className="w-full">
              <Printer className="mr-2 h-4 w-4"/> 
              Cetak Semua Rapor
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}