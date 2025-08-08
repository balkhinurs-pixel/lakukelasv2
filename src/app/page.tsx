
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl">
        <Card className="grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl rounded-2xl">
          {/* Left Panel */}
          <div className="bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-center items-center text-center">
            <div className="mb-8">
                <AppLogo className="h-14 w-14 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold font-headline mb-2">Selamat Datang Kembali!</h1>
            <p className="text-primary-foreground/80 mb-8 max-w-sm">
              Anda hanya selangkah lagi untuk mengelola kelas Anda secara efisien.
            </p>
            <div className="w-full max-w-xs">
                <p className="text-sm text-primary-foreground/60 mb-2">Belum punya akun?</p>
                <Button variant="outline" className="w-full rounded-full border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                    Buat Akun
                </Button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-card text-card-foreground p-8 md:p-12 flex flex-col justify-center">
             <h2 className="text-2xl font-bold text-left mb-6">Masuk</h2>
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
          </div>
        </Card>
      </div>
    </div>
  );
}
