
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
  } from 'recharts';
import { DollarSign, Users, CreditCard } from "lucide-react";


const userGrowthData = [
    { month: 'Jan', users: 150 },
    { month: 'Feb', users: 220 },
    { month: 'Mar', users: 300 },
    { month: 'Apr', users: 450 },
    { month: 'Mei', users: 600 },
    { month: 'Jun', users: 800 },
    { month: 'Jul', users: 1250 },
];

const revenueData = [
    { month: 'Jan', revenue: 1500000 },
    { month: 'Feb', revenue: 2200000 },
    { month: 'Mar', revenue: 3000000 },
    { month: 'Apr', revenue: 4500000 },
    { month: 'Mei', revenue: 6000000 },
    { month: 'Jun', revenue: 8000000 },
    { month: 'Jul', revenue: 12500000 },
]

const subscriptionData = [
    { name: 'Free Tier', value: 677 },
    { name: 'Premium', value: 573 },
];

const COLORS = ['#8884d8', '#82ca9d'];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold font-headline">Analitik Aplikasi</h1>
            <p className="text-muted-foreground">Analisis mendalam tentang pertumbuhan dan performa aplikasi.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">1,250</div>
                    <p className="text-xs text-muted-foreground">+150 dalam 30 hari terakhir</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rp 37.950.000</div>
                    <p className="text-xs text-muted-foreground">Sepanjang waktu</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Langganan Aktif</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">573</div>
                    <p className="text-xs text-muted-foreground">Tingkat konversi 45.8%</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Grafik Pertumbuhan Pengguna</CardTitle>
                    <CardDescription>Jumlah pengguna terdaftar dari waktu ke waktu.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="users" name="Pengguna" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Distribusi Langganan</CardTitle>
                    <CardDescription>Perbandingan jumlah pengguna gratis vs premium.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={subscriptionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={(entry) => `${entry.name} (${entry.value})`}
                            >
                                {subscriptionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
