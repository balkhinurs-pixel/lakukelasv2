
"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RosterPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/roster/students');
    }, [router]);

    return null; 
}
