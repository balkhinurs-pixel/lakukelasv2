
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
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Ambil profil lengkap di sini (Single Fetch)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, is_homeroom_teacher, role, is_activated')
    .eq('id', user.id)
    .single();

  if (!profile) {
      redirect('/complete-profile');
  }

  // Pindahkan logika pengalihan status dari middleware ke sini agar load awal lebih ringan
  if (!profile.is_activated) {
      redirect('/waiting-approval');
  }

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
