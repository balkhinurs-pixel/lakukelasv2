
/**
 * @fileOverview OMR Processor Engine V87.0 (GROUPED MATRIX SUPPORT)
 * Menangani deteksi bulatan pada tata letak grid 3-kolom yang mendukung header.
 */

declare const cv: any;

export interface OMRResult {
    detectedNis: string;
    studentAnswers: { questionNum: number; studentChoice: string }[];
}

const CONFIG = {
    targetWidth: 794,
    targetHeight: 1123,
    targetPoints: [0, 0, 794, 0, 794, 1123, 0, 1123],
    nis: {
        startX: 575,
        startY: 185,
        gapX: 28,
        gapY: 20,
        rows: 10,
        cols: 5
    },
    answers: {
        // Tiga Kolom Konfigurasi Grid
        col1: { startX: 135, startY: 488, gapX: 31, gapY: 25.5 }, // gapY disesuaikan dengan CSS flex
        col2: { startX: 375, startY: 488, gapX: 31, gapY: 25.5 }, 
        col3: { startX: 615, startY: 488, gapX: 31, gapY: 25.5 },
        rowsPerCol: 24, // Sama dengan MAX_PER_COL di PrintLjkView
        options: ['A', 'B', 'C', 'D', 'E']
    }
};

export async function processLJK(imageElement: HTMLImageElement): Promise<OMRResult> {
    if (typeof cv === 'undefined') throw new Error("OpenCV belum siap.");

    let src = cv.imread(imageElement);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 1. PERSPECTIVE WARP (Sama seperti V84)
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
        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);
        if (approx.rows === 4 && cv.contourArea(cnt) > 400 && cv.contourArea(cnt) < 15000) {
            let rect = cv.boundingRect(cnt);
            corners.push({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
        }
        approx.delete();
    }

    let warped = new cv.Mat();
    if (corners.length >= 4) {
        corners.sort((a, b) => a.y - b.y);
        let top = corners.slice(0, 2).sort((a, b) => a.x - b.x);
        let bottom = corners.slice(corners.length - 2).sort((a, b) => a.x - b.x);
        let srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [top[0].x, top[0].y, top[1].x, top[1].y, bottom[1].x, bottom[1].y, bottom[0].x, bottom[0].y]);
        let dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, CONFIG.targetPoints);
        let M = cv.getPerspectiveTransform(srcPts, dstPts);
        cv.warpPerspective(gray, warped, M, new cv.Size(CONFIG.targetWidth, CONFIG.targetHeight));
        srcPts.delete(); dstPts.delete(); M.delete();
    } else {
        cv.resize(gray, warped, new cv.Size(CONFIG.targetWidth, CONFIG.targetHeight), 0, 0, cv.INTER_AREA);
    }

    // 2. SCANNING GRID
    let binary = new cv.Mat();
    cv.adaptiveThreshold(warped, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 15, 10);

    const isFilled = (img: any, x: number, y: number) => {
        const radius = 7; // Lebih kecil untuk grid padat
        try {
            let rect = new cv.Rect(Math.round(x - radius), Math.round(y - radius), radius * 2, radius * 2);
            let roi = img.roi(rect);
            let count = cv.countNonZero(roi);
            roi.delete();
            return count > (radius * 2 * radius * 2) * 0.30; // Threshold 30%
        } catch (e) { return false; }
    };

    // Scan NIS
    let nis = "";
    for (let c = 0; c < CONFIG.nis.cols; c++) {
        let d = "?";
        for (let r = 0; r < CONFIG.nis.rows; r++) {
            if (isFilled(binary, CONFIG.nis.startX + (c * CONFIG.nis.gapX), CONFIG.nis.startY + (r * CONFIG.nis.gapY))) { d = String(r); break; }
        }
        nis += d;
    }

    const studentAnswers = [];
    const cols = [CONFIG.answers.col1, CONFIG.answers.col2, CONFIG.answers.col3];
    
    // Scan All Slots in 3 Columns
    let globalIndex = 0;
    cols.forEach(col => {
        for (let r = 0; r < CONFIG.answers.rowsPerCol; r++) {
            let choice = "EMPTY";
            for (let o = 0; o < CONFIG.answers.options.length; o++) {
                if (isFilled(binary, col.startX + (o * col.gapX), col.startY + (r * col.gapY))) {
                    choice = CONFIG.answers.options[o];
                    break;
                }
            }
            // Simpan indeks slot ini. Server Action akan memetakan ini ke No. Soal atau Header
            studentAnswers.push({ questionNum: globalIndex + 1, studentChoice: choice });
            globalIndex++;
        }
    });

    src.delete(); gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete(); warped.delete(); binary.delete();
    return { detectedNis: nis, studentAnswers };
}
