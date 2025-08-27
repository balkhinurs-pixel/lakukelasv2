
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
            router.refresh();
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
                        <Button type="submit" className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg" disabled={loading}>
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
                        <Button type="submit" className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-lg" disabled={loading}>
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
                    <span className="bg-background/30 backdrop-blur-sm px-2 text-white">
                        Atau lanjutkan dengan
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full h-14 text-base bg-white/90 dark:bg-black/80 rounded-xl text-foreground hover:bg-white dark:hover:bg-black/90" onClick={handleGoogleSignIn} disabled={loading}>
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="#4285F4" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.8 0 256S110.3 0 244 0c69.8 0 129.8 28.2 174.2 73.4l-64.5 64.5C325.5 110.3 288.5 96 244 96c-85.3 0-154.1 68.8-154.1 154.1s68.8 154.1 154.1 154.1c98.2 0 135-70.4 140.8-106.9H244v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
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
                    router.refresh();
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
            style={{ backgroundImage: `url('https://picsum.photos/1080/1920')` }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
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
