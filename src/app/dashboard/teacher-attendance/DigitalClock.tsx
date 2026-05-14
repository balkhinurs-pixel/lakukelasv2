"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { motion } from "framer-motion";

export default function DigitalClock() {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    // Set initial time only on client mount
    setTime(new Date());
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  // Prevent hydration mismatch by not rendering time on server
  if (!time) return <div className="h-[72px]" />;

  return (
    <div className="flex flex-col items-center justify-center text-white">
        <motion.div 
          key={time.getSeconds()}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono text-6xl md:text-7xl font-black tracking-tight drop-shadow-md"
        >
          {format(time, "HH:mm:ss")}
        </motion.div>
        
        <div className="mt-2 flex flex-col items-center opacity-90">
            <span className="text-sm font-medium tracking-wide">
                Hari ini : {format(time, "eeee, d MMMM yyyy", { locale: id })}
            </span>
        </div>
    </div>
  );
}
