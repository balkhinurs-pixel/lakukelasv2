
"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Briefcase,
  Users,
} from "lucide-react";
import { format, addMonths, subMonths, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { id } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const agendaData = {
    '2023-08-02': [
        {
            title: 'Meeting with James Brown',
            time: '8:00 - 8:45 AM (UTC)',
            platform: 'On Google Meet',
            tag: 'MARKETING',
            attendees: [
                'https://placehold.co/40x40.png?text=A',
                'https://placehold.co/40x40.png?text=B',
                'https://placehold.co/40x40.png?text=C',
            ],
            color: 'bg-orange-100/50 border-orange-200'
        },
        {
            title: 'Meeting with Laura Perez',
            time: '9:00 - 9:45 AM (UTC)',
            platform: 'On Zoom',
            tag: 'PRODUCT MANAGER',
            attendees: [
                 'https://placehold.co/40x40.png?text=D',
                 'https://placehold.co/40x40.png?text=E',
                 'https://placehold.co/40x40.png?text=F',
            ],
            color: 'bg-blue-100/50 border-blue-200'
        }
    ]
};

export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date(2023, 7, 1));
  const [selectedDate, setSelectedDate] = React.useState(new Date(2023, 7, 2));

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const eventsForSelectedDate = agendaData[selectedDateString as keyof typeof agendaData] || [];

  return (
    <div className="space-y-6">
      <Card className="p-4 shadow-sm">
        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold font-headline">
            {format(currentMonth, 'MMMM, yyyy', { locale: id })}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Day Selector */}
        <div className="relative">
             <div className="overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-2">
                {daysInMonth.map((day) => (
                    <button
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl w-14 h-20 shrink-0 transition-colors",
                            isSameDay(day, selectedDate)
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-background hover:bg-muted"
                        )}
                        >
                        <span className={cn("text-xs uppercase", isSameDay(day, selectedDate) ? "text-primary-foreground/70" : "text-muted-foreground")}>
                            {format(day, 'E', { locale: id })}
                        </span>
                        <span className="text-xl font-bold mt-1">
                            {format(day, 'dd')}
                        </span>
                    </button>
                ))}
                </div>
            </div>
        </div>
      </Card>
      
      {/* Search and Tabs */}
      <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10"/>
             <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2">
                <SlidersHorizontal className="h-5 w-5" />
            </Button>
        </div>
        
        <Tabs defaultValue="meetings" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0">
                <TabsTrigger value="meetings" className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><CalendarIcon className="mr-2"/> Meetings</TabsTrigger>
                <TabsTrigger value="events" className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><Briefcase className="mr-2"/> Events</TabsTrigger>
                <TabsTrigger value="holidays" className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><Users className="mr-2"/> Holidays</TabsTrigger>
            </TabsList>
            <TabsContent value="meetings" className="mt-6 space-y-4">
               {eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map((event, index) => (
                  <Card key={index} className={cn("p-4 flex flex-col gap-3 shadow-sm", event.color)}>
                     <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">{event.time}</p>
                        </div>
                         <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                     </div>
                     <div className="flex -space-x-2 overflow-hidden">
                        {event.attendees.map((attendee, i) => (
                            <Avatar key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                <AvatarImage src={attendee} alt={`Attendee ${i+1}`} data-ai-hint="person face" />
                                <AvatarFallback>{i+1}</AvatarFallback>
                            </Avatar>
                        ))}
                         <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted">
                            <AvatarFallback>+2</AvatarFallback>
                        </Avatar>
                     </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">{event.platform}</p>
                        <Badge variant="outline" className="bg-background">{event.tag}</Badge>
                     </div>
                  </Card>
                ))
               ) : (
                <div className="text-center text-muted-foreground py-16">
                    <p>Tidak ada agenda untuk tanggal ini.</p>
                </div>
               )}
            </TabsContent>
             <TabsContent value="events" className="mt-6">
                <div className="text-center text-muted-foreground py-16">
                    <p>Fitur Events sedang dalam pengembangan.</p>
                </div>
             </TabsContent>
             <TabsContent value="holidays" className="mt-6">
                 <div className="text-center text-muted-foreground py-16">
                    <p>Fitur Holidays sedang dalam pengembangan.</p>
                </div>
             </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}

