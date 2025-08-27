
'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
    const supabase = createClient();
    const [loading, setLoading] = React.useState(true);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        if (supabase) {
            setLoading(false);
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    setIsDialogOpen(false);
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
    
    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.host}`;
        }
        return 'http://localhost:9002'; // Fallback for server-side
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <main className="flex flex-col items-center justify-center text-center w-full max-w-md flex-1">
                <div className="w-full max-w-xs">
                    <Image
                        src="https://picsum.photos/800/600"
                        alt="Ilustrasi manajemen kelas yang efisien"
                        width={400}
                        height={300}
                        className="rounded-2xl shadow-2xl shadow-slate-200 aspect-[4/3] object-cover"
                        data-ai-hint="dashboard chart"
                        priority
                    />
                </div>

                <div className="mt-8 space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-slate-900">
                        Selamat Datang di <span className="text-primary">LakuKelas</span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 max-w-prose">
                        Manajemen administrasi kelas menjadi lebih mudah dan intuitif. Fokus pada mengajar, biar kami yang urus sisanya.
                    </p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="mt-8 w-full max-w-xs shadow-lg">
                            Masuk atau Daftar Sekarang
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 border-none max-w-sm">
                        <div className="bg-primary text-primary-foreground p-6 rounded-t-lg">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-center">Akses Akun Anda</DialogTitle>
                                <DialogDescription className="text-center text-primary-foreground/80">
                                    Gunakan email atau akun Google Anda untuk melanjutkan.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="p-6">
                            <Auth
                                supabaseClient={supabase}
                                appearance={{ 
                                    theme: ThemeSupa,
                                    variables: {
                                        default: {
                                            colors: {
                                                brand: 'hsl(var(--primary))',
                                                brandAccent: 'hsl(var(--primary) / 0.8)',
                                                brandButtonText: 'hsl(var(--primary-foreground))',
                                                defaultButtonBackground: 'white',
                                                defaultButtonBackgroundHover: '#eaeaea',
                                                defaultButtonBorder: 'lightgray',
                                                defaultButtonText: 'gray',
                                                dividerBackground: '#eaeaea',
                                                inputBackground: 'hsl(var(--muted))',
                                                inputBorder: 'transparent',
                                                inputBorderHover: 'lightgray',
                                                inputBorderFocus: 'hsl(var(--primary))',
                                                inputText: 'black',
                                                inputLabelText: '#888888',
                                                inputPlaceholder: '#aaaaaa',
                                                messageText: '#2b2b2b',
                                                messageTextDanger: 'red',
                                            },
                                            space: {
                                                spaceSmall: '4px',
                                                spaceMedium: '8px',
                                                spaceLarge: '16px',
                                                labelBottomMargin: '8px',
                                                anchorBottomMargin: '8px',
                                                emailInputSpacing: '8px',
                                                socialAuthSpacing: '8px',
                                                buttonPadding: '12px 15px',
                                                inputPadding: '12px 15px',
                                            },
                                            fontSizes: {
                                                baseBodySize: '14px',
                                                baseInputSize: '14px',
                                                baseLabelSize: '14px',
                                                baseButtonSize: '14px',
                                            },
                                            fonts: {
                                                bodyFontFamily: `var(--font-geist-sans)`,
                                                buttonFontFamily: `var(--font-geist-sans)`,
                                                linkFontFamily: `var(--font-geist-sans)`,
                                                labelFontFamily: `var(--font-geist-sans)`,
                                            },
                                            radii: {
                                                borderRadiusButton: 'var(--radius)',
                                                buttonBorderRadius: 'var(--radius)',
                                                inputBorderRadius: 'var(--radius)',
                                            },
                                        },
                                    },
                                }}
                                providers={['google']}
                                redirectTo={`${getBaseUrl()}/auth/callback`}
                                socialLayout="horizontal"
                                localization={{
                                    variables: {
                                        sign_in: {
                                            email_label: 'Alamat Email',
                                            password_label: 'Kata Sandi',
                                            button_label: 'Masuk',
                                            social_provider_text: 'Masuk dengan {{provider}}',
                                            link_text: 'Sudah punya akun? Masuk',
                                            forgotten_password_label: 'Lupa kata sandi?'
                                        },
                                        sign_up: {
                                            email_label: 'Alamat Email',
                                            password_label: 'Kata Sandi',
                                            button_label: 'Daftar',
                                            social_provider_text: 'Daftar dengan {{provider}}',
                                            link_text: 'Belum punya akun? Daftar'
                                        },
                                        forgotten_password: {
                                            email_label: 'Alamat Email',
                                            email_input_placeholder: 'email@anda.com',
                                            button_label: 'Kirim Instruksi Reset',
                                            link_text: 'Lupa kata sandi Anda?',
                                            confirmation_text: 'Email konfirmasi telah dikirim'
                                        },
                                        update_password: {
                                            password_label: 'Kata Sandi Baru',
                                            button_label: 'Perbarui Kata Sandi'
                                        }
                                    }
                                }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </main>

            <footer className="w-full text-center py-4 mt-auto">
                <p className="text-xs text-slate-500">
                    © {new Date().getFullYear()} LakuKelas. All rights reserved.
                </p>
            </footer>
        </div>
    );
}