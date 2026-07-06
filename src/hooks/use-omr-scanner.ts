"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { detectMarkers, type DetectionResult } from '@/lib/omr/detector';

export function useOmrScanner(active: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<DetectionResult>({
    found: false,
    corners: [null, null, null, null],
    message: "Memulai Kamera...",
    isStable: false,
    isBrightEnough: false
  });
  
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stabilityCounter = useRef(0);
  const requestRef = useRef<number>(null);
  
  const isCapturingRef = useRef(false);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, [stream]);

  // Fungsi untuk pengambilan manual (Manual Snap)
  const manualCapture = useCallback(() => {
    if (!canvasRef.current || isCapturingRef.current) return;
    
    isCapturingRef.current = true;
    setIsCapturing(true);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }
  }, []);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !active || isCapturingRef.current) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const result = detectMarkers(canvas);
      setStatus(result);

      // Logika Kunci 4 Titik & Auto-Capture (Dipercepat dari 25 ke 12 frame)
      if (result.found && result.isBrightEnough) {
        stabilityCounter.current += 1;
        const progress = Math.min(100, (stabilityCounter.current / 12) * 100);
        setCaptureProgress(progress);

        if (stabilityCounter.current >= 12) {
          isCapturingRef.current = true;
          setIsCapturing(true);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedImage(dataUrl);
          
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
        }
      } else {
        stabilityCounter.current = Math.max(0, stabilityCounter.current - 1.5);
        setCaptureProgress(0);
      }
    }

    requestRef.current = requestAnimationFrame(processFrame);
  }, [active]);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (active) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 960 }
        } 
      })
      .then(s => {
        currentStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        setStatus(prev => ({ ...prev, message: "Akses Kamera Ditolak" }));
      });
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [active]);

  useEffect(() => {
    if (active) {
      requestRef.current = requestAnimationFrame(processFrame);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [active, processFrame]);

  return {
    videoRef,
    canvasRef,
    status,
    captureProgress,
    capturedImage,
    manualCapture,
    resetScanner: () => {
      setCapturedImage(null);
      setIsCapturing(false);
      isCapturingRef.current = false;
      stabilityCounter.current = 0;
      setCaptureProgress(0);
    },
    stopStream
  };
}
