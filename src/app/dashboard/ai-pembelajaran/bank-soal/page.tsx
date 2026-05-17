import { 
    Database, 
    Search, 
    Filter, 
    PlusCircle,
    FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import Link from "next/link";

export default function BankSoalPage() {
    return (
        <div className="space-y-8 p-1">
            <HandWrittenTitle 
                title="Bank Soal AI" 
                subtitle="Manajemen Aset"
                className="py-4 md:py-6"
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Cari soal yang pernah dibuat..." className="pl-10 rounded-xl" />
                </div>
                <Button className="w-full md:w-auto bg-indigo-600 rounded-xl gap-2" asChild>
                    <Link href="/dashboard/ai-pembelajaran/generate-soal">
                        <PlusCircle className="h-4 w-4" />
                        Generate Soal Baru
                    </Link>
                </Button>
            </div>

            <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                        <Database className="h-6 w-6 text-indigo-600" />
                        Daftar Soal Tersimpan
                    </CardTitle>
                    <CardDescription>Kumpulan soal-soal hasil generate AI yang tersimpan di database dan Google Drive.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 text-center py-32 opacity-30">
                    <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-lg font-bold text-slate-900">Belum Ada Soal</p>
                    <p className="text-sm font-medium text-slate-500 mt-2">Soal yang Anda generate akan otomatis muncul di sini.</p>
                </CardContent>
            </Card>
        </div>
    );
}
