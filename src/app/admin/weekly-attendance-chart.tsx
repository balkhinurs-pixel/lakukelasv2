
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
    // Tentukan interval label X-axis agar tidak menumpuk saat data banyak (30/90 hari)
    const interval = data.length > 31 ? 13 : data.length > 10 ? 6 : 0;

    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBerangkat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="tanggal" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                        fontFamily="inherit"
                        fontWeight="bold"
                        interval={interval}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        domain={[0, 'auto']}
                        fontFamily="inherit"
                        fontWeight="bold"
                    />

                    <Tooltip 
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '12px'
                        }}
                        cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                    />

                    {/* Area: Berangkat */}
                    <Area
                        type="monotone"
                        dataKey="berangkat"
                        name="Berangkat"
                        stroke="#10b981"
                        fill="url(#colorBerangkat)"
                        strokeWidth={3}
                        animationDuration={1500}
                        dot={data.length < 31 ? { r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" } : false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />

                    {/* Line: Tidak Absen (Alpha) */}
                    <Line
                        type="monotone"
                        dataKey="tidakAbsen"
                        name="Alpha"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        dot={data.length < 31 ? { r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" } : false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />

                    {/* Line: Izin / Sakit */}
                    <Line
                        type="monotone"
                        dataKey="izinSakit"
                        name="Izin/Sakit"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={data.length < 31 ? { r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" } : false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
