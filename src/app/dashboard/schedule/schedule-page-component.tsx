
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, BookOpen } from "lucide-react";
import type { ScheduleItem } from "@/lib/types";
import { formatTime } from "@/lib/utils";

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
    <div className="space-y-8 p-1">
      {/* Enhanced Header Section */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-3xl -z-10" />
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Jadwal Mengajar
                </h1>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-1" />
              </div>
            </div>
            <p className="text-muted-foreground/80 ml-14">
              Jadwal mengajar mingguan Anda yang telah diatur oleh Administrator.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {daysOfWeek.map((day, dayIndex) => (
            (groupedSchedule[day] && groupedSchedule[day].length > 0) ? (
            <Card 
              key={day} 
              className="group bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden"
              style={{
                animationDelay: `${dayIndex * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Card gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    {day}
                  </CardTitle>
                </div>
                <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </CardHeader>
              
              <CardContent className="space-y-3 relative z-10">
                {groupedSchedule[day].map((item, itemIndex) => (
                  <div 
                    key={item.id} 
                    className="group/item relative p-4 rounded-2xl bg-gradient-to-br from-white/80 to-gray-50/50 dark:from-gray-800/80 dark:to-gray-700/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm"
                    style={{
                      animationDelay: `${dayIndex * 100 + itemIndex * 50}ms`,
                      animation: 'slideInLeft 0.5s ease-out forwards'
                    }}
                  >
                    {/* Item gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="font-bold text-gray-900 dark:text-gray-100 group-hover/item:text-blue-700 dark:group-hover/item:text-blue-300 transition-colors duration-300">
                            {item.subject}
                          </p>
                        </div>
                        
                        <div className="space-y-1 ml-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-purple-500 rounded-full" />
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                              {item.class}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover/item:text-foreground transition-colors duration-300">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
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
      
      {/* Enhanced Empty State */}
      {schedule.length === 0 && (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 via-purple-100 to-blue-100 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-blue-950/30 rounded-3xl flex items-center justify-center shadow-lg">
              <Calendar className="w-12 h-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Belum Ada Jadwal
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Saat ini belum ada jadwal mengajar yang diatur untuk Anda. Mohon hubungi Administrator.
            </p>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
