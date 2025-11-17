'use client';

import React, { createContext, useContext } from 'react';
import { useFrontendConfig } from './FrontendConfigContext';

interface ExperimentalFeaturesContextType {
  ekretaMulasztasokEnabled: boolean;
  setEkretaMulasztasokEnabled: (enabled: boolean) => Promise<void>;
}

const ExperimentalFeaturesContext = createContext<ExperimentalFeaturesContextType | undefined>(undefined);

export function ExperimentalFeaturesProvider({ children }: { children: React.ReactNode }) {
  const { config, updateConfig } = useFrontendConfig();

  const ekretaMulasztasokEnabled = config.experimental?.ekretaMulasztasok ?? false;

  const setEkretaMulasztasokEnabled = async (enabled: boolean) => {
    await updateConfig({
      experimental: {
        ...config.experimental,
        ekretaMulasztasok: enabled,
      },
    });
  };

  return (
    <ExperimentalFeaturesContext.Provider
      value={{
        ekretaMulasztasokEnabled,
        setEkretaMulasztasokEnabled,
      }}
    >
      {children}
    </ExperimentalFeaturesContext.Provider>
  );
}

export function useExperimentalFeatures() {
  const context = useContext(ExperimentalFeaturesContext);
  if (context === undefined) {
    throw new Error('useExperimentalFeatures must be used within an ExperimentalFeaturesProvider');
  }
  return context;
}
