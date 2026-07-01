"use client";

import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Kbd } from "@/components/ui/kbd";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  Users,
  Eye,
  Home,
  Search,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";

export default function OsztalyfonokiUtmutato() {
  const pageTitle = "Osztályfőnöki útmutató - Szent László Gimnázium F Tagozat";
  const pageDescription = "Átfogó útmutató osztályfőnökök számára az igazoláskezelő rendszer használatához. Gyors műveletek, részletes elbírálás, hivatalos igazolások kezelése és diákok adminisztrációja.";
  const pageUrl = "https://igazolas.f-tagozat.hu/utmutato/osztalyfonoki";
  const pageImage = "https://igazolas.f-tagozat.hu/og-teacher-guide.png";

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="osztályfőnök, útmutató, igazolás, Szent László Gimnázium, F tagozat, tanár, elbírálás, hiányzás kezelés" />
        <meta name="author" content="Szent László Gimnázium F Tagozat" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Osztályfőnöki útmutató - Igazoláskezelő rendszer" />
        <meta property="og:site_name" content="F Tagozat Igazoláskezelő" />
        <meta property="og:locale" content="hu_HU" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        <meta name="twitter:image:alt" content="Osztályfőnöki útmutató - Igazoláskezelő rendszer" />

        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="canonical" href={pageUrl} />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Navigation Bar */}
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Osztályfőnöki útmutató</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Osztályfőnöki útmutató</h1>
            <p className="text-xl text-muted-foreground">
              Szent László Gimnázium F Tagozat - Igazoláskezelő Rendszer
            </p>
            <p className="text-sm text-muted-foreground">
              Utoljára frissítve: 2026. július 1.
            </p>
          </div>

          <Separator />

          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Bevezetés</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ez az útmutató osztályfőnökök számára készült, hogy hatékonyan használhassák az 
              igazoláskezelő rendszert. A rendszer lehetővé teszi a diákok hiányzási igazolásainak 
              gyors elbírálását, diákok kezelését, és részletes statisztikák megtekintését.
            </p>
          </section>

          <Separator />

          {/* Login */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </span>
              Bejelentkezés és hozzáférés
            </h2>
            
            <div className="space-y-3 ml-10">
              <p className="text-muted-foreground">
                Az osztályfőnöki jogosultság automatikusan beállításra kerül, ha legalább egy 
                osztály osztályfőnökeként vagy regisztrálva a rendszerben.
              </p>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Osztályfőnöki jogosultság</AlertTitle>
                <AlertDescription>
                  Az osztályfőnöki szerepkör automatikusan aktiválódik, amikor legalább egy 
                  osztályhoz osztályfőnökként hozzá vagy rendelve. Csak a saját osztályod 
                  diákjainak igazolásait látod és kezelheted.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          <Separator />

          {/* Dashboard Overview */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </span>
              Irányítópult áttekintése
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                A bal oldali menüsávban az alábbi funkciók érhetők el:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <FileText className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Összes igazolás</p>
                    <p className="text-sm text-muted-foreground">
                      Teljes áttekintés minden igazolásról
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Diákok kezelése</p>
                    <p className="text-sm text-muted-foreground">
                      Osztályod diákjainak listája
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* Quick Actions */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </span>
              Gyors műveletek
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Az igazolások listájában minden sornál találhatók gyors műveleti gombok az 
                azonnali elbíráláshoz.
              </p>

              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="outline" className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/20">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20">
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="font-medium">Gyors műveleti gombok</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span><strong>Zöld gomb:</strong> Igazolás jóváhagyása</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span><strong>Piros gomb:</strong> Igazolás elutasítása)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span><strong>Kék gomb:</strong> Visszahelyezés függőben állapotba</span>
                    </li>
                  </ul>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Gyors jóváhagyás</AlertTitle>
                  <AlertDescription>
                    A gyors műveleti gombokkal egyetlen kattintással elbírálhatod az igazolásokat. 
                    A részletes nézetre kattintva további információkat láthatsz és megjegyzést 
                    is fűzhetsz hozzá.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </section>

          <Separator />

          {/* Detailed Review */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                4
              </span>
              Részletes elbírálás
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Bármelyik igazolásra kattintva megnyílik a részletes nézet, ahol minden 
                információt láthatsz és megjegyzést is fűzhetsz hozzá.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium">Mit látsz a részletes nézetben?</h4>
                
                <div className="space-y-2">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Diák információk</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Diák neve és osztálya</li>
                      <li>• Igazolás típusa (orvosi, közlekedési, stb.)</li>
                      <li>• Dátum és időszak (órarend szerint)</li>
                      <li>• Diák indoklása és megjegyzései</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Támogató dokumentumok</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Feltöltött kép (JPEG/PNG/WebP, ha van)</li>
                      <li>• Google Drive dokumentum link (régi igazolásoknál)</li>
                      <li>• BKK/MÁV hivatalos igazolás (ha van csatolva)</li>
                      <li>• FTV (Forgatásszervezési Platform) automatikus szinkronizálás</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Elbírálási lehetőségek</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Osztályfőnöki megjegyzés hozzáadása</li>
                      <li>• Jóváhagyás, elutasítás vagy függőben tartás</li>
                      <li>• Rögzítési időpont megtekintése</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Megjegyzés hozzáadása</AlertTitle>
                  <AlertDescription>
                    Elutasítás esetén mindig adj meg konkrét indoklást a megjegyzés mezőben, 
                    hogy a diák megértse az okot!
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* BKK/FTV Verification */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                5
              </span>
              Hivatalos igazolások kezelése
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                A rendszer két típusú hivatalos, automatikusan hitelesített igazolást támogat:
              </p>

              <div className="space-y-3">
                {/* BKK/MAV */}
                <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      🚇
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                        BKK/MÁV hivatalos közlekedési adatok
                      </h4>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        A diák közvetlenül a BKK/MÁV rendszerből lekérdezett forgalmi zavart, 
                        késést vagy járatinformációt csatolt. Ezek az adatok automatikusan 
                        hitelesítettek és megbízhatóak.
                      </p>
                      <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                        <p>✓ Automatikus időbélyeg és lokáció</p>
                        <p>✓ Hivatalos BKK/MÁV adatforrás</p>
                        <p>✓ Módosíthatatlan bizonyíték</p>
                      </div>
                      <Badge variant="outline" className="mt-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700">
                        ✅ Hivatalos adat
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* FTV */}
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      🎬
                    </div>
                    <div className="space-y-2 flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        FTV - Forgatásszervezési Platform
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        A médiatanár által jóváhagyott forgatási engedélyek automatikusan 
                        szinkronizálódnak a rendszerbe. Ezek előre elbírált, elfogadott 
                        igazolásként jelennek meg.
                      </p>
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <p>✓ Médiatanár által előzetesen engedélyezett</p>
                        <p>✓ Automatikus szinkronizálás</p>
                        <p>✓ Produktum és csapat információk</p>
                      </div>
                      <Badge variant="outline" className="mt-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                        ✅ Média tanár által igazolva
                      </Badge>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Hivatalos igazolások kezelése</AlertTitle>
                  <AlertDescription>
                    A hivatalos igazolásokat a rendszer automatikusan validálja. FTV esetén 
                    a média tanár már engedélyezte a hiányzást, BKK/MÁV esetén pedig hivatalos 
                    közlekedési adatokról van szó. Mindkettő erős támogató bizonyíték.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* Students Management */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                6
              </span>
              Diákok kezelése
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                A &quot;Diákok kezelése&quot; menüpontban részletes áttekintést kapsz az osztályod minden 
                diákjáról és az igazolásaikról.
              </p>

              <div className="space-y-3">
                <h4 className="font-medium">Elérhető funkciók:</h4>
                
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Keresés és szűrés</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Név vagy felhasználónév alapján keresd meg a diákokat. Szűrhetsz 
                      státusz szerint is (függőben, aktív diákok).
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Részletes diák profil</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Minden diákra kattintva megtekintheted az összes igazolását és alapadatait.
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Statisztikák</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Láthatod minden diáknál az összes, függőben lévő, jóváhagyott és 
                      elutasított igazolások számát.
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Export funkcióval</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Exportálhatod az adatokat Excel formátumban jelentések készítéséhez.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Diák profil nézetben:</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Teljes igazolás történet</li>
                    <li>• Státusz szerinti csoportosítás</li>
                    <li>• Időszak alapú szűrés</li>
                    <li>• Összes elbírált és függőben lévő kérelem</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Filtering and Search */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                7
              </span>
              Szűrés és keresés
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Mindkét táblázatban (igazolások és diákok) hatékony keresési és szűrési 
                lehetőségek állnak rendelkezésre.
              </p>

              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-900 dark:text-green-100">Könnyű feldolgozás</span>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                    Egy kattintással aktiválhatod a gyors feldolgozási módot, amely automatikusan 
                    beállítja a leggyakrabban használt szűrőket: csak függőben lévő, múltbeli 
                    igazolások, dátum szerint rendezve.
                  </p>
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                      ✓ Státusz: Függőben<br/>
                      ✓ Dátum: Múltbeli (mai napig)<br/>
                      ✓ Rendezés: Dátum szerint növekvő
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Szöveges keresés</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    A keresőmezőbe írva azonnal szűrheted a listát név, osztály vagy egyéb 
                    adatok alapján.
                  </p>
                  <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Keresés név szerint...</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Státusz szűrés</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    A legördülő menükből választva szűkítheted a listát státusz szerint:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="pending">Függőben</Badge>
                    <Badge variant="approved">Jóváhagyva</Badge>
                    <Badge variant="rejected">Elutasítva</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Rendezés</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bármelyik oszlop fejlécére kattintva rendezheted a listát növekvő vagy 
                    csökkenő sorrendben.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* Timetable and Calendar Display */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                8
              </span>
              Órarend és naptár megjelenítés
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                A rendszer vizuálisan ábrázolja az érintett órákat és napokat színkódolt 
                jelölésekkel, amelyek azonnal jelzik az igazolás státuszát.
              </p>

              <div className="space-y-4">
                {/* Single Day - Timetable Display */}
                <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/30 dark:bg-blue-950/20">
                  <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
                    Egynapos hiányzás - Órarend nézet
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Az érintett órákat színes négyzetekkel jelöljük a csengetési rend szerint 
                    (0-8. óra). Minden órára kattintva részletes információt látsz.
                  </p>
                  
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                    <div className="flex gap-2 flex-wrap justify-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border">
                        0
                      </span>
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/50">
                        1
                      </span>
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/50">
                        2
                      </span>
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-purple-500 text-white shadow-lg shadow-purple-500/50">
                        3
                      </span>
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border">
                        4
                      </span>
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border">
                        5
                      </span>
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border">
                        6
                      </span>
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border">
                        7
                      </span>
                      <span className="inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border">
                        8
                      </span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Példa: 1-2. óra függőben, 3. óra diák korrekció
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h5 className="font-medium text-sm">Csengetési rend:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-muted/30 rounded">0. óra: 07:30-08:15</div>
                      <div className="p-2 bg-muted/30 rounded">1. óra: 08:25-09:10</div>
                      <div className="p-2 bg-muted/30 rounded">2. óra: 09:20-10:05</div>
                      <div className="p-2 bg-muted/30 rounded">3. óra: 10:20-11:05</div>
                      <div className="p-2 bg-muted/30 rounded">4. óra: 11:15-12:00</div>
                      <div className="p-2 bg-muted/30 rounded">5. óra: 12:20-13:05</div>
                      <div className="p-2 bg-muted/30 rounded">6. óra: 13:25-14:10</div>
                      <div className="p-2 bg-muted/30 rounded">7. óra: 14:20-15:05</div>
                      <div className="p-2 bg-muted/30 rounded">8. óra: 15:15-16:00</div>
                    </div>
                  </div>
                </div>

                {/* Multi-day Calendar Display */}
                <div className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/30 dark:bg-purple-950/20">
                  <h4 className="font-semibold mb-3 text-purple-900 dark:text-purple-100">
                    Többnapos hiányzás - Naptár nézet
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Hosszabb távollét esetén a rendszer naptár formában jeleníti meg az 
                    érintett napokat, ahol minden nap színkódja mutatja a státuszt.
                  </p>
                  
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                    <div className="flex flex-col gap-1 w-fit mx-auto">
                      {/* Day headers */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9">H</div>
                        <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9">K</div>
                        <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9">Sze</div>
                        <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9">Cs</div>
                        <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9">P</div>
                        <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9">Szo</div>
                        <div className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9">V</div>
                      </div>
                      
                      {/* Calendar week example */}
                      <div className="grid grid-cols-7 gap-1">
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">1</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">2</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-green-500 text-white shadow-lg shadow-green-500/50">3</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-green-500 text-white shadow-lg shadow-green-500/50">4</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-green-500 text-white shadow-lg shadow-green-500/50">5</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">6</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">7</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-green-500 text-white shadow-lg shadow-green-500/50">8</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-green-500 text-white shadow-lg shadow-green-500/50">9</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">10</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">11</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">12</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">13</span>
                        <span className="inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">14</span>
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Példa: 6 napos hiányzás (3-8. nap), jóváhagyott státusszal
                    </p>
                  </div>
                </div>

                {/* Color Legend */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    Színkódok magyarázata
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg bg-blue-500 text-white shadow-sm">0</span>
                      <span className="text-sm font-medium">Függőben / FTV importált</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg bg-purple-500 text-white shadow-sm">0</span>
                      <span className="text-sm font-medium">Diák korrekció</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg bg-green-500 text-white shadow-sm">0</span>
                      <span className="text-sm font-medium">Jóváhagyva</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg bg-red-500 text-white shadow-sm">0</span>
                      <span className="text-sm font-medium">Elutasítva</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border">0</span>
                      <span className="text-sm font-medium">Nincs hiányzás</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Diák korrekció (lila szín)</AlertTitle>
                  <AlertDescription>
                    Ha a diák az FTV időszakhoz képest több órát is jelölt (pl. előtte vagy 
                    utána legalább 45 percet), akkor ezek az órák lila színnel jelennek meg, 
                    és osztályfőnöki jóváhagyásra várnak. Ez a &quot;diák korrekció&quot; funkció.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* Absence Types */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                9
              </span>
              Igazolástípusok
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                A rendszerben két fő kategória különböztetendő meg: iskolaérdekű és egyéb távollét.
              </p>

              <div className="space-y-4">
                {/* School-interest absences */}
                <div className="p-4 border-2 border-teal-300 dark:border-teal-700 rounded-lg bg-teal-50 dark:bg-teal-950/20">
                  <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Iskolaérdekű távollét
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🎬</span>
                      <span className="font-medium">Stúdiós távollét</span>
                      <span className="text-xs text-muted-foreground">- Stúdió keretein belüli tevékenység</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">📺</span>
                      <span className="font-medium">Médiás távollét</span>
                      <span className="text-xs text-muted-foreground">- Média tagozattal kapcsolatos tevékenység</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🎓</span>
                      <span className="font-medium">OKTV</span>
                      <span className="text-xs text-muted-foreground">- Országos Középiskolai Tanulmányi Verseny</span>
                    </div>
                  </div>
                </div>

                {/* Regular absences */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Igazolt hiányzás</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏥</span>
                      <span>Orvosi igazolás</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚇</span>
                      <span>Közlekedés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👨‍👩‍👧‍👦</span>
                      <span>Családi okok</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⛷️</span>
                      <span>Sítábor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏖️</span>
                      <span>Utazás</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <span>Igazgatói engedély</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <span>Egyéb</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Best Practices */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Jó gyakorlatok</h2>
            
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Gyors reagálás</AlertTitle>
                <AlertDescription>
                  Igyekezz minél hamarabb elbírálni a beérkező igazolásokat, hogy a diákok 
                  gyorsan visszajelzést kapjanak.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Konstruktív visszajelzés</AlertTitle>
                <AlertDescription>
                  Elutasítás esetén mindig adj meg konkrét, érthető indoklást a megjegyzés 
                  mezőben. Segíts a diáknak megérteni, mit kellett volna másképp tennie.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Dokumentumok ellenőrzése</AlertTitle>
                <AlertDescription>
                  Ha a diák képet töltött fel, a &quot;Melléklet megtekintése&quot; gombra kattintva megtekintheted.
                  Régi igazolásoknál Google Drive link is szerepelhet — azt szintén ugyanitt érheted el.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Rendszeres ellenőrzés</AlertTitle>
                <AlertDescription>
                  Naponta többször nézd meg a &quot;Ellenőrzésre vár&quot; menüpontot, hogy ne maradjon 
                  le feldolgozatlan kérelem.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Statisztikák használata</AlertTitle>
                <AlertDescription>
                  A diák profilokban látható statisztikák segítenek azonosítani a gyakori 
                  hiányzókat vagy mintázatokat.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* Keyboard Shortcuts */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Gyorsbillentyűk és tippek</h2>
            
            <div className="space-y-3 ml-4">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Navigáció</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Keresés aktiválása</span>
                    <div className="flex gap-1">
                      <Kbd>Ctrl</Kbd>
                      <span>+</span>
                      <Kbd>F</Kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Oldal frissítése</span>
                    <Kbd>F5</Kbd>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Hasznos tippek</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>
                      A táblázat soraira kattintva nyílik meg a részletes nézet
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>
                      A gyors műveleti gombok azonnal mentik az állapotot
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>
                      Az export gomb Excel fájlt készít a kiválasztott adatokból
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          {/* Troubleshooting */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Gyakori problémák</h2>
            
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Nem látom a diák igazolását</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Ellenőrizd:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>A megfelelő szűrési beállítások vannak-e aktívak?</li>
                  <li>A keresőmezőben nincs-e szűrő kifejezés?</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">A feltöltött kép nem nyílik meg</h4>
                <p className="text-sm text-muted-foreground">
                  Ha a diák által feltöltött kép nem jeleníthető meg, kérd meg a diákot, hogy töltse fel újra a képet JPEG, PNG vagy WebP formátumban, legfeljebb 10 MB méretben.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Téves döntés javítása</h4>
                <p className="text-sm text-muted-foreground">
                  Ha véletlenül jóváhagytál vagy elutasítottál egy igazolást, használd a 
                  kék gombot (óra ikon) a visszaállításhoz függőben állapotra, majd 
                  elbírálhatod újra.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Support */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Segítség és támogatás</h2>
            
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Ha technikai problémád van a rendszer használatával:
              </p>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Fordulj az IT támogatáshoz</h4>
                <p className="text-sm text-muted-foreground">
                  Technikai hibák, hozzáférési problémák vagy rendszerhiba esetén jelentsd 
                  az applikáció adminisztrátorainak, üzemeltetőinek vagy fejlesztőinek.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Útmutató anyagok</h4>
                <p className="text-sm text-muted-foreground">
                  Ez az útmutató mindig elérhető a <Kbd>/utmutato/osztalyfonoki</Kbd> címen, 
                  és nyomtatható/PDF formátumban is menthető.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Footer */}
          <footer className="text-center text-sm text-muted-foreground py-8">
            <p>Szent László Gimnázium F Tagozat</p>
            <p>Igazoláskezelő Rendszer - Osztályfőnöki útmutató</p>
            <p className="mt-2">© 2025 - Minden jog fenntartva</p>
          </footer>
        </div>
      </div>
    </>
  );
}
