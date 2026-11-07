'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Download, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { apiClient } from '@/lib/api';
import type { IgazolasTipus } from '@/lib/types';
import { frontendIgazolasTypeCatalog, getIgazolasType } from '@/app/dashboard/types';

const CATEGORY_LABELS: Record<string, string> = {
  egeszsegugy: 'Egészségügyi',
  verseny: 'Verseny',
  kulturalis: 'Kulturális / művészeti',
  kozlekedes: 'Közlekedés',
  tanulmanyi: 'Tanulmányi',
  csaladi: 'Családi',
  egyeb: 'Egyéb',
};

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('hu-HU');
}

export function IgazolasTypeImport() {
  const [backendTypes, setBackendTypes] = useState<IgazolasTipus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedKeys, setImportedKeys] = useState<Set<string>>(() => new Set());

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setLoadingError(null);
    try {
      setBackendTypes(await apiClient.listIgazolasTipus());
    } catch (error) {
      setLoadingError(error instanceof Error ? error.message : 'Nem sikerült betölteni a backend igazolástípusait.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  const backendNames = useMemo(
    () => new Set(backendTypes.map((type) => normalizeName(type.nev))),
    [backendTypes],
  );

  const importType = async (typeKey: string) => {
    const type = frontendIgazolasTypeCatalog.find((candidate) => candidate.key === typeKey);
    if (!type) return;

    setImportingKey(typeKey);
    setImportError(null);
    try {
      await apiClient.importFrontendIgazolasType(type);
      setImportedKeys((previous) => new Set(previous).add(typeKey));
      await loadTypes();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : `Nem sikerült importálni: ${type.nev}`);
    } finally {
      setImportingKey(null);
    }
  };

  if (loading && backendTypes.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-40 items-center justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Frontend igazolástípusok importálása</CardTitle>
          <CardDescription>
            A frontend által ismert, de a backend adatbázisából hiányzó típusokat egyenként adhatod hozzá.
            Az import nem módosít meglévő típusokat.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadTypes()} disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Frissítés
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingError && (
          <Alert variant="destructive">
            <AlertDescription>{loadingError}</AlertDescription>
          </Alert>
        )}
        {importError && (
          <Alert variant="destructive">
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground">
          Importált típusok a <strong>Jogok</strong> lapon automatikusan megjelennek a jogosultsági mátrixban.
          A Médiás Távollét csak F tagozatú osztályokhoz használható.
        </p>
        <div className="divide-y rounded-md border">
          {frontendIgazolasTypeCatalog.map((type) => {
            const exists = backendNames.has(normalizeName(type.nev)) || importedKeys.has(type.key);
            const isImporting = importingKey === type.key;
            return (
              <div key={type.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="text-xl" aria-hidden="true">{getIgazolasType(type.nev).emoji}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{type.nev}</p>
                      <Badge variant="outline">{CATEGORY_LABELS[type.category] || type.category}</Badge>
                      <Badge variant="secondary">{type.beleszamit ? 'Beleszámít' : 'Nem számít bele'}</Badge>
                      {type.iskolaerdeku && <Badge variant="secondary">Iskolaérdekű</Badge>}
                      {type.requires_studios && <Badge variant="secondary">Stúdiós szükséges</Badge>}
                      {type.available_tagozat && <Badge variant="secondary">{type.available_tagozat} tagozat</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{type.leiras}</p>
                  </div>
                </div>
                {exists ? (
                  <Badge variant="secondary" className="w-fit shrink-0 gap-1">
                    <Check className="h-3.5 w-3.5" /> Backendben elérhető
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={() => void importType(type.key)}
                    disabled={Boolean(importingKey)}
                  >
                    {isImporting ? <Spinner className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                    Importálás
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
