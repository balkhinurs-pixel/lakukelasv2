'use client';

import * as React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

interface LottieSchoolHolidayProps {
  className?: string;
  size?: number;
}

export function LottieSchoolHoliday({ className, size = 100 }: LottieSchoolHolidayProps) {
  return (
    <div style={{ width: size, height: size }} className={cn("flex items-center justify-center shrink-0", className)}>
      <DotLottieReact
        src="https://lottie.host/3a6c7be9-b85a-48a1-b3a7-698e8df05116/cizMtFJwkU.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
