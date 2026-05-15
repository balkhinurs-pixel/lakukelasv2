'use server';

import * as React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LottieAgendaProps {
  className?: string;
  size?: number;
}

export function LottieAgenda({ className, size = 100 }: LottieAgendaProps) {
  return (
    <div style={{ width: size, height: size }} className={cn("flex items-center justify-center shrink-0", className)}>
      <DotLottieReact
        src="https://lottie.host/3525156f-90a6-4ffc-96a7-1569253b07a3/CIwCDqrbZ6.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
