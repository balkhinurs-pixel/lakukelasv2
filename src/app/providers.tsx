"use client";

import { ActivationProvider } from "@/hooks/use-activation.tsx";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ActivationProvider>
            {children}
        </ActivationProvider>
    );
}
