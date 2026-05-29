"use client";

import * as React from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintLjkView({ doc, questions, schoolProfile }: any) {
    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center">
            <header className="no-print sticky top-0 z-[200] w-full bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-4 hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <div className="text-center">
                    <div className="font-black uppercase tracking-widest text-[10px] sm:text-xs">LJK OMR RIGID V73.0</div>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase">Fixed Layout untuk AI Scanner</p>
                </div>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-black gap-2 px-6 shadow-lg">
                    <Printer className="h-4 w-4" /> CETAK LJK
                </Button>
            </header>

            <main className="flex-1 w-full flex justify-center p-4 sm:p-10 overflow-auto print:p-0 print:bg-white">
                <div className="ljk-rigid-container bg-white relative print:shadow-none shadow-2xl overflow-hidden text-black" 
                     style={{ width: '794px', height: '1123px', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    
                    {/* OMR ANCHOR MARKERS */}
                    <div className="absolute top-[25px] left-[25px] w-8 h-8 bg-black" />
                    <div className="absolute top-[25px] right-[25px] w-8 h-8 bg-black" />
                    <div className="absolute bottom-[25px] left-[25px] w-8 h-8 bg-black" />
                    <div className="absolute bottom-[25px] right-[25px] w-8 h-8 bg-black" />

                    {/* LJK HEADER */}
                    <div className="absolute top-[70px] left-[70px] right-[70px] border-b-2 border-black pb-4">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 flex items-center justify-center">
                                {schoolProfile?.school_logo_url && <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" />}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-[16pt] font-black uppercase m-0 leading-tight">{schoolProfile?.school_name || "NAMA SEKOLAH"}</h1>
                                <p className="text-[8pt] font-bold uppercase tracking-tight text-slate-500 mt-1">LEMBAR JAWAB KOMPUTER AI Standard LakuKelas</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-[14pt] font-black uppercase underline">LJK Ujian</h2>
                                <p className="text-[9pt] font-bold mt-1 uppercase">{doc.subject} | KELAS {doc.class_level}</p>
                            </div>
                        </div>
                    </div>

                    {/* STUDENT INFO & NIS */}
                    <div className="absolute top-[180px] left-[70px] w-[450px] border-2 border-black p-6 rounded-2xl">
                        <p className="text-[9pt] font-black mb-4 uppercase text-slate-600 tracking-widest">Identitas Peserta</p>
                        <div className="space-y-8">
                            <div className="h-10 border-b-2 border-black flex items-end pb-1 text-[11pt] font-bold text-slate-200">NAMA: ..............................................................</div>
                            <div className="h-10 border-b-2 border-black flex items-end pb-1 text-[11pt] font-bold text-slate-200">KELAS: .............................................................</div>
                        </div>
                    </div>

                    <div className="absolute top-[180px] right-[70px] w-[180px] border-2 border-black p-6 rounded-2xl text-center">
                        <p className="text-[8pt] font-black mb-4 uppercase text-slate-600 tracking-wider">NIS (5 DIGIT)</p>
                        <div className="flex justify-center gap-2">
                            {[1,2,3,4,5].map(col => (
                                <div key={col} className="space-y-1">
                                    <div className="w-8 h-8 border-2 border-black flex items-center justify-center font-bold text-[10pt] mb-1 text-slate-100 rounded-sm" />
                                    {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                        <div key={num} className="w-5 h-5 rounded-full border-[1.5pt] border-black flex items-center justify-center text-[7pt] font-black">{num}</div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BUBBLE MATRIX */}
                    <div className="absolute top-[520px] left-[70px] right-[70px] bottom-[70px] border-[3pt] border-black p-10 rounded-[50px]">
                        <p className="text-[12pt] font-black uppercase text-center bg-black text-white py-3 rounded-2xl tracking-[0.5em] mb-10">Matriks Jawaban</p>
                        <div className="flex gap-20">
                            <div className="flex-1 space-y-4">
                                {questions.slice(0, 15).map((q: any, idx: number) => {
                                    const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                                    return (
                                        <div key={q.id} className="flex items-center gap-5">
                                            <span className="w-8 text-right font-black text-[11pt] text-slate-400">{idx + 1}.</span>
                                            <div className="flex gap-3">
                                                {options.map(opt => (
                                                    <div key={opt} className="w-[30px] h-[30px] rounded-full border-[2pt] border-black flex items-center justify-center text-[10pt] font-black">{opt}</div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex-1 space-y-4">
                                {questions.slice(15, 30).map((q: any, idx: number) => {
                                    const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                                    return (
                                        <div key={q.id} className="flex items-center gap-5">
                                            <span className="w-8 text-right font-black text-[11pt] text-slate-400">{idx + 16}.</span>
                                            <div className="flex gap-3">
                                                {options.map(opt => (
                                                    <div key={opt} className="w-[30px] h-[30px] rounded-full border-[2pt] border-black flex items-center justify-center text-[10pt] font-black">{opt}</div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
