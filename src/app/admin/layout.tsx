
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
    console.log('[AdminLayout] No user found, redirecting to login');
    redirect('/');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single();

  console.log(`[AdminLayout] Server-side check - User: ${user.email}, Role: ${profile?.role}`);

  if (profileError) {
      console.error('[AdminLayout] Profile fetch error:', profileError.message);
  }

  // Secondary security check: Ensure the user actually has the admin role
  if (!profile || profile.role !== 'admin') {
    console.log(`[AdminLayout] Access forbidden for role: ${profile?.role}. Redirecting to dashboard`);
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
