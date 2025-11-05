# Frontend Configuration System

## Overview

The frontend configuration system allows users to persist their preferences and settings across sessions and devices. The configuration is stored in the backend's `Profile.frontendConfig` field as a JSON object, but the structure and logic are **entirely defined by the frontend**.

## Architecture

### Backend Endpoints

Two simple endpoints manage the configuration:

```python
# GET current user's frontend config
GET /api/profiles/me/frontend-config

# POST/update current user's frontend config
POST /api/profiles/me/frontend-config
```

**Important**: The backend has NO validation or logic for the config data. It simply stores and retrieves it as a JSON object. All structure, validation, and logic are handled by the frontend.

### Frontend Components

1. **Type Definitions** (`lib/frontend-config-types.ts`)
   - Defines the `FrontendConfig` interface
   - Provides default values
   - Includes utility functions for merging and validating config

2. **Context Provider** (`app/context/FrontendConfigContext.tsx`)
   - Loads config from backend on mount
   - Provides methods to update config
   - Handles optimistic updates and error recovery
   - Merges backend config with defaults

3. **Integration Points**
   - `ThemeContext` - Uses frontend config to persist theme preference
   - `SettingsDialog` - Shows current config and allows modifications
   - `layout.tsx` - Wraps app with `FrontendConfigProvider`

## Configuration Structure

```typescript
{
  version: 1,  // For future migrations
  
  appearance: {
    themeMode: 'light' | 'dark'  // ✅ Currently implemented
  },
  
  dashboard: {
    viewMode: 'table' | 'cards',  // Future: view preference
    showArchived: boolean,         // Future: filter preference
    defaultSort: {                 // Future: sorting preference
      field: string,
      direction: 'asc' | 'desc'
    }
  },
  
  notifications: {
    enabled: boolean,              // Future: notification toggle
    statusChanges: boolean,        // Future: specific notification types
    newComments: boolean
  },
  
  experimental: {
    bkkAlerts: boolean,           // Future: feature toggles
    bkkVehicleInfo: boolean,
    ftvSync: boolean
  },
  
  preferences: {
    showTooltips: boolean,        // Future: UI preferences
    compactMode: boolean,
    language: string
  },
  
  custom: {                       // For any additional settings
    [key: string]: unknown
  }
}
```

## Current Implementation

### ✅ Implemented Features

1. **Theme Preference**
   - Stored in `config.appearance.themeMode`
   - Automatically synced when user toggles theme
   - Falls back to localStorage and system preference
   - Shows sync status in Settings dialog

### 🔄 Ready for Implementation

The structure includes sections for:
- Dashboard view preferences
- Notification settings
- Experimental feature toggles
- UI preferences

These sections have default values and type definitions, but no UI or logic yet.

## Usage Examples

### Reading Configuration

```tsx
import { useFrontendConfig } from '@/app/context/FrontendConfigContext';

function MyComponent() {
  const { config, loading } = useFrontendConfig();
  
  if (loading) return <LoadingSpinner />;
  
  const themeMode = config.appearance?.themeMode || 'light';
  // Use the config...
}
```

### Updating Configuration

```tsx
import { useFrontendConfig } from '@/app/context/FrontendConfigContext';

function MyComponent() {
  const { updateConfig } = useFrontendConfig();
  
  const handleToggleTheme = async () => {
    await updateConfig({
      appearance: {
        themeMode: 'dark'
      }
    });
  };
}
```

### Adding New Settings

1. **Update the type definition** in `lib/frontend-config-types.ts`:

```typescript
export interface FrontendConfig {
  // ...existing fields
  
  myNewSection?: {
    mySetting?: string;
  };
}

export const DEFAULT_FRONTEND_CONFIG: FrontendConfig = {
  // ...existing defaults
  
  myNewSection: {
    mySetting: 'default-value'
  }
};
```

2. **Update the merge function** if needed (for nested objects):

```typescript
export function mergeFrontendConfig(
  base: FrontendConfig,
  updates: Partial<FrontendConfig>
): FrontendConfig {
  return {
    // ...existing merges
    
    myNewSection: {
      ...base.myNewSection,
      ...updates.myNewSection,
    },
  };
}
```

3. **Use in your component**:

```tsx
const { config, updateConfig } = useFrontendConfig();
const mySetting = config.myNewSection?.mySetting || 'default';

await updateConfig({
  myNewSection: {
    mySetting: newValue
  }
});
```

## Benefits

1. **Server-Side Persistence**: Settings sync across devices
2. **Type Safety**: TypeScript definitions prevent errors
3. **Flexible**: Easy to extend without backend changes
4. **Resilient**: Falls back to defaults if config is missing or invalid
5. **Optimistic Updates**: UI updates immediately, syncs in background

## Fallback Strategy

The system has multiple fallback layers:

1. Try to load from backend
2. If backend fails, use localStorage (for theme)
3. If localStorage fails, use system preferences (for theme)
4. If all fails, use hardcoded defaults

## Future Enhancements

- Add migration system for config version changes
- Implement more settings (dashboard, notifications, etc.)
- Add export/import functionality
- Add config validation in frontend
- Add config history/undo functionality
