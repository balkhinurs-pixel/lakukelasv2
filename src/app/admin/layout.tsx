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
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
      redirect('/dashboard');
  }

  // Izinkan Admin DAN Kepala Sekolah untuk masuk ke layout admin
  if (profile.role !== 'admin' && profile.role !== 'headmaster') {
    redirect('/dashboard');
  }

  return (
    <SidebarProvider>
        <AdminLayoutClient user={user} profile={profile}>
            {children}
        </AdminLayoutClient>
    </SidebarProvider>
  );
}
