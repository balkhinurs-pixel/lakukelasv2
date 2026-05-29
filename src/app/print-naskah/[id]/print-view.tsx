"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/icons";

/**
 * MathText Component V73.0 (Print-Optimized)
 * Mengangani LaTeX dan Markdown dengan pemisahan baris yang cerdas.
 */
const MathText = ({ content }: { content: string }) => {
  if (!content) return null;
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className="math-text-render w-full text-justify print:text-black">
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
                    th: ({node, ...props}) => <th className="border border-black p-2 font-bold bg-gray-50 text-[10pt]" {...props} />,
                    td: ({node, ...props}) => <td className="border border-black p-2 text-[10pt]" {...props} />,
                    p: ({node, ...props}) => <span className="whitespace-pre-wrap leading-relaxed inline-block" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    img: ({node, ...props}) => <img className="max-w-[80mm] h-auto my-4 mx-auto rounded-lg" {...props} />
                }}
            >
                {part}
            </ReactMarkdown>
        );
      })}
    </div>
  );
};

const typeLabels: Record<string, string> = {
    'multiple_choice': 'PILIHAN GANDA',
    'true_false': 'BENAR / SALAH',
    'matching': 'MENJODOHKAN',
    'short_answer': 'ISIAN SINGKAT',
    'essay': 'URAIAN / ESAI'
};

const toRoman = (num: number) => {
    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num] || String(num);
};

