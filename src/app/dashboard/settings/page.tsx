
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

    let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    // If profile doesn't exist, create a default one
    if (error || !profile) {
        console.log("Profile not found, creating default profile for user:", user.id);
        
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
        
        profile = newProfile;
    }

    return <SettingsClientPage user={user} profile={profile as Profile} />;
}
