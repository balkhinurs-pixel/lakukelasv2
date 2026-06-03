"use client";

import * as React from "react";
import { useOmrScanner } from "@/hooks/use-omr-scanner";
import { cn } from "@/lib/utils";
import { X, Camera, Zap, Sun, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface OmrScannerViewProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function OmrScannerView({ onCapture, onClose, isOpen }: OmrScannerViewProps) {
  const { videoRef, canvasRef, status, captureProgress, capturedImage, resetScanner } = useOmrScanner(isOpen);

  React.useEffect(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* 1. Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      {/* 2. Processing Canvas (Hidden or Debug) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 3. Overlay & Guidelines */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-6">
        
        {/* Top UI */}
        <div className="w-full flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full h-12 w-12">
            <X className="h-6 w-6" />
          </Button>
          <div className="flex flex-col items-center gap-1">
             <Badge className="bg-indigo-600 text-white border-0 px-3 py-1 font-black uppercase text-[10px] tracking-widest shadow-lg animate-pulse">
                Live OMR Scanner
             </Badge>
          </div>
          <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Scanner Frame */}
        <div className="relative w-full max-w-sm aspect-[3/4] border-2 border-white/20 rounded-[2rem] flex items-center justify-center">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-[2rem]" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-[2rem]" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-[2rem]" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-[2rem]" />

            {/* Scanning Laser Line */}
            <motion.div 
                animate={{ top: ['5%', '95%', '5%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-4 right-4 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-20 rounded-full"
            />

            {/* Center Feedback */}
            <div className="text-center space-y-4 px-6 relative z-30">
                <div className={cn(
                    "mx-auto w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500",
                    status.found ? "bg-emerald-500 text-white rotate-0" : "bg-white/10 text-white/40 rotate-45"
                )}>
                    {status.found ? <CheckCircle2 className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
                </div>
                <div className="space-y-1">
                    <p className={cn(
                        "text-lg font-black uppercase tracking-tight",
                        status.found ? "text-white" : "text-white/60"
                    )}>
                        {status.message}
                    </p>
                    {!status.isBrightEnough && (
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                           <Sun className="h-3 w-3" /> Cari Tempat Terang
                        </p>
                    )}
                </div>
            </div>

            {/* Corner Markers Visual (Debug Only if needed) */}
            {status.corners?.map((p, i) => (
                <div key={i} className="absolute w-4 h-4 bg-emerald-500/50 rounded-full border border-white" style={{ left: `${(p.x / canvasRef.current!.width) * 100}%`, top: `${(p.y / canvasRef.current!.height) * 100}%` }} />
            ))}
        </div>

        {/* Bottom Actions & Progress */}
        <div className="w-full max-w-sm space-y-8">
            <AnimatePresence>
                {captureProgress > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Memotret Otomatis...</span>
                            <span className="text-[10px] font-black text-white">{Math.round(captureProgress)}%</span>
                        </div>
                        <Progress value={captureProgress} className="h-2 bg-white/10" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-4">
                <Button 
                    variant="outline" 
                    className="rounded-2xl border-white/20 text-white bg-white/5 h-14 px-8 font-bold"
                    onClick={onClose}
                >
                    Batalkan
                </Button>
            </div>
        </div>
      </div>

      <style jsx global>{`
        .lucide-badge {
            display: inline-flex;
            align-items: center;
            border-radius: 9999px;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
        }
      `}</style>
    </div>
  );
}

function Badge({ children, className }: any) {
    return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>{children}</div>
}
