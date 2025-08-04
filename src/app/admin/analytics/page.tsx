
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold font-headline">Analitik</h1>
            <p className="text-muted-foreground">Analisis mendalam tentang penggunaan aplikasi.</p>
        </div>
         <Card>
            <CardHeader>
                <CardTitle>Grafik Pertumbuhan</CardTitle>
                <CardDescription>Placeholder untuk grafik dan data analitik.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Fitur analitik lebih lanjut akan tersedia di sini.</p>
            </CardContent>
        </Card>
    </div>
  );
}
