# Frontend Config Quick Reference

## Quick Start

### Get current config
```tsx
import { useFrontendConfig } from '@/app/context/FrontendConfigContext';

const { config, loading, error } = useFrontendConfig();
```

### Update config
```tsx
const { updateConfig } = useFrontendConfig();

await updateConfig({
  appearance: {
    themeMode: 'dark'
  }
});
```

### Reload config from server
```tsx
const { reloadConfig } = useFrontendConfig();

await reloadConfig();
```

## Current Settings

### ✅ Theme Mode (Implemented)
- **Path**: `config.appearance.themeMode`
- **Type**: `'light' | 'dark'`
- **Default**: `'light'`
- **Where**: Settings > Appearance

## Adding New Settings

### 1. Define Type (lib/frontend-config-types.ts)
```typescript
export interface FrontendConfig {
  myFeature?: {
    enabled?: boolean;
    option?: string;
  };
}

export const DEFAULT_FRONTEND_CONFIG: FrontendConfig = {
  myFeature: {
    enabled: true,
    option: 'default',
  },
};
```

### 2. Update Merge Function (if nested)
```typescript
export function mergeFrontendConfig(...) {
  return {
    // ...existing
    myFeature: {
      ...base.myFeature,
      ...updates.myFeature,
    },
  };
}
```

### 3. Use in Component
```tsx
function MyComponent() {
  const { config, updateConfig } = useFrontendConfig();
  
  const isEnabled = config.myFeature?.enabled ?? true;
  
  const toggle = async () => {
    await updateConfig({
      myFeature: {
        enabled: !isEnabled
      }
    });
  };
  
  return <Switch checked={isEnabled} onCheckedChange={toggle} />;
}
```

## Backend Integration

The backend endpoints are:
- `GET /api/profiles/me/frontend-config` - Get current user's config
- `POST /api/profiles/me/frontend-config` - Update current user's config

Backend has NO validation - it's pure JSON storage.

## API Client Methods

```typescript
// lib/api.ts
await apiClient.getMyFrontendConfig()
await apiClient.updateMyFrontendConfig(config)
```

## Error Handling

The context handles errors automatically:
- Failed loads: Uses DEFAULT_FRONTEND_CONFIG
- Failed updates: Reverts to previous state
- Network errors: Logged to console

```tsx
const { error } = useFrontendConfig();

if (error) {
  console.error('Config error:', error);
}
```

## Best Practices

1. **Always use defaults**: `config.myFeature?.option ?? 'fallback'`
2. **Update only changed values**: Don't send entire config
3. **Use optimistic updates**: UI updates immediately
4. **Handle loading state**: Show spinner while loading
5. **Document new settings**: Add comments in type definitions

## Migration Pattern

When changing config structure:

1. Increment version number
2. Add migration logic in FrontendConfigContext
3. Test with old and new configs

```typescript
useEffect(() => {
  if (config.version === 1) {
    // Migrate to version 2
    updateConfig({
      version: 2,
      // ...new structure
    });
  }
}, [config.version]);
```
