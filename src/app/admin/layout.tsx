

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <SidebarProvider>
        <AdminLayoutClient user={user} profile={profile}>
            {children}
        </AdminLayoutClient>
    </SidebarProvider>
  );
}
