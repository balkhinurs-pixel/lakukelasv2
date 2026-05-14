"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { motion } from "framer-motion";

export default function DigitalClock() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-slate-950 rounded-[2rem] p-8 shadow-2xl border border-white/10"
    >
      {/* Background Glows */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px]" />
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        <motion.div 
          key={time.getSeconds()}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          {format(time, "HH:mm:ss")}
        </motion.div>
        
        <div className="mt-4 flex flex-col items-center">
            <span className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs mb-1">
                Waktu Indonesia Barat
            </span>
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent mb-3" />
            <span className="text-slate-300 text-lg font-medium">
                {format(time, "eeee, dd MMMM yyyy", { locale: id })}
            </span>
        </div>
      </div>
    </motion.div>
  );
}
