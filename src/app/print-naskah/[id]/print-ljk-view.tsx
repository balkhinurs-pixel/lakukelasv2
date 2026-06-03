"use client";

import * as React from "react";
import { Printer, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

/**
 * OMR RIGID CONFIG V110 (Overlap Fix & Header Safety)
 * Semua unit dalam Pixel (96 DPI). A4 = 794 x 1123px.
 */
const OMR_UI_CONFIG = {
    page: { width: 794, height: 1123 },
    anchors: { offset: 30, size: 32 },
    content: {
        marginLeft: 80, // Tambah margin agar teks tidak kena anchor
        marginRight: 80,
        marginTop: 80,
    },
    nis: {
        top: 185, // Diangkat 30px (dari 215)
        left: 80, 
        digitWidth: 32,
        bubbleSize: 18,
        gapY: 19,
        cols: 5,
        rows: 10
    },
    matrix: {
        top: 480, // Diturunkan 30px (dari 450)
        left: 50,
        rowHeight: 28, 
        colWidth: 230,
        bubbleSize: 19,
        bubbleGapX: 24,
        colGap: 20
    }
};

const questionTypeConfig: Record<string, { label: string; options: string[] }> = {
    'multiple_choice': { label: 'PILIHAN GANDA', options: ['A', 'B', 'C', 'D', 'E'] },
    'true_false': { label: 'BENAR / SALAH', options: ['B', 'S'] },
    'matching': { label: 'MENJODOHKAN', options: ['A', 'B', 'C', 'D', 'E'] },
    'short_answer': { label: 'ISIAN SINGKAT', options: ['A', 'B', 'C', 'D'] }, 
    'essay': { label: 'URAIAN / ESAI', options: [] }
};

const getQuestionRowSpan = (q: any) => {
    if (q.question_type !== 'matching') return 1;
    const lines = q.question_text?.split('\n').filter((l: string) => /^\d+[\.\)]/.test(l.trim()));
    return lines?.length > 0 ? lines.length : 4; 
};

