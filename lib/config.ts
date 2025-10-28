// Environment configuration
export const config = {
  api: {
    baseUrl: (() => {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        // Client-side: use environment variable or fallback based on hostname
        const envUrl = process.env.NEXT_PUBLIC_API_URL;
        if (envUrl) return envUrl;
        
        // Fallback: detect if we're on localhost or production
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:8000/api';
        }
        return 'https://ikapi.szlg.info/api';
      }
      
      // Server-side: use environment variable or production default
      return process.env.NEXT_PUBLIC_API_URL || 
             (process.env.NODE_ENV === 'development' 
               ? 'http://localhost:8000/api' 
               : 'https://ikapi.szlg.info/api');
    })(),
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Helper function to log current configuration (useful for debugging)
export const logConfig = () => {
  if (typeof window !== 'undefined') {
    console.log('🔧 API Configuration:', {
      baseUrl: config.api.baseUrl,
      environment: process.env.NODE_ENV,
      envVar: process.env.NEXT_PUBLIC_API_URL,
      hostname: window.location.hostname,
    });
  }
};