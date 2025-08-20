
'use client';

import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts";

type WeeklyAttendanceChartProps = {
    data: {
        day: string;
        hadir: number;
        tidak_hadir: number;
    }[];
};

export default function WeeklyAttendanceChart({ data }: WeeklyAttendanceChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: '0.5rem',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--background))'
                    }}
                />
                <Bar dataKey="hadir" name="Hadir" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
