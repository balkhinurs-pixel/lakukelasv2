/**
 * @fileOverview OMR Processor Engine V101 (PRECISION CALIBRATED FOR SIDE-BY-SIDE LAYOUT)
 * Menangani deteksi bulatan dengan kalibrasi koordinat yang singkron dengan desain UI V101.
 */

declare const cv: any;

export interface OMRResult {
    detectedNis: string;
    studentAnswers: { questionNum: number; studentChoice: string }[];
}

// CONFIGURATION SYNCED WITH UI (V101 - 3 Column Rigid + Side Identity)
const OMR_UI_CONFIG = {
    page: { width: 794, height: 1123, padding: 40 },
    nis: {
        top: 212, // Disesuaikan dengan posisi visual NIS yang baru
        left: 80, // Sesuai OMR_CONFIG.nis.left
        digitWidth: 32,
        bubbleSize: 18,
        gapY: 19,
        cols: 5,
        rows: 10
    },
    matrix: {
        top: 450, // Diangkat dari 520 sesuai UI baru
        left: 50,
        rowHeight: 28, // Sesuai UI baru
        colWidth: 235,
        bubbleSize: 19,
        bubbleGapX: 24,
        colGap: 20
    }
};

/**
 * Memproses gambar LJK mentah menjadi data OMR.
 */
export async function processLJK(imageElement: HTMLImageElement): Promise<OMRResult> {
    if (typeof cv === 'undefined') throw new Error("Mesin OpenCV belum siap.");

    let src = cv.imread(imageElement);
    let gray = new cv.Mat();
    let warped = new cv.Mat();
    let binary = new cv.Mat();

    try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // 1. Perspective Correction (Warp to A4 proportions)
        cv.resize(gray, warped, new cv.Size(OMR_UI_CONFIG.page.width, OMR_UI_CONFIG.page.height), 0, 0, cv.INTER_AREA);

        // 2. Binarization (Thresholding)
        cv.adaptiveThreshold(warped, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 19, 12);

        const isFilled = (img: any, x: number, y: number, radius: number = 8.5) => {
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
                // Sensitivitas deteksi: minimal 24% area terisi hitam
                return count > (radius * 2 * radius * 2) * 0.24;
            } catch (e) { return false; }
        };

        // 3. Scan NIS (5 Digits)
        let nis = "";
        const nisStartY = OMR_UI_CONFIG.nis.top; 
        for (let c = 0; c < OMR_UI_CONFIG.nis.cols; c++) {
            let detectedDigit = "?";
            for (let r = 0; r < OMR_UI_CONFIG.nis.rows; r++) {
                const centerX = OMR_UI_CONFIG.nis.left + (c * OMR_UI_CONFIG.nis.digitWidth) + (OMR_UI_CONFIG.nis.bubbleSize / 2);
                const centerY = nisStartY + (r * OMR_UI_CONFIG.nis.gapY) + (OMR_UI_CONFIG.nis.bubbleSize / 2);
                if (isFilled(binary, centerX, centerY)) { 
                    detectedDigit = String(r); 
                    break; 
                }
            }
            nis += detectedDigit;
        }

        // 4. Scan Answers Grid (Rigid 60 Slots - 3 Columns)
        const studentAnswers: { questionNum: number, studentChoice: string }[] = [];
        const rowsPerCol = 20;

        for (let idx = 0; idx < 60; idx++) {
            const colIdx = Math.floor(idx / rowsPerCol);
            const rowIdx = idx % rowsPerCol;

            const startX = OMR_UI_CONFIG.matrix.left + (colIdx * (OMR_UI_CONFIG.matrix.colWidth + OMR_UI_CONFIG.matrix.colGap));
            const startY = OMR_UI_CONFIG.matrix.top + (rowIdx * OMR_UI_CONFIG.matrix.rowHeight);
            
            let choice = "EMPTY";
            // Scan 5 possible bubbles (A-E)
            for (let o = 0; o < 5; o++) {
                const bubbleX = startX + 32 + (o * OMR_UI_CONFIG.matrix.bubbleGapX) + (OMR_UI_CONFIG.matrix.bubbleSize / 2);
                const bubbleY = startY + (OMR_UI_CONFIG.matrix.bubbleSize / 2) + 3;
                
                if (isFilled(binary, bubbleX, bubbleY)) {
                    choice = String.fromCharCode(65 + o); // Convert 0-4 to A-E
                    break;
                }
            }
            
            studentAnswers.push({ 
                questionNum: idx + 1, 
                studentChoice: choice 
            });
        }

        return { detectedNis: nis, studentAnswers };

    } finally {
        src.delete(); gray.delete(); warped.delete(); binary.delete();
    }
}
