"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Printer, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
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

            <main className="a4-canvas" style={{ transform: `scale(${zoom / 100})`, width: '210mm' }}>
                <div className="print-area h-full w-full bg-white text-black" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.6', padding: '15mm 20mm' }}>
                    
                    {/* Kop Surat Profesional */}
                    <div className="mb-8 pb-2 border-b-[3pt] border-double border-black">
                        <div className="flex items-center gap-8">
                            <div className="w-[30mm] h-[30mm] flex items-center justify-center shrink-0">
                                {schoolProfile?.school_logo_url ? (
                                    <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" crossOrigin="anonymous" />
                                ) : (
                                    <AppLogo className="opacity-10 w-full h-full text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1 text-center pr-[30mm]">
                                <p className="text-[11pt] font-bold uppercase leading-tight tracking-wide">Pemerintah Daerah / Yayasan Pendidikan Terkait</p>
                                <h1 className="text-[18pt] font-black uppercase leading-tight mt-1">{schoolProfile?.school_name || "NAMA SEKOLAH ANDA"}</h1>
                                <p className="text-[10pt] font-bold mt-1">{schoolProfile?.school_address || "Alamat lengkap sekolah belum diatur"}</p>
                                <p className="text-[9pt] font-bold mt-0.5">NPSN: {schoolProfile?.npsn || "........"} {schoolProfile?.school_website && ` | Website: ${schoolProfile.school_website}`}</p>
                            </div>
                        </div>
                    </div>

                    {/* Identity Box */}
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

                    {/* Questions Content (Flowing) */}
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
