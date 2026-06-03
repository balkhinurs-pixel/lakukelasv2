"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { detectMarkers, type Point, type DetectionResult } from '@/lib/omr/detector';

export function useOmrScanner(active: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<DetectionResult>({
    found: false,
    corners: null,
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
    if (!videoRef.current || !canvasRef.current || !active || isCapturing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas size match video
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Run Detection
      const result = detectMarkers(canvas);
      setStatus(result);

      if (result.found && result.isBrightEnough) {
        stabilityCounter.current += 1;
        // Progress bar logic (butuh ~1 detik stabil)
        const progress = Math.min(100, (stabilityCounter.current / 30) * 100);
        setCaptureProgress(progress);

        if (stabilityCounter.current >= 30) {
          handleAutoCapture();
        }
      } else {
        stabilityCounter.current = Math.max(0, stabilityCounter.current - 2);
        setCaptureProgress(0);
      }
    }

    requestRef.current = requestAnimationFrame(processFrame);
  }, [active, isCapturing]);

  const handleAutoCapture = () => {
    if (!canvasRef.current) return;
    setIsCapturing(true);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    // Feedback haptic if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  useEffect(() => {
    if (active) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      .then(s => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        requestRef.current = requestAnimationFrame(processFrame);
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        setStatus(prev => ({ ...prev, message: "Kamera Ditolak" }));
      });
    } else {
      stopStream();
    }

    return () => stopStream();
  }, [active, processFrame, stopStream]);

  return {
    videoRef,
    canvasRef,
    status,
    captureProgress,
    capturedImage,
    resetScanner: () => {
      setCapturedImage(null);
      setIsCapturing(false);
      stabilityCounter.current = 0;
      setCaptureProgress(0);
    },
    stopStream
  };
}
