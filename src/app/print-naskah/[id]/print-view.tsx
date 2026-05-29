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
 * MathText Component V60.0 (Print Optimized)
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
    const [scale, setScale] = React.useState(1);
    const [isReady, setIsReady] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            const A4_WIDTH_PX = 794; 
            if (window.innerWidth < A4_WIDTH_PX) {
                const newScale = (window.innerWidth - 32) / A4_WIDTH_PX;
                setScale(newScale);
            } else {
                setScale(1);
            }
            setIsReady(true);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    const groupedQuestions = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        questions.forEach((q: any) => {
            if (!groups[q.question_type]) groups[q.question_type] = [];
            groups[q.question_type].push(q);
        });
        return groups;
    }, [questions]);

    // Template LJK OMR Profesional (Update V60.0 - Edge to Edge Stabilization)
    if (isLjk) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
                <header className="no-print sticky top-0 z-[100] bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                    <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-2 sm:px-4">
                        <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Kembali</span>
                    </Button>
                    <div className="font-bold uppercase tracking-widest text-[10px] sm:text-xs text-center flex-1 mx-2">LJK AI OMR (Single Page Stable)</div>
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 px-2 sm:px-4 shadow-lg">
                        <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Cetak / Simpan</span>
                    </Button>
                </header>

                <main className="flex-1 flex justify-center items-start print:p-0 print-area-container relative">
                    {!isReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10 no-print">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        </div>
                    )}
                    
                    <div 
                        className={cn(
                            "preview-scale-wrapper transition-opacity duration-500 will-change-transform print:transform-none",
                            isReady ? "opacity-100" : "opacity-0"
                        )}
                        style={{ transform: scale < 1 ? `scale(${scale})` : 'none', transformOrigin: 'top center' }}
                    >
                        <div 
                            className="print-area bg-white relative print:shadow-none shadow-xl mx-auto overflow-hidden" 
                            style={{ 
                                width: '210mm', 
                                height: '297mm',
                                padding: '10mm 15mm', // Padding ditingkatkan sedikit agar tidak kena potong printer
                                boxSizing: 'border-box', 
                                fontFamily: 'Arial, sans-serif'
                            }}
                        >
                            {/* Anchor Points - Reposisi agar tidak terkena clipping fisik printer (5mm dari tepi div) */}
                            <div className="absolute top-[5mm] left-[5mm] w-6 h-6 bg-black z-50" />
                            <div className="absolute top-[5mm] right-[5mm] w-6 h-6 bg-black z-50" />
                            <div className="absolute bottom-[5mm] left-[5mm] w-6 h-6 bg-black z-50" />
                            <div className="absolute bottom-[5mm] right-[5mm] w-6 h-6 bg-black z-50" />

                            <div className="flex items-center justify-between border-b-[1.5pt] border-black pb-2 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 flex items-center justify-center">
                                        {schoolProfile?.school_logo_url && <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" crossOrigin="anonymous" />}
                                    </div>
                                    <div>
                                        <h1 className="text-[12pt] font-black uppercase leading-tight">{schoolProfile?.school_name || "NAMA SEKOLAH"}</h1>
                                        <p className="text-[7pt] font-bold uppercase text-slate-500">LEMBAR JAWAB KOMPUTER AI Standard LakuKelas</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-[10pt] font-black uppercase underline">LJK Ujian Siswa</h2>
                                    <p className="text-[7pt] font-bold text-slate-500">{doc.subject} | KELAS {doc.class_level}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-[1.4fr_1fr] gap-4 mb-6">
                                <div className="space-y-3">
                                    <div className="border border-black p-3 rounded-lg">
                                        <p className="text-[7pt] font-black mb-2 uppercase text-slate-500">IDENTITAS PESERTA</p>
                                        <div className="space-y-3">
                                            <div className="h-7 border-b border-black flex items-end pb-0.5 text-[9pt] font-bold text-slate-300">NAMA: ................................................................</div>
                                            <div className="h-7 border-b border-black flex items-end pb-0.5 text-[9pt] font-bold text-slate-300">KELAS: ...............................................................</div>
                                        </div>
                                    </div>
                                    <div className="border border-black p-3 rounded-lg bg-slate-50">
                                        <p className="text-[7pt] font-black mb-1 uppercase text-slate-500">PETUNJUK</p>
                                        <p className="text-[6.5pt] font-bold leading-tight">
                                            1. Gunakan Pensil 2B atau Pulpen Hitam.<br/>
                                            2. Hitamkan bulatan secara penuh.<br/>
                                            3. Jaga lembar tetap bersih dan tidak terlipat.
                                        </p>
                                    </div>
                                </div>

                                <div className="border border-black p-3 rounded-lg text-center">
                                    <p className="text-[7pt] font-black mb-2 uppercase text-slate-500">KOLOM NIS (5 DIGIT)</p>
                                    <div className="flex justify-center gap-1.5">
                                        {[1,2,3,4,5].map(col => (
                                            <div key={col} className="space-y-0.5">
                                                <div className="w-6 h-6 border border-black flex items-center justify-center font-bold text-[8pt] mb-1 text-slate-200" />
                                                {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                                    <div key={num} className="w-4 h-4 rounded-full border-[1pt] border-black flex items-center justify-center text-[6pt] font-bold">{num}</div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="border-[1.5pt] border-black p-4 rounded-2xl flex-1 bg-white">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6 items-start">
                                    <div className="space-y-4">
                                        <p className="text-[8pt] font-black uppercase text-center bg-slate-100 py-1 rounded tracking-widest mb-2">Jawaban Objektif</p>
                                        <div className="grid grid-cols-1 gap-y-1.5">
                                            {questions.filter((q:any) => q.question_type === 'multiple_choice' || q.question_type === 'true_false').map((q: any, idx: number) => {
                                                const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                                                return (
                                                    <div key={q.id} className="flex items-center gap-3 py-0.5">
                                                        <span className="w-5 font-bold text-[8pt] text-right">{idx + 1}.</span>
                                                        <div className="flex gap-1.5">
                                                            {options.map(opt => (
                                                                <div key={opt} className="w-5 h-5 rounded-full border-[1pt] border-black flex items-center justify-center text-[6pt] font-black">{opt}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {groupedQuestions.matching && (
                                            <div className="space-y-2">
                                                <p className="text-[8pt] font-black uppercase text-center bg-slate-100 py-1 rounded tracking-widest mb-2">Menjodohkan</p>
                                                <div className="grid grid-cols-1 gap-1.5">
                                                    {groupedQuestions.matching.map((q: any, idx: number) => (
                                                        <div key={q.id} className="flex items-center gap-2">
                                                            <span className="w-5 font-bold text-[8pt] text-right">{idx + 1}.</span>
                                                            <div className="flex-1 h-7 border-[1pt] border-black border-dashed rounded flex items-center px-2 text-[6pt] font-bold text-slate-300">Tulis Pasangan (e.g. 1-C)</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(groupedQuestions.short_answer || groupedQuestions.essay) && (
                                            <div className="space-y-2">
                                                <p className="text-[8pt] font-black uppercase text-center bg-slate-100 py-1 rounded tracking-widest mb-2">Isian / Uraian</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {questions.filter((q:any) => q.question_type === 'short_answer' || q.question_type === 'essay').map((q: any, idx: number) => (
                                                        <div key={q.id} className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-[8pt]">{idx + 1}.</span>
                                                                <div className="flex-1 h-[10mm] border-[1pt] border-black rounded-md" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-[15mm] left-[20mm] right-[20mm] flex justify-between text-[8pt]">
                                <div className="text-center">
                                    <p>Tanda Tangan Pengawas</p>
                                    <div className="h-10" />
                                    <p>( .................................... )</p>
                                </div>
                                <div className="text-center">
                                    <p>Tanda Tangan Siswa</p>
                                    <div className="h-10" />
                                    <p>( .................................... )</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <style jsx global>{`
                    @media print {
                        @page { 
                            margin: 0 !important; 
                        }
                    }
                `}</style>
            </div>
        );
    }

    // Template Naskah Soal / Kunci Jawaban
    let currentRomanIdx = 0;
    let lastRenderedType = "";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
            <header className="no-print sticky top-0 z-[100] bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-2 sm:px-4">
                    <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Kembali</span>
                </Button>
                <div className="font-bold uppercase tracking-widest text-[10px] sm:text-xs text-center flex-1 mx-2">
                    {isKunci ? 'Kunci Jawaban' : 'Naskah Soal'}
                </div>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 px-2 sm:px-4 shadow-lg shadow-indigo-600/20">
                    <Printer className="h-4 w-4" /> <span className="hidden sm:inline">PDF / Print</span>
                </Button>
            </header>

            <main className="flex-1 p-4 sm:p-8 flex justify-center items-start print:p-0 print-area-container relative">
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10 no-print">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    </div>
                )}

                <div 
                    className={cn(
                        "preview-scale-wrapper transition-opacity duration-500 will-change-transform print:transform-none",
                        isReady ? "opacity-100" : "opacity-0"
                    )}
                    style={{ transform: scale < 1 ? `scale(${scale})` : 'none', transformOrigin: 'top center' }}
                >
                    <div 
                        className="print-area bg-white mx-auto print:shadow-none shadow-2xl" 
                        style={{ 
                            width: '210mm', 
                            padding: '15mm 15mm', 
                            boxSizing: 'border-box', 
                            fontFamily: '"Times New Roman", Times, serif', 
                            fontSize: '11pt', 
                            lineHeight: '1.45'
                        }}
                    >
                        {/* Kop Surat Profesional */}
                        <div className="print-header-block mb-4 pb-2 border-b-[3pt] border-double border-black">
                            <div className="flex items-center gap-6">
                                <div className="w-[28mm] h-[28mm] flex items-center justify-center shrink-0">
                                    {schoolProfile?.school_logo_url ? (
                                        <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" crossOrigin="anonymous" />
                                    ) : null}
                                </div>
                                <div className="flex-1 text-center pr-[28mm]">
                                    <p className="text-[11pt] font-bold uppercase leading-tight tracking-wide">
                                        Pemerintah Daerah / Yayasan Pendidikan Terkait
                                    </p>
                                    <h1 className="text-[18pt] font-black uppercase leading-tight mt-1">{schoolProfile?.school_name || "NAMA SEKOLAH ANDA"}</h1>
                                    <p className="text-[9.5pt] font-bold mt-1">
                                        {schoolProfile?.school_address || "Alamat lengkap sekolah belum diatur"}
                                    </p>
                                    <p className="text-[9pt] font-bold mt-0.5">
                                        NPSN: {schoolProfile?.npsn || "........"} {schoolProfile?.school_website && ` | Website: ${schoolProfile.school_website}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Box */}
                        <div className="border-[1.5pt] border-black p-4 mb-6 rounded-sm bg-slate-50/20">
                            <div className="grid grid-cols-2 gap-x-12">
                                <div className="space-y-1.5">
                                    <div className="grid grid-cols-[110px_10px_1fr] items-baseline">
                                        <span className="font-bold">Hari / Tanggal</span>
                                        <span className="font-bold">:</span>
                                        <span className="font-bold">{doc.exam_date ? format(parseISO(doc.exam_date), 'EEEE, dd MMMM yyyy', { locale: id }) : '..........................'}</span>
                                    </div>
                                    <div className="grid grid-cols-[110px_10px_1fr] items-baseline">
                                        <span className="font-bold">Pukul</span>
                                        <span className="font-bold">:</span>
                                        <span className="font-bold">{doc.exam_time || '..........................'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                                        <span className="font-bold">Mata Pelajaran</span>
                                        <span className="font-bold">:</span>
                                        <span className="font-black uppercase">{doc.subject}</span>
                                    </div>
                                    <div className="grid grid-cols-[130px_10px_1fr] items-baseline">
                                        <span className="font-bold">Kelas / Semester</span>
                                        <span className="font-bold">:</span>
                                        <span className="font-bold">{doc.class_level} / {doc.semester || 'I (Satu)'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-[12pt] font-bold uppercase underline leading-tight tracking-tight">
                                {isKunci ? 'KUNCI JAWABAN: ' : ''}{doc.title}
                            </h3>
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
                                        <div className="print-question-block mb-10" style={{ breakInside: 'avoid' }}>
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
                    </div>
                </div>
            </main>
            
            <style jsx>{`
                @media (max-width: 793px) {
                    .preview-scale-wrapper:not(.opacity-100) {
                        transform: scale(0.45); 
                    }
                }
            `}</style>
        </div>
    );
}