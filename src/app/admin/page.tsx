
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
  const { totalUsers } = await getAdminDashboardData();

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
