import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/icons";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Classroom Zephyr</CardTitle>
          <CardDescription>Selamat datang kembali! Silakan masuk ke akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="guru@sekolah.id" required className="rounded-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input id="password" type="password" required className="rounded-full" />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full rounded-full" size="lg" asChild>
            <Link href="/dashboard">Masuk</Link>
          </Button>
          <Button variant="link" size="sm" className="w-full text-muted-foreground">
            Lupa kata sandi?
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
