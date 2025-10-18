

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

    // Fetch the teacher's own profile
    const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (userProfileError) {
         console.error("Error fetching user profile:", userProfileError);
        // If profile doesn't exist, create a default one
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                email: user.email,
                avatar_url: user.user_metadata?.avatar_url || null,
                role: 'teacher'
            })
            .select('*')
            .single();
            
        if (createError) {
            console.error("Error creating profile:", createError);
            return (
                <div className="space-y-6">
                     <div>
                        <h1 className="text-2xl font-bold font-headline">Pengaturan</h1>
                        <p className="text-muted-foreground">Kelola profil, akun, dan data sekolah Anda.</p>
                    </div>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Gagal Membuat Profil</AlertTitle>
                        <AlertDescription>
                            Tidak dapat membuat profil baru. Silakan coba muat ulang halaman atau hubungi dukungan jika masalah berlanjut.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }
        return <SettingsClientPage user={user} profile={newProfile as Profile} schoolProfile={newProfile as Profile} />;
    }

    // Fetch the admin's profile to get the school data
    const { data: schoolProfile, error: adminProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single();

    if (adminProfileError) {
        console.error("Error fetching admin profile for school data:", adminProfileError);
        // If admin profile isn't found, we can pass the user's own profile as a fallback
        // so the page doesn't crash, but the school data will be empty.
        return <SettingsClientPage user={user} profile={userProfile as Profile} schoolProfile={userProfile as Profile} />;
    }

    return <SettingsClientPage user={user} profile={userProfile as Profile} schoolProfile={schoolProfile as Profile} />;
}
