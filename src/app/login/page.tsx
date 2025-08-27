
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
            <Button variant="outline" className="w-full h-14 text-base bg-white/90 dark:bg-black/80 rounded-xl text-foreground hover:bg-white dark:hover:bg-black/90" onClick={handleGoogleSignIn} disabled={loading}>
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5">
                        <title>Google</title>
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.4-5.75 2.4-4.87 0-8.8-3.92-8.8-8.72s3.93-8.72 8.8-8.72c2.6 0 4.5.92 5.8 2.15l2.8-2.78C19.1 1.96 16.2.72 12.48.72c-6.9 0-12.48 5.6-12.48 12.4s5.58 12.4 12.48 12.4c6.8 0 12.12-4.72 12.12-12.24 0-1.12-.12-2.12-.36-3.18H12.48z" fill="#4285F4"/>
                        <path d="m12.48.72 5.8 5.8 2.8-2.78-5.6-5.6C16.2.72 19.1 1.96 21.8 4.66l-2.8 2.78-5.8-5.8h.68z" fill="#34A853"/>
                        <path d="M21.8 4.66c3.24 3.2 4.68 7.36 4.68 12.24 0-1.12-.12-2.12-.36-3.18h-7.84v3.28h4.56c-1.32 3.6-4.24 5.92-8.32 5.92-1.92 0-3.76-.6-5.32-1.68l-2.8 2.78C6.12 23.4 9.16 24 12.48 24c6.8 0 12.12-4.72 12.12-12.24 0-4.88-1.44-9.04-4.68-12.24l.6-.6z" fill="#FBBC05"/>
                        <path d="M12.48 10.92V7.64H4.64c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.4-5.75 2.4s-5.8-1.16-7.36-3.08l-2.8 2.78c1.56 2.08 3.4 3.28 5.76 3.92.24.04.52.04.76.04 6.9 0 12.48-5.6 12.48-12.4V10.92z" fill="#EA4335"/>
                    </svg>
                )}
                Google
            </Button>
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
