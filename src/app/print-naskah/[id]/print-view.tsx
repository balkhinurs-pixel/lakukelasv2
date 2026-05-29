"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/icons";

/**
 * MathText Component V50.0 (Print Optimized & Clean)
 */
const MathText = ({ content }: { content: string }) => {
  if (!content) return null;
  
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

    React.useEffect(() => {
        const prepareAndPrint = async () => {
            if (typeof document !== 'undefined' && (document as any).fonts) {
                await (document as any).fonts.ready;
            }
        };
        prepareAndPrint();
    }, []);

    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    // -- LJK Dynamic Layout Logic --
    const groupedQuestions = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        questions.forEach((q: any) => {
            if (!groups[q.question_type]) groups[q.question_type] = [];
            groups[q.question_type].push(q);
        });
        return groups;
    }, [questions]);

    // -- LJK VIEW (Standard OMR) --
    if (isLjk) {
        return (
            <div className="min-h-screen bg-white">
                <header className="no-print sticky top-0 z-50 bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                    <Button variant="ghost" onClick={handleClose} className="text-white gap-2">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                    <div className="font-bold uppercase tracking-widest text-xs">Cetak LJK AI OMR Standard</div>
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
                        <Printer className="h-4 w-4" /> Simpan PDF / Print
                    </Button>
                </header>

                <main className="print-area bg-white mx-auto relative overflow-hidden" style={{ width: '210mm', minHeight: '297mm', padding: '15mm 15mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>
                    
                    {/* Anchor Points (Critical for AI Vision) */}
                    <div className="absolute top-4 left-4 w-8 h-8 bg-black z-50" />
                    <div className="absolute top-4 right-4 w-8 h-8 bg-black z-50" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 bg-black z-50" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 bg-black z-50" />

                    {/* Kop Surat */}
                    <div className="mb-6 pb-2 border-b-[3pt] border-double border-black">
                        <div className="flex items-center gap-6">
                            <div className="w-[28mm] h-[25mm] flex items-center justify-center shrink-0">
                                {schoolProfile?.school_logo_url ? (
                                    <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" crossOrigin="anonymous" />
                                ) : null}
                            </div>
                            <div className="flex-1 text-center pr-[28mm]">
                                <p className="text-[10pt] font-bold uppercase leading-tight tracking-wide">Yayasan / Dinas Pendidikan Terkait</p>
                                <h1 className="text-[16pt] font-black uppercase leading-tight mt-1">{schoolProfile?.school_name || "NAMA SEKOLAH ANDA"}</h1>
                                <p className="text-[8pt] font-bold mt-1">
                                    {schoolProfile?.school_address || "Alamat lengkap sekolah belum diatur"} 
                                    {schoolProfile?.npsn && ` | NPSN: ${schoolProfile.npsn}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-6">
                        <h2 className="text-[14pt] font-black uppercase underline tracking-tighter">LEMBAR JAWAB KOMPUTER (LJK) AI</h2>
                        <p className="text-[10pt] font-bold uppercase mt-1">SISTEM PENILAIAN DIGITAL LAKUKELAS</p>
                    </div>

                    {/* Section 1: Identitas & Petunjuk */}
                    <div className="grid grid-cols-[1.5fr_1fr] gap-6 mb-8">
                        <div className="space-y-4">
                            <div className="border-[1.5pt] border-black p-4 rounded-xl">
                                <p className="text-[8pt] font-black mb-3 uppercase text-slate-500 tracking-widest">A. IDENTITAS PESERTA UJIAN</p>
                                <div className="space-y-4">
                                    <div className="h-9 border-b border-black flex items-end pb-1 text-[10pt] font-bold">NAMA : ............................................................................</div>
                                    <div className="h-9 border-b border-black flex items-end pb-1 text-[10pt] font-bold">KELAS : ...........................................................................</div>
                                    <div className="h-9 border-b border-black flex items-end pb-1 text-[10pt] font-bold">MATA PELAJARAN : <span className="uppercase">{doc.subject}</span></div>
                                </div>
                            </div>
                            <div className="border-[1.5pt] border-black p-4 rounded-xl bg-slate-50">
                                <p className="text-[8pt] font-black mb-2 uppercase text-slate-500 tracking-widest">B. PETUNJUK PENGISIAN</p>
                                <ul className="text-[7.5pt] font-bold space-y-1">
                                    <li>1. Gunakan Pensil 2B atau Pulpen Hitam.</li>
                                    <li>2. Hitamkan/Silang pada bulatan jawaban yang benar.</li>
                                    <li>3. Contoh pengisian: <span className="inline-flex items-center gap-1 mx-2"> Benar: <span className="w-3.5 h-3.5 rounded-full bg-black"></span> Salah: <span className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[5pt] font-black">X</span></span></li>
                                    <li>4. Jaga lembar ini agar tidak kotor, basah, atau terlipat.</li>
                                </ul>
                            </div>
                        </div>

                        {/* NIS Block OMR Style */}
                        <div className="border-[1.5pt] border-black p-4 rounded-xl text-center">
                            <p className="text-[8pt] font-black mb-3 uppercase text-slate-500 tracking-widest">C. KOLOM NIS (5 DIGIT)</p>
                            <div className="flex justify-center gap-1.5">
                                {[1,2,3,4,5].map(col => (
                                    <div key={col} className="space-y-0.5">
                                        <div className="w-7 h-7 border border-black flex items-center justify-center font-bold text-[9pt] mb-1" />
                                        {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                            <div key={num} className="w-5 h-5 rounded-full border-[1pt] border-black flex items-center justify-center text-[7pt] font-bold">{num}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Dinamis Jawaban Berkelompok */}
                    <div className="border-[2pt] border-black p-6 rounded-3xl min-h-[150mm]">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-10 items-start">
                            
                            {/* Pilihan Ganda / True False Group */}
                            <div className="space-y-6">
                                {(groupedQuestions.multiple_choice || groupedQuestions.true_false) && (
                                    <div className="space-y-3">
                                        <p className="text-[9pt] font-black uppercase text-center bg-slate-100 py-1.5 rounded-md tracking-widest mb-4">Jawaban Objektif (PG/BS)</p>
                                        <div className="grid grid-cols-1 gap-y-2.5">
                                            {questions.filter((q:any) => q.question_type === 'multiple_choice' || q.question_type === 'true_false').map((q: any, idx: number) => {
                                                const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                                                return (
                                                    <div key={q.id} className="flex items-center gap-4">
                                                        <span className="w-6 font-bold text-[9pt] text-right">{idx + 1}.</span>
                                                        <div className="flex gap-2">
                                                            {options.map(opt => (
                                                                <div key={opt} className="w-6 h-6 rounded-full border-[1.2pt] border-black flex items-center justify-center text-[8pt] font-black">{opt}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Matching & Short Answer Group */}
                            <div className="space-y-8">
                                {groupedQuestions.matching && (
                                    <div className="space-y-3">
                                        <p className="text-[9pt] font-black uppercase text-center bg-slate-100 py-1.5 rounded-md tracking-widest mb-4">Jawaban Menjodohkan</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {groupedQuestions.matching.map((q: any, idx: number) => (
                                                <div key={q.id} className="flex items-center gap-3">
                                                    <span className="w-6 font-bold text-[9pt] text-right">{idx + 1}.</span>
                                                    <div className="flex-1 h-8 border-[1pt] border-black border-dashed rounded-md flex items-center px-3 text-[8pt] font-bold text-slate-300">Tulis Pasangan (Misal: 1-C, 2-A)</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(groupedQuestions.short_answer || groupedQuestions.essay) && (
                                    <div className="space-y-3">
                                        <p className="text-[9pt] font-black uppercase text-center bg-slate-100 py-1.5 rounded-md tracking-widest mb-4">Jawaban Isian / Uraian</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {questions.filter((q:any) => q.question_type === 'short_answer' || q.question_type === 'essay').map((q: any, idx: number) => (
                                                <div key={q.id} className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-[9pt]">{idx + 1}.</span>
                                                        <div className="flex-1 h-[12mm] border-[1pt] border-black rounded-lg" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Signature Area */}
                    <div className="mt-8 flex justify-between text-[9pt] px-10">
                        <div className="text-center">
                            <p>Tanda Tangan Pengawas</p>
                            <div className="h-14" />
                            <p>( .................................... )</p>
                        </div>
                        <div className="text-center">
                            <p>Tanda Tangan Siswa</p>
                            <div className="h-14" />
                            <p>( .................................... )</p>
                        </div>
                    </div>

                </main>
            </div>
        );
    }

    // -- SOAL & KUNCI VIEW --
    let currentRomanIdx = 0;
    let lastRenderedType = "";

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

            <main className="print-area mx-auto" style={{ width: '210mm', padding: '15mm 20mm', boxSizing: 'border-box', fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', lineHeight: '1.45', position: 'relative', zIndex: 1 }}>
                
                <div className="print-header-block mb-6 pb-2 border-b-[3pt] border-double border-black">
                    <div className="flex items-center gap-6">
                        <div className="w-[30mm] h-[28mm] flex items-center justify-center shrink-0">
                            {schoolProfile?.school_logo_url ? (
                                <img 
                                    src={schoolProfile.school_logo_url} 
                                    className="w-full h-full object-contain" 
                                    alt="Logo Sekolah" 
                                    crossOrigin="anonymous" 
                                />
                            ) : null}
                        </div>
                        <div className="flex-1 text-center pr-[30mm]">
                            <p className="text-[11pt] font-bold uppercase leading-tight tracking-wide">Yayasan / Dinas Pendidikan Terkait</p>
                            <h1 className="text-[18pt] font-black uppercase leading-tight mt-1">{schoolProfile?.school_name || "NAMA SEKOLAH ANDA"}</h1>
                            <p className="text-[9pt] font-bold mt-1">
                                {schoolProfile?.school_address || "Alamat lengkap sekolah belum diatur"} 
                                {schoolProfile?.npsn && ` | NPSN: ${schoolProfile.npsn}`}
                            </p>
                            <p className="text-[8pt] italic mt-0.5">
                                {schoolProfile?.school_website && `Website: ${schoolProfile.school_website}`} 
                                {schoolProfile?.school_email && ` | Email: ${schoolProfile.school_email}`}
                            </p>
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
                    <div className="flex justify-center gap-10 mt-1 text-[10pt] font-bold">
                        {doc.exam_date && <p>Hari/Tanggal: {format(parseISO(doc.exam_date), 'EEEE, d MMMM yyyy', { locale: id })}</p>}
                        {doc.exam_time && <p>Waktu: {doc.exam_time}</p>}
                    </div>
                </div>

                <div className="questions-container">
                    {questions.map((q: any, idx: number) => {
                        const showSectionHeader = q.question_type !== lastRenderedType;
                        if (showSectionHeader) {
                            lastRenderedType = q.question_type;
                            currentRomanIdx++;
                        }

                        const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                        const isTrueFalse = q.question_type === 'true_false';
                        const isMatching = q.question_type === 'matching';
                        
                        const lines = isMatching ? q.question_text.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '') : [];
                        const matchingItems = lines.filter((l: string) => /^\d+[\.\)]/.test(l));
                        const matchingIntro = lines.filter((l: string) => !/^\d+[\.\)]/.test(l)).join('\n');
                        const rowCount = isMatching ? Math.max(matchingItems.length, options.length) : 0;

                        return (
                            <React.Fragment key={q.id}>
                                {showSectionHeader && (
                                    <div className="mt-8 mb-4 border-b border-black/20 pb-1" style={{ breakAfter: 'avoid' }}>
                                        <p className="text-[11pt] font-black uppercase">
                                            {toRoman(currentRomanIdx)}. {typeLabels[q.question_type] || q.question_type.toUpperCase()}
                                        </p>
                                    </div>
                                )}
                                <div className="print-question-block mb-10" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                    <div className="flex gap-4 items-start">
                                        <span className="font-bold min-w-[28pt] text-left">{idx + 1}.</span>
                                        <div className="flex-1">
                                            <MathText content={isMatching ? (matchingIntro || q.question_text) : q.question_text} />
                                            
                                            {q.visual_svg && (
                                                <div className="my-6 flex justify-center">
                                                    <div 
                                                        className="border border-slate-100 p-2 rounded-lg"
                                                        style={{ maxWidth: '50mm', width: '100%' }}
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
                            </React.Fragment>
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
