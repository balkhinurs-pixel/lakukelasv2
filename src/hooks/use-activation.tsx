"use client";

import * as React from 'react';

// Tipe untuk status aktivasi
export type ActivationStatus = 'free' | 'pro';

// Konfigurasi batasan untuk setiap tier
const TIER_LIMITS = {
  free: {
    classes: 1,
    studentsPerClass: 10,
    journalEntries: 20,
    canDownloadPdf: false,
    canImportExport: false,
  },
  pro: {
    classes: Infinity,
    studentsPerClass: Infinity,
    journalEntries: Infinity,
    canDownloadPdf: true,
    canImportExport: true,
  },
};

// Konteks untuk berbagi status aktivasi
const ActivationContext = React.createContext<{
    status: ActivationStatus;
    limits: typeof TIER_LIMITS['free'] | typeof TIER_LIMITS['pro'];
    isPro: boolean;
    setActivationStatus: (isActivated: boolean) => void;
} | null>(null);


// Provider untuk membungkus aplikasi
export function ActivationProvider({ children }: { children: React.ReactNode }) {
    // Di aplikasi nyata, status awal akan diambil dari database atau local storage
    const [status, setStatus] = React.useState<ActivationStatus>('pro');

    const setActivationStatus = (isActivated: boolean) => {
        setStatus(isActivated ? 'pro' : 'free');
        // Di aplikasi nyata, simpan status ini ke database/local storage
    };

    const value = {
        status,
        limits: TIER_LIMITS[status],
        isPro: status === 'pro',
        setActivationStatus,
    };
    
    return (
        <ActivationContext.Provider value={value}>
            {children}
        </ActivationContext.Provider>
    );
};


// Hook untuk mendapatkan status aktivasi dan batasannya
export const useActivation = () => {
  const context = React.useContext(ActivationContext);
  if (!context) {
    throw new Error('useActivation must be used within an ActivationProvider');
  }
  return context;
};
