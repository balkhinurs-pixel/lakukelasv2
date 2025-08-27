
'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
    const supabase = createClient();
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        if (supabase) {
            setLoading(false);
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    router.refresh();
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [supabase, router]);
    
    if (loading || !supabase) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <main className="flex flex-col items-center justify-center text-center w-full max-w-md flex-1">
                <div className="w-full max-w-xs">
                    <Image
                        src="/ilustration.png"
                        alt="Ilustrasi guru dan siswa menggunakan aplikasi Lakukelas"
                        width={400}
                        height={300}
                        className="rounded-2xl shadow-2xl shadow-slate-200 aspect-[4/3] object-cover"
                        data-ai-hint="teacher students application"
                        priority
                    />
                </div>

                <div className="mt-8 space-y-4">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-slate-900">
                        Selamat Datang di <span className="text-primary">LakuKelas</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 max-w-prose">
                        Manajemen administrasi kelas menjadi lebih mudah dan intuitif. Fokus pada mengajar, biar kami yang urus sisanya.
                    </p>
                </div>
                
                <Button size="lg" className="mt-8 w-full max-w-xs shadow-lg" asChild>
                    <a href="/login">Masuk atau Daftar Sekarang</a>
                </Button>
            </main>

            <footer className="w-full text-center py-4 mt-auto">
                <p className="text-xs text-slate-500">
                    © {new Date().getFullYear()} LakuKelas. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
