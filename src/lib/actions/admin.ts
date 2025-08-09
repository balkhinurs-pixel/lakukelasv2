
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import type { ActivationCode } from '../types';

// This function generates a unique, random activation code.
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i < 15) {
      result += '-';
    }
  }
  return result;
}

export async function generateActivationCode(): Promise<{ success: boolean; data?: ActivationCode, error?: string, code?: string }> {
  noStore();
  const supabase = createClient();
  const newCode = generateCode();

  try {
    const { data, error } = await supabase
      .from('activation_codes')
      .insert([{ code: newCode }])
      .select()
      .single();

    if (error) {
      // Handle potential unique constraint violation by retrying
      if (error.code === '23505') { // unique_violation
        return generateActivationCode();
      }
      throw error;
    }

    revalidatePath('/admin/codes');
    return { success: true, data };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function updateUserStatus(userId: string, newStatus: 'Pro' | 'Free') {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ account_status: newStatus })
            .eq('id', userId);

        if (error) throw error;
        
        revalidatePath('/admin/users');
        return { success: true, message: `Status pengguna berhasil diubah menjadi ${newStatus}.` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteUser(userId: string) {
    const supabase = createClient();
    try {
        // We need to use the service role key to delete from auth.users
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) throw error;
        
        // The on_delete_user function in the database should handle deleting the profile.
        revalidatePath('/admin/users');
        return { success: true, message: 'Pengguna berhasil dihapus.' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
