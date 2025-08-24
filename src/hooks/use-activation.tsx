
"use client";

// This hook is no longer actively used as the Pro/Free distinction is removed.
// It is kept for reference but its provider is no longer wrapping the app.
// It's simplified to always return "Pro" status.

export const useActivation = () => {
  // All users are now considered "Pro".
  const isPro = true;

  const limits = {
    canDownloadPdf: isPro,
    canImportExport: isPro,
  };
  
  return {
      status: 'Pro' as const,
      limits,
      isPro,
  };
};
