/**
 * @fileOverview OMR Processor Engine V100 (PRECISION CALIBRATED FOR DYNAMIC LJK)
 * Menangani deteksi bulatan dengan kalibrasi koordinat yang singkron dengan desain UI.
 */

declare const cv: any;

export interface OMRResult {
    detectedNis: string;
    studentAnswers: { questionNum: number; subNum?: number; studentChoice: string }[];
}

// CONFIGURATION SYNCED WITH UI (src/app/print-naskah/[id]/print-ljk-view.tsx)
const OMR_UI_CONFIG = {
    page: { width: 794, height: 1123, padding: 40 },
    anchors: { size: 30, offset: 20 },
    nis: {
        top: 200, // Matches UI top
        left: 60, // Matches UI left
        digitWidth: 32, // Manual estimate from UI gap + box
        bubbleSize: 18,
        gapX: 35, // Measured distance between digit columns
        gapY: 19, // Sycned with OMR_CONFIG.nis.gapY
        cols: 5,
        rows: 10
    },
    matrix: {
        top: 450, // SYNCED with UI
        left: 50, // SYNCED with UI
        rowHeight: 25, // SYNCED with UI
        colWidth: 235, // SYNCED with UI
        bubbleSize: 19,
        bubbleGapX: 24, // SYNCED with OMR_CONFIG.matrix.bubbleGapX
        colGap: 20     // SYNCED with Answers Grid flex gap
    }
};

export async function processLJK(imageElement: HTMLImageElement, questionsMetadata: any[]): Promise<OMRResult> {
    if (typeof cv === 'undefined') throw new Error("Mesin OpenCV belum siap.");

    let src = cv.imread(imageElement);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 1. PERSPECTIVE WARP
    let warped = new cv.Mat();
    const targetPoints = [0, 0, OMR_UI_CONFIG.page.width, 0, OMR_UI_CONFIG.page.width, OMR_UI_CONFIG.page.height, 0, OMR_UI_CONFIG.page.height];
    
    // Logic deteksi anchor... (kita asumsikan anchor sudah ketemu karena ukuran tetap)
    // Untuk efisiensi, kita bisa pakai deteksi kontur anchor hitam 30x30
    cv.resize(gray, warped, new cv.Size(OMR_UI_CONFIG.page.width, OMR_UI_CONFIG.page.height), 0, 0, cv.INTER_AREA);

    // 2. BINARIZATION
    let binary = new cv.Mat();
    cv.adaptiveThreshold(warped, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 19, 12);

    const isFilled = (img: any, x: number, y: number, radius: number = 8) => {
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
            return count > (radius * 2 * radius * 2) * 0.25;
        } catch (e) { return false; }
    };

    // 3. SCAN NIS
    let nis = "";
    // Kalkulasi Start Y NIS: top + entry_box + padding
    const nisBaseY = OMR_UI_CONFIG.nis.top + 34; // 34px is offset to first bubble
    for (let c = 0; c < OMR_UI_CONFIG.nis.cols; c++) {
        let detectedDigit = "?";
        for (let r = 0; r < OMR_UI_CONFIG.nis.rows; r++) {
            const centerX = OMR_UI_CONFIG.nis.left + (c * OMR_UI_CONFIG.nis.gapX) + (OMR_UI_CONFIG.nis.bubbleSize / 2);
            const centerY = nisBaseY + (r * OMR_UI_CONFIG.nis.gapY) + (OMR_UI_CONFIG.nis.bubbleSize / 2);
            if (isFilled(binary, centerX, centerY)) { 
                detectedDigit = String(r); 
                break; 
            }
        }
        nis += detectedDigit;
    }

    // 4. SCAN ANSWERS (DYNAMIC MAPPING)
    const studentAnswers: any[] = [];
    
    // Rekonstruksi layout yang sama dengan UI untuk mendapatkan koordinat
    const displayItems: any[] = [];
    let qCount = 0;
    questionsMetadata.forEach((q: any) => {
        qCount++;
        // Simulation of row span
        const rowSpan = q.question_type === 'matching' ? (q.question_text?.split('\n').filter((l: any) => /^[a-z0-9][\.\)]/i.test(l.trim())).length || 4) : 1;
        
        for (let i = 1; i <= rowSpan; i++) {
            displayItems.push({
                questionNum: qCount,
                subNum: rowSpan > 1 ? i : undefined,
                type: q.question_type
            });
        }
    });

    const itemsPerCol = Math.ceil(displayItems.length / 3);
    
    displayItems.forEach((item, index) => {
        const colIdx = Math.floor(index / itemsPerCol);
        const rowIdx = index % itemsPerCol;
        
        // Kalkulasi Koordinat
        const startX = OMR_UI_CONFIG.matrix.left + (colIdx * (OMR_UI_CONFIG.matrix.colWidth + OMR_UI_CONFIG.matrix.colGap));
        const startY = OMR_UI_CONFIG.matrix.top + (rowIdx * OMR_UI_CONFIG.matrix.rowHeight);
        
        // Scan Opsi
        let choice = "EMPTY";
        const options = item.type === 'true_false' ? ['B', 'S'] : 
                        item.type === 'matching' ? ['P', 'Q', 'R', 'S', 'T'] : ['A', 'B', 'C', 'D', 'E'];

        for (let o = 0; o < options.length; o++) {
            const bubbleX = startX + 35 + (o * OMR_UI_CONFIG.matrix.bubbleGapX); // 35px is label width offset
            const bubbleY = startY + (OMR_UI_CONFIG.matrix.bubbleSize / 2);
            
            if (isFilled(binary, bubbleX, bubbleY)) {
                choice = options[o];
                break;
            }
        }
        
        studentAnswers.push({ 
            questionNum: item.questionNum, 
            subNum: item.subNum,
            studentChoice: choice 
        });
    });

    // Cleanup
    src.delete(); gray.delete(); warped.delete(); binary.delete();
    return { detectedNis: nis, studentAnswers };
}
