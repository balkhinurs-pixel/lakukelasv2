
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClientPage from './settings-client-page';
import type { Profile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function SettingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error || !profile) {
        console.error("Error fetching profile for settings page:", error);
        return (
            <div className="space-y-6">
                 <div>
                    <h1 className="text-2xl font-bold font-headline">Pengaturan</h1>
                    <p className="text-muted-foreground">Kelola profil, akun, dan data sekolah Anda.</p>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Gagal Memuat Profil</AlertTitle>
                    <AlertDescription>
                        Tidak dapat memuat data profil Anda saat ini. Silakan coba muat ulang halaman atau hubungi dukungan jika masalah berlanjut.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return <SettingsClientPage user={user} profile={profile as Profile} />;
}
