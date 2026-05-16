"use client";

import * as React from "react";
import {
  format,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Holiday } from "@/lib/types";

const DAYS_OF_WEEK = [
  { key: "mon", label: "Sen" },
  { key: "tue", label: "Sel" },
  { key: "wed", label: "Rab" },
  { key: "thu", label: "Kam" },
  { key: "fri", label: "Jum" },
  { key: "sat", label: "Sab" },
  { key: "sun", label: "Min" },
];

interface MiniCalendarProps {
    holidays?: Holiday[];
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({ holidays = [] }) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = React.useState<Date>(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: weekEnd,
  });

  // Ambil daftar libur yang ada di minggu yang sedang ditampilkan
  const holidaysInWeek = React.useMemo(() => {
    return holidays.filter(h => {
        const hDate = new Date(h.date);
        return hDate >= weekStart && hDate <= weekEnd;
    });
  }, [holidays, weekStart, weekEnd]);

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {format(currentWeek, "MMMM yyyy", { locale: id })}
        </h2>
        <div className="flex gap-1">
          <button
            className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="h-4 w-4 text-slate-400" />
          </button>
          <button
            className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day.key}
            className="text-[10px] font-black text-center uppercase tracking-tighter text-slate-300"
          >
            {day.label}
          </div>
        ))}
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selectedDate);
          const holiday = holidays.find(h => h.date === dateStr);
          const isSunday = day.getDay() === 0;

          return (
            <div key={day.toString()} className="relative flex flex-col items-center">
                <button
                    className={cn(
                        "aspect-square h-auto w-full p-0 font-black text-xs transition-all duration-300 rounded-xl relative z-10 flex items-center justify-center",
                        isSelected 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105" 
                        : cn(
                            "text-slate-600 hover:bg-indigo-50",
                            holiday?.type === 'national' || isSunday ? "text-rose-500" : 
                            holiday?.type === 'school' ? "text-indigo-500" : ""
                        )
                    )}
                    onClick={() => setSelectedDate(day)}
                >
                    <time dateTime={dateStr}>
                        {format(day, "d")}
                    </time>
                </button>
                {holiday && (
                    <div className={cn(
                        "absolute -bottom-1 w-1 h-1 rounded-full",
                        isSelected ? "bg-white" : (holiday.type === 'national' ? "bg-rose-500" : "bg-indigo-500")
                    )} />
                )}
            </div>
          );
        })}
      </div>

      {/* Deskripsi Libur - Tanpa Icon, Pastel Style */}
      {holidaysInWeek.length > 0 && (
          <div className="mt-4 space-y-2 pt-4 border-t border-slate-50">
              {holidaysInWeek.map((h, i) => (
                  <div 
                    key={i} 
                    className={cn(
                        "px-3 py-2 rounded-xl text-[10px] font-bold leading-tight",
                        h.type === 'national' 
                            ? "bg-rose-50 text-rose-600 border border-rose-100/50" 
                            : "bg-indigo-50 text-indigo-600 border border-indigo-100/50"
                    )}
                  >
                      <span className="opacity-60 mr-1.5">{format(new Date(h.date), "dd/MM")}:</span>
                      {h.description}
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};
