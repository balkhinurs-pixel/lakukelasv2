/**
 * @fileOverview OMR Processor Engine V83.0 (OpenCV.js based)
 * Menangani deteksi bulatan dan NIS secara lokal di browser.
 * Didesain khusus untuk Rigid LJK Layout (Update V73.0).
 */

declare const cv: any;

export interface OMRResult {
    detectedNis: string;
    studentAnswers: { questionNum: number; studentChoice: string }[];
}

/**
 * Koordinat Tetap LJK (Berdasarkan Canvas 794x1123 - A4 96DPI)
 */
const CONFIG = {
    targetWidth: 794,
    targetHeight: 1123,
    // Koordinat Jangkar (Pojok)
    anchors: [
        { x: 25, y: 25 },   // Top-Left
        { x: 769, y: 25 },  // Top-Right
        { x: 25, y: 1098 }, // Bottom-Left
        { x: 769, y: 1098 } // Bottom-Right
    ],
    // Area NIS (5 Kolom, 10 Baris)
    nis: {
        startX: 565,
        startY: 235,
        gapX: 34,
        gapY: 26,
        rows: 10,
        cols: 5
    },
    // Area Jawaban (2 Kolom @ 15 Soal)
    answers: {
        col1: { startX: 145, startY: 605, gapX: 42, gapY: 44 },
        col2: { startX: 470, startY: 605, gapX: 42, gapY: 44 },
        questionsPerCol: 15,
        options: ['A', 'B', 'C', 'D', 'E']
    }
};

/**
 * Mendeteksi apakah sebuah area (bulatan) dihitamkan.
 */
function isFilled(src: any, x: number, y: number, radius: number = 8): boolean {
    const rect = new cv.Rect(x - radius, y - radius, radius * 2, radius * 2);
    const roi = src.roi(rect);
    const mean = cv.mean(roi)[0]; // Ambil rata-rata intensitas (0=hitam, 255=putih)
    roi.delete();
    return mean < 150; // Threshold: Jika lebih gelap dari 150 (skala 0-255)
}

/**
 * Fungsi Utama Scan LJK Lokal
 */
export async function processLJK(imageElement: HTMLImageElement): Promise<OMRResult> {
    if (typeof cv === 'undefined') throw new Error("OpenCV belum dimuat.");

    let src = cv.imread(imageElement);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 1. Perspective Correction (Sederhana: Kita asumsikan gambar sudah cukup lurus)
    // Untuk pengembangan selanjutnya, kita bisa gunakan detectMarkers untuk warping otomatis.
    let resized = new cv.Mat();
    let dsize = new cv.Size(CONFIG.targetWidth, CONFIG.targetHeight);
    cv.resize(gray, resized, dsize, 0, 0, cv.INTER_AREA);

    // 2. Scan NIS
    let nis = "";
    for (let c = 0; c < CONFIG.nis.cols; c++) {
        let detectedDigit = "0";
        for (let r = 0; r < CONFIG.nis.rows; r++) {
            const x = CONFIG.nis.startX + (c * CONFIG.nis.gapX);
            const y = CONFIG.nis.startY + (r * CONFIG.nis.gapY);
            if (isFilled(resized, x, y)) {
                detectedDigit = String(r);
                break;
            }
        }
        nis += detectedDigit;
    }

    // 3. Scan Jawaban
    const studentAnswers: { questionNum: number; studentChoice: string }[] = [];

    // Proses Kolom 1 (1-15)
    for (let q = 0; r < CONFIG.answers.questionsPerCol; r++) {
        let choice = "EMPTY";
        for (let o = 0; o < CONFIG.answers.options.length; o++) {
            const x = CONFIG.answers.col1.startX + (o * CONFIG.answers.col1.gapX);
            const y = CONFIG.answers.col1.startY + (r * CONFIG.answers.col1.gapY);
            if (isFilled(resized, x, y)) {
                choice = CONFIG.answers.options[o];
                break;
            }
        }
        studentAnswers.push({ questionNum: r + 1, studentChoice: choice });
    }

    // Proses Kolom 2 (16-30)
    for (let r = 0; r < CONFIG.answers.questionsPerCol; r++) {
        let choice = "EMPTY";
        for (let o = 0; o < CONFIG.answers.options.length; o++) {
            const x = CONFIG.answers.col2.startX + (o * CONFIG.answers.col2.gapX);
            const y = CONFIG.answers.col2.startY + (r * CONFIG.answers.col2.gapY);
            if (isFilled(resized, x, y)) {
                choice = CONFIG.answers.options[o];
                break;
            }
        }
        studentAnswers.push({ questionNum: r + 16, studentChoice: choice });
    }

    // Cleanup
    src.delete(); gray.delete(); resized.delete();

    return {
        detectedNis: nis,
        studentAnswers
    };
}
