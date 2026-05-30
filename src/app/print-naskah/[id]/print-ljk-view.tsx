
"use client";

import * as React from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const typeLabels: Record<string, string> = {
    'multiple_choice': 'I. PILIHAN GANDA',
    'true_false': 'II. BENAR / SALAH',
    'matching': 'III. MENJODOHKAN',
    'short_answer': 'IV. ISIAN SINGKAT',
    'essay': 'V. URAIAN / ESAI'
};

const getSubRowCount = (q: any) => {
    if (q.question_type !== 'matching') return 1;
    const lines = q.question_text?.split('\n').filter((l: string) => /^\d+[\.\)]/.test(l.trim()));
    return lines?.length > 0 ? lines.length : 1;
};

export default function PrintLjkView({ doc, questions, schoolProfile }: any) {
    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    // 1. BANGUN FLAT LIST (Header + Rows)
    const displayItems = React.useMemo(() => {
        const items: { type: 'header' | 'row'; label: string; questionType?: string }[] = [];
        let currentType = "";

        questions.forEach((q: any, idx: number) => {
            // Tambahkan Header jika tipe berubah
            if (q.question_type !== currentType) {
                currentType = q.question_type;
                items.push({ 
                    type: 'header', 
                    label: typeLabels[currentType] || currentType.toUpperCase() 
                });
            }

            // Tambahkan Baris (atau Sub-baris untuk matching)
            const count = getSubRowCount(q);
            if (count > 1) {
                for (let i = 1; i <= count; i++) {
                    items.push({
                        type: 'row',
                        label: `${idx + 1}.${i}`,
                        questionType: q.question_type
                    });
                }
            } else {
                items.push({
                    type: 'row',
                    label: `${idx + 1}`,
                    questionType: q.question_type
                });
            }
        });
        return items;
    }, [questions]);

    // 2. PEMBAGIAN KOLOM (Auto-Flow)
    // Kapasitas max per kolom (misal 24 baris agar pas di A4)
    const MAX_PER_COL = 24;
    const col1 = displayItems.slice(0, MAX_PER_COL);
    const col2 = displayItems.slice(MAX_PER_COL, MAX_PER_COL * 2);
    const col3 = displayItems.slice(MAX_PER_COL * 2, MAX_PER_COL * 3);

    const renderColumn = (items: typeof displayItems) => (
        <div className="flex-1 flex flex-col gap-2">
            {items.map((item, idx) => (
                item.type === 'header' ? (
                    <div key={idx} className="bg-slate-100 py-1.5 px-3 rounded-lg border-l-4 border-indigo-600 mb-1 mt-2 first:mt-0">
                        <span className="text-[8.5pt] font-black text-indigo-900 tracking-tight">{item.label}</span>
                    </div>
                ) : (
                    <div key={idx} className="flex items-center gap-3 py-1 border-b border-slate-50">
                        <span className="w-8 text-right font-black text-[9pt] text-slate-400">{item.label}.</span>
                        <div className="flex gap-2">
                            {(item.questionType === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E']).map(opt => (
                                <div key={opt} className="w-[23px] h-[23px] rounded-full border-[1.5pt] border-black flex items-center justify-center text-[8pt] font-black">{opt}</div>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center">
            <header className="no-print sticky top-0 z-[200] w-full bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-4 hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <div className="text-center">
                    <div className="font-black uppercase tracking-widest text-[10px] sm:text-xs">LJK GROUPED FLOW V87.0</div>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase">Auto-Splitting Section Matrix</p>
                </div>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-black gap-2 px-6 shadow-lg">
                    <Printer className="h-4 w-4" /> CETAK LJK
                </Button>
            </header>

            <main className="flex-1 w-full flex justify-center p-4 sm:p-10 overflow-auto print:p-0 print:bg-white">
                <div className="ljk-rigid-container bg-white relative print:shadow-none shadow-2xl overflow-hidden text-black" 
                     style={{ width: '794px', height: '1123px', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    
                    <div className="absolute top-[20px] left-[20px] w-6 h-6 bg-black" />
                    <div className="absolute top-[20px] right-[20px] w-6 h-6 bg-black" />
                    <div className="absolute bottom-[20px] left-[20px] w-6 h-6 bg-black" />
                    <div className="absolute bottom-[20px] right-[20px] w-6 h-6 bg-black" />

                    <div className="absolute top-[50px] left-[60px] right-[60px] border-b-2 border-black pb-3">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 flex items-center justify-center">
                                {schoolProfile?.school_logo_url && <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" />}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-[14pt] font-black uppercase m-0 leading-tight">{schoolProfile?.school_name || "NAMA SEKOLAH"}</h1>
                                <p className="text-[7.5pt] font-bold uppercase tracking-tight text-slate-500 mt-1">LEMBAR JAWAB KOMPUTER AI Standard LakuKelas</p>
                            </div>
                            <div className="text-right border-l-2 border-black/10 pl-6">
                                <h2 className="text-[12pt] font-black uppercase underline">LJK Ujian</h2>
                                <p className="text-[8pt] font-bold mt-0.5 uppercase">{doc.subject} | KELAS {doc.class_level}</p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-[140px] left-[60px] w-[450px] border-[1.5pt] border-black p-5 rounded-xl">
                        <p className="text-[8pt] font-black mb-3 uppercase text-slate-600 tracking-widest">Identitas Peserta</p>
                        <div className="space-y-6">
                            <div className="h-8 border-b border-black flex items-end pb-1 text-[10pt] font-bold text-slate-200">NAMA: ..............................................................</div>
                            <div className="h-8 border-b border-black flex items-end pb-1 text-[10pt] font-bold text-slate-200">KELAS: .............................................................</div>
                        </div>
                    </div>

                    <div className="absolute top-[140px] right-[60px] w-[170px] border-[1.5pt] border-black p-4 rounded-xl text-center bg-slate-50/30">
                        <p className="text-[7.5pt] font-black mb-3 uppercase text-slate-600 tracking-wider">NIS (5 DIGIT)</p>
                        <div className="flex justify-center gap-2">
                            {[1,2,3,4,5].map(col => (
                                <div key={col} className="space-y-1">
                                    <div className="w-7 h-7 border border-black flex items-center justify-center font-bold text-[9pt] mb-1 text-slate-100 rounded-sm bg-white" />
                                    {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                        <div key={num} className="w-4.5 h-4.5 rounded-full border-[1pt] border-black flex items-center justify-center text-[6pt] font-black">{num}</div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DYNAMIC GROUPED MATRIX */}
                    <div className="absolute top-[420px] left-[50px] right-[50px] bottom-[50px] border-[2pt] border-black p-8 rounded-[40px]">
                        <p className="text-[10pt] font-black uppercase text-center bg-black text-white py-2 rounded-xl tracking-[0.5em] mb-6">Matriks Jawaban</p>
                        <div className="flex gap-4">
                            {renderColumn(col1)}
                            <div className="w-[1pt] bg-slate-100 mx-1" />
                            {renderColumn(col2)}
                            <div className="w-[1pt] bg-slate-100 mx-1" />
                            {renderColumn(col3)}
                        </div>
                        
                        {displayItems.length > 72 && (
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <p className="text-[7pt] font-bold text-rose-500 uppercase tracking-widest">Hanya 72 baris (incl. header) yang ditampilkan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
