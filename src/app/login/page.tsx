
'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function AuthForm() {
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const handleGoogleSignIn = async () => {
        if (!supabase) return;
        setLoading(true);
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        setLoading(false);
    };

    const handleAuthAction = async (event: React.FormEvent<HTMLFormElement>, action: 'sign_in' | 'sign_up') => {
        event.preventDefault();
        if (!supabase) return;
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const { error } = action === 'sign_in'
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` }});

        if (error) {
            toast({
                title: 'Autentikasi Gagal',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: action === 'sign_in' ? 'Login Berhasil' : 'Pendaftaran Berhasil',
                description: action === 'sign_in' ? 'Anda akan diarahkan ke dasbor.' : 'Silakan cek email Anda untuk verifikasi.',
            });
             if (action === 'sign_in') {
                router.push('/dashboard');
            } else {
                router.push('/auth/check-email');
            }
        }
        setLoading(false);
    };

    return (
        <div className="w-full">
            <Tabs defaultValue="sign_in" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/30 dark:bg-black/30 p-1 rounded-xl backdrop-blur-sm">
                    <TabsTrigger value="sign_in" className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-md rounded-lg">Masuk</TabsTrigger>
                    <TabsTrigger value="sign_up" className="data-[state=active]:bg-white/80 dark:data-[state=active]:bg-black/80 data-[state=active]:shadow-md rounded-lg">Daftar</TabsTrigger>
                </TabsList>
                <TabsContent value="sign_in">
                    <form onSubmit={(e) => handleAuthAction(e, 'sign_in')} className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <Label htmlFor="email-in" className="text-white drop-shadow-sm">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input id="email-in" name="email" type="email" placeholder="email@anda.com" required className="pl-12 h-14 bg-white/90 dark:bg-black/80 rounded-xl text-base"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-in" className="text-white drop-shadow-sm">Kata Sandi</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input id="password-in" name="password" type={showPassword ? 'text' : 'password'} required className="pl-12 pr-12 h-14 bg-white/90 dark:bg-black/80 rounded-xl text-base"/>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 text-base font-semibold bg-[#FFD93D] hover:bg-[#FFD93D]/90 text-black rounded-xl shadow-lg" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Masuk
                        </Button>
                    </form>
                </TabsContent>
                <TabsContent value="sign_up">
                    <form onSubmit={(e) => handleAuthAction(e, 'sign_up')} className="space-y-6 mt-6">
                         <div className="space-y-2">
                            <Label htmlFor="email-up" className="text-white drop-shadow-sm">Email</Label>
                             <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input id="email-up" name="email" type="email" placeholder="email@anda.com" required className="pl-12 h-14 bg-white/90 dark:bg-black/80 rounded-xl text-base"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-up" className="text-white drop-shadow-sm">Kata Sandi</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input id="password-up" name="password" type={showPassword ? 'text' : 'password'} required className="pl-12 pr-12 h-14 bg-white/90 dark:bg-black/80 rounded-xl text-base"/>
                                 <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 text-base font-semibold bg-[#FFD93D] hover:bg-[#FFD93D]/90 text-black rounded-xl shadow-lg" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Daftar
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-2 text-white/90 backdrop-blur-sm">
                        Atau lanjutkan dengan
                    </span>
                </div>
            </div>
            <button 
                onClick={handleGoogleSignIn} 
                disabled={loading}
                className="w-full h-14 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium text-gray-700"
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                )}
                <span className="text-sm font-medium">
                    {loading ? 'Memproses...' : 'Lanjutkan dengan Google'}
                </span>
            </button>
        </div>
    )
}

export default function LoginPage() {
    const supabase = createClient();
    const router = useRouter();

    React.useEffect(() => {
        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    router.push('/dashboard');
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [supabase, router]);
    
    return (
        <div 
            className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url('/bg-login.png')` }}
        >
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative mx-auto grid w-full max-w-sm gap-6">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold text-white drop-shadow-md">Masuk Akun</h1>
                    <p className="text-balance text-white/90 drop-shadow-sm">
                        Masukkan detail Anda untuk mengakses dasbor guru.
                    </p>
                </div>
                <AuthForm />
                <div className="mt-4 text-center text-sm">
                    <Link href="/" className="underline text-white/80 hover:text-white">
                        Kembali ke Halaman Utama
                    </Link>
                </div>
            </div>
        </div>
    )
}
