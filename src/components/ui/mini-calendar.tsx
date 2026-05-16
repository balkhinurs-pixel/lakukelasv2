"use client";

import * as React from "react";
import {
  format,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DAYS_OF_WEEK = [
  { key: "sun", label: "Min" },
  { key: "mon", label: "Sen" },
  { key: "tue", label: "Sel" },
  { key: "wed", label: "Rab" },
  { key: "thu", label: "Kam" },
  { key: "fri", label: "Jum" },
  { key: "sat", label: "Sab" },
];

export const MiniCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = React.useState<Date>(new Date());

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  });

  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-slate-100 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl hover:bg-slate-50"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="h-4 w-4 text-slate-400" />
        </Button>
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">
          {format(currentWeek, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl hover:bg-slate-50"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center mb-2 px-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day.key}
            className="text-[9px] font-black uppercase tracking-tighter text-slate-300"
          >
            {day.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2 pt-0">
        {weekDays.map((day) => {
          const isSelected =
            format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

          return (
            <Button
              key={day.toString()}
              variant={isSelected ? "default" : "ghost"}
              className={cn(
                "h-9 w-full p-0 font-bold text-xs transition-all duration-300 rounded-xl",
                isSelected 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700" 
                  : "text-slate-600 hover:bg-indigo-50"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <time dateTime={format(day, "yyyy-MM-dd")}>
                {format(day, "d")}
              </time>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
