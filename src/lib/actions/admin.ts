
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';

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

export async function generateActivationCode() {
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
    return { success: true, code: data.code };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
