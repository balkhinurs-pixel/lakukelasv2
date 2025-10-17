import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SchoolSettingsClientPage from './school-settings-client';
import type { Profile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function SchoolSettingsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Since school data is stored on the profile, we just need the admin's profile
    // But conceptually, it's for the whole "school" which is tied to one admin in this SaaS model
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.error("Error fetching admin profile for school data:", error);
        return (
            <div className="space-y-6">
                 <div>
                    <h1 className="text-2xl font-bold font-headline">Data Sekolah</h1>
                    <p className="text-muted-foreground">Kelola informasi sekolah yang akan tampil di kop surat laporan.</p>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Gagal Memuat Profil</AlertTitle>
                    <AlertDescription>
                        Tidak dapat memuat profil admin. Silakan coba lagi.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return <SchoolSettingsClientPage profile={profile as Profile} />;
}
