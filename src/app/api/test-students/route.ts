import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: students, error } = await supabase
      .from('students')
      .select('id, name, nis, class_id')
      .eq('status', 'active')
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ 
      error: (error as Error).message || 'Internal Server Error' 
    }, { status: 500 });
  }
}