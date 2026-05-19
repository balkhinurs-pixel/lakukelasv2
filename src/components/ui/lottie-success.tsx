'use client';

import * as React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LottieSuccessProps {
  className?: string;
  size?: number;
  loop?: boolean;
}

export function LottieSuccess({ className, size = 180, loop = false }: LottieSuccessProps) {
  return (
    <div style={{ width: size, height: size }} className={cn("flex items-center justify-center shrink-0", className)}>
      <DotLottieReact
        src="https://lottie.host/445375aa-7c6a-4aad-8d7e-ccc0f7ce6cbb/nwY5J7GCLi.lottie"
        loop={loop}
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
