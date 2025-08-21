

'use server';

import * as React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import DashboardLayoutClient from './layout-client';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

// Dummy data for design mode
const DUMMY_USER: User = {
    id: 'user-dummy-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
};

const DUMMY_PROFILE: Pick<Profile, 'full_name' | 'avatar_url' | 'account_status' | 'is_homeroom_teacher'> = {
    full_name: 'Guru Dummy',
    avatar_url: 'https://placehold.co/100x100.png',
    account_status: 'Pro',
    is_homeroom_teacher: true, // Set to true for design mode to see the menu
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SidebarProvider>
      <DashboardLayoutClient user={DUMMY_USER} profile={DUMMY_PROFILE}>
        {children}
      </DashboardLayoutClient>
    </SidebarProvider>
  );
}
