
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, BookOpen } from "lucide-react";
import type { ScheduleItem } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";

const daysOfWeek: ScheduleItem['day'][] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function SchedulePageComponent({
    initialSchedule,
} : {
    initialSchedule: ScheduleItem[],
}) {
    const [schedule, setSchedule] = React.useState<ScheduleItem[]>(initialSchedule);

    React.useEffect(() => {
        setSchedule(initialSchedule);
    }, [initialSchedule]);

    const groupedSchedule = schedule.reduce((acc, item) => {
        (acc[item.day] = acc[item.day] || []).push(item);
        return acc;
      }, {} as Record<ScheduleItem['day'], ScheduleItem[]>);
    
    for (const day in groupedSchedule) {
        groupedSchedule[day as ScheduleItem['day']].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

  return (
    <div className="space-y-6 p-1">
      <HandWrittenTitle 
        title="Jadwal Mengajar" 
        subtitle="Guru"
        className="py-4 md:py-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {daysOfWeek.map((day) => (
            (groupedSchedule[day] && groupedSchedule[day].length > 0) ? (
            <Card 
              key={day} 
              className="bg-white dark:bg-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                  <CardTitle className="text-xl font-bold">{day}</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {groupedSchedule[day].map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 hover:border-blue-300 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {item.subject}
                          </p>
                        </div>
                        
                        <div className="space-y-1 ml-6">
                          <p className="text-sm font-medium text-purple-700 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full inline-block border border-purple-100">
                            {item.class}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null
        ))}
      </div>
      
      {schedule.length === 0 && (
        <div className="text-center py-20 opacity-50">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-sm font-medium">Belum ada jadwal mengajar</p>
        </div>
      )}
    </div>
  );
}
