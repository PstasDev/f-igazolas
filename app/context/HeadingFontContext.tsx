'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useFrontendConfig } from './FrontendConfigContext';

type HeadingFont = 'serif' | 'sans-serif';

interface HeadingFontContextType {
  headingFont: HeadingFont;
  setHeadingFont: (font: HeadingFont) => Promise<void>;
}

const HeadingFontContext = createContext<HeadingFontContextType | undefined>(undefined);

export function HeadingFontProvider({ children }: { children: React.ReactNode }) {
  const [headingFont, setHeadingFontState] = useState<HeadingFont>('serif');
  const [isInitialized, setIsInitialized] = useState(false);
  const { config, updateConfig, loading } = useFrontendConfig();

  // Initialize heading font from frontend config
  useEffect(() => {
    if (loading || isInitialized) return;

    const configFont = config.appearance?.headingFont || 'serif';
    setHeadingFontState(configFont);
    
    setIsInitialized(true);
  }, [config.appearance?.headingFont, loading, isInitialized]);

  // Apply heading font to document whenever it changes
  useEffect(() => {
    const root = document.documentElement;
    
    if (headingFont === 'sans-serif') {
      // Use Noto Sans
      root.style.setProperty('--heading-font-family', '"Noto Sans", system-ui, -apple-system, sans-serif');
    } else {
      // Use Playfair Display  
      root.style.setProperty('--heading-font-family', '"Playfair Display", Georgia, serif');
    }
    
    console.log('Applied heading font:', headingFont, 'CSS var value:', root.style.getPropertyValue('--heading-font-family'));
  }, [headingFont]);

  const setHeadingFont = async (font: HeadingFont) => {
    setHeadingFontState(font);
    
    // Persist to backend via frontend config
    try {
      await updateConfig({
        appearance: {
          ...config.appearance,
          headingFont: font,
        },
      });
    } catch (error) {
      console.error('Failed to save heading font preference:', error);
      // Font is already updated locally, so just log the error
    }
  };

  return (
    <HeadingFontContext.Provider value={{ headingFont, setHeadingFont }}>
      {children}
    </HeadingFontContext.Provider>
  );
}

export function useHeadingFont() {
  const context = useContext(HeadingFontContext);
  if (context === undefined) {
    throw new Error('useHeadingFont must be used within a HeadingFontProvider');
  }
  return context;
}
