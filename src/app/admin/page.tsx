
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, CheckCircle } from "lucide-react";

export default function AdminDashboardPage() {
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
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">
              +20.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akun Teraktivasi (Pro)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">
             Tingkat konversi 45.8%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
