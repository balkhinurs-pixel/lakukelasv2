
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [view, setView] = React.useState<'login' | 'register'>('login');

  const WelcomePanel = () => (
    <div className="bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-center items-center text-center">
        <div className="mb-8">
            <AppLogo className="h-14 w-14 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold font-headline mb-2">
            {view === 'login' ? 'Selamat Datang Kembali!' : 'Buat Akun Baru'}
        </h1>
        <p className="text-primary-foreground/80 mb-8 max-w-sm">
            {view === 'login' 
              ? 'Anda hanya selangkah lagi untuk mengelola kelas Anda secara efisien.'
              : 'Bergabunglah dengan ribuan guru lain dan modernisasi cara Anda mengajar.'}
        </p>
        <div className="w-full max-w-xs">
            <p className="text-sm text-primary-foreground/60 mb-2">
                {view === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
            </p>
            <Button 
                variant="outline" 
                className="w-full rounded-full bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
            >
                {view === 'login' ? 'Buat Akun' : 'Masuk di Sini'}
            </Button>
        </div>
      </div>
  )

  const LoginForm = () => (
     <form className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="guru@sekolah.id" required className="rounded-lg" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input id="password" type="password" required className="rounded-lg" />
        </div>

        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="font-normal text-muted-foreground">Ingat saya</Label>
            </div>
            <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                Lupa kata sandi?
            </Button>
        </div>
        
         <Button className="w-full rounded-lg" size="lg" asChild>
            <Link href="/dashboard">Masuk</Link>
        </Button>
     </form>
  )

  const RegisterForm = () => (
      <form className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="fullname">Nama Lengkap</Label>
            <Input id="fullname" type="text" placeholder="e.g. Guru Tangguh, S.Pd." required className="rounded-lg" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="email-register">Email</Label>
            <Input id="email-register" type="email" placeholder="guru@sekolah.id" required className="rounded-lg" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password-register">Kata Sandi</Label>
            <Input id="password-register" type="password" required className="rounded-lg" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="password-confirm">Konfirmasi Kata Sandi</Label>
            <Input id="password-confirm" type="password" required className="rounded-lg" />
        </div>
        
        <Button className="w-full rounded-lg" size="lg">Buat Akun</Button>
      </form>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl">
        <Card className="grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl rounded-2xl">
          <WelcomePanel />
          <div className="bg-card text-card-foreground p-8 md:p-12 flex flex-col justify-center">
             <h2 className="text-2xl font-bold text-left mb-6">{view === 'login' ? 'Masuk' : 'Daftar'}</h2>
             
             {view === 'login' ? <LoginForm /> : <RegisterForm />}
             
             <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Atau lanjutkan dengan</span>
                </div>
            </div>

            <Button variant="outline" className="w-full rounded-lg">
                <GoogleIcon className="mr-2 h-5 w-5" />
                Masuk dengan Google
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

