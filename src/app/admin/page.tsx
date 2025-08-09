
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, CheckCircle } from "lucide-react";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminDashboardPage() {
  const { totalUsers, proUsers } = await getAdminDashboardData();
  const conversionRate = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold font-headline">Dasbor Admin</h1>
            <p className="text-muted-foreground">Ringkasan umum aplikasi Lakukelas.</p>
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengguna (Guru)
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            {/* <p className="text-xs text-muted-foreground">
              +20.1% dari bulan lalu
            </p> */}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akun Teraktivasi (Pro)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proUsers}</div>
            <p className="text-xs text-muted-foreground">
             Tingkat konversi {conversionRate}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
