
import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import type { Profile } from './types';

// --- Admin Data ---

export async function getActivationCodes() {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching activation codes:', error);
        return [];
    }
    return data;
}

export async function getCodeUser(userId: string): Promise<Profile | null> {
    noStore();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user for code:', error);
        return null;
    }
    return data as Profile | null;
}
