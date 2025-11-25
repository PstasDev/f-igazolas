'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DetailsPageProps {
  indoklas: string;
  link: string;
  bkkDisruption?: {
    type: 'alert' | 'vehicle';
    data: unknown;
    description: string;
  };
  selectedTipusId: number | null;
  onNext: (data: { indoklas: string; link: string; bkkDisruption?: unknown }) => void;
  onBack: () => void;
}

export function DetailsPage({
  indoklas,
  link,
  bkkDisruption,
  onNext,
  onBack
}: DetailsPageProps) {
  const [reasonText, setReasonText] = useState(indoklas || '');
  const [linkUrl, setLinkUrl] = useState(link || '');
  const [linkType, setLinkType] = useState<'drive' | 'other' | null>(null);
  const [linkValidated, setLinkValidated] = useState(false);

  const validateLink = (url: string) => {
    if (!url) {
      setLinkType(null);
      setLinkValidated(false);
      return;
    }

    try {
      const urlObj = new URL(url);
      
      // Check if it's a Google Drive link
      if (urlObj.hostname.includes('drive.google.com') || urlObj.hostname.includes('docs.google.com')) {
        setLinkType('drive');
        setLinkValidated(true);
        toast.success('Google Drive link felismerve');
      } else {
        setLinkType('other');
        setLinkValidated(true);
        toast.info('Link érvényes, de nem Google Drive');
      }
    } catch {
      setLinkType(null);
      setLinkValidated(false);
      toast.error('Érvénytelen link formátum');
    }
  };

  const handleLinkChange = (url: string) => {
    setLinkUrl(url);
    if (url) {
      validateLink(url);
    } else {
      setLinkType(null);
      setLinkValidated(false);
    }
  };

  const handleNext = () => {
    // Validation: at least one field should be filled
    if (!reasonText.trim() && !linkUrl.trim()) {
      toast.error('Kérlek adj meg indoklást vagy tölts fel linket');
      return;
    }

    if (linkUrl && !linkValidated) {
      toast.error('Kérlek adj meg érvényes linket');
      return;
    }

    onNext({
      indoklas: reasonText.trim(),
      link: linkUrl.trim(),
      bkkDisruption,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indoklás hozzáadása</CardTitle>
        <CardDescription>
          Írjon részletes indoklást az igazoláshoz vagy töltsön fel dokumentumot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reason Textarea */}
        <div className="space-y-2">
          <Label htmlFor="reason">
            Indoklás
            <span className="text-muted-foreground text-sm ml-2">(ajánlott)</span>
          </Label>
          <Textarea
            id="reason"
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Részletes indoklás az igazoláshoz..."
            rows={5}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {reasonText.length}/500 karakter
          </p>
        </div>

        {/* Link Input */}
        <div className="space-y-2">
          <Label htmlFor="link">
            Dokumentum link
            <span className="text-muted-foreground text-sm ml-2">(opcionális)</span>
          </Label>
          <div className="relative">
            <Input
              id="link"
              type="url"
              value={linkUrl}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
            {linkValidated && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {linkType === 'drive' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Info className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            )}
            {linkUrl && !linkValidated && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            )}
          </div>
          {linkUrl && linkValidated && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Link megtekintése <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Info Alerts */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Google Drive link feltöltése:</strong>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>Töltsd fel a dokumentumot (pl. orvosi igazolás fotója) Google Drive-ra</li>
              <li>Jobb klikk → Megosztás → Link másolása</li>
              <li>Illeszd be a linket a fenti mezőbe</li>
              <li>Győződj meg róla, hogy a link jogosultságai megfelelőek (megtekinthető)</li>
            </ol>
          </AlertDescription>
        </Alert>

        {linkType === 'other' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ez a link nem Google Drive link. Ajánlott Google Drive-ot használni a dokumentumok feltöltéséhez.
            </AlertDescription>
          </Alert>
        )}

        {bkkDisruption && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>BKK közlekedési probléma észlelve:</strong> {bkkDisruption.description}
            </AlertDescription>
          </Alert>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack}>Vissza</Button>
          <Button onClick={handleNext}>Tovább</Button>
        </div>
      </CardContent>
    </Card>
  );
}
