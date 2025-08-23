
'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const supabase = createClient();
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        if (supabase) {
            setLoading(false);
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    // User is signed in, redirect to middleware which will handle routing
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
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.host}`;
        }
        return 'http://localhost:9002'; // Fallback for server-side
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 p-4">
            <div className="w-full max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center mb-6">
                    <Image src="/login.png" alt="LakuKelas Illustration" width={280} height={60} className="w-48 h-auto" />
                    <h1 className="text-5xl font-bold tracking-tighter text-foreground mt-2">
                        <span>Laku</span>
                        <span className="text-primary">Kelas</span>
                    </h1>
                </div>
                <Card className="shadow-2xl shadow-slate-200 border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Selamat Datang!</CardTitle>
                        <CardDescription className="text-center">
                            Silakan masuk atau daftar untuk melanjutkan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Auth
                            supabaseClient={supabase}
                            appearance={{ theme: ThemeSupa }}
                            providers={['google']}
                            redirectTo={`${getBaseUrl()}/auth/callback`}
                            socialLayout="horizontal"
                            localization={{
                                variables: {
                                    sign_in: {
                                        email_label: 'Alamat Email',
                                        password_label: 'Kata Sandi',
                                        email_input_placeholder: 'email@anda.com',
                                        password_input_placeholder: 'Kata sandi Anda',
                                        button_label: 'Masuk',
                                        social_provider_text: 'Masuk dengan {{provider}}',
                                        link_text: 'Sudah punya akun? Masuk'
                                    },
                                    sign_up: {
                                        email_label: 'Alamat Email',
                                        password_label: 'Kata Sandi',
                                        email_input_placeholder: 'email@anda.com',
                                        password_input_placeholder: 'Buat kata sandi yang kuat',
                                        button_label: 'Daftar',
                                        social_provider_text: 'Daftar dengan {{provider}}',
                                        link_text: 'Belum punya akun? Daftar'
                                    },
                                    forgotten_password: {
                                        email_label: 'Alamat Email',
                                        email_input_placeholder: 'email@anda.com',
                                        button_label: 'Kirim instruksi reset',
                                        link_text: 'Lupa kata sandi?'
                                    }
                                }
                            }}
                        />
                    </CardContent>
                </Card>
                 <p className="text-center text-xs text-muted-foreground mt-6">
                    © {new Date().getFullYear()} LakuKelas. All rights reserved.
                </p>
            </div>
        </div>
    );
}
