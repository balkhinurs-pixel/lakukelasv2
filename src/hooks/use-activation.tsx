
"use client";

import * as React from 'react';

// This file is no longer needed in its current form as activation
// is handled by the user's profile data from the database.
// It is kept for reference but its provider is no longer wrapping the app.
// It can be repurposed for client-side permission checks in the future if needed.

export type ActivationStatus = 'Free' | 'Pro';

// This hook can be adapted later to use profile data passed from server components.
export const useActivation = () => {
  // For now, we assume all users are Pro as per the new model.
  // This can be replaced with a context provider that gets the real status.
  const status: ActivationStatus = 'Pro';

  const limits = {
    canDownloadPdf: status === 'Pro',
    canImportExport: status === 'Pro',
  };
  
  return {
      status,
      limits,
      isPro: status === 'Pro'
  };
};
