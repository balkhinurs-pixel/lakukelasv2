/**
 * @fileOverview OMR Processor Engine V93.0 (PRECISION CALIBRATED FOR V92.0 RIGID GRID)
 * Menangani deteksi bulatan pada tata letak kaku 3-kolom dengan tinggi baris tetap 32px.
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
        startX: 578,
        // KALIBRASI V93: top:120px + title_area:23px + half_circle:8px = 151
        startY: 151, 
        gapX: 28,
        gapY: 18.2, 
        rows: 10,
        cols: 5
    },
    answers: {
        // KALIBRASI V93: MatrixTop:360px + padding:32px + title_area:36px + half_row:16px - small_nudge:2px = 442
        col1: { startX: 128, startY: 442, gapX: 30.5, gapY: 32 }, 
        col2: { startX: 374, startY: 442, gapX: 30.5, gapY: 32 }, 
        col3: { startX: 622, startY: 442, gapX: 30.5, gapY: 32 },
        rowsPerCol: 20,
        options: ['A', 'B', 'C', 'D', 'E']
    }
};

export async function processLJK(imageElement: HTMLImageElement): Promise<OMRResult> {
    if (typeof cv === 'undefined') throw new Error("Mesin OpenCV belum siap.");

    let src = cv.imread(imageElement);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 1. PERSPECTIVE WARP (Meluruskan Foto berdasarkan Anchor 4 Titik)
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
        // Deteksi kotak anchor hitam di pojok
        if (approx.rows === 4 && cv.contourArea(cnt) > 300 && cv.contourArea(cnt) < 15000) {
            let rect = cv.boundingRect(cnt);
            corners.push({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
        }
        approx.delete();
    }

    let warped = new cv.Mat();
    if (corners.length >= 4) {
        // Sortir titik: top-left, top-right, bottom-right, bottom-left
        corners.sort((a, b) => a.y - b.y);
        let top = corners.slice(0, 2).sort((a, b) => a.x - b.x);
        let bottom = corners.slice(corners.length - 2).sort((a, b) => a.x - b.x);
        let srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [top[0].x, top[0].y, top[1].x, top[1].y, bottom[1].x, bottom[1].y, bottom[0].x, bottom[0].y]);
        let dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, CONFIG.targetPoints);
        let M = cv.getPerspectiveTransform(srcPts, dstPts);
        cv.warpPerspective(gray, warped, M, new cv.Size(CONFIG.targetWidth, CONFIG.targetHeight));
        srcPts.delete(); dstPts.delete(); M.delete();
    } else {
        // Fallback jika anchor tidak ketemu: resize paksa (kurang akurat)
        cv.resize(gray, warped, new cv.Size(CONFIG.targetWidth, CONFIG.targetHeight), 0, 0, cv.INTER_AREA);
    }

    // 2. SCANNING GRID DENGAN PRE-PROCESSING KUAT
    let binary = new cv.Mat();
    // Threshold lebih tebal untuk deteksi pulpen/pensil tipis
    cv.adaptiveThreshold(warped, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 19, 12);

    const isFilled = (img: any, x: number, y: number) => {
        const radius = 8.5; // Radius sensor lebih besar (V93)
        try {
            let rect = new cv.Rect(
                Math.round(x - radius), 
                Math.round(y - radius), 
                Math.round(radius * 2), 
                Math.round(radius * 2)
            );
            let roi = img.roi(rect);
            let count = cv.countNonZero(roi);
            roi.delete();
            // Threshold 24%: Lebih sensitif terhadap isian siswa (V93)
            return count > (radius * 2 * radius * 2) * 0.24;
        } catch (e) { return false; }
    };

    // Scan NIS
    let nis = "";
    for (let c = 0; c < CONFIG.nis.cols; c++) {
        let detectedDigit = "?";
        for (let r = 0; r < CONFIG.nis.rows; r++) {
            if (isFilled(binary, CONFIG.nis.startX + (c * CONFIG.nis.gapX), CONFIG.nis.startY + (r * CONFIG.nis.gapY))) { 
                detectedDigit = String(r); 
                break; 
            }
        }
        nis += detectedDigit;
    }

    const studentAnswers = [];
    const cols = [CONFIG.answers.col1, CONFIG.answers.col2, CONFIG.answers.col3];
    
    // Scan Total 60 Slot (20 baris x 3 kolom kaku)
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
            studentAnswers.push({ questionNum: globalIndex + 1, studentChoice: choice });
            globalIndex++;
        }
    });

    src.delete(); gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete(); warped.delete(); binary.delete();
    return { detectedNis: nis, studentAnswers };
}
