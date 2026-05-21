'use server';

import * as React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminLayoutClient from './layout-client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, is_activated')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
      redirect('/complete-profile');
  }

  // Proteksi 1: Wajib Aktif
  if (!profile.is_activated) {
    redirect('/waiting-approval');
  }

  // Proteksi 2: Wajib Role Admin atau Kepala Sekolah
  if (profile.role !== 'admin' && profile.role !== 'headmaster') {
    redirect('/dashboard');
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "19rem" } as React.CSSProperties}>
        <AdminLayoutClient user={user} profile={profile}>
            {children}
        </AdminLayoutClient>
    </SidebarProvider>
  );
}
