"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Printer, ArrowLeft, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AppLogo } from "@/components/icons";

const MathText = ({ content }: { content: string }) => {
  if (!content) return null;
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

  return (
    <div className="math-text-render w-full text-justify print:text-black">
      {parts.map((part, i) => {
        if (!part) return null;
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

export default function PrintSoalView({ doc, questions, schoolProfile, isKunci }: any) {
    const [zoom, setZoom] = React.useState(100);

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

    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    return (
        <div className="preview-wrapper">
            <header className="no-print fixed top-0 left-0 right-0 z-[200] bg-slate-900/95 backdrop-blur-md text-white h-16 flex items-center justify-between px-4 shadow-2xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleClose} className="text-white hover:bg-white/10 rounded-xl h-10 gap-2 font-bold">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                    <div className="hidden sm:block">
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Pratinjau Cetak</p>
                        <h2 className="text-sm font-black uppercase tracking-tight">{isKunci ? 'Kunci Jawaban' : 'Naskah Soal'}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 w-32 sm:w-48">
                        <ZoomOut className="h-4 w-4 text-slate-400" />
                        <Slider 
                            value={[zoom]} 
                            onValueChange={(val) => setZoom(val[0])} 
                            min={50} 
                            max={150} 
                            step={5} 
                            className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black w-8">{zoom}%</span>
                </div>

                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-black uppercase tracking-widest gap-2 shadow-lg shadow-indigo-500/20">
                    <Printer className="h-4 w-4" /> Cetak / PDF
                </Button>
            </header>

            <main className="a4-canvas" style={{ transform: `scale(${zoom / 100})`, width: '210mm', minHeight: '297mm' }}>
                <div className="print-area h-full w-full bg-white text-black" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', lineHeight: '1.45', padding: '15mm 20mm' }}>
                    
                    {/* Kop Surat */}
                    <div className="mb-6 pb-2 border-b-[3pt] border-double border-black">
                        <div className="flex items-center gap-8">
                            <div className="w-[24mm] h-[24mm] flex items-center justify-center shrink-0">
                                {schoolProfile?.school_logo_url ? (
                                    <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" crossOrigin="anonymous" />
                                ) : (
                                    <AppLogo className="opacity-10 w-full h-full text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1 text-center pr-[24mm]">
                                <p className="text-[10pt] font-bold uppercase leading-tight tracking-wide">Pemerintah Daerah / Yayasan Pendidikan Terkait</p>
                                <h1 className="text-[15pt] font-black uppercase leading-tight mt-1">{schoolProfile?.school_name || "NAMA SEKOLAH ANDA"}</h1>
                                {schoolProfile?.npsn && <p className="text-[9pt] font-bold">NPSN: {schoolProfile.npsn}</p>}
                                <p className="text-[9pt] italic leading-tight mt-1">{schoolProfile?.school_address || "Alamat lengkap sekolah belum diatur"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Identity Info Box */}
                    <div className="border-[1.2pt] border-black p-3 mb-8 rounded-sm">
                        <div className="grid grid-cols-2 gap-x-8 text-[10.5pt]">
                            <div className="space-y-1">
                                <div className="grid grid-cols-[100px_10px_1fr] items-baseline font-bold"><span>Hari / Tanggal</span><span>:</span><span>{doc.exam_date ? format(parseISO(doc.exam_date), 'EEEE, d MMMM yyyy', { locale: id }) : '..........................'}</span></div>
                                <div className="grid grid-cols-[100px_10px_1fr] items-baseline font-bold"><span>Waktu</span><span>:</span><span>{doc.exam_time || '..........................'}</span></div>
                            </div>
                            <div className="space-y-1 border-l-[1pt] border-black/20 pl-8">
                                <div className="grid grid-cols-[110px_10px_1fr] items-baseline font-bold"><span>Mata Pelajaran</span><span>:</span><span className="uppercase">{doc.subject}</span></div>
                                <div className="grid grid-cols-[110px_10px_1fr] items-baseline font-bold"><span>Kelas</span><span>:</span><span>{doc.class_level}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h3 className="text-[12pt] font-black uppercase underline tracking-tight">{isKunci ? 'KUNCI JAWABAN: ' : ''}{doc.title}</h3>
                    </div>

                    {/* Questions Loop */}
                    <div className="questions-container">
                        {sections.map((section, sIdx) => (
                            <div key={sIdx} className="mb-6">
                                <div className="mt-6 mb-4 border-b border-black/20 pb-0.5" style={{ breakAfter: 'avoid' }}>
                                    <p className="text-[11pt] font-black uppercase tracking-tight">
                                        {toRoman(sIdx + 1)}. {typeLabels[section.type] || section.type.toUpperCase()}
                                    </p>
                                </div>
                                
                                {section.questions.map((q: any) => {
                                    const globalIdx = questions.indexOf(q);
                                    const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                                    const isMultipleChoice = q.question_type === 'multiple_choice';
                                    const isTrueFalse = q.question_type === 'true_false';
                                    const isMatching = q.question_type === 'matching';
                                    
                                    let matchingItems: string[] = [];
                                    let matchingIntro = q.question_text;
                                    let rowCount = 0;

                                    if (isMatching) {
                                        const lines = q.question_text.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '');
                                        if (lines.length > 1) {
                                            const hasNumberedLines = lines.slice(1).some(l => /^\d+[\.\)]/.test(l));
                                            if (hasNumberedLines) {
                                                matchingItems = lines.filter((l: string) => /^\d+[\.\)]/.test(l));
                                                matchingIntro = lines.filter((l: string) => !/^\d+[\.\)]/.test(l)).join('\n');
                                            } else {
                                                matchingIntro = lines[0];
                                                matchingItems = lines.slice(1);
                                            }
                                        }
                                        rowCount = Math.max(matchingItems.length, options.length);
                                    }

                                    return (
                                        <div key={q.id} className="print-question-block mb-6" style={{ breakInside: 'avoid' }}>
                                            <div className="flex gap-3 items-start">
                                                <span className="font-bold min-w-[24pt] text-left">{globalIdx + 1}.</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-3">
                                                        <MathText content={isMatching ? (matchingIntro || q.question_text) : q.question_text} />
                                                    </div>
                                                    
                                                    {q.visual_svg && (
                                                        <div className="my-4 flex justify-center">
                                                            <div className="border border-slate-100 p-3 rounded-lg"
                                                                 style={{ maxWidth: '60mm', width: '100%' }}
                                                                 dangerouslySetInnerHTML={{ __html: q.visual_svg.replace('<svg', '<svg style="width:100%; height:auto;" preserveAspectRatio="xMidYMid meet"') }} />
                                                        </div>
                                                    )}

                                                    {isMultipleChoice ? (
                                                        <div className="mt-3 grid grid-cols-2 gap-x-12 gap-y-1.5 items-start">
                                                            {options.map(([k, v]) => (
                                                                <div key={k} className="flex gap-2 items-start py-0.5">
                                                                    <span className="font-bold min-w-[18pt]">{k}.</span>
                                                                    <div className="flex-1"><MathText content={v} /></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : isTrueFalse ? (
                                                        <div className="mt-3 flex gap-10 items-center font-bold">
                                                            {options.map(([k, v]) => (
                                                                <div key={k} className="flex gap-2 items-center">
                                                                    <span>{k}.</span><span className="uppercase tracking-widest">{v}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : isMatching ? (
                                                        <div className="mt-4 border border-black rounded-sm overflow-hidden">
                                                            <table className="w-full border-collapse">
                                                                <thead>
                                                                    <tr className="bg-gray-100 border-b border-black">
                                                                        <th className="p-2 border-r border-black font-black text-[8.5pt] uppercase w-10 text-center">No</th>
                                                                        <th className="p-2 border-r border-black font-black text-[8.5pt] uppercase text-left">Pernyataan / Soal</th>
                                                                        <th className="p-2 border-r border-black font-black text-[8.5pt] uppercase w-12 text-center">Pilih</th>
                                                                        <th className="p-2 font-black text-[8.5pt] uppercase text-left">Pilihan Jawaban</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {Array.from({ length: rowCount }).map((_, i) => (
                                                                        <tr key={i} className="border-b border-black last:border-b-0">
                                                                            <td className="p-2 border-r border-black text-center font-bold text-[10.5pt]">{i + 1}</td>
                                                                            <td className="p-2 border-r border-black text-[10pt] min-w-[65mm]">
                                                                                {matchingItems[i] ? <MathText content={matchingItems[i].replace(/^\d+[\.\)]\s*/, '')} /> : <div className="h-6 italic text-slate-300">...</div>}
                                                                            </td>
                                                                            <td className="p-2 border-r border-black text-center font-bold text-slate-200">[....]</td>
                                                                            <td className="p-2 text-[10pt] min-w-[50mm]">
                                                                                {options[i] ? (
                                                                                    <div className="flex gap-2 items-start">
                                                                                        <span className="font-bold min-w-[14pt]">{options[i][0]}.</span>
                                                                                        <div className="flex-1"><MathText content={options[i][1]} /></div>
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
                                                            <div className="mt-3 grid grid-cols-1 gap-y-1">
                                                                {options.map(([k, v]) => (
                                                                    <div key={k} className="flex gap-2 items-start py-0.5">
                                                                        <span className="font-bold min-w-[18pt]">{k}.</span>
                                                                        <div className="flex-1"><MathText content={v} /></div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                    )}

                                                    {isKunci && (
                                                        <div className="mt-4 p-4 border-l-[3pt] border-indigo-600 bg-indigo-50/20 text-[10.5pt] italic rounded-r-xl shadow-inner">
                                                            <p className="font-black text-indigo-900 not-italic uppercase text-[8.5pt] mb-1.5 flex items-center gap-2">Kunci: {q.correct_answer}</p>
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

                    <div className="mt-12 text-center border-t border-black pt-4 italic text-[10.5pt] font-bold text-slate-400">
                        <p>*** Selamat Mengerjakan & Utamakan Kejujuran ***</p>
                    </div>
                </div>
            </main>
        </div>
    );
}