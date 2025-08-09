
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getActivationCodes, getCodeUser } from "@/lib/data";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { GenerateCodeButton } from "./generate-button";


export default async function AdminCodesPage() {
    const codes = await getActivationCodes();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Kelola Kode Aktivasi</h1>
                    <p className="text-muted-foreground">Buat dan pantau penggunaan kode aktivasi akun Pro.</p>
                </div>
                <GenerateCodeButton />
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Daftar Kode</CardTitle>
                    <CardDescription>Total kode yang pernah dibuat: {codes.length}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode Aktivasi</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Digunakan Oleh</TableHead>
                                    <TableHead>Tanggal Digunakan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {codes.map(async (code) => {
                                    const user = code.used_by ? await getCodeUser(code.used_by) : null;
                                    return (
                                        <TableRow key={code.id}>
                                            <TableCell className="font-mono">{code.code}</TableCell>
                                            <TableCell>
                                                <Badge variant={code.is_used ? "secondary" : "default"} className={!code.is_used ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
                                                    {code.is_used ? 'Digunakan' : 'Tersedia'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{user?.email || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {code.used_at ? format(new Date(code.used_at), 'dd MMM yyyy, HH:mm', { locale: id }) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
