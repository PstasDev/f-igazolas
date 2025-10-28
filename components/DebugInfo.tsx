'use client';

import { useEffect } from 'react';
import { config, logConfig } from '@/lib/config';

export default function DebugInfo() {
  useEffect(() => {
    // Log configuration in development or when debugging
    if (process.env.NODE_ENV === 'development' || 
        typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      logConfig();
    }
  }, []);

  // Only show debug info in development or when debug param is present
  if (process.env.NODE_ENV !== 'development' && 
      !(typeof window !== 'undefined' && window.location.search.includes('debug=true'))) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-50 max-w-xs">
      <div><strong>API URL:</strong> {config.api.baseUrl}</div>
      <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
      <div><strong>Env Var:</strong> {process.env.NEXT_PUBLIC_API_URL || 'undefined'}</div>
      {typeof window !== 'undefined' && (
        <div><strong>Hostname:</strong> {window.location.hostname}</div>
      )}
    </div>
  );
}