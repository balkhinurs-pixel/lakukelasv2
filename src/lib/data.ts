
import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { Profile } from './types';
import { activationCodes } from './placeholder-data';

// --- Admin Data ---

export async function getActivationCodes() {
    noStore();
    // In a real app, you'd fetch this from Supabase.
    // Simulating a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return activationCodes;
}

export async function getCodeUser(userId: string): Promise<Profile | null> {
    noStore();
    // In a real app, you'd fetch this from Supabase.
    // For placeholder, returning a mock user.
    if (userId === 'user_2cVLj8iA1tAcrrf34oVbVuA2t65') {
        return {
            id: userId,
            email: 'siti.a@email.com',
        } as Profile
    }
    return null;
}
