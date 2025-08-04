
"use client";

import * as React from 'react';

// Tipe untuk status langganan
export type SubscriptionStatus = 'free' | 'premium';
export type SubscriptionPlanName = 'Free' | 'Semester' | 'Tahunan';


// Tipe untuk data langganan, bisa diperluas nanti
export interface Subscription {
  status: SubscriptionStatus;
  planName: SubscriptionPlanName;
  // Contoh: tanggal berakhir langganan
  expires?: Date | null;
}

// Konfigurasi batasan untuk setiap tier
const TIER_LIMITS = {
  free: {
    classes: 1,
    studentsPerClass: 10,
    journalEntries: 20,
    canDownloadPdf: false,
  },
  premium: {
    classes: Infinity,
    studentsPerClass: Infinity,
    journalEntries: Infinity,
    canDownloadPdf: true,
  },
};

// Hook untuk mendapatkan status langganan dan batasannya
// Dalam aplikasi nyata, ini akan mengambil data dari server/database
export const useSubscription = () => {
  // --- Simulasi Pengguna dengan Langganan yang Telah Berakhir ---
  // Kita set tanggal kedaluwarsa ke masa lalu untuk melihat apa yang terjadi.
  const simulatedExpiryDate = new Date();
  simulatedExpiryDate.setDate(simulatedExpiryDate.getDate() - 1); // Set ke 1 hari yang lalu

  const [simulatedUser] = React.useState<{ plan: SubscriptionPlanName, expires: Date | null }>({ 
    plan: 'Tahunan',
    expires: simulatedExpiryDate 
  });

  const [subscription, setSubscription] = React.useState<Subscription>({
    status: 'free',
    planName: 'Free',
    expires: null
  });

  React.useEffect(() => {
    const now = new Date();
    if (simulatedUser.expires && simulatedUser.expires > now) {
      // Jika langganan masih aktif
      setSubscription({
        status: 'premium',
        planName: simulatedUser.plan,
        expires: simulatedUser.expires,
      });
    } else {
      // Jika tidak ada tanggal kedaluwarsa atau sudah lewat (langganan berakhir)
      setSubscription({
        status: 'free',
        planName: 'Free',
        expires: null,
      });
    }
  }, [simulatedUser]);


  const limits = TIER_LIMITS[subscription.status];

  return {
    subscription,
    limits,
    isPremium: subscription.status === 'premium',
  };
};
