'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface LinkAnalysis {
  type: 'drive' | 'other';
  domain: string;
  isRecognized: boolean;
}

export interface LinkAnalyzerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

function analyzeLink(url: string): LinkAnalysis | null {
  if (!url || url.trim() === '') return null;
  
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    
    // Check for Google Drive
    if (domain.includes('drive.google.com') || domain.includes('docs.google.com')) {
      return {
        type: 'drive',
        domain: 'Google Drive',
        isRecognized: true
      };
    }
    
    // Check for common cloud storage
    if (domain.includes('dropbox.com')) {
      return { type: 'other', domain: 'Dropbox', isRecognized: true };
    }
    
    if (domain.includes('onedrive.com')) {
      return { type: 'other', domain: 'OneDrive', isRecognized: true };
    }
    
    // Generic URL
    return {
      type: 'other',
      domain: domain,
      isRecognized: false
    };
  } catch {
    return null;
  }
}

export function LinkAnalyzer({ 
  value, 
  onChange, 
  label = 'Dokumentum link',
  placeholder = 'https://...'
}: LinkAnalyzerProps) {
  const [analysis, setAnalysis] = React.useState<LinkAnalysis | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnalysis(analyzeLink(value));
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="link" className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          <span>{label}</span>
        </Label>
        <Badge variant="outline" className="ml-auto">Opcionális</Badge>
      </div>
      
      <Input
        id="link"
        type="url"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {analysis && (
        <Alert 
          variant={analysis.type === 'drive' ? 'default' : 'default'}
          className={
            analysis.type === 'drive' 
              ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
          }
        >
          <div className="flex items-start gap-2">
            {analysis.type === 'drive' ? (
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <AlertDescription>
                {analysis.type === 'drive' ? (
                  <>
                    <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      ✓ Google Drive link felismerve
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Győződj meg róla, hogy a megosztási jogosultság megfelelően be van állítva az osztályfőnököd számára.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                      Nem Google Drive link
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Ez egy {analysis.domain} link. Ellenőrizd, hogy az osztályfőnöknek van-e hozzáférése.
                    </p>
                  </>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}
