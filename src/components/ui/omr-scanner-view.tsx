"use client";

import * as React from "react";
import { useOmrScanner } from "@/hooks/use-omr-scanner";
import { cn } from "@/lib/utils";
import { X, Camera, Sun, CheckCircle2, Zap, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface OmrScannerViewProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function OmrScannerView({ onCapture, onClose, isOpen }: OmrScannerViewProps) {
  const { videoRef, canvasRef, status, captureProgress, capturedImage } = useOmrScanner(isOpen);

  React.useEffect(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* 1. Live Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 2. Scanning UI Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-6">
        
        {/* Top Navigation & Status */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full h-12 w-12 backdrop-blur-md">
              <X className="h-6 w-6" />
            </Button>
            <div className="flex flex-col items-center">
               <div className="bg-indigo-600/90 backdrop-blur-md text-white border-0 px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2">
                  <Zap className="h-3 w-3 fill-current" />
                  Live AI Scanner
               </div>
            </div>
            <div className="w-12" />
          </div>
          
          <div className="flex items-center gap-2 text-indigo-400 font-black text-sm uppercase tracking-[0.3em] animate-pulse">
            <ArrowUp className="w-4 h-4" />
            <span>Bagian Atas</span>
          </div>
        </div>

        {/* The Frame / Target Area */}
        <div className="relative w-full max-w-sm aspect-[3/4.2] flex items-center justify-center">
            {/* 4 Square Target Boxes (Strict Visual Guidelines) */}
            {/* Top Left */}
            <div className={cn(
                "absolute top-0 left-0 w-16 h-16 border-2 transition-all duration-300 rounded-xl",
                status.corners[0] 
                    ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-110" 
                    : "border-indigo-600 bg-indigo-600/5 shadow-inner"
            )} />
            
            {/* Top Right */}
            <div className={cn(
                "absolute top-0 right-0 w-16 h-16 border-2 transition-all duration-300 rounded-xl",
                status.corners[1] 
                    ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-110" 
                    : "border-indigo-600 bg-indigo-600/5 shadow-inner"
            )} />
            
            {/* Bottom Right */}
            <div className={cn(
                "absolute bottom-0 right-0 w-16 h-16 border-2 transition-all duration-300 rounded-xl",
                status.corners[2] 
                    ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-110" 
                    : "border-indigo-600 bg-indigo-600/5 shadow-inner"
            )} />
            
            {/* Bottom Left */}
            <div className={cn(
                "absolute bottom-0 left-0 w-16 h-16 border-2 transition-all duration-300 rounded-xl",
                status.corners[3] 
                    ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-110" 
                    : "border-indigo-600 bg-indigo-600/5 shadow-inner"
            )} />

            {/* Scanning Laser Animation */}
            <motion.div 
                animate={{ top: ['2%', '98%', '2%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-10 right-10 h-0.5 bg-indigo-400/30 shadow-[0_0_15px_rgba(129,140,248,0.8)] z-10"
            />

            {/* Central Progress Ring (Reference Style) */}
            <div className="relative flex items-center justify-center z-20">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-white/20"
                    />
                    <motion.circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={264}
                        initial={{ strokeDashoffset: 264 }}
                        animate={{ strokeDashoffset: 264 - (264 * captureProgress) / 100 }}
                        className={cn(
                            "transition-all duration-100",
                            status.found ? "text-emerald-500" : "text-indigo-500"
                        )}
                        strokeLinecap="round"
                    />
                </svg>
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-500",
                    status.found ? "scale-110" : "scale-100"
                )}>
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl",
                        status.found ? "bg-emerald-500 text-white" : "bg-white text-indigo-600"
                    )}>
                        {status.found ? (
                            <CheckCircle2 className="h-9 w-9 animate-in zoom-in-50" />
                        ) : (
                            <div className="w-12 h-12 rounded-full border-4 border-indigo-100 bg-white" />
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Status Messaging */}
        <div className="w-full max-w-sm mb-12 space-y-6">
            <div className="text-center space-y-2">
                <p className={cn(
                    "text-xl font-black uppercase tracking-tight transition-colors drop-shadow-md",
                    status.found ? "text-emerald-400" : "text-white"
                )}>
                    {status.message}
                </p>
                {!status.isBrightEnough && (
                    <motion.p 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm"
                    >
                       <Sun className="h-3.5 w-3.5" /> Ruangan Terlalu Gelap
                    </motion.p>
                )}
            </div>

            <div className="flex justify-center">
                <Button 
                    variant="outline" 
                    className="rounded-2xl border-white/30 text-white bg-white/10 h-14 px-10 font-black uppercase tracking-widest backdrop-blur-md active:scale-95 hover:bg-white/20 transition-all"
                    onClick={onClose}
                >
                    Batalkan
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
