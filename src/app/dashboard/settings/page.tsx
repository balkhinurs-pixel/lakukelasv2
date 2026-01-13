

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClientPage from './settings-client-page';
import type { Profile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getUserProfile } from '@/lib/data';

export default async function SettingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const userProfile = await getUserProfile();
    
    if (!userProfile) {
        // This case should be rare, but as a fallback, we can show an error.
        return (
             <div className="space-y-6">
                 <div>
                    <h1 className="text-2xl font-bold font-headline">Pengaturan</h1>
                    <p className="text-muted-foreground">Kelola profil dan akun Anda.</p>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Gagal Memuat Profil</AlertTitle>
                    <AlertDescription>
                        Tidak dapat memuat profil pengguna. Silakan coba muat ulang halaman.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return <SettingsClientPage user={user} profile={userProfile} />;
}
