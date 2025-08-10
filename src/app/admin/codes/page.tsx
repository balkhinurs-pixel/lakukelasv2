
import * as React from 'react';
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
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { GenerateCodeButton } from "./generate-button";
import { getActivationCodes } from "@/lib/data";
import { cn } from '@/lib/utils';
import { KeyRound, CheckCircle, User, Calendar } from 'lucide-react';

function FormattedDate({ dateString }: { dateString: string | null }) {
    if (!dateString) return <>-</>;
    try {
        return <>{format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id })}</>;
    } catch (error) {
        return <>-</>;
    }
}


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
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {codes.map((code) => (
                             <div key={code.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold font-mono text-sm">{code.code}</p>
                                    <Badge variant={code.is_used ? "secondary" : "default"} className={cn("text-xs", !code.is_used ? "bg-green-600 hover:bg-green-700 text-white" : "")}>
                                        {code.is_used ? 'Digunakan' : 'Tersedia'}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-2 border-t pt-3 mt-3">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary"/>
                                        <span>{code.used_by_email || 'Belum Digunakan'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary"/>
                                        <span><FormattedDate dateString={code.used_at} /></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
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
                                {codes.map((code) => {
                                    return (
                                        <TableRow key={code.id}>
                                            <TableCell className="font-mono">{code.code}</TableCell>
                                            <TableCell>
                                                <Badge variant={code.is_used ? "secondary" : "default"} className={!code.is_used ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
                                                    {code.is_used ? 'Digunakan' : 'Tersedia'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{code.used_by_email || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <FormattedDate dateString={code.used_at} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {codes.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            <KeyRound className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium">Belum Ada Kode</h3>
                            <p className="mt-1 text-sm text-gray-500">Buat kode aktivasi baru untuk memulai.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
