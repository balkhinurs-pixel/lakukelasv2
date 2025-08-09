
'use client';

import { createClient } from '@/lib/supabase/client';
import type { Student } from './types';

// This file contains data fetching functions that are meant to be used on the client side.

export async function getStudentsByClass(classId: string): Promise<Student[]> {
    if (!classId) return [];
    const supabase = createClient();
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching students:", error);
        return [];
    }
    return data;
}

    