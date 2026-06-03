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
  
  // Gunakan ref untuk isCapturing agar tidak memicu re-render loop
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

      // Logika Kunci 4 Titik & Auto-Capture
      if (result.found && result.isBrightEnough) {
        stabilityCounter.current += 1;
        const progress = Math.min(100, (stabilityCounter.current / 25) * 100);
        setCaptureProgress(progress);

        if (stabilityCounter.current >= 25) {
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

  // Effect 1: Handle Hardware Stream (Kamera)
  // Hanya berjalan saat 'active' berubah, tidak bergantung pada processFrame
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

  // Effect 2: Handle Detection Loop
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
