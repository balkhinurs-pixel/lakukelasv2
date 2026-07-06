"use client";

import * as React from "react";
import { Printer, ArrowLeft, ZoomIn, ZoomOut, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { QRCodeSVG } from "qrcode.react";

/**
 * OMR RIGID CONFIG V130 (PERSONALIZED - NO NIS GRID)
 */
const OMR_UI_CONFIG = {
    page: { width: 794, height: 1123 },
    matrix: {
        top: 380, // Dinaikkan karena grid NIS dihapus
        left: 50,
        rowHeight: 28, 
        colWidth: 230,
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

export default function PrintLjkView({ doc, questions, schoolProfile, students = [] }: any) {
    const [zoom, setZoom] = React.useState(100);
    const handlePrint = () => window.print();
    const handleClose = () => window.close();

    const displayItems = React.useMemo(() => {
        const items: any[] = [];
        let currentType = "";
        let qCount = 0;

        questions.forEach((q: any) => {
            qCount++;
            if (q.question_type !== currentType) {
                currentType = q.question_type;
                const config = questionTypeConfig[currentType] || questionTypeConfig['multiple_choice'];
                items.push({ type: 'header', label: config.label });
            }

            const rowSpan = getQuestionRowSpan(q);
            if (rowSpan > 1) {
                for (let i = 1; i <= rowSpan; i++) {
                    items.push({
                        type: 'row',
                        questionType: q.question_type,
                        displayLabel: `${qCount}.${i}`
                    });
                }
            } else {
                items.push({
                    type: 'row',
                    questionType: q.question_type,
                    displayLabel: String(qCount)
                });
            }
        });
        return items;
    }, [questions]);

    const renderColumn = (items: any[]) => {
        return (
            <div className="flex flex-col" style={{ width: `${OMR_UI_CONFIG.matrix.colWidth}px` }}>
                {items.map((item, idx) => (
                    item.type === 'header' ? (
                        <div key={idx} className="w-full bg-slate-100 py-1.5 px-3 rounded-md border-l-4 border-indigo-600 mb-1 mt-3 first:mt-0" style={{ WebkitPrintColorAdjust: 'exact' }}>
                            <span className="text-[7pt] font-black text-indigo-900 tracking-tight uppercase truncate block">{item.label}</span>
                        </div>
                    ) : (
                        <div key={idx} className="flex items-center gap-3 w-full border-b border-slate-50" style={{ height: `${OMR_UI_CONFIG.matrix.rowHeight}px` }}>
                            <span className="w-8 text-right font-black text-[8pt] text-slate-400">{item.displayLabel}.</span>
                            <div className="flex gap-2">
                                {(questionTypeConfig[item.questionType]?.options || ['A', 'B', 'C', 'D', 'E']).map(opt => (
                                    <div key={opt} className="rounded-full border-[1.5pt] border-black flex items-center justify-center text-[7pt] font-black" style={{ width: '20px', height: '20px', WebkitPrintColorAdjust: 'exact' }}>{opt}</div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        );
    };

    // Jika tidak ada siswa, buat satu halaman kosong (Generic)
    const printList = students.length > 0 ? students : [{ id: 'generic', name: '...................................', nis: '..........' }];

    return (
        <div className="preview-wrapper bg-slate-100 pb-20">
            <header className="no-print fixed top-0 left-0 right-0 z-[200] bg-slate-900 text-white h-16 flex items-center justify-between px-4 shadow-2xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={handleClose} className="text-white hover:bg-white/10 rounded-xl font-bold">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                    <div>
                        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Personalized LJK V130</p>
                        <h2 className="text-sm font-black uppercase tracking-tight">QR Smart Identity</h2>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                    <ZoomOut className="h-4 w-4 text-slate-400" />
                    <Slider value={[zoom]} onValueChange={(val) => setZoom(val[0])} min={40} max={150} step={5} className="w-32 sm:w-48" />
                    <ZoomIn className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-black w-8">{zoom}%</span>
                </div>

                <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-black uppercase tracking-widest gap-2 shadow-lg">
                    <Printer className="h-4 w-4" /> Cetak ({printList.length}) LJK
                </Button>
            </header>

            <div className="flex flex-col items-center gap-8 pt-24">
                {printList.map((student: any) => (
                    <main 
                        key={student.id}
                        className="a4-canvas bg-white relative overflow-hidden text-black" 
                        style={{ 
                            transform: `scale(${zoom / 100})`, 
                            width: '794px', 
                            height: '1123px',
                            breakAfter: 'page'
                        }}
                    >
                        {/* Anchor Markers */}
                        <div className="absolute top-[30px] left-[30px] w-8 h-8 bg-black" style={{ WebkitPrintColorAdjust: 'exact' }} />
                        <div className="absolute top-[30px] right-[30px] w-8 h-8 bg-black" style={{ WebkitPrintColorAdjust: 'exact' }} />
                        <div className="absolute bottom-[30px] left-[30px] w-8 h-8 bg-black" style={{ WebkitPrintColorAdjust: 'exact' }} />
                        <div className="absolute bottom-[30px] right-[30px] w-8 h-8 bg-black" style={{ WebkitPrintColorAdjust: 'exact' }} />

                        {/* Header Section */}
                        <div className="absolute left-[80px] right-[80px] top-[80px] border-b-[2.5pt] border-black pb-5 flex justify-between items-center">
                            <div className="flex gap-5 items-center">
                                {schoolProfile?.school_logo_url && <img src={schoolProfile.school_logo_url} className="w-14 h-14 object-contain" crossOrigin="anonymous" />}
                                <div>
                                    <h1 className="text-xl font-black uppercase leading-tight">{schoolProfile?.school_name || "SEKOLAH LAKUKELAS"}</h1>
                                    <p className="text-[9pt] font-bold text-slate-500 uppercase tracking-widest mt-1">Sistem Administrasi Guru Digital</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-black uppercase underline decoration-2 underline-offset-4">LJK UJIAN PERSONAL</h2>
                                <p className="text-[9pt] font-black mt-1 uppercase text-indigo-600">{doc.subject} | KELAS {doc.class_level}</p>
                            </div>
                        </div>

                        {/* QR & Identity Section */}
                        <div className="absolute left-[80px] right-[80px] top-[180px] flex gap-10 items-start">
                            {/* QR CODE - Identitas Terenkripsi */}
                            <div className="p-3 border-2 border-black rounded-3xl bg-white shadow-sm">
                                <QRCodeSVG 
                                    value={JSON.stringify({ n: student.name, s: student.id, i: student.nis })}
                                    size={110}
                                    level="H"
                                    includeMargin={false}
                                />
                                <p className="text-[7pt] font-black text-center mt-2 uppercase tracking-tighter">Scan QR Identity</p>
                            </div>

                            {/* Personalized Data */}
                            <div className="flex-1 space-y-5 pt-2">
                                <div className="space-y-1">
                                    <p className="text-[9pt] font-black uppercase text-slate-400 tracking-widest">Nama Lengkap Peserta</p>
                                    <p className="text-2xl font-black uppercase tracking-tight border-b-2 border-slate-100 pb-1">{student.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[9pt] font-black uppercase text-slate-400 tracking-widest">Nomor Induk (NIS)</p>
                                        <p className="text-xl font-black tracking-widest border-b-2 border-slate-100 pb-1">{student.nis}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9pt] font-black uppercase text-slate-400 tracking-widest">Ruang / Kelas</p>
                                        <p className="text-xl font-black uppercase border-b-2 border-slate-100 pb-1">{doc.class_level}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="absolute left-[80px] right-[80px] top-[375px] bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[8pt] leading-snug">
                             <p className="font-black uppercase mb-1 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Petunjuk Pengerjaan:</p>
                             <ul className="list-disc pl-5 font-bold text-slate-600">
                                 <li>Gunakan pensil 2B atau pulpen hitam. Hitamkan bulatan secara penuh.</li>
                                 <li>Jangan melipat, merobek, atau mengotori lembar jawaban ini.</li>
                                 <li>Pastikan Nama dan NIS di atas sudah sesuai dengan identitas Anda.</li>
                             </ul>
                        </div>

                        {/* Answers Matrix (Rigid 60 Slots) */}
                        <div className="absolute left-[50px] right-[50px] top-[480px] flex gap-5">
                            {renderColumn(displayItems.slice(0, 20))}
                            <div className="w-px bg-slate-100 self-stretch" />
                            {renderColumn(displayItems.slice(20, 40))}
                            <div className="w-px bg-slate-100 self-stretch" />
                            {renderColumn(displayItems.slice(40, 60))}
                        </div>

                        <div className="absolute bottom-10 left-0 right-0 text-center opacity-30">
                             <p className="text-[7pt] font-bold uppercase tracking-[0.6em]">Dibuat Otomatis Melalui LakuKelas AI Engine</p>
                        </div>
                    </main>
                ))}
            </div>
        </div>
    );
}