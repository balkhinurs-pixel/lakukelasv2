'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
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
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        {/* Gradient Hijau - Berangkat */}
                        <linearGradient id="colorBerangkat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        {/* Gradient Merah - Alpha */}
                        <linearGradient id="colorAlpha" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        {/* Gradient Oranye - Izin/Sakit */}
                        <linearGradient id="colorIzinSakit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="tanggal" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10}
                        fontFamily="inherit"
                        fontWeight="600"
                        interval={interval}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        domain={[0, 'auto']}
                        fontFamily="inherit"
                        fontWeight="600"
                    />

                    <Tooltip 
                        contentStyle={{
                            borderRadius: '20px',
                            border: 'none',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '12px'
                        }}
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                    />

                    {/* Area: Berangkat (Hijau) - Minimalist Line */}
                    <Area
                        type="monotone"
                        dataKey="berangkat"
                        name="Berangkat"
                        stroke="#10b981"
                        fill="url(#colorBerangkat)"
                        strokeWidth={2}
                        animationDuration={1500}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
                    />

                    {/* Area: Tidak Absen (Alpha - Merah) - Minimalist Line */}
                    <Area
                        type="monotone"
                        dataKey="tidakAbsen"
                        name="Alpha"
                        stroke="#ef4444"
                        fill="url(#colorAlpha)"
                        strokeWidth={2}
                        animationDuration={1500}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
                    />

                    {/* Area: Izin / Sakit (Oranye) - Minimalist Line */}
                    <Area
                        type="monotone"
                        dataKey="izinSakit"
                        name="Izin/Sakit"
                        stroke="#f59e0b"
                        fill="url(#colorIzinSakit)"
                        strokeWidth={2}
                        animationDuration={1500}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#f59e0b' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