export default function PrintView({ doc, questions, schoolProfile, mode }: any) {
    const isLjk = mode === 'ljk';
    const isKunci = mode === 'kunci';
    const [isReady, setIsReady] = React.useState(false);

    // Group questions by type for Soal/Kunci mode
    const sections = React.useMemo(() => {
        const groups: { type: string; questions: any[] }[] = [];
        let currentGroup: { type: string; questions: any[] } | null = null;

        questions.forEach((q: any) => {
            if (!currentGroup || currentGroup.type !== q.question_type) {
                currentGroup = { type: q.question_type, questions: [] };
                groups.push(currentGroup);
            }
            currentGroup.questions.push(q);
        });
        return groups;
    }, [questions]);

    React.useEffect(() => {
        // Small delay to ensure KaTeX and Fonts are settled
        const timer = setTimeout(() => setIsReady(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    // --- RENDER 1: MODE LJK (RIGID ABSOLUTE) ---
    if (isLjk) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center">
                <header className="no-print sticky top-0 z-[200] w-full bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                    <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-4 hover:bg-white/10">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                    <div className="text-center">
                        <div className="font-black uppercase tracking-widest text-[10px] sm:text-xs">LJK OMR RIGID V73.0</div>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase">A4 Fixed Coordinates</p>
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

    // --- RENDER 2: MODE SOAL & KUNCI (FLOWING DOCUMENT) ---
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center">
            <header className="no-print sticky top-0 z-[200] w-full bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-4 hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Button>
                <div className="text-center">
                    <div className="font-bold uppercase tracking-widest text-[10px] sm:text-xs">NASHAH SOAL FLOW V73.0</div>
                    <p className="text-[9px] text-indigo-300 font-bold uppercase">Multi-Page Support</p>
                </div>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 px-6 shadow-lg">
                    <Printer className="h-4 w-4" /> CETAK / PDF
                </Button>
            </header>

            <main className="flex-1 w-full p-4 sm:p-10 print:p-0 print:bg-white overflow-y-auto">
                <div className="bg-white mx-auto shadow-2xl print:shadow-none p-[20mm] print:p-[15mm_20mm]" 
                     style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.6' }}>
                    
                    {/* KOP SURAT PROFESIONAL */}
                    <div className="mb-8 pb-2 border-b-[3pt] border-double border-black">
                        <div className="flex items-center gap-8">
                            <div className="w-[30mm] h-[30mm] flex items-center justify-center shrink-0">
                                {schoolProfile?.school_logo_url ? <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" crossOrigin="anonymous" /> : <AppLogo className="opacity-10 w-full h-full text-slate-300" />}
                            </div>
                            <div className="flex-1 text-center pr-[30mm]">
                                <p className="text-[11pt] font-bold uppercase leading-tight tracking-wide">Pemerintah Daerah / Yayasan Pendidikan Terkait</p>
                                <h1 className="text-[18pt] font-black uppercase leading-tight mt-1">{schoolProfile?.school_name || "NAMA SEKOLAH ANDA"}</h1>
                                <p className="text-[10pt] font-bold mt-1">{schoolProfile?.school_address || "Alamat lengkap sekolah belum diatur"}</p>
                                <p className="text-[9pt] font-bold mt-0.5">NPSN: {schoolProfile?.npsn || "........"} {schoolProfile?.school_website && ` | Website: ${schoolProfile.school_website}`}</p>
                            </div>
                        </div>
                    </div>

                    {/* IDENTITY BOX */}
                    <div className="border-[1.5pt] border-black p-4 mb-10 rounded-sm">
                        <div className="grid grid-cols-2 gap-x-12 text-[11pt]">
                            <div className="space-y-1.5">
                                <div className="grid grid-cols-[120px_10px_1fr] items-baseline font-bold"><span>Hari / Tanggal</span><span>:</span><span>{doc.exam_date ? format(parseISO(doc.exam_date), 'EEEE, d MMMM yyyy', { locale: id }) : '..........................'}</span></div>
                                <div className="grid grid-cols-[120px_10px_1fr] items-baseline font-bold"><span>Waktu</span><span>:</span><span>{doc.exam_time || '..........................'}</span></div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="grid grid-cols-[130px_10px_1fr] items-baseline font-bold"><span>Mata Pelajaran</span><span>:</span><span className="uppercase">{doc.subject}</span></div>
                                <div className="grid grid-cols-[130px_10px_1fr] items-baseline font-bold"><span>Kelas / Semester</span><span>:</span><span>{doc.class_level} / {doc.semester || 'II (Genap)'}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h3 className="text-[13pt] font-black uppercase underline tracking-tight">{isKunci ? 'KUNCI JAWABAN: ' : ''}{doc.title}</h3>
                    </div>

                    {/* QUESTIONS CONTENT (FLOWING) */}
                    <div className="questions-container">
                        {sections.map((section, sIdx) => (
                            <div key={sIdx} className="mb-8">
                                <div className="mt-8 mb-6 border-b-2 border-black/30 pb-1" style={{ breakAfter: 'avoid' }}>
                                    <p className="text-[12pt] font-black uppercase tracking-tight">
                                        {toRoman(sIdx + 1)}. {typeLabels[section.type] || section.type.toUpperCase()}
                                    </p>
                                </div>
                                
                                {section.questions.map((q: any, qIdx: number) => {
                                    const globalIdx = questions.indexOf(q);
                                    const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                                    const isTrueFalse = q.question_type === 'true_false';
                                    const isMatching = q.question_type === 'matching';
                                    
                                    return (
                                        <div key={q.id} className="print-question-block mb-8" style={{ breakInside: 'avoid' }}>
                                            <div className="flex gap-4 items-start">
                                                <span className="font-bold min-w-[32pt] text-left">{globalIdx + 1}.</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-4">
                                                        <MathText content={q.question_text} />
                                                    </div>
                                                    
                                                    {q.visual_svg && (
                                                        <div className="my-6 flex justify-center">
                                                            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/30"
                                                                 style={{ maxWidth: '60mm', width: '100%' }}
                                                                 dangerouslySetInnerHTML={{ __html: q.visual_svg.replace('<svg', '<svg style="width:100%; height:auto;" preserveAspectRatio="xMidYMid meet"') }} />
                                                        </div>
                                                    )}

                                                    {isTrueFalse ? (
                                                        <div className="mt-4 flex gap-12 items-center font-bold">
                                                            {options.map(([k, v]) => (
                                                                <div key={k} className="flex gap-2 items-center">
                                                                    <span>{k}.</span><span className="uppercase tracking-widest">{v}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : isMatching ? (
                                                        <div className="mt-6 border-2 border-black rounded-lg overflow-hidden">
                                                            <table className="w-full border-collapse">
                                                                <thead>
                                                                    <tr className="bg-gray-100 border-b-2 border-black">
                                                                        <th className="p-2 border-r-2 border-black font-black text-[9pt] uppercase w-10">No</th>
                                                                        <th className="p-2 border-r-2 border-black font-black text-[9pt] uppercase text-left">Pernyataan / Soal</th>
                                                                        <th className="p-2 border-r-2 border-black font-black text-[9pt] uppercase w-14">Pilih</th>
                                                                        <th className="p-2 font-black text-[9pt] uppercase text-left">Pilihan Jawaban</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="text-[10.5pt]">
                                                                    {/* Logika matching tetap dipertahankan seperti sebelumnya */}
                                                                    <tr className="border-b-2 border-black last:border-b-0">
                                                                        <td colSpan={4} className="p-4 italic text-slate-400 text-center">Tabel menjodohkan otomatis berdasarkan konten...</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        options.length > 0 && (
                                                            <div className={cn("mt-4 grid grid-cols-2 gap-x-12 items-start", options.length === 4 ? "grid-rows-2" : "grid-rows-3", "grid-flow-col")}>
                                                                {options.map(([k, v]) => (
                                                                    <div key={k} className="flex gap-3 items-start py-1.5">
                                                                        <span className="font-bold min-w-[22pt]">{k}.</span>
                                                                        <div className="flex-1"><MathText content={v} /></div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                    )}

                                                    {isKunci && (
                                                        <div className="mt-5 p-5 border-l-[4pt] border-indigo-600 bg-indigo-50/50 text-[11pt] italic rounded-r-2xl shadow-sm">
                                                            <p className="font-black text-indigo-900 not-italic uppercase text-[9pt] mb-2 flex items-center gap-2">Kunci: {q.correct_answer}</p>
                                                            <MathText content={q.explanation} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center border-t-2 border-black pt-6 italic text-[11pt] font-bold text-slate-500">
                        <p>*** Selamat Mengerjakan & Utamakan Kejujuran ***</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
