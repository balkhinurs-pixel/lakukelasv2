'use client';

import * as React from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface LottieWhatsAppProps {
  className?: string;
  size?: number;
}

export function LottieWhatsApp({ className, size = 24 }: LottieWhatsAppProps) {
  const [animationData, setAnimationData] = React.useState<any>(null);

  React.useEffect(() => {
    // Memuat file JSON dari folder public secara asinkron
    fetch('/WhatsApp icon animation.json')
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Gagal memuat animasi WhatsApp:', err));
  }, []);

  if (!animationData) {
    // Fallback ke div kosong dengan ukuran yang sama saat loading
    return <div style={{ width: size, height: size }} className={className} />;
  }

  return (
    <div style={{ width: size, height: size }} className={cn("flex items-center justify-center", className)}>
      <Lottie 
        animationData={animationData} 
        loop={true} 
        style={{ width: '100%', height: '100%' }} 
      />
    </div>
  );
}
