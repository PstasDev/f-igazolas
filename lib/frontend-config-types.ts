/**
 * Frontend Configuration Type Definitions
 * 
 * This file defines the structure of the frontend configuration stored in the backend.
 * The backend stores this as a JSON object in the Profile.frontendConfig field.
 * 
 * IMPORTANT: This structure is ONLY defined and used by the frontend.
 * The backend has NO logic or validation for this data - it simply stores it as-is.
 * 
 * Structure Guidelines:
 * - Keep configuration flat when possible for easy access
 * - Group related settings under nested objects
 * - Use clear, descriptive property names
 * - Document each property with comments
 * - Provide sensible defaults in the useFrontendConfig hook
 */

/**
 * Main Frontend Configuration Interface
 * 
 * This is the root structure stored in Profile.frontendConfig
 */
export interface FrontendConfig {
  /**
   * Version of the config structure (for future migrations)
   * Increment this when making breaking changes to the structure
   */
  version?: number;

  /**
   * Appearance and theme preferences
   */
  appearance?: {
    /**
     * User's preferred theme mode
     * @values 'light' | 'dark'
     * @default 'dark'
     */
    themeMode?: 'light' | 'dark';

    /**
     * User's preferred heading font family
     * @values 'serif' | 'sans-serif'
     * @default 'serif'
     */
    headingFont?: 'serif' | 'sans-serif';
  };

  /**
   * Experimental features toggles
   */
  experimental?: {
    /**
     * Enable BKK traffic disruption alerts
     * @default true
     */
    bkkAlerts?: boolean;

    /**
     * Enable BKK vehicle modification info
     * @default true
     */
    bkkVehicleInfo?: boolean;

    /**
     * Enable FTV Sync integration
     * @default true
     */
    ftvSync?: boolean;
  };

  /**
   * Dashboard preferences
   */
  dashboard?: {
    /**
     * Enable "Könnyű feldolgozás" smart filter mode for teachers
     * Automatically filters pending absences up to current date, sorted by date
     * @default false
     */
    smartFilter?: boolean;
  };
}

/**
 * Default configuration values
 * Used when no config exists or properties are missing
 */
export const DEFAULT_FRONTEND_CONFIG: FrontendConfig = {
  version: 1,
  appearance: {
    themeMode: 'dark',
    headingFont: 'serif',
  },
  experimental: {
    bkkAlerts: true,
    bkkVehicleInfo: true,
    ftvSync: true,
  },
  dashboard: {
    smartFilter: false,
  },
};

/**
 * Type guard to check if an object is a valid FrontendConfig
 */
export function isFrontendConfig(obj: unknown): obj is FrontendConfig {
  return obj !== null && typeof obj === 'object';
}

/**
 * Deep merge two config objects, with newer values taking precedence
 */
export function mergeFrontendConfig(
  base: FrontendConfig,
  updates: Partial<FrontendConfig>
): FrontendConfig {
  return {
    ...base,
    ...updates,
    appearance: {
      ...base.appearance,
      ...updates.appearance,
    },
    experimental: {
      ...base.experimental,
      ...updates.experimental,
    },
    dashboard: {
      ...base.dashboard,
      ...updates.dashboard,
    },
  };
}
