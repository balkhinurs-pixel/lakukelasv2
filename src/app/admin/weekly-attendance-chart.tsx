
'use client';

import * as React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type WeeklyAttendanceChartProps = {
    data: {
        day: string;
        tanggal: string;
        berangkat: number;
        tidakAbsen: number;
        izinSakit: number;
    }[];
};

export default function WeeklyAttendanceChart({ data }: WeeklyAttendanceChartProps) {
    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                    <defs>
                        <linearGradient id="colorBerangkat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                        dataKey="tanggal" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />

                    <Tooltip 
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '12px'
                        }}
                        itemStyle={{ padding: '2px 0' }}
                    />

                    {/* Area untuk Kehadiran Utama (Hadir) */}
                    <Area
                        type="monotone"
                        dataKey="berangkat"
                        name="Hadir"
                        stroke="#10b981"
                        fill="url(#colorBerangkat)"
                        strokeWidth={4}
                        animationDuration={1500}
                    />

                    {/* Line untuk Perbandingan: Tanpa Keterangan */}
                    <Line
                        type="monotone"
                        dataKey="tidakAbsen"
                        name="Alpha"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />

                    {/* Line untuk Perbandingan: Izin / Sakit */}
                    <Line
                        type="monotone"
                        dataKey="izinSakit"
                        name="Izin/Sakit"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
