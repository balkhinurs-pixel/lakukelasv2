'use client';

import * as React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LottieWelcomeProps {
  className?: string;
}

export function LottieWelcome({ className }: LottieWelcomeProps) {
  return (
    <div className={cn("flex items-center justify-center w-full aspect-square max-w-[400px]", className)}>
      <DotLottieReact
        src="https://lottie.host/f3dc83aa-9ce8-4569-94dc-29f7c5432e6d/trasfvpT7k.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
