

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClientPage from './settings-client-page';
import type { Profile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getAdminProfile, getUserProfile } from '@/lib/data';

export default async function SettingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Fetch both profiles in parallel
    const [userProfile, adminProfile] = await Promise.all([
        getUserProfile(),
        getAdminProfile()
    ]);
    
    if (!userProfile) {
        // This case should be rare, but as a fallback, we can show an error.
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
                        Tidak dapat memuat profil pengguna. Silakan coba muat ulang halaman.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
    
    // The admin profile is the single source of truth for school data.
    // If it doesn't exist, we pass an empty object to the client, which will show "Belum Diatur".
    const schoolProfileForDisplay = adminProfile || {
        school_name: '',
        school_address: '',
        headmaster_name: '',
        headmaster_nip: '',
        school_logo_url: ''
    };

    return <SettingsClientPage user={user} profile={userProfile} schoolProfile={schoolProfileForDisplay as Profile} />;
}
