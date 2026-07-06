/**
 * @fileOverview OMR Processor Engine V130 (PERSONALIZED - NO NIS SCAN)
 * Fokus murni pada pemindaian matriks jawaban. Identitas dideteksi via QR oleh AI.
 */

declare const cv: any;

export interface OMRResult {
    detectedNis: string;
    studentAnswers: { questionNum: number; studentChoice: string }[];
}

const OMR_UI_CONFIG = {
    page: { width: 794, height: 1123 },
    matrix: {
        top: 480, // Sinkron dengan V130 (Matrix LJK Baru)
        left: 50,
        rowHeight: 28, 
        colWidth: 230,
        bubbleSize: 19,
        bubbleGapX: 24,
        colGap: 20
    }
};

/**
 * Memproses gambar LJK menjadi matriks jawaban mentah.
 */
export async function processLJK(imageElement: HTMLImageElement): Promise<OMRResult> {
    if (typeof cv === 'undefined') throw new Error("Mesin OpenCV belum siap.");

    let src = cv.imread(imageElement);
    let gray = new cv.Mat();
    let warped = new cv.Mat();
    let binary = new cv.Mat();

    try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // 1. Perspective Correction
        cv.resize(gray, warped, new cv.Size(OMR_UI_CONFIG.page.width, OMR_UI_CONFIG.page.height), 0, 0, cv.INTER_AREA);

        // 2. Binarization
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
                return count > (radius * 2 * radius * 2) * 0.24;
            } catch (e) { return false; }
        };

        // 3. Scan Answers Grid (60 Slots)
        const studentAnswers: { questionNum: number, studentChoice: string }[] = [];
        const rowsPerCol = 20;

        for (let idx = 0; idx < 60; idx++) {
            const colIdx = Math.floor(idx / rowsPerCol);
            const rowIdx = idx % rowsPerCol;

            const startX = OMR_UI_CONFIG.matrix.left + (colIdx * (OMR_UI_CONFIG.matrix.colWidth + OMR_UI_CONFIG.matrix.colGap));
            const startY = OMR_UI_CONFIG.matrix.top + (rowIdx * OMR_UI_CONFIG.matrix.rowHeight);
            
            let choice = "EMPTY";
            for (let o = 0; o < 5; o++) {
                const bubbleX = startX + 32 + (o * OMR_UI_CONFIG.matrix.bubbleGapX) + (OMR_UI_CONFIG.matrix.bubbleSize / 2);
                const bubbleY = startY + (OMR_UI_CONFIG.matrix.bubbleSize / 2) + 3;
                
                if (isFilled(binary, bubbleX, bubbleY)) {
                    choice = String.fromCharCode(65 + o); 
                    break;
                }
            }
            
            studentAnswers.push({ 
                questionNum: idx + 1, 
                studentChoice: choice 
            });
        }

        // NIS deteksi dilewati karena sudah ada di QR Code yang dibaca AI di langkah selanjutnya
        return { detectedNis: "??????", studentAnswers };

    } finally {
        src.delete(); gray.delete(); warped.delete(); binary.delete();
    }
}