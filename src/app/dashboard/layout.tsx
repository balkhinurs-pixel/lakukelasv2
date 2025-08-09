
'use server';

import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import DashboardLayoutClient from './layout-client'; // We will create this client component
import type { Profile } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, account_status')
    .eq('id', user.id)
    .single();

   if (profile?.role === 'admin') {
      redirect('/admin');
  }

  return (
    <SidebarProvider>
      <DashboardLayoutClient user={user} profile={profile}>
        {children}
      </DashboardLayoutClient>
    </SidebarProvider>
  );
}
