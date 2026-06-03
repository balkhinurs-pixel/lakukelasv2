"use client";

import * as React from "react";
import { useOmrScanner } from "@/hooks/use-omr-scanner";
import { cn } from "@/lib/utils";
import { X, Camera, Sun, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 2. Scanning UI Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-6">
        
        {/* Top Navigation */}
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

        {/* The Frame / Target Area */}
        <div className="relative w-full max-w-sm aspect-[3/4.2] flex items-center justify-center">
            {/* 4 Corner Target Boxes (Visual Guidelines) */}
            {/* Top Left */}
            <div className={cn(
                "absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 rounded-tl-[1.5rem] transition-all duration-300",
                status.corners[0] ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "border-white/30"
            )} />
            {/* Top Right */}
            <div className={cn(
                "absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 rounded-tr-[1.5rem] transition-all duration-300",
                status.corners[1] ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "border-white/30"
            )} />
            {/* Bottom Right */}
            <div className={cn(
                "absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 rounded-br-[1.5rem] transition-all duration-300",
                status.corners[2] ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "border-white/30"
            )} />
            {/* Bottom Left */}
            <div className={cn(
                "absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 rounded-bl-[1.5rem] transition-all duration-300",
                status.corners[3] ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "border-white/30"
            )} />

            {/* Scanning Laser Animation */}
            <motion.div 
                animate={{ top: ['2%', '98%', '2%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-6 right-6 h-0.5 bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,1)] z-10 opacity-50"
            />

            {/* Central Progress Circle */}
            <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-white/10"
                    />
                    <motion.circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={238}
                        initial={{ strokeDashoffset: 238 }}
                        animate={{ strokeDashoffset: 238 - (238 * captureProgress) / 100 }}
                        className={cn(
                            "transition-all duration-100",
                            status.found ? "text-emerald-500" : "text-white/40"
                        )}
                    />
                </svg>
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-500",
                    status.found ? "scale-110" : "scale-100"
                )}>
                    <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
                        status.found ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40 backdrop-blur-sm"
                    )}>
                        {status.found ? <CheckCircle2 className="h-8 w-8" /> : <Camera className="h-7 w-7" />}
                    </div>
                </div>
            </div>
        </div>

        {/* Status Messaging */}
        <div className="w-full max-w-sm mb-12 space-y-6">
            <div className="text-center space-y-2">
                <p className={cn(
                    "text-xl font-black uppercase tracking-tight transition-colors",
                    status.found ? "text-emerald-400" : "text-white/70"
                )}>
                    {status.message}
                </p>
                {!status.isBrightEnough && (
                    <motion.p 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                       <Sun className="h-3.5 w-3.5" /> Ruangan Terlalu Gelap
                    </motion.p>
                )}
            </div>

            <div className="flex justify-center">
                <Button 
                    variant="outline" 
                    className="rounded-2xl border-white/20 text-white bg-white/5 h-14 px-10 font-black uppercase tracking-widest backdrop-blur-md active:scale-95"
                    onClick={onClose}
                >
                    Batalkan Scan
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
