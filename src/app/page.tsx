
"use client";

import * as React from "react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.641-3.657-11.303-8H6.306C9.656,35.663,16.318,40,24,40z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,36.49,44,30.861,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

export default function LoginPage() {
  const [view, setView] = React.useState<'login' | 'register' | 'forgot-password'>('login');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!supabase) {
      toast({ title: "Kesalahan Konfigurasi", description: "Koneksi ke Supabase gagal.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message === 'Email not confirmed') {
        toast({ title: "Verifikasi Email Diperlukan", description: "Silakan cek email Anda untuk tautan konfirmasi sebelum masuk.", variant: "destructive" });
      } else {
        toast({ title: "Login Gagal", description: "Email atau kata sandi salah.", variant: "destructive" });
      }
      setLoading(false);
    } else {
        // On successful login, refresh the page. 
        // The middleware will then handle the redirection based on the user's role.
        router.refresh();
    }
  };
  
  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!supabase) {
      toast({ title: "Kesalahan Konfigurasi", description: "Koneksi ke Supabase gagal.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullname') as string;

    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                full_name: fullName
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
    });

    if (error) {
      toast({ title: "Registrasi Gagal", description: error.message, variant: "destructive" });
    } else {
      router.push('/auth/check-email');
    }
    setLoading(false);
  };
  
  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!supabase) {
      toast({ title: "Kesalahan Konfigurasi", description: "Koneksi ke Supabase gagal.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`
    });

    if (error) {
        toast({ title: "Gagal Mengirim Email", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Email Terkirim", description: "Silakan cek email Anda untuk tautan reset kata sandi." });
        setView('login');
    }
    setLoading(false);
  };
  
  const handleGoogleLogin = async () => {
      setLoading(true);

      if (!supabase) {
        toast({ title: "Kesalahan Konfigurasi", description: "Koneksi ke Supabase gagal.", variant: "destructive" });
        setLoading(false);
        return;
      }

      await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: `${window.location.origin}/auth/callback`
          }
      });
      // No need to set loading to false, user is being redirected
  }

  const WelcomePanel = () => {
    const titles = {
        login: 'Selamat Datang Kembali!',
        register: 'Buat Akun Baru',
        'forgot-password': 'Lupa Kata Sandi?'
    };
    const descriptions = {
        login: 'Anda hanya selangkah lagi untuk mengelola kelas Anda secara efisien.',
        register: 'Bergabunglah dengan ribuan guru lain dan modernisasi cara Anda mengajar.',
        'forgot-password': 'Tidak masalah. Kami akan membantu Anda mendapatkan kembali akses ke akun Anda.'
    };
    const buttonLabels = {
        login: 'Buat Akun',
        register: 'Masuk di Sini',
        'forgot-password': 'Kembali untuk Masuk'
    };
    const buttonActions = {
        login: () => setView('register'),
        register: () => setView('login'),
        'forgot-password': () => setView('login')
    };

    return (
        <div className="bg-primary text-primary-foreground p-8 md:p-12 flex-col justify-center items-center text-center hidden md:flex">
             <div className="flex items-center justify-center gap-4 mb-4">
                <Image src="/login.png" alt="LakuKelas Logo" width={80} height={80} className="w-20 h-20" />
                <h1 className="text-5xl font-bold tracking-tighter">
                    <span className="text-white">Laku</span>
                    <span style={{ color: '#48c4c2' }}>Kelas</span>
                </h1>
            </div>
            <h2 className="text-3xl font-bold font-headline mb-2">
                {titles[view]}
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-sm">
                {descriptions[view]}
            </p>
            <div className="w-full max-w-xs">
                <p className="text-sm text-primary-foreground/60 mb-2">
                    {view === 'login' ? 'Belum punya akun?' : view === 'register' ? 'Sudah punya akun?' : 'Ingat kata sandi Anda?'}
                </p>
                <Button 
                    variant="outline" 
                    className="w-full rounded-full bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={buttonActions[view]}
                    disabled={loading}
                >
                    {buttonLabels[view]}
                </Button>
            </div>
        </div>
    )
  }

  const LoginForm = () => (
     <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="guru@sekolah.id" required className="rounded-lg" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input id="password" name="password" type="password" required className="rounded-lg" />
        </div>
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="font-normal text-muted-foreground">Ingat saya</Label>
            </div>
            <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setView('forgot-password')}>
                Lupa kata sandi?
            </Button>
        </div>
        <Button className="w-full rounded-lg" size="lg" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Masuk
        </Button>
     </form>
  )

  const RegisterForm = () => (
      <form className="space-y-4" onSubmit={handleRegister}>
        <div className="space-y-2">
            <Label htmlFor="fullname">Nama Lengkap</Label>
            <Input id="fullname" name="fullname" type="text" placeholder="e.g. Guru Tangguh, S.Pd." required className="rounded-lg" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="email-register">Email</Label>
            <Input id="email-register" name="email" type="email" placeholder="guru@sekolah.id" required className="rounded-lg" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password-register">Kata Sandi</Label>
            <Input id="password-register" name="password" type="password" required className="rounded-lg" />
        </div>
        <Button className="w-full rounded-lg" size="lg" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Akun
        </Button>
      </form>
  )

  const ForgotPasswordForm = () => (
    <form className="space-y-4" onSubmit={handleForgotPassword}>
        <p className="text-sm text-muted-foreground">
            Masukkan alamat email Anda yang terdaftar dan kami akan mengirimkan tautan untuk mereset kata sandi Anda.
        </p>
       <div className="space-y-2">
           <Label htmlFor="email-forgot">Email</Label>
           <Input id="email-forgot" name="email" type="email" placeholder="guru@sekolah.id" required className="rounded-lg" />
       </div>
       <Button className="w-full rounded-lg" size="lg" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Tautan Reset
       </Button>
    </form>
  )
  
  const FormContent = () => {
      if (view === 'register') return <RegisterForm />;
      if (view === 'forgot-password') return <ForgotPasswordForm />;
      return <LoginForm />;
  }
  
  const FormTitle = () => {
      if (view === 'register') return 'Daftar';
      if (view === 'forgot-password') return 'Reset Kata Sandi Anda';
      return 'Masuk';
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl">
        <Card className="grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl rounded-2xl">
          <WelcomePanel />
          <div className="bg-card text-card-foreground p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-2 mb-6 md:hidden">
                 <Image src="/login.png" alt="LakuKelas Logo" width={60} height={60} className="w-12 h-12" />
                <h1 className="text-5xl font-bold tracking-tighter">
                    <span className="text-foreground">Laku</span>
                    <span className="text-primary">Kelas</span>
                </h1>
            </div>
             <h2 className="text-2xl font-bold text-left mb-6">{FormTitle()}</h2>
             
             <FormContent />
             
             {view !== 'forgot-password' && (
                <>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Atau lanjutkan dengan</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full rounded-lg" onClick={handleGoogleLogin} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
                    Masuk dengan Google
                </Button>
                </>
             )}

            <div className="mt-6 text-center text-sm md:hidden">
                {view === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => setView(view === 'login' ? 'register' : 'login')}>
                    {view === 'login' ? 'Buat Akun' : 'Masuk di Sini'}
                </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