export default function PrintLjkView({ doc, questions, schoolProfile }: any) {
    const [zoom, setZoom] = React.useState(100);
    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    const displayItems = React.useMemo(() => {
        const items: any[] = [];
        let currentType = "";
        let qCount = 0;

        questions.forEach((q: any) => {
            qCount++;
            if (q.question_type !== currentType) {
                currentType = q.question_type;
                const config = questionTypeConfig[currentType] || questionTypeConfig['multiple_choice'];
                items.push({ type: 'header', label: config.label });
            }

            const rowSpan = getQuestionRowSpan(q);
            if (rowSpan > 1) {
                for (let i = 1; i <= rowSpan; i++) {
                    items.push({
                        type: 'row',
                        questionType: q.question_type,
                        displayLabel: `${qCount}.${i}`
                    });
                }
            } else {
                items.push({
                    type: 'row',
                    questionType: q.question_type,
                    displayLabel: String(qCount)
                });
            }
        });
        return items;
    }, [questions]);

    const renderColumn = (items: any[]) => {
        return (
            <div className="flex flex-col" style={{ width: `${OMR_UI_CONFIG.matrix.colWidth}px` }}>
                {items.map((item, idx) => (
                    item.type === 'header' ? (
                        <div key={idx} className="w-full bg-slate-100 py-1 px-2 rounded-md border-l-4 border-indigo-600 mb-1 mt-2 first:mt-0" style={{ WebkitPrintColorAdjust: 'exact' }}>
                            <span className="text-[7pt] font-black text-indigo-900 tracking-tight uppercase truncate block">{item.label}</span>
                        </div>
                    ) : (
                        <div key={idx} className="flex items-center gap-2 w-full border-b border-slate-50" style={{ height: `${OMR_UI_CONFIG.matrix.rowHeight}px` }}>
                            <span className="w-8 text-right font-bold text-[8pt] text-slate-500">{item.displayLabel}.</span>
                            <div className="flex gap-2">
                                {(questionTypeConfig[item.questionType]?.options || ['A', 'B', 'C', 'D', 'E']).map(opt => (
                                    <div key={opt} className="rounded-full border-[1.2pt] border-black flex items-center justify-center text-[6.5pt] font-black" style={{ width: '19px', height: '19px', WebkitPrintColorAdjust: 'exact' }}>{opt}</div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        );
    };

    return (
        <div className="preview-wrapper">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0 !important;
                    }
                    body { margin: 0 !important; padding: 0 !important; }
                }
            `}</style>

            <header className="no-print fixed top-0 left-0 right-0 z-[200] bg-slate-900 text-white h-16 flex items-center justify-between px-4 shadow-2xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleClose} className="text-white hover:bg-white/10 rounded-xl font-bold">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                    <div className="hidden sm:block">
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">OMR PRECISION V110</p>
                        <h2 className="text-sm font-black uppercase tracking-tight">Lembar Jawab Komputer (LJK)</h2>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                    <ZoomOut className="h-4 w-4 text-slate-400" />
                    <Slider value={[zoom]} onValueChange={(val) => setZoom(val[0])} min={40} max={150} step={5} className="w-32 sm:w-48" />
                    <ZoomIn className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-black w-8">{zoom}%</span>
                </div>

                <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-6 font-black uppercase tracking-widest gap-2 shadow-lg">
                    <Printer className="h-4 w-4" /> Cetak LJK
                </Button>
            </header>

            <main className="a4-canvas" style={{ transform: `scale(${zoom / 100})`, width: '794px', height: '1123px' }}>
                <div className="print-area relative h-full w-full bg-white text-black overflow-hidden">
                    
                    {/* Anchor Markers (Fixed Offset for Accuracy) */}
                    <div className="absolute w-8 h-8 bg-black border-4 border-black" style={{ top: '30px', left: '30px', WebkitPrintColorAdjust: 'exact' }} />
                    <div className="absolute w-8 h-8 bg-black border-4 border-black" style={{ top: '30px', right: '30px', WebkitPrintColorAdjust: 'exact' }} />
                    <div className="absolute w-8 h-8 bg-black border-4 border-black" style={{ bottom: '30px', left: '30px', WebkitPrintColorAdjust: 'exact' }} />
                    <div className="absolute w-8 h-8 bg-black border-4 border-black" style={{ bottom: '30px', right: '30px', WebkitPrintColorAdjust: 'exact' }} />

                    {/* Header (More Centered Padding for Anchor Safety) */}
                    <div className="absolute left-[80px] right-[80px] top-[80px] border-b-2 border-black pb-4 flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            {schoolProfile?.school_logo_url && <img src={schoolProfile.school_logo_url} className="w-12 h-12 object-contain" crossOrigin="anonymous" />}
                            <div>
                                <h1 className="text-lg font-black uppercase leading-tight">{schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}</h1>
                                <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">Lembar Jawab Komputer AI</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-md font-black uppercase underline decoration-2 underline-offset-4">LJK UJIAN</h2>
                            <p className="text-[8pt] font-bold mt-1 uppercase">{doc.subject} | KELAS {doc.class_level}</p>
                        </div>
                    </div>

                    {/* Content Section (NIS & Identity moved up to top-165px) */}
                    <div className="absolute left-[80px] right-[80px] top-[165px] flex gap-10">
                        {/* NIS Input */}
                        <div className="shrink-0 space-y-2">
                            <p className="text-[7.5pt] font-black uppercase text-center text-slate-400">NIS (5 Digit)</p>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(c => (
                                    <div key={c} className="flex flex-col gap-1">
                                        <div className="w-7 h-7 border-2 border-black rounded-md" />
                                        {[0,1,2,3,4,5,6,7,8,9].map(n => (
                                            <div key={n} className="w-5 h-5 rounded-full border-[1pt] border-black flex items-center justify-center text-[6pt] font-black" style={{ WebkitPrintColorAdjust: 'exact' }}>{n}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Identity Fields */}
                        <div className="flex-1 space-y-6 pt-6">
                            <div className="border-b border-black border-dotted h-10 flex items-end pb-1 text-[10pt] font-bold text-slate-200">NAMA PESERTA: .....................................................</div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="border-b border-black border-dotted h-8 flex items-end pb-1 text-[9pt] font-bold text-slate-200">TANGGAL: .....................</div>
                                <div className="border-b border-black border-dotted h-8 flex items-end pb-1 text-[9pt] font-bold text-slate-200">RUANG/KELAS: ...........</div>
                            </div>
                            <div className="border-b border-black border-dotted h-8 flex items-end pb-1 text-[9pt] font-bold uppercase">MAPEL: {doc.subject}</div>
                        </div>
                    </div>

                    {/* Answers Grid (Matrix pushed down to top-480px to clear NIS) */}
                    <div className="absolute left-[50px] right-[50px] top-[480px] flex gap-5">
                        {renderColumn(displayItems.slice(0, 20))}
                        <div className="w-px bg-slate-200 self-stretch" />
                        {renderColumn(displayItems.slice(20, 40))}
                        <div className="w-px bg-slate-200 self-stretch" />
                        {renderColumn(displayItems.slice(40, 60))}
                    </div>

                    <div className="absolute bottom-10 left-0 right-0 text-center opacity-30">
                         <p className="text-[7pt] font-bold uppercase tracking-[0.4em]">Sistem Administrasi Guru LakuKelas</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
