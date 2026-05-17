'use client';

import * as React from 'react';
import DashboardLayoutClient from '../dashboard/layout-client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

export default function AdminLayoutClient({ 
  children,
  user,
  profile
}: { 
  children: React.ReactNode;
  user: User | null;
  profile: Pick<Profile, 'full_name' | 'avatar_url' | 'is_homeroom_teacher' | 'role'> | null;
}) {
  // Use the unified layout to ensure consistent drawer experience
  return (
    <DashboardLayoutClient user={user} profile={profile}>
      {children}
    </DashboardLayoutClient>
  );
}
