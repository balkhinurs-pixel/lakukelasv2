
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
import { Loader2, Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react";

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
  const [showPassword, setShowPassword] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Animation trigger
  React.useEffect(() => {
    setIsVisible(true);
  }, []);

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
        login: 'Sistem manajemen kelas yang dirancang khusus untuk meningkatkan efisiensi pengajaran dan pembelajaran.',
        register: 'Bergabunglah dengan komunitas guru modern dan transformasi cara Anda mengelola kelas.',
        'forgot-password': 'Tenang, kami akan membantu Anda mendapatkan kembali akses ke akun dengan aman.'
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
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-teal-500 text-white p-8 md:p-12 flex-col justify-center items-center text-center hidden md:flex overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                <div className="absolute bottom-20 right-20 w-1 h-1 bg-white/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className={`relative z-10 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="mb-4">
                        <Image src="/login.png" alt="LakuKelas Logo" width={80} height={80} className="w-20 h-20 drop-shadow-lg" />
                    </div>
                    <h1 className="text-5xl font-bold tracking-tighter">
                        <span className="text-white drop-shadow-md">Laku</span>
                        <span className="drop-shadow-md" style={{ color: '#47c4c1' }}>Kelas</span>
                    </h1>
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                    <h2 className="text-3xl font-bold font-headline">
                        {titles[view]}
                    </h2>
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                </div>
                
                <p className="text-white/80 mb-8 max-w-sm leading-relaxed">
                    {descriptions[view]}
                </p>
                
                <div className="w-full max-w-xs">
                    <p className="text-sm text-white/60 mb-3">
                        {view === 'login' ? 'Belum punya akun?' : view === 'register' ? 'Sudah punya akun?' : 'Ingat kata sandi Anda?'}
                    </p>
                    <Button 
                        variant="outline" 
                        className="w-full rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={buttonActions[view]}
                        disabled={loading}
                    >
                        {buttonLabels[view]}
                    </Button>
                </div>
            </div>
        </div>
    )
  }

  const LoginForm = () => (
     <form className="space-y-6" onSubmit={handleLogin}>
        <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="guru@sekolah.id" 
                    required 
                    className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-300" 
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Kata Sandi</Label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-300" 
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </Button>
            </div>
        </div>
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" className="rounded-md" />
                <Label htmlFor="remember-me" className="font-normal text-muted-foreground cursor-pointer">Ingat saya</Label>
            </div>
            <Button variant="link" size="sm" className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium" onClick={() => setView('forgot-password')}>
                Lupa kata sandi?
            </Button>
        </div>
        <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200" size="lg" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Masuk
        </Button>
     </form>
  )

  const RegisterForm = () => (
      <form className="space-y-6" onSubmit={handleRegister}>
        <div className="space-y-2">
            <Label htmlFor="fullname" className="text-sm font-medium text-gray-700">Nama Lengkap</Label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                    id="fullname" 
                    name="fullname" 
                    type="text" 
                    placeholder="e.g. Guru Tangguh, S.Pd." 
                    required 
                    className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-300" 
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="email-register" className="text-sm font-medium text-gray-700">Email</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                    id="email-register" 
                    name="email" 
                    type="email" 
                    placeholder="guru@sekolah.id" 
                    required 
                    className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-300" 
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="password-register" className="text-sm font-medium text-gray-700">Kata Sandi</Label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                    id="password-register" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-300" 
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </Button>
            </div>
        </div>
        <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200" size="lg" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Akun
        </Button>
      </form>
  )

  const ForgotPasswordForm = () => (
    <form className="space-y-6" onSubmit={handleForgotPassword}>
        <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-200">
            Masukkan alamat email Anda yang terdaftar dan kami akan mengirimkan tautan untuk mereset kata sandi Anda.
        </p>
       <div className="space-y-2">
           <Label htmlFor="email-forgot" className="text-sm font-medium text-gray-700">Email</Label>
           <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                    id="email-forgot" 
                    name="email" 
                    type="email" 
                    placeholder="guru@sekolah.id" 
                    required 
                    className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 hover:border-gray-300" 
                />
            </div>
       </div>
       <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200" size="lg" type="submit" disabled={loading}>
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-4xl relative z-10">
        <Card className={`grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl rounded-3xl backdrop-blur-sm bg-white/95 border-0 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
          <WelcomePanel />
          <div className="bg-white/90 backdrop-blur-sm text-card-foreground p-8 md:p-12 flex flex-col justify-center">
            <div className="flex flex-col items-center justify-center mb-8 md:hidden">
                <div className="mb-4">
                    <Image src="/login.png" alt="LakuKelas Logo" width={80} height={80} className="w-20 h-20 drop-shadow-lg" />
                </div>
                <h1 className="text-4xl font-bold tracking-tighter mb-2">
                    <span className="text-gray-800">Laku</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Kelas</span>
                </h1>
                <p className="text-sm text-gray-600 text-center max-w-xs leading-relaxed">
                    Sistem Manajemen Kelas Modern untuk Guru Profesional
                </p>
            </div>
             <h2 className="text-3xl font-bold text-left mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{FormTitle()}</h2>
             
             <FormContent />
             
             {view !== 'forgot-password' && (
                <>
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-4 text-gray-500 font-medium">Atau lanjutkan dengan</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md" onClick={handleGoogleLogin} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
                    <span className="font-medium">Masuk dengan Google</span>
                </Button>
                </>
             )}

            <div className="mt-8 text-center md:hidden">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 mb-2">
                        {view === 'login' ? 'Belum punya akun?' : view === 'register' ? 'Sudah punya akun?' : 'Ingat kata sandi Anda?'}
                    </p>
                    <Button 
                        variant="outline" 
                        className="w-full rounded-xl border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-medium transition-all duration-200" 
                        onClick={() => setView(view === 'login' ? 'register' : view === 'register' ? 'login' : 'login')}
                    >
                        {view === 'login' ? 'Buat Akun' : view === 'register' ? 'Masuk di Sini' : 'Kembali untuk Masuk'}
                    </Button>
                </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

    