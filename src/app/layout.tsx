
import type {Metadata} from 'next';
import { cn } from "@/lib/utils";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { GeistSans } from 'geist/font/sans';
import { ActivationProvider } from '@/hooks/use-activation';

export const metadata: Metadata = {
  title: 'Classroom Zephyr',
  description: 'A modern attendance app for teachers.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body className={cn("font-body antialiased")}>
        <ActivationProvider>
            {children}
        </ActivationProvider>
        <Toaster />
      </body>
    </html>
  );
}
