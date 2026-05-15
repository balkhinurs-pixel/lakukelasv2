'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GradientText from '@/components/ui/gradient-text';
import SplitText from '@/components/ui/split-text';
import { InfiniteGrid } from '@/components/ui/the-infinite-grid';
import { LottieWelcome } from '@/components/ui/lottie-welcome';

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
        <InfiniteGrid>
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen">
                <main className="flex flex-col items-center justify-center text-center w-full max-w-2xl flex-1 z-10">
                    <div className="w-full flex justify-center transform transition-transform duration-700 hover:scale-105">
                        <LottieWelcome className="drop-shadow-2xl" />
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="space-y-1">
                             <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                                <SplitText
                                    text="Selamat Datang di"
                                    className="inline-block"
                                    from={{ opacity: 0, y: 20 }}
                                    to={{ opacity: 1, y: 0 }}
                                    delay={80}
                                    splitType="chars"
                                />
                                <br className="sm:hidden" />
                                <GradientText
                                    colors={['#6366f1', '#a855f7', '#6366f1']}
                                    className="font-black ml-0 sm:ml-3 inline-block"
                                >
                                    LakuKelas
                                </GradientText>
                            </h1>
                        </div>
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-prose mx-auto leading-relaxed font-medium">
                            Platform manajemen kelas digital tercanggih untuk guru masa kini. <br className="hidden sm:block" />
                            Administrasi jadi ringan, mengajar jadi menyenangkan.
                        </p>
                    </div>
                    
                    <div className="mt-10 w-full max-w-sm flex flex-col gap-3">
                        <Button size="lg" className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 group" asChild>
                            <a href="/login">
                                Mulai Sekarang
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                        </Button>
                        <p className="text-xs text-slate-400 font-medium">Gratis untuk seluruh guru di Indonesia</p>
                    </div>
                </main>

                <footer className="w-full text-center py-6 mt-auto z-10">
                    <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase">
                        © {new Date().getFullYear()} LakuKelas • Digitalizing Education
                    </p>
                </footer>
            </div>
        </InfiniteGrid>
    );
}
