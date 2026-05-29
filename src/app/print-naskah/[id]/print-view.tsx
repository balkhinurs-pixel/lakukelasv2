"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/icons";

/**
 * MathText Component V43.0 (Print Optimized)
 */
const MathText = ({ content }: { content: string }) => {
  if (!content) return null;
  
  // Deteksi berbagai format LaTeX yang mungkin dihasilkan AI
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className="math-text-render w-full overflow-visible text-justify">
      {parts.map((part, i) => {
        if (part.startsWith('$$')) return <div key={i} className="my-2"><BlockMath math={part.slice(2, -2)} /></div>;
        if (part.startsWith('$')) return <InlineMath key={i} math={part.slice(1, -1)} />;
        if (part.startsWith('\\[')) return <div key={i} className="my-2"><BlockMath math={part.slice(2, -2)} /></div>;
        if (part.startsWith('\\(')) return <InlineMath key={i} math={part.slice(2, -2)} />;
        
        return (
            <ReactMarkdown 
                key={i} 
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({node, ...props}) => <table className="w-full border-collapse border border-black my-4 text-center" {...props} />,
                    th: ({node, ...props}) => <th className="border border-black p-2 font-bold bg-gray-50" {...props} />,
                    td: ({node, ...props}) => <td className="border border-black p-2" {...props} />,
                    p: ({node, ...props}) => <span className="whitespace-pre-wrap leading-relaxed inline-block" {...props} />
                }}
            >
                {part}
            </ReactMarkdown>
        );
      })}
    </div>
  );
};

