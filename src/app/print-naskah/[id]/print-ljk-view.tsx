"use client";

import * as React from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// ==========================================
// PRECISION OMR CONSTANTS (Sync with AI Processor)
// ==========================================
const OMR_CONFIG = {
    page: { width: 794, height: 1123, padding: 40 },
    anchors: { size: 30, offset: 20 },
    nis: {
        top: 180, 
        left: 80,
        digitWidth: 32,
        bubbleSize: 18,
        gapY: 19,
        cols: 5,
        rows: 10
    },
    matrix: {
        top: 450, // Diangkat dari 520 agar lebih lega
        left: 50,
        rowHeight: 28, // Sedikit lebih tinggi agar teks tidak berdempetan
        colWidth: 235,
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

const renderColumn = (items: any[], config: typeof questionTypeConfig) => {
    return (
        <div className="flex-1 flex flex-col" style={{ width: OMR_CONFIG.matrix.colWidth }}>
            {items.map((item, idx) => {
                if (item.type === 'header') {
                    return (
                        <div key={`header-${idx}`} className="w-full bg-slate-100 py-1 px-2 rounded-md border-l-4 border-indigo-600 mb-1 mt-2 first:mt-0 overflow-hidden">
                            <span className="text-[7.5pt] font-black text-indigo-900 tracking-tight uppercase truncate block">{item.label}</span>
                        </div>
                    );
                } else if (item.type === 'row') {
                    const configForType = config[item.questionType] || config['multiple_choice'];
                    const options = configForType.options;
                    let label = `${item.originalQuestionNumber}`;
                    if (item.subLabel) label = `${item.originalQuestionNumber}.${item.subLabel}`;

                    return (
                        <div key={`row-${idx}`} className="flex items-center gap-2 w-full border-b border-slate-50 mb-0.5" style={{ height: `${OMR_CONFIG.matrix.rowHeight}px` }}>
                            <span className="w-8 text-right font-bold text-[8pt] text-slate-500 whitespace-nowrap">{label}.</span>
                            <div className="flex" style={{ gap: `${OMR_CONFIG.matrix.bubbleGapX - OMR_CONFIG.matrix.bubbleSize}px` }}>
                                {options.map(opt => (
                                    <div key={opt} 
                                         className="rounded-full border-[1.2pt] border-black flex items-center justify-center text-[6.5pt] font-black bg-white"
                                         style={{ width: `${OMR_CONFIG.matrix.bubbleSize}px`, height: `${OMR_CONFIG.matrix.bubbleSize}px` }}>
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

const renderNisInput = () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    return (
        <div className="flex flex-col items-center">
            <span className="text-[7.5pt] font-black uppercase mb-1 tracking-widest text-slate-700">NIS</span>
            <div className="flex" style={{ gap: '8px' }}>
                {[...Array(OMR_CONFIG.nis.cols)].map((_, digitIndex) => (
                    <div key={digitIndex} className="flex flex-col items-center" style={{ gap: '4px' }}>
                        <div className="w-7 h-7 border-2 border-black rounded-md bg-white flex items-center justify-center font-bold text-[9pt]" />
                        <div className="flex flex-col" style={{ gap: `${OMR_CONFIG.nis.gapY - OMR_CONFIG.nis.bubbleSize}px` }}>
                            {numbers.map((num) => (
                                <div key={num} 
                                     className="rounded-full border-[1pt] border-black flex items-center justify-center text-[6pt] font-black bg-white"
                                     style={{ width: `${OMR_CONFIG.nis.bubbleSize}px`, height: `${OMR_CONFIG.nis.bubbleSize}px` }}>
                                    {num}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function PrintLjkView({ doc, questions, schoolProfile }: any) {
    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    const displayItems = React.useMemo(() => {
        const items: { type: 'header' | 'row'; label: string; questionType?: string; subLabel?: number; originalQuestionNumber?: number }[] = [];
        let currentType = "";
        let qCount = 0;

        questions.forEach((q: any) => {
            qCount++;
            if (q.question_type !== currentType) {
                currentType = q.question_type;
                const config = questionTypeConfig[currentType] || questionTypeConfig['multiple_choice'];
                items.push({ type: 'header', label: config.label, questionType: currentType });
            }

            const rowSpan = getQuestionRowSpan(q);
            if (rowSpan > 1) {
                for (let i = 1; i <= rowSpan; i++) {
                    items.push({
                        type: 'row',
                        label: `${qCount}`,
                        questionType: q.question_type,
                        subLabel: i,
                        originalQuestionNumber: qCount
                    });
                }
            } else {
                items.push({
                    type: 'row',
                    label: `${qCount}`,
                    questionType: q.question_type,
                    originalQuestionNumber: qCount
                });
            }
        });
        return items;
    }, [questions]);

    const itemsPerCol = 20; 
    const col1 = displayItems.slice(0, itemsPerCol);
    const col2 = displayItems.slice(itemsPerCol, itemsPerCol * 2);
    const col3 = displayItems.slice(itemsPerCol * 2, itemsPerCol * 3);

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center">
            <header className="no-print sticky top-0 z-[200] w-full bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-4 hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <div className="text-center">
                    <div className="font-black uppercase tracking-widest text-[10px] sm:text-xs">LJK OMR PRECISION V101</div>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase">AI-READY CALIBRATED LAYOUT</p>
                </div>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-black gap-2 px-6 shadow-lg">
                    <Printer className="h-4 w-4" /> CETAK LJK
                </Button>
            </header>

            <main className="flex-1 w-full flex justify-center p-4 sm:p-10 overflow-auto print:p-0 print:bg-white">
                <div className="ljk-page bg-white relative print:shadow-none shadow-2xl text-black" 
                     style={{ 
                        width: `${OMR_CONFIG.page.width}px`, 
                        height: `${OMR_CONFIG.page.height}px`, 
                        boxSizing: 'border-box', 
                        fontFamily: 'Arial, sans-serif', 
                        padding: `${OMR_CONFIG.page.padding}px` 
                     }}>
                    
                    {/* OMR ANCHOR MARKERS */}
                    <div className="absolute bg-black" style={{ top: '20px', left: '20px', width: '30px', height: '30px' }} />
                    <div className="absolute bg-black" style={{ top: '20px', right: '20px', width: '30px', height: '30px' }} />
                    <div className="absolute bg-black" style={{ bottom: '20px', left: '20px', width: '30px', height: '30px' }} />
                    <div className="absolute bg-black" style={{ bottom: '20px', right: '20px', width: '30px', height: '30px' }} />

                    {/* SCHOOL KOP - CENTERED PADDING (Prevent Anchor Coverage) */}
                    <div className="border-b-2 border-black pb-3 flex justify-between items-start mb-4" style={{ margin: '0 50px' }}>
                        <div className="flex gap-4 items-center">
                            {schoolProfile?.school_logo_url && (
                                <img src={schoolProfile.school_logo_url} className="w-12 h-12 object-contain" alt="Logo" />
                            )}
                            <div>
                                <h1 className="text-lg font-black uppercase tracking-tight leading-none mb-1">
                                    {schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}
                                </h1>
                                <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">Lembar Jawab Komputer</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-md font-black uppercase underline decoration-2 underline-offset-4">LJK UJIAN</h2>
                            <p className="text-[8pt] font-bold mt-1 uppercase text-slate-700">
                                {doc.subject || 'MATEMATIKA'} | KELAS {doc.class_level || '7'}
                            </p>
                        </div>
                    </div>

                    {/* TOP SECTION: NIS & IDENTITY SIDE-BY-SIDE */}
                    <div className="flex items-start gap-12" style={{ marginTop: '30px', padding: '0 40px' }}>
                        {/* LEFT: NIS SECTION */}
                        <div className="shrink-0">
                            {renderNisInput()}
                        </div>

                        {/* RIGHT: IDENTITY GRID (Dotted Fields) */}
                        <div className="flex-1 space-y-5 pt-8">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[8pt] font-black uppercase tracking-wider text-slate-400">NAMA PESERTA :</span>
                                <div className="h-10 border-b border-black border-dotted w-full flex items-end pb-1 text-[11pt] font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[8pt] font-black uppercase tracking-wider text-slate-400">TANGGAL UJIAN :</span>
                                    <div className="h-8 border-b border-black border-dotted w-full flex items-end pb-1 text-[10pt] font-bold" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[8pt] font-black uppercase tracking-wider text-slate-400">RUANG / KELAS :</span>
                                    <div className="h-8 border-b border-black border-dotted w-full flex items-end pb-1 text-[10pt] font-bold" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[8pt] font-black uppercase tracking-wider text-slate-400">MATA PELAJARAN / PAKET :</span>
                                <div className="h-8 border-b border-black border-dotted w-full flex items-end pb-1 text-[10pt] font-bold uppercase">{doc.subject}</div>
                            </div>
                        </div>
                    </div>

                    {/* ANSWERS GRID - ELEVATED Y (matrix.top) */}
                    <div className="flex" style={{ gap: '20px', marginTop: '60px' }}>
                        <div style={{ width: `${OMR_CONFIG.matrix.colWidth}px` }}>{renderColumn(col1, questionTypeConfig)}</div>
                        <div className="w-[1pt] bg-slate-200 self-stretch" />
                        <div style={{ width: `${OMR_CONFIG.matrix.colWidth}px` }}>{renderColumn(col2, questionTypeConfig)}</div>
                        <div className="w-[1pt] bg-slate-200 self-stretch" />
                        <div style={{ width: `${OMR_CONFIG.matrix.colWidth}px` }}>{renderColumn(col3, questionTypeConfig)}</div>
                    </div>

                    {/* CAPACITY WARNING */}
                    {displayItems.length > 60 && (
                        <div className="absolute bottom-10 left-0 right-0 text-center">
                            <span className="bg-red-500 text-white text-[7pt] font-black px-4 py-1 rounded-full uppercase animate-pulse">
                                Kapasitas halaman terlampaui. Gunakan lembar kedua.
                            </span>
                        </div>
                    )}

                    <div className="absolute bottom-12 left-0 right-0 text-center opacity-30">
                         <p className="text-[7pt] font-bold uppercase tracking-[0.4em]">Sistem Administrasi Guru LakuKelas</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
