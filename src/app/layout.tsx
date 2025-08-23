import type {Metadata} from 'next';
import { cn } from "@/lib/utils";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { GeistSans } from 'geist/font/sans';

export const metadata: Metadata = {
  title: 'LakuKelas - Sistem Manajemen Kelas Modern',
  description: 'Platform manajemen kelas digital yang dirancang khusus untuk guru Indonesia. Kelola absensi, nilai, jurnal, dan agenda kelas dengan mudah dan efisien.',
  manifest: '/manifest.json',
  keywords: ['manajemen kelas', 'absensi digital', 'guru indonesia', 'pendidikan', 'sekolah digital'],
  authors: [{ name: 'LakuKelas Team' }],
  creator: 'LakuKelas',
  publisher: 'LakuKelas',
  metadataBase: new URL('https://app.lakukelas.my.id'),
  
  // Open Graph untuk WhatsApp, Facebook, dll
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://app.lakukelas.my.id',
    siteName: 'LakuKelas',
    title: 'LakuKelas - Sistem Manajemen Kelas Modern untuk Guru Indonesia',
    description: 'Platform digital terdepan untuk manajemen kelas yang membantu guru Indonesia mengelola absensi, nilai, jurnal pembelajaran, dan agenda kelas secara efisien. Bergabunglah dengan ribuan guru yang telah merasakan kemudahan mengajar dengan teknologi modern.',
    images: [
      {
        url: '/login.png',
        width: 1200,
        height: 630,
        alt: 'LakuKelas - Sistem Manajemen Kelas Modern',
        type: 'image/png',
      },
      {
        url: '/icons-512x512.png',
        width: 512,
        height: 512,
        alt: 'Logo LakuKelas',
        type: 'image/png',
      }
    ],
  },
  
  // Twitter Cards
  twitter: {
    card: 'summary_large_image',
    site: '@lakukelas',
    creator: '@lakukelas',
    title: 'LakuKelas - Sistem Manajemen Kelas Modern',
    description: 'Platform digital untuk guru Indonesia. Kelola kelas dengan mudah: absensi, nilai, jurnal, dan agenda dalam satu aplikasi modern.',
    images: ['/login.png'],
  },
  
  // Additional meta tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // App specific
  applicationName: 'LakuKelas',
  category: 'Education',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={GeistSans.className} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="canonical" href="https://app.lakukelas.my.id" />
        
        {/* Structured Data untuk SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "LakuKelas",
              "description": "Platform manajemen kelas digital yang dirancang khusus untuk guru Indonesia",
              "url": "https://app.lakukelas.my.id",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "IDR"
              },
              "creator": {
                "@type": "Organization",
                "name": "LakuKelas Team"
              }
            })
          }}
        />
      </head>
      <body className={cn("font-body antialiased")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
