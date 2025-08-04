
"use client";

import * as React from 'react';

// Tipe untuk status langganan
export type SubscriptionStatus = 'free' | 'premium';

// Tipe untuk data langganan, bisa diperluas nanti
export interface Subscription {
  status: SubscriptionStatus;
  // Contoh: tanggal berakhir langganan
  // expires?: Date;
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
// Untuk sekarang, kita akan menggunakan state sederhana dan menganggap defaultnya 'free'
export const useSubscription = () => {
  // Untuk simulasi, kita bisa menggunakan state atau context.
  // Di sini kita hardcode sebagai 'free' untuk demonstrasi.
  const [subscription] = React.useState<Subscription>({ status: 'free' });

  const limits = TIER_LIMITS[subscription.status];

  return {
    subscription,
    limits,
    isPremium: subscription.status === 'premium',
  };
};

