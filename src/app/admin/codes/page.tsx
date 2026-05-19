import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyRound, Ticket, Calendar, UserCheck, Smartphone } from 'lucide-react';
import { GenerateCodeButton } from './generate-button';
import { TokenActions } from './token-actions';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default async function AdminCodesPage() {
    const supabase = await createClient();
    
    // Fetch activation tokens with join to profile to see who used it
    const { data: tokens } = await supabase
        .from('activation_tokens')
        .select(`
            *,
            used_by_profile:profiles!activation_tokens_used_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

    // Fetch app url from settings
    const { data: appUrlSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'app_url')
        .maybeSingle();
    
    const appUrl = appUrlSetting?.value || 'https://app.lakukelas.my.id';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline text-slate-900">Token Aktivasi</h1>
                    <p className="text-muted-foreground text-sm">Kelola kode akses unik untuk mengizinkan pendaftaran staf baru.</p>
                </div>
                <GenerateCodeButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokens && tokens.length > 0 ? (
                    tokens.map((token) => (
                        <Card key={token.id} className={token.used_by ? "opacity-60 bg-slate-50 border-dashed border-slate-200" : "border-primary/20 shadow-xl relative overflow-hidden bg-white ring-1 ring-black/5"}>
                            {!token.used_by && (
                                <div className="absolute top-0 right-0 p-2">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                </div>
                            )}
                            <CardContent className="pt-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className={token.used_by ? "p-3 rounded-2xl bg-slate-200 text-slate-500" : "p-3 rounded-2xl bg-primary/10 text-primary"}>
                                        <Ticket className="h-6 w-6" />
                                    </div>
                                    <Badge variant={token.used_by ? "secondary" : "default"} className={token.used_by ? "bg-slate-200 text-slate-600 border-0" : "bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-[10px] tracking-widest px-3 py-1"}>
                                        {token.used_by ? "Sudah Terpakai" : "Siap Digunakan"}
                                    </Badge>
                                </div>
                                
                                <div className={token.used_by ? "text-center py-4 bg-slate-100 rounded-2xl border border-slate-200" : "text-center py-4 bg-slate-50 rounded-2xl border border-slate-100 group relative"}>
                                    <code className={token.used_by ? "text-3xl font-black tracking-[0.2em] text-slate-400 font-mono" : "text-3xl font-black tracking-[0.2em] text-primary font-mono drop-shadow-sm"}>
                                        {token.token}
                                    </code>
                                </div>

                                {!token.used_by && (
                                    <TokenActions token={token.token} appUrl={appUrl} id={token.id} />
                                )}

                                <div className="space-y-2 border-t pt-4 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>Dibuat: {format(new Date(token.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                                    </div>
                                    {token.used_by && (
                                        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100 mt-2">
                                            <UserCheck className="h-3.5 w-3.5" />
                                            <span className="truncate">Digunakan oleh: {token.used_by_profile?.full_name || "Staf Pengajar"}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="col-span-full border-dashed border-2 py-20 flex flex-col items-center justify-center text-center bg-slate-50/50">
                        <div className="p-6 rounded-full bg-slate-100 mb-4 border border-slate-200">
                            <KeyRound className="h-16 w-16 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Belum Ada Token</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Buat token baru untuk memberikan akses kepada guru atau staf lain yang ingin bergabung.</p>
                        <div className="mt-6">
                            <GenerateCodeButton />
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
