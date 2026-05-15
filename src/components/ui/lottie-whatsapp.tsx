'use client';

import * as React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LottieWhatsAppProps {
  className?: string;
  size?: number;
}

export function LottieWhatsApp({ className, size = 24 }: LottieWhatsAppProps) {
  return (
    <div style={{ width: size, height: size }} className={cn("flex items-center justify-center shrink-0", className)}>
      <DotLottieReact
        src="https://lottie.host/9fe5cae7-9730-461a-95f7-be0aecff8ca1/uqcnUyaQNp.json"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
