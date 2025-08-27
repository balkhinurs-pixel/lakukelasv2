
'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
            : await supabase.auth.signUp({ email, password });

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
        <Tabs defaultValue="sign_in" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign_in">Masuk</TabsTrigger>
                <TabsTrigger value="sign_up">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="sign_in">
                <form onSubmit={(e) => handleAuthAction(e, 'sign_in')} className="space-y-4">
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
                <form onSubmit={(e) => handleAuthAction(e, 'sign_up')} className="space-y-4">
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
    );
}


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
                            <AuthForm />
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
