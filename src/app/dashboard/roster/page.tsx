
"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RosterPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/roster/students');
    }, [router]);

    return null; 
}
