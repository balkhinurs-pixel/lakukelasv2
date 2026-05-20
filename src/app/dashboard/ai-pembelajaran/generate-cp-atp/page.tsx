import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitBranchPlus, Sparkles } from "lucide-react";

export default function GenerateCpAtpPage() {
    return (
        <div className="space-y-8 p-1">
            <HandWrittenTitle 
                title="Generate CP & ATP" 
                subtitle="Pemetaan Kurikulum AI"
                className="py-4 md:py-6"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-0 shadow-xl rounded-[2.5rem] bg-white h-fit">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <GitBranchPlus className="h-5 w-5 text-indigo-600" />
                            Konfigurasi Fase
                        </CardTitle>
                        <CardDescription>Tentukan fase dan mata pelajaran untuk pemetaan CP ke ATP.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <p className="text-sm text-slate-400 italic">Mesin perumusan ATP sedang disiapkan (Tahap 2)...</p>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-0 shadow-xl rounded-[2.5rem] bg-white min-h-[500px] flex flex-col">
                    <CardContent className="p-8 flex-grow flex flex-col items-center justify-center text-center opacity-20">
                        <Sparkles className="h-20 w-20 mb-4 text-indigo-200" />
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Curricullum Architect</h3>
                        <p className="text-sm font-bold text-slate-400">Pratinjau alur tujuan pembelajaran</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}