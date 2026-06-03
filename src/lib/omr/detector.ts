/**
 * @fileOverview OMR Live Detector Logic (V100)
 * Uses OpenCV to find 4 anchor markers in real-time.
 */

declare const cv: any;

export interface Point {
  x: number;
  y: number;
}

export interface DetectionResult {
  found: boolean;
  corners: (Point | null)[]; // [TL, TR, BR, BL]
  message: string;
  isStable: boolean;
  isBrightEnough: boolean;
  error?: string;
}

/**
 * Mendeteksi 4 marker kotak di pojok LJK.
 * Memastikan urutan: Top-Left, Top-Right, Bottom-Right, Bottom-Left.
 */
export function detectMarkers(canvas: HTMLCanvasElement): DetectionResult {
  if (typeof cv === 'undefined' || !cv.Mat) {
    return { found: false, corners: [null, null, null, null], message: "Memuat Mesin...", isStable: false, isBrightEnough: false };
  }

  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  let blurred = new cv.Mat();
  let thresh = new cv.Mat();
  let contours = new cv.TypedVector(cv.Mat);
  let hierarchy = new cv.Mat();

  try {
    // 1. Preprocessing
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Cek Kecerahan
    let mean = cv.mean(gray)[0];
    const isBrightEnough = mean > 50; 

    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

    // 2. Find Contours
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let markers: Point[] = [];
    const minArea = (canvas.width * canvas.height) * 0.0003; 

    for (let i = 0; i < contours.size(); ++i) {
      let cnt = contours.get(i);
      let area = cv.contourArea(cnt);
      let peri = cv.arcLength(cnt, true);
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      // Cari kotak (4 sudut)
      if (approx.rows === 4 && area > minArea) {
        let rect = cv.boundingRect(approx);
        let aspectRatio = rect.width / rect.height;
        
        if (aspectRatio > 0.7 && aspectRatio < 1.3) {
          markers.push({
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
          });
        }
      }
      approx.delete();
    }

    // 3. Map to 4 Corners
    const resultCorners: (Point | null)[] = [null, null, null, null];
    if (markers.length >= 4) {
      // Sort by Y to separate Top and Bottom
      markers.sort((a, b) => a.y - b.y);
      let top = markers.slice(0, 2).sort((a, b) => a.x - b.x);
      let bottom = markers.slice(markers.length - 2).sort((a, b) => b.x - a.x);
      
      resultCorners[0] = top[0]; // TL
      resultCorners[1] = top[1]; // TR
      resultCorners[2] = bottom[0]; // BR
      resultCorners[3] = bottom[1]; // BL
    }

    const foundAll = resultCorners.every(c => c !== null);

    return {
      found: foundAll,
      corners: resultCorners,
      message: foundAll ? (isBrightEnough ? "Posisi Terkunci..." : "Kurang Cahaya") : "Arahkan ke Target",
      isStable: foundAll,
      isBrightEnough
    };

  } catch (e: any) {
    return { found: false, corners: [null, null, null, null], message: "Error", isStable: false, isBrightEnough: false, error: e.message };
  } finally {
    src.delete(); gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
  }
}
