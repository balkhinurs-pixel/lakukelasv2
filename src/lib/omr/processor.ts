/**
 * @fileOverview OMR Processor Engine V84.0 (OpenCV.js with Perspective Transform)
 * Menangani pelurusan gambar otomatis (Perspective Warp) dan deteksi bulatan.
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
    // Koordinat target setelah warp (TL, TR, BR, BL)
    targetPoints: [
        0, 0,
        794, 0,
        794, 1123,
        0, 1123
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
 * Fungsi Utama Scan LJK Lokal dengan Perspective Warp
 */
export async function processLJK(imageElement: HTMLImageElement): Promise<OMRResult> {
    if (typeof cv === 'undefined') throw new Error("OpenCV belum dimuat.");

    let src = cv.imread(imageElement);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 1. PERSPECTIVE TRANSFORM (Meluruskan Foto)
    let blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    
    let thresh = new cv.Mat();
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let corners: any[] = [];
    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);
        let perimeter = cv.arcLength(cnt, true);
        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * perimeter, true);

        // Cari 4 kontur segiempat di pojok (Anchor Boxes)
        if (approx.rows === 4 && area > 500 && area < 10000) {
            let rect = cv.boundingRect(cnt);
            corners.push({
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                area: area
            });
        }
        approx.delete();
    }

    let warped = new cv.Mat();
    if (corners.length >= 4) {
        // Sort corners: Top-Left, Top-Right, Bottom-Right, Bottom-Left
        corners.sort((a, b) => a.y - b.y);
        let top = corners.slice(0, 2).sort((a, b) => a.x - b.x);
        let bottom = corners.slice(corners.length - 2).sort((a, b) => a.x - b.x);
        
        let srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
            top[0].x, top[0].y,
            top[1].x, top[1].y,
            bottom[1].x, bottom[1].y,
            bottom[0].x, bottom[0].y
        ]);
        let dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, CONFIG.targetPoints);
        let M = cv.getPerspectiveTransform(srcPts, dstPts);
        cv.warpPerspective(gray, warped, M, new cv.Size(CONFIG.targetWidth, CONFIG.targetHeight));
        
        srcPts.delete(); dstPts.delete(); M.delete();
    } else {
        // Fallback jika jangkar tidak terdeteksi: Lakukan resize standar
        cv.resize(gray, warped, new cv.Size(CONFIG.targetWidth, CONFIG.targetHeight), 0, 0, cv.INTER_AREA);
    }

    // 2. SCAN BUBBLES (Deteksi Bulatan)
    let binary = new cv.Mat();
    cv.adaptiveThreshold(warped, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 15, 10);

    const isFilled = (img: any, x: number, y: number) => {
        const radius = 10;
        let rect = new cv.Rect(x - radius, y - radius, radius * 2, radius * 2);
        let roi = img.roi(rect);
        let count = cv.countNonZero(roi);
        roi.delete();
        // Threshold: 35% area terisi coretan hitam
        return count > (radius * 2 * radius * 2) * 0.35;
    };

    // Scan NIS (5 Digits)
    let nis = "";
    for (let c = 0; c < CONFIG.nis.cols; c++) {
        let detectedDigit = "0"; // Default
        for (let r = 0; r < CONFIG.nis.rows; r++) {
            const x = CONFIG.nis.startX + (c * CONFIG.nis.gapX);
            const y = CONFIG.nis.startY + (r * CONFIG.nis.gapY);
            if (isFilled(binary, x, y)) {
                detectedDigit = String(r);
                break;
            }
        }
        nis += detectedDigit;
    }

    // Scan Jawaban (30 Soal)
    const studentAnswers: { questionNum: number; studentChoice: string }[] = [];
    
    // Kolom 1 (1-15)
    for (let r = 0; r < CONFIG.answers.questionsPerCol; r++) {
        let choice = "EMPTY";
        for (let o = 0; o < CONFIG.answers.options.length; o++) {
            const x = CONFIG.answers.col1.startX + (o * CONFIG.answers.col1.gapX);
            const y = CONFIG.answers.col1.startY + (r * CONFIG.answers.col1.gapY);
            if (isFilled(binary, x, y)) {
                choice = CONFIG.answers.options[o];
                break;
            }
        }
        studentAnswers.push({ questionNum: r + 1, studentChoice: choice });
    }

    // Kolom 2 (16-30)
    for (let r = 0; r < CONFIG.answers.questionsPerCol; r++) {
        let choice = "EMPTY";
        for (let o = 0; o < CONFIG.answers.options.length; o++) {
            const x = CONFIG.answers.col2.startX + (o * CONFIG.answers.col2.gapX);
            const y = CONFIG.answers.col2.startY + (r * CONFIG.answers.col2.gapY);
            if (isFilled(binary, x, y)) {
                choice = CONFIG.answers.options[o];
                break;
            }
        }
        studentAnswers.push({ questionNum: r + 16, studentChoice: choice });
    }

    // Cleanup memori WebAssembly
    src.delete(); gray.delete(); blurred.delete(); thresh.delete(); 
    contours.delete(); hierarchy.delete(); warped.delete(); binary.delete();

    return {
        detectedNis: nis,
        studentAnswers
    };
}
