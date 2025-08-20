
"use client";

// This provider component is no longer needed as activation system is removed.
// It's kept for potential future use but does not wrap the application anymore.
// You can re-introduce it in layout.tsx if needed.

export function Providers({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
