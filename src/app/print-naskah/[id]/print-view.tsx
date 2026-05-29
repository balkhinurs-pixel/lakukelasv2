"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { Printer, ArrowLeft, Loader2, FileDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/icons";

/**
 * MathText Component V66.0 (Print Optimized)
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

    if (isLjk) {
        return (
            <div className="min-h-screen bg-slate-100 flex flex-col items-center">
                <header className="no-print sticky top-0 z-[100] w-full bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                    <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-4">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                    <div className="flex flex-col items-center">
                        <div className="font-black uppercase tracking-widest text-xs">LJK OMR PRECISION ENGINE</div>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">V71.0 RIGID COORDINATE LAYOUT</p>
                    </div>
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-black gap-2 px-6 shadow-lg shadow-indigo-500/20">
                        <Printer className="h-4 w-4" /> CETAK / SIMPAN PDF
                    </Button>
                </header>

                <main className="flex-1 w-full flex justify-center p-4 sm:p-10 overflow-auto">
                    <div 
                        className={cn(
                            "transition-all duration-700 print:transform-none",
                            isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        )}
                        style={{ transform: scale < 1 ? `scale(${scale})` : 'none', transformOrigin: 'top center' }}
                    >
                        {/* 
                            RIGID LJK LAYOUT V71.0 
                            Using position: absolute for 100% precision in OMR detection.
                        */}
                        <div 
                            className="ljk-rigid-container bg-white relative print:shadow-none shadow-2xl overflow-hidden text-black" 
                            style={{ 
                                width: '794px', // Standard A4 width at 96 DPI
                                height: '1123px', // Standard A4 height at 96 DPI
                                boxSizing: 'border-box', 
                                fontFamily: 'Arial, Helvetica, sans-serif'
                            }}
                        >
                            {/* OMR ANCHOR POINTS (4 CORNERS) */}
                            <div className="absolute top-[20px] left-[20px] w-8 h-8 bg-black" />
                            <div className="absolute top-[20px] right-[20px] w-8 h-8 bg-black" />
                            <div className="absolute bottom-[20px] left-[20px] w-8 h-8 bg-black" />
                            <div className="absolute bottom-[20px] right-[20px] w-8 h-8 bg-black" />

                            {/* HEADER RIGID */}
                            <div className="absolute top-[60px] left-[60px] right-[60px] border-b-2 border-black pb-3">
                                <div className="flex items-center gap-4">
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

                            {/* IDENTITY BOX (ABSOLUTE) */}
                            <div className="absolute top-[160px] left-[60px] w-[450px] border-2 border-black p-5 rounded-2xl">
                                <p className="text-[9pt] font-black mb-4 uppercase text-slate-600">Identitas Peserta</p>
                                <div className="space-y-6">
                                    <div className="h-10 border-b-2 border-black flex items-end pb-1 text-[11pt] font-bold text-slate-200">NAMA: ..............................................................</div>
                                    <div className="h-10 border-b-2 border-black flex items-end pb-1 text-[11pt] font-bold text-slate-200">KELAS: .............................................................</div>
                                </div>
                            </div>

                            {/* NIS BOX (ABSOLUTE) */}
                            <div className="absolute top-[160px] right-[60px] w-[180px] border-2 border-black p-5 rounded-2xl text-center">
                                <p className="text-[8pt] font-black mb-4 uppercase text-slate-600 tracking-wider">NIS (5 DIGIT)</p>
                                <div className="flex justify-center gap-2">
                                    {[1,2,3,4,5].map(col => (
                                        <div key={col} className="space-y-1">
                                            <div className="w-8 h-8 border-2 border-black flex items-center justify-center font-bold text-[10pt] mb-1 text-slate-100 rounded-sm" />
                                            {[0,1,2,3,4,5,6,7,8,9].map(num => (
                                                <div key={num} className="w-5 h-5 rounded-full border-[1.5pt] border-black flex items-center justify-center text-[7.5pt] font-black">{num}</div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PETUNJUK (ABSOLUTE) */}
                            <div className="absolute top-[370px] left-[60px] w-[450px] p-5 border-2 border-dashed border-black/30 rounded-2xl bg-slate-50">
                                <p className="text-[8pt] font-black mb-2 uppercase text-slate-600">PETUNJUK PENGISIAN</p>
                                <ul className="text-[8pt] font-bold space-y-1 text-slate-700">
                                    <li>1. Gunakan Pensil 2B atau Pulpen Hitam pekat.</li>
                                    <li>2. Hitamkan bulatan secara penuh dan tidak meluber keluar garis.</li>
                                    <li>3. Pastikan lembar tetap bersih dan tidak terlipat agar terbaca AI.</li>
                                </ul>
                            </div>

                            {/* ANSWER AREA (ABSOLUTE RIGID) */}
                            <div className="absolute top-[510px] left-[60px] right-[60px] bottom-[60px] border-[2.5pt] border-black p-8 rounded-[40px]">
                                <p className="text-[11pt] font-black uppercase text-center bg-black text-white py-2 rounded-xl tracking-[0.4em] mb-8">Matriks Jawaban Objektif</p>
                                
                                <div className="flex gap-20">
                                    {/* COLUMN 1 */}
                                    <div className="flex-1 space-y-3">
                                        {questions.slice(0, 15).map((q: any, idx: number) => {
                                            const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                                            return (
                                                <div key={q.id} className="flex items-center gap-4">
                                                    <span className="w-7 text-right font-black text-[10.5pt] text-slate-400">{idx + 1}.</span>
                                                    <div className="flex gap-2.5">
                                                        {options.map(opt => (
                                                            <div key={opt} className="w-[28px] h-[28px] rounded-full border-[2pt] border-black flex items-center justify-center text-[10pt] font-black">{opt}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* COLUMN 2 */}
                                    <div className="flex-1 space-y-3">
                                        {questions.slice(15, 30).map((q: any, idx: number) => {
                                            const options = q.question_type === 'true_false' ? ['B', 'S'] : ['A', 'B', 'C', 'D', 'E'];
                                            return (
                                                <div key={q.id} className="flex items-center gap-4">
                                                    <span className="w-7 text-right font-black text-[10.5pt] text-slate-400">{idx + 16}.</span>
                                                    <div className="flex gap-2.5">
                                                        {options.map(opt => (
                                                            <div key={opt} className="w-[28px] h-[28px] rounded-full border-[2pt] border-black flex items-center justify-center text-[10pt] font-black">{opt}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {questions.length > 30 && (
                                    <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
                                        <Info className="h-5 w-5 text-amber-600" />
                                        <p className="text-[8pt] font-bold text-amber-800">
                                            Perhatian: LJK standar hanya menampung 30 soal objektif. Gunakan lembar tambahan untuk soal esai/uraian.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <header className="no-print sticky top-0 z-[100] bg-slate-900 text-white p-4 flex items-center justify-between shadow-xl">
                <Button variant="ghost" onClick={handleClose} className="text-white gap-2 px-2 sm:px-4">
                    <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Kembali</span>
                </Button>
                <div className="font-bold uppercase tracking-widest text-[10px] sm:text-xs text-center flex-1 mx-2">
                    {isKunci ? 'Kunci Jawaban' : 'Naskah Soal'}
                </div>
                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 px-2 sm:px-4 shadow-lg">
                    <Printer className="h-4 w-4" /> <span className="hidden sm:inline">PDF / Print</span>
                </Button>
            </header>

            <main className="flex-1 p-4 sm:p-8 flex justify-center items-start print:p-0 print-area-container relative">
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white z-10 no-print">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    </div>
                )}

                <div 
                    className={cn(
                        "transition-opacity duration-500 will-change-transform print:transform-none",
                        isReady ? "opacity-100" : "opacity-0"
                    )}
                    style={{ transform: scale < 1 ? `scale(${scale})` : 'none', transformOrigin: 'top center' }}
                >
                    <div 
                        className="print-area bg-white mx-auto print:shadow-none shadow-sm" 
                        style={{ 
                            width: '210mm', 
                            padding: '15mm 15mm', 
                            boxSizing: 'border-box', 
                            fontFamily: '"Times New Roman", Times, serif', 
                            fontSize: '11pt', 
                            lineHeight: '1.45'
                        }}
                    >
                        {/* Kop Surat */}
                        <div className="print-header-block mb-4 pb-2 border-b-[3pt] border-double border-black">
                            <div className="flex items-center gap-6">
                                <div className="w-[28mm] h-[28mm] flex items-center justify-center shrink-0">
                                    {schoolProfile?.school_logo_url && (
                                        <img src={schoolProfile.school_logo_url} className="w-full h-full object-contain" alt="Logo" crossOrigin="anonymous" />
                                    )}
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
                            {sections.map((section, sectionIdx) => (
                                <React.Fragment key={section.type}>
                                    <div className="mt-8 mb-4 border-b border-black/20 pb-1" style={{ breakAfter: 'avoid' }}>
                                        <p className="text-[11pt] font-black uppercase">
                                            {toRoman(sectionIdx + 1)}. {typeLabels[section.type] || section.type.toUpperCase()}
                                        </p>
                                    </div>
                                    
                                    {section.questions.map((q: any, idx: number) => {
                                        const globalIdx = questions.indexOf(q);
                                        const options = q.options_json ? Object.entries(q.options_json as Record<string, string>).sort() : [];
                                        const isTrueFalse = q.question_type === 'true_false';
                                        const isMatching = q.question_type === 'matching';
                                        
                                        const lines = isMatching ? q.question_text.split('\n').map((l: string) => l.trim()).filter((l: string) => l !== '') : [];
                                        const matchingItems = lines.filter((l: string) => /^\d+[\.\)]/.test(l));
                                        const matchingIntro = lines.filter((l: string) => !/^\d+[\.\)]/.test(l)).join('\n');
                                        const rowCount = isMatching ? Math.max(matchingItems.length, options.length) : 0;

                                        return (
                                            <div key={q.id} className="print-question-block mb-10" style={{ breakInside: 'avoid' }}>
                                                <div className="flex gap-4 items-start">
                                                    <span className="font-bold min-w-[28pt] text-left">{globalIdx + 1}.</span>
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
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="mt-12 text-center border-t border-black pt-4 italic text-[9pt]">
                            <p>*** Selamat Mengerjakan & Utamakan Kejujuran ***</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
