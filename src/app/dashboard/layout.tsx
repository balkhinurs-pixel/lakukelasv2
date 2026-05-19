'use server';

import * as React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import DashboardLayoutClient from './layout-client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Ambil profil lengkap (Single Fetch untuk seluruh subtree)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, is_homeroom_teacher, role, is_activated')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
      redirect('/complete-profile');
  }

  // Proteksi 1: Pengecekan Aktivasi Akun
  if (!profile.is_activated) {
      redirect('/waiting-approval');
  }

  // Proteksi 2: Redirect Kepala Sekolah ke Monitoring
  if (profile.role === 'headmaster') {
      redirect('/monitoring');
  }

  return (
    <SidebarProvider>
      <DashboardLayoutClient user={user} profile={profile}>
        {children}
      </DashboardLayoutClient>
    </SidebarProvider>
  );
}
