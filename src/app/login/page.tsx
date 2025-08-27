
'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
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
        <div className="w-full max-w-sm">
            <Tabs defaultValue="sign_in" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sign_in">Masuk</TabsTrigger>
                    <TabsTrigger value="sign_up">Daftar</TabsTrigger>
                </TabsList>
                <TabsContent value="sign_in">
                    <form onSubmit={(e) => handleAuthAction(e, 'sign_in')} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="email-in">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="email-in" name="email" type="email" placeholder="email@anda.com" required className="pl-10"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-in">Kata Sandi</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="password-in" name="password" type={showPassword ? 'text' : 'password'} required className="pl-10 pr-10"/>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Masuk
                        </Button>
                    </form>
                </TabsContent>
                <TabsContent value="sign_up">
                    <form onSubmit={(e) => handleAuthAction(e, 'sign_up')} className="space-y-4 mt-4">
                         <div className="space-y-2">
                            <Label htmlFor="email-up">Email</Label>
                             <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="email-up" name="email" type="email" placeholder="email@anda.com" required className="pl-10"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-up">Kata Sandi</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="password-up" name="password" type={showPassword ? 'text' : 'password'} required className="pl-10 pr-10"/>
                                 <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Daftar
                        </Button>
                    </form>
                </TabsContent>
                 <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Atau lanjutkan dengan
                        </span>
                    </div>
                </div>
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                            <path
                            fill="currentColor"
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.98-4.66 1.98-5.6 0-9.98-4.9-9.98-10.9s4.38-10.9 9.98-10.9c3.03 0 5.39 1.25 6.63 2.44l2.13-2.13C18.53 1.11 15.82 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c7.04 0 12.12-4.92 12.12-12.48 0-.83-.07-1.64-.2-2.44h-12z"
                            ></path>
                        </svg>
                    )}
                    Google
                </Button>
            </Tabs>
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
            className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url('https://picsum.photos/800/1200')` }}
        >
            <div className="flex items-center justify-center py-12 bg-background/80 backdrop-blur-sm lg:bg-background lg:backdrop-blur-none">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">Masuk Akun</h1>
                        <p className="text-balance text-muted-foreground">
                            Masukkan detail Anda untuk mengakses dasbor guru.
                        </p>
                    </div>
                    <AuthForm />
                    <div className="mt-4 text-center text-sm">
                        Kembali ke <Link href="/" className="underline">Halaman Utama</Link>
                    </div>
                </div>
            </div>
            <div className="hidden bg-muted lg:block">
                <Image
                    src="https://picsum.photos/1200/1800"
                    alt="Image"
                    width="1200"
                    height="1800"
                    data-ai-hint="teacher classroom"
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </div>
    )
}
