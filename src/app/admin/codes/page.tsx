import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyRound, Ticket, Trash2, Calendar, User, UserCheck } from 'lucide-react';
import { GenerateCodeButton } from './generate-button';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default async function AdminCodesPage() {
    const supabase = createClient();
    
    // Fetch activation tokens
    const { data: tokens } = await supabase
        .from('activation_tokens')
        .select('*, profiles:used_by(full_name)')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Token Aktivasi</h1>
                    <p className="text-muted-foreground">Kelola token untuk mengizinkan pengguna baru mengakses sistem.</p>
                </div>
                <GenerateCodeButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tokens && tokens.length > 0 ? (
                    tokens.map((token) => (
                        <Card key={token.id} className={token.used_by ? "opacity-60 bg-slate-50" : "border-primary/20 shadow-lg"}>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Ticket className="h-5 w-5" />
                                    </div>
                                    <Badge variant={token.used_by ? "secondary" : "default"} className="font-bold">
                                        {token.used_by ? "Terpakai" : "Tersedia"}
                                    </Badge>
                                </div>
                                
                                <div className="text-center py-2">
                                    <code className="text-3xl font-black tracking-widest text-primary font-mono">
                                        {token.token}
                                    </code>
                                </div>

                                <div className="space-y-2 border-t pt-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        <span>Dibuat: {format(new Date(token.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                                    </div>
                                    {token.used_by && (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <UserCheck className="h-3 w-3" />
                                            <span>Oleh: {token.profiles?.full_name || "Seseorang"}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <KeyRound className="mx-auto h-12 w-12 opacity-20 mb-4" />
                            <h3 className="text-sm font-medium">Belum Ada Token</h3>
                            <p className="text-xs">Klik tombol "Buat Token Baru" untuk memulai.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
