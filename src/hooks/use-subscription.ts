
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
// Untuk sekarang, kita akan mensimulasikan pengguna 'premium' untuk demonstrasi.
export const useSubscription = () => {
  // Ubah baris ini untuk mensimulasikan pengguna 'free' vs 'premium'
  const [subscription] = React.useState<Subscription>({ 
    status: 'premium', 
    planName: 'Tahunan',
    expires: new Date('2025-01-15')
  });

  const limits = TIER_LIMITS[subscription.status];

  return {
    subscription,
    limits,
    isPremium: subscription.status === 'premium',
  };
};
