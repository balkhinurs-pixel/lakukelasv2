import { 
    FileText, 
    Sparkles,
    Settings2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

export default function ModulAjarPage() {
    return (
        <div className="space-y-8 p-1">
            <HandWrittenTitle 
                title="Modul Ajar" 
                subtitle="Generator AI"
                className="py-4 md:py-6"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-0 shadow-xl rounded-[2.5rem] bg-white h-fit">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <Settings2 className="h-5 w-5 text-indigo-600" />
                            Konfigurasi RPP
                        </CardTitle>
                        <CardDescription>Lengkapi data untuk membuat modul ajar berbasis Kurikulum Merdeka.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <p className="text-sm text-slate-400 italic">Form konfigurasi sedang disiapkan...</p>
                        <Button className="w-full mt-6 bg-indigo-600 rounded-xl" disabled>
                            Mulai Generate Modul
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-0 shadow-xl rounded-[2.5rem] bg-white min-h-[500px] flex flex-col">
                    <CardContent className="p-8 flex-grow flex flex-col items-center justify-center text-center opacity-20">
                        <Sparkles className="h-20 w-20 mb-4" />
                        <h3 className="text-2xl font-black">AI Ready</h3>
                        <p className="text-sm font-bold">Hasil generate akan tampil di sini</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
