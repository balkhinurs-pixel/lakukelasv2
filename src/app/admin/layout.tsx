

'use server';

import * as React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminLayoutClient from './layout-client';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

// Dummy data for design mode
const DUMMY_USER: User = {
    id: 'admin-dummy-id',
    app_metadata: {},
    user_metadata: { full_name: "Admin LakuKelas" },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'admin.dummy@lakukelas.id'
};

const DUMMY_PROFILE: Pick<Profile, 'full_name' | 'avatar_url'> = {
    full_name: 'Admin LakuKelas',
    avatar_url: 'https://placehold.co/100x100.png',
};


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SidebarProvider>
        <AdminLayoutClient user={DUMMY_USER} profile={DUMMY_PROFILE}>
            {children}
        </AdminLayoutClient>
    </SidebarProvider>
  );
}
