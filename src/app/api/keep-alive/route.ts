
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API Route untuk menjaga agar database Supabase tetap aktif.
 * Vercel Cron akan memanggil rute ini secara terjadwal.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Melakukan query sangat ringan untuk memicu aktivitas database
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .eq('key', 'active_school_year_id')
      .maybeSingle();

    if (error) {
      console.error('[Keep-Alive] Database ping failed:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('[Keep-Alive] Supabase ping successful at:', new Date().toISOString());

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase Keep-Alive successful',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Keep-Alive] Unexpected error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
