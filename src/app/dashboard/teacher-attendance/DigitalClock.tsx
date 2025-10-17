"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card } from "@/components/ui/card";

export default function DigitalClock() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg text-center">
      <div className="font-mono text-5xl font-bold tracking-widest">
        {format(time, "HH:mm:ss")}
      </div>
      <div className="text-sm text-slate-300 tracking-wide mt-2">
        {format(time, "eeee, dd MMMM yyyy", { locale: id })}
      </div>
    </Card>
  );
}