export default function PrintView({ doc, questions, schoolProfile, mode }: any) {
    const isLjk = mode === 'ljk';
    const isKunci = mode === 'kunci';

    React.useEffect(() => {
        const prepareAndPrint = async () => {
            // Tunggu font siap (krusial untuk LaTeX/Serif)
            if (typeof document !== 'undefined' && (document as any).fonts) {
                await (document as any).fonts.ready;
            }
            // Delay kecil untuk KaTeX rendering
            setTimeout(() => {
                // Auto print bisa diaktifkan jika dirasa perlu
                // window.print();
            }, 1000);
        };
        prepareAndPrint();
    }, []);

    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    // --- LJK VIEW ---
    if (isLjk) {
        return (
            <div className="min-h-screen bg-white">
                <header className="no-print sticky top-0 z-50 bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                    <Button variant="ghost" onClick={handleClose} className="text-white gap-2">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                    <div className="font-bold uppercase tracking-widest text-xs">Cetak Lembar Jawab Komputer</div>
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
                        <Printer className="h-4 w-4" /> Simpan PDF / Print
                    </Button>
                </header>

                <main className="print-area bg-white mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
                    {/* Anchor Points for Vision AI */}
                    <div className="absolute top-6 left-6 w-6 h-6 bg-black" />
                    <div className="absolute top-6 right-6 w-6 h-6 bg-black" />
                    <div className="absolute bottom-6 left-6 w-6 h-6 bg-black" />
                    <div className="absolute bottom-6 right-6 w-6 h-6 bg-black" />

                    <div className="text-center border-b-[2pt] border-black pb-4 mb-8">
                        <h1 className="text-2xl font-black uppercase tracking-tight">LEMBAR JAWAB KOMPUTER (LJK) AI</h1>
                        <p className="text-sm font-bold uppercase mt-1 tracking-widest">{schoolProfile?.school_name || "SISTEM ADMINISTRASI SEKOLAH LAKUKELAS"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-10">
                        <div className="space-y-6">
                            <div className="border-2 border-black p-4 rounded-xl">
                                <p className="text-[10px] font-black mb-3 uppercase text-slate-500">Data Diri Peserta</p>
                                <div className="space-y-4">
                                    <div className="h-10 border-b-2 border-black/10 flex items-end pb-1 text-sm font-black text-slate-300 uppercase">NAMA: ...........................................................</div>
                                    <div className="h-10 border-b-2 border-black/10 flex items-end pb-1 text-sm font-black text-slate-300 uppercase">KELAS: ...........................................................</div>
                                </div>
                            </div>
                        </div>
                        <div className="border-2 border-black p-4 rounded-xl text-center">
                            <p className="text-[10px] font-black mb-4 uppercase text-slate-500 tracking-widest">KOLOM NIS (5 DIGIT)</p>
                            <div className="flex justify-center gap-2">
                                {[1,2,3,4,5].map(col => (
                                    <div key={col} className="space-y-1">
                                        <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-sm mb-1" />
                                        {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                            <div key={num} className="w-7 h-7 rounded-full border-[1.5pt] border-black flex items-center justify-center text-[10px] font-black">{num}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-[2.5pt] border-black p-8 rounded-3xl">
                         <p className="text-[11px] font-black mb-6 uppercase text-center bg-slate-900 text-white py-2 rounded-lg tracking-[0.3em]">Lembar Jawaban Objektif</p>
                         <div className="grid grid-cols-2 gap-x-16 gap-y-3">
                            {questions.map((q: any, idx: number) => {
                                const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                                return (
                                    <div key={q.id} className="flex items-center gap-4 py-1.5 border-b border-slate-100">
                                        <span className="w-8 font-black text-sm text-slate-400">{idx + 1}.</span>
                                        <div className="flex gap-3">
                                            {options.map(opt => (
                                                <div key={opt} className="w-7 h-7 rounded-full border-[2pt] border-black flex items-center justify-center text-[11px] font-black">{opt}</div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                    </div>
                </main>
            </div>
        );
    }

    // --- SOAL & KUNCI VIEW ---
    return (
        <div className="min-h-screen bg-white">
            <header className="no-print sticky top-0 z-50 bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                <Button variant="ghost" onClick={handleClose} className="text-white gap-2">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <div className="font-bold uppercase tracking-widest text-xs">Pratinjau Cetak {isKunci ? 'Kunci Jawaban' : 'Naskah Soal'}</div>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
                    <Printer className="h-4 w-4" /> Simpan PDF / Print
                </Button>
            </header>

            <main className="print-area mx-auto" style={{ width: '210mm', padding: '15mm 20mm', boxSizing: 'border-box', fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', lineHeight: '1.45' }}>
                {/* Kop Surat Profesional */}
                <div className="print-header-block mb-6 pb-2 border-b-[3pt] border-double border-black">
                    <div className="flex items-center gap-8">
                        <div className="w-[25mm] h-[25mm] flex items-center justify-center shrink-0">
                            {schoolProfile?.school_logo_url ? (
                                <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" />
                            ) : (
                                <AppLogo className="opacity-20 w-full h-full text-slate-300" />
                            )}
                        </div>
                        <div className="flex-1 text-center pr-[25mm]">
                            <h1 className="text-[14pt] font-bold uppercase leading-tight">{schoolProfile?.school_name || "PEMERINTAH KOTA / KABUPATEN"}</h1>
                            <h2 className="text-[16pt] font-black uppercase leading-tight">{schoolProfile?.school_name || "DINAS PENDIDIKAN"}</h2>
                            {schoolProfile?.npsn && <p className="text-[10pt] font-bold mt-1">NPSN: {schoolProfile.npsn}</p>}
                            <p className="text-[9pt] italic leading-tight mt-1">{schoolProfile?.school_address || "Alamat lengkap sekolah belum diatur"}</p>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h3 className="text-[12pt] font-bold uppercase underline leading-tight">
                        {isKunci ? 'KUNCI JAWABAN & PEMBAHASAN' : `NASKAH SOAL ${doc.title.toUpperCase()}`}
                    </h3>
                    <div className="flex justify-center gap-10 mt-2 text-[11pt] font-bold uppercase">
                        <p>Mata Pelajaran: {doc.subject}</p>
                        <p>Kelas: {doc.class_level}</p>
                    </div>
                </div>

                <div className="questions-container">
                    {questions.map((q: any, idx: number) => {
                        const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                        const isTrueFalse = q.question_type === 'true_false';
                        const isMatching = q.question_type === 'matching';
                        
                        // Logic Parsing Menjodohkan Profesional
                        const lines = isMatching ? q.question_text.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '') : [];
                        const matchingItems = lines.filter((l: string) => /^\d+[\.\)]/.test(l));
                        const matchingIntro = lines.filter((l: string) => !/^\d+[\.\)]/.test(l)).join('\n');
                        const rowCount = isMatching ? Math.max(matchingItems.length, options.length) : 0;

                        return (
                            <div key={q.id} className="print-question-block mb-10" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                <div className="flex gap-4 items-start">
                                    <span className="font-bold min-w-[28pt] text-left">{idx + 1}.</span>
                                    <div className="flex-1">
                                        <MathText content={isMatching ? (matchingIntro || q.question_text) : q.question_text} />
                                        
                                        {q.visual_svg && (
                                            <div className="my-6 flex justify-center">
                                                <div 
                                                    className="border border-slate-100 p-2 rounded-lg"
                                                    style={{ maxWidth: '60mm', width: '100%' }}
                                                    dangerouslySetInnerHTML={{ 
                                                        __html: q.visual_svg.replace('<svg', '<svg style="width:100%; height:auto;" preserveAspectRatio="xMidYMid meet"') 
                                                    }} 
                                                />
                                            </div>
                                        )}

                                        {isTrueFalse ? (
                                            <div className="mt-4 flex gap-12 items-center">
                                                {options.map(([k, v]) => (
                                                    <div key={k} className="flex gap-2 items-center">
                                                        <span className="font-bold">{k}.</span>
                                                        <div className="font-bold uppercase tracking-wide">{v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : isMatching ? (
                                            <div className="mt-6 border border-black rounded-lg overflow-hidden">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-black">
                                                            <th className="p-2 border-r border-black font-bold text-[9pt] uppercase text-center w-10">No</th>
                                                            <th className="p-2 border-r border-black font-bold text-[9pt] uppercase text-left">Pernyataan / Soal</th>
                                                            <th className="p-2 border-r border-black font-bold text-[9pt] uppercase text-center w-14">Pilih</th>
                                                            <th className="p-2 font-bold text-[9pt] uppercase text-left">Pilihan Jawaban</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Array.from({ length: rowCount }).map((_, i) => (
                                                            <tr key={i} className="border-b border-black last:border-b-0">
                                                                <td className="p-2 border-r border-black text-center font-bold">{i + 1}</td>
                                                                <td className="p-2 border-r border-black text-[10pt] min-w-[70mm]">
                                                                    {matchingItems[i] ? <MathText content={matchingItems[i].replace(/^\d+[\.\)]\s*/, '')} /> : <div className="h-6 italic text-slate-300">...</div>}
                                                                </td>
                                                                <td className="p-2 border-r border-black text-center font-bold text-slate-200">[.....]</td>
                                                                <td className="p-2 text-[10pt] min-w-[50mm]">
                                                                    {options[i] ? (
                                                                        <div className="flex gap-2 items-start">
                                                                            <span className="font-bold min-w-[15pt]">{options[i][0]}.</span>
                                                                            <MathText content={options[i][1]} />
                                                                        </div>
                                                                    ) : <div className="h-6 italic text-slate-300">...</div>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            options.length > 0 && (
                                                <div className={cn(
                                                    "mt-4 grid grid-cols-2 gap-x-12 items-start",
                                                    options.length === 4 ? "grid-rows-2" : "grid-rows-3",
                                                    "grid-flow-col"
                                                )}>
                                                    {options.map(([k, v]) => (
                                                        <div key={k} className="flex gap-2 items-start py-1">
                                                            <span className="font-bold min-w-[18pt]">{k}.</span>
                                                            <div className="flex-1"><MathText content={v} /></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}

                                        {isKunci && (
                                            <div className="mt-4 p-4 border-l-[3pt] border-indigo-200 bg-slate-50 text-[10pt] italic rounded-r-lg">
                                                <p className="font-bold text-indigo-800 not-italic uppercase text-[8.5pt] mb-2 tracking-widest">Analisis Jawaban (Kunci: {q.correct_answer})</p>
                                                <MathText content={q.explanation} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center border-t border-black pt-4 italic text-[9pt]">
                    <p>*** Selamat Mengerjakan & Utamakan Kejujuran ***</p>
                </div>
            </main>
        </div>
    );
}
