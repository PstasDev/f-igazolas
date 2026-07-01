"use client";

import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Kbd } from "@/components/ui/kbd";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  FileText, 
  Calendar, 
  Clock, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  Home,
  Plus,
  CirclePlus
} from "lucide-react";

export default function TanuloiUtmutato() {
  const pageTitle = "Tanulói útmutató - Szent László Gimnázium F Tagozat";
  const pageDescription = "Részletes útmutató diákok számára az igazoláskezelő rendszer használatához. Új igazolás beküldése, dokumentumok csatolása, BKK/MÁV igazolások, FTV szinkronizáció és státusz követés.";
  const pageUrl = "https://igazolas.f-tagozat.hu/utmutato/tanuloi";
  const pageImage = "https://igazolas.f-tagozat.hu/og-student-guide.png";

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="diák, tanuló, útmutató, igazolás, Szent László Gimnázium, F tagozat, hiányzás, BKK, FTV, forgatás" />
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
        <meta property="og:image:alt" content="Tanulói útmutató - Igazoláskezelő rendszer" />
        <meta property="og:site_name" content="F Tagozat Igazoláskezelő" />
        <meta property="og:locale" content="hu_HU" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
        <meta name="twitter:image:alt" content="Tanulói útmutató - Igazoláskezelő rendszer" />

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
              <span className="font-semibold">Tanulói útmutató</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Tanulói útmutató</h1>
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
              Ez az útmutató segít eligazodni az igazoláskezelő rendszerben. A rendszer lehetővé teszi, 
              hogy egyszerűen és gyorsan benyújts hiányzási igazolásokat, nyomon kövesd azok státuszát, 
              és kommunikálj az osztályfőnököddel.
            </p>
          </section>

          <Separator />

          {/* Login */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </span>
              Bejelentkezés
            </h2>
            
            <div className="space-y-3 ml-10">
              <p className="text-muted-foreground">
                A rendszerbe a következő adatokkal jelentkezhetsz be:
              </p>
              
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-col items-start items-center gap-2 text-sm">
                  <span className="font-medium min-w-[120px]">Felhasználónév:</span>
                  A felhasználóneved az iskolai e-mail címed első része. Például, ha az e-mail címed minta.diak.00f@szlgbp.hu, akkor a felhasználóneved:
                  <Kbd className="text-md text-black dark:text-white">minta.diak.00f</Kbd>
                </div>
                <div className="flex flex-col items-start items-center gap-2 text-sm">
                  <span className="font-medium min-w-[120px]">Jelszó:</span>
                  <span className="text-sm text-muted-foreground">Az első jelszavadat a <strong>
                    Még nincs jelszavam</strong> feliratú gombra kattintva állíthatod be.</span>
                </div>
              </div>

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
                A bal oldali menüsávban az alábbi lehetőségek érhetők el:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <CirclePlus className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Új igazolás</p>
                    <p className="text-sm text-muted-foreground">
                        Új igazolás beküldése az osztályfőnöködnek
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Igazolások</p>
                    <p className="text-sm text-muted-foreground">
                        Az összes beküldött igazolásod és azok státusza
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* FTV Automatic Sync */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </span>
              FTV Automatikus Szinkronizálás
            </h2>
            
            <div className="space-y-4 ml-10">
              <Alert className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🎬</span>
                  </div>
                  <div className="space-y-2 flex-1">
                    <AlertTitle className="text-blue-900 dark:text-blue-100 text-lg">
                      Figyelem - Hivatalos FTV Szinkronizálás
                    </AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      A <strong>Forgatásszervezési Platformban (FTV)</strong> médiás tanár által rögzített és 
                      beosztott forgatási igazolások <strong>automatikusan szinkronizálódnak</strong> a rendszerbe. 
                      Ezeket az igazolásokat <strong>nem szükséges újra beküldened!</strong>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400">📝</span>
                  Korrekciók kezelése
                </h3>
                <div className="ml-7 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ha az FTV-ben rögzített forgatás időpontját módosítani szeretnéd, azt az 
                    <strong> FTV oldalán</strong> teheted meg, ahol megadhatod:
                  </p>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-700 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                      <div>
                        <span className="font-medium text-purple-900 dark:text-purple-100">Hány perccel korábban érkeztél</span>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          Például előkészületek, helyszínre utazás
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                      <div>
                        <span className="font-medium text-purple-900 dark:text-purple-100">Hány perccel tartott utána</span>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          Például utómunkálatok, leszerelés
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                      <div>
                        <span className="font-medium text-purple-900 dark:text-purple-100">Részletes indoklás</span>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          Minden megjegyzés látható az osztályfőnök számára
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border">
                    <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">K</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Korrekciók jelölése a rendszerben</p>
                      <p className="text-xs text-muted-foreground">
                        A korrigált forgatási igazolások <Badge variant="purple" className="inline-flex mx-1">LILA SZÍNNEL</Badge> 
                        jelennek meg a rendszerben, így könnyen felismerhető, hogy módosításra került.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Creating New Request */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                4
              </span>
              Új igazolás beküldése
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Új igazolás beküldéséhez kattints a menüben található gombra, vagy navigálj az 
                <Kbd className="mx-1">Új igazolás</Kbd> menüpontra.
              </p>

              <div className="space-y-6">
                {/* Date Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Dátum megadása</h3>
                  </div>
                  <div className="ml-7 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Válaszd ki azt a dátumot, amikor hiányoztál. Többnapos hiányzás esetén 
                      pipáld be a &quot;Többnapos hiányzás&quot; opciót, és add meg a befejező dátumot is.
                    </p>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          type="checkbox" 
                          disabled 
                          className="rounded border-gray-300" 
                        />
                        <span className="text-sm font-medium">Többnapos hiányzás</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Többnapos hiányzásnál a rendszer az egész napokat fogja figyelembe venni
                      </p>
                    </div>
                  </div>
                </div>

                {/* Period Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Órarend időszak</h3>
                  </div>
                  <div className="ml-7 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Egynapos hiányzás esetén válaszd ki azt az időszakot (órát), amikor hiányoztál. 
                      Több egymást követő óra esetén használd a csúszkát az időszak beállításához.
                    </p>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="font-medium mb-1">Példa:</p>
                      <p className="text-muted-foreground">
                        0. óra (07:30-08:15) - 2. óra (09:15-10:00)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Type Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Igazolás típusa</h3>
                  </div>
                  <div className="ml-7 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Válaszd ki, hogy milyen okból hiányoztál. A következő típusok közül választhatsz:
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-teal-700 dark:text-teal-400">Iskolaérdekű távollét</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="p-2 border border-teal-300 dark:border-teal-700 rounded flex items-center gap-2 bg-teal-50 dark:bg-teal-950/20">
                            <span className="text-lg">🎬</span>
                            <span className="text-sm font-medium">Stúdiós távollét</span>
                          </div>
                          <div className="p-2 border border-blue-300 dark:border-blue-700 rounded flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20">
                            <span className="text-lg">📺</span>
                            <span className="text-sm font-medium">Médiás távollét</span>
                          </div>
                          <div className="p-2 border border-orange-300 dark:border-orange-700 rounded flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20">
                            <span className="text-lg">🎓</span>
                            <span className="text-sm font-medium">OKTV</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-400">Igazolt hiányzás</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="p-2 border rounded flex items-center gap-2">
                            <span className="text-lg">🏥</span>
                            <span className="text-sm">Orvosi igazolás</span>
                          </div>
                          <div className="p-2 border rounded flex items-center gap-2">
                            <span className="text-lg">🚇</span>
                            <span className="text-sm">Közlekedés</span>
                          </div>
                          <div className="p-2 border rounded flex items-center gap-2">
                            <span className="text-lg">👨‍👩‍👧‍👦</span>
                            <span className="text-sm">Családi okok</span>
                          </div>
                          <div className="p-2 border rounded flex items-center gap-2">
                            <span className="text-lg">⛷️</span>
                            <span className="text-sm">Sítábor</span>
                          </div>
                          <div className="p-2 border rounded flex items-center gap-2">
                            <span className="text-lg">�️</span>
                            <span className="text-sm">Utazás</span>
                          </div>
                          <div className="p-2 border rounded flex items-center gap-2">
                            <span className="text-lg">📝</span>
                            <span className="text-sm">Igazgatói engedély</span>
                          </div>
                          <div className="p-2 border rounded flex items-center gap-2">
                            <span className="text-lg">�</span>
                            <span className="text-sm">Egyéb</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* Document Upload */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                5
              </span>
              Kép csatolása
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Az igazoláshoz támogató dokumentumot csatolhatsz képfeltöltéssel közvetlenül a rendszerbe.
              </p>

              <Alert>
                <Upload className="h-4 w-4" />
                <AlertTitle>Képfeltöltés</AlertTitle>
                <AlertDescription>
                  A dokumentumokat (pl. orvosi igazolás, közlekedési igazolás fotója) közvetlenül feltöltheted az igazoláskezelő rendszerbe.
                  Nincs szükség Google Drive-ra vagy más külső szolgáltatásra.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold text-sm">Lépések:</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Az igazolás beküldési űrlap &quot;Kép feltöltése&quot; szekciójára kattints</li>
                  <li>Válaszd ki a képet a készülékedről (JPEG, PNG vagy WebP formátum)</li>
                  <li>Ellenőrizd, hogy a fájl mérete nem haladja meg a 10 MB-ot</li>
                  <li>Küld be az igazolást — a kép automatikusan feltöltődik</li>
                </ol>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tipp:</strong> A kép csak te és az osztályfőnököd számára lesz elérhető, mások nem láthatják.
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Elfogadott formátumok:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• JPEG / JPG (.jpg, .jpeg)</li>
                  <li>• PNG (.png)</li>
                  <li>• WebP (.webp)</li>
                  <li>• Maximum fájlméret: 10 MB</li>
                </ul>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Visszafelé kompatibilitás</AlertTitle>
                <AlertDescription>
                  Korábban Google Drive linkkel csatolt dokumentumok továbbra is elérhetők maradnak.
                  Az új igazolásoknál azonban a közvetlen képfeltöltést ajánljuk.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          <Separator />

          {/* BKK Verification */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                6
              </span>
              BKK/MÁV igazolás csatolása
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Közlekedési probléma esetén a rendszer lehetővé teszi hivatalos BKK és MÁV 
                adatok csatolását az igazolásodhoz.
              </p>

              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                        Hivatalos közlekedési adatok
                      </h4>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        A rendszer valós időben lekérdezi a BKK és MÁV rendszeréből a forgalmi 
                        zavarokat, késéseket és járatinformációkat. Ezek az adatok automatikusan 
                        hitelesítettek és elfogadottak az osztályfőnök számára.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Mit csatolhatsz?</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span><strong>BKK forgalmi zavarok:</strong> Metrók, villamosok, buszok szolgáltatási problémái</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span><strong>Járművek késése:</strong> Konkrét járat aktuális késési információja</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span><strong>MÁV vonatok:</strong> Vonatok valós idejű helyzete és késések</span>
                    </li>
                  </ul>
                </div>

                <Button variant="outline" className="w-full" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  BKK/MÁV adat csatolása
                </Button>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* Status Tracking */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                7
              </span>
              Státusz követése
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Az igazolásaid státuszát a táblázatban követheted nyomon. Minden igazolás 
                három állapot egyikében lehet:
              </p>

              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Függőben</span>
                    </div>
                    <Badge variant="pending">Függőben</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Az igazolást beküldted, és az osztályfőnökre vár az elbírálás.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Elfogadva</span>
                    </div>
                    <Badge variant="approved">Elfogadva</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Az osztályfőnök elfogadta az igazolást. A hiányzás igazoltnak számít.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Elutasítva</span>
                    </div>
                    <Badge variant="rejected">Elutasítva</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Az osztályfőnök elutasította az igazolást. Vedd fel vele a kapcsolatot, különben az eKréta rendszerben igazolatlan hiányzásként fog szerepelni!
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Details View */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                8
              </span>
              Részletes nézet
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Az igazolások listájában bármelyik sorra kattintva megtekintheted a részleteket.
              </p>

              <div className="space-y-2">
                <h4 className="font-medium">Mit láthatsz a részletes nézetben?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Eye className="h-4 w-4 mt-1 text-blue-500" />
                    <span>Teljes igazolási információ (dátum, időszak, típus)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Eye className="h-4 w-4 mt-1 text-blue-500" />
                    <span>A te indoklásod és megjegyzéseid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Eye className="h-4 w-4 mt-1 text-blue-500" />
                    <span>Csatolt kép (ha van feltöltve)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Eye className="h-4 w-4 mt-1 text-blue-500" />
                    <span>BKK/MÁV igazolás részletei (ha van csatolva)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Eye className="h-4 w-4 mt-1 text-blue-500" />
                    <span>Osztályfőnök megjegyzése (ha van)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Eye className="h-4 w-4 mt-1 text-blue-500" />
                    <span>Igazolás beküldésének időpontja</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <Separator className="print-page-break" />

          {/* Tips & Best Practices */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tippek és jó gyakorlatok</h2>
            
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Minél hamarabb küld be!</AlertTitle>
                <AlertDescription>
                  Igazolásokat lehetőleg azonnal, vagy legkésőbb 1-2 napon belül küldd be 
                  a hiányzás után. Így nem lesz abból probléma, hogy egy későbbi időpontban már nem emlékszel a hiányzás okára.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Pontos indoklás</AlertTitle>
                <AlertDescription>
                  Mindig adj meg konkrét és érthető indoklást. Ez segíti az osztályfőnököt 
                  a döntésben, és gyorsítja az elbírálást.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Támogató dokumentum</AlertTitle>
                <AlertDescription>
                  Ha van orvosi papír vagy más igazolás, mindig csatold! Ez nagyban növeli 
                  az elfogadás esélyét.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>BKK/MÁV adat használata</AlertTitle>
                <AlertDescription>
                  Közlekedési probléma esetén mindig csatold a hivatalos BKK vagy MÁV adatot, 
                  ha elérhető. Ez automatikusan hitelesített információ.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Ellenőrizd az adatokat</AlertTitle>
                <AlertDescription>
                  Beküldés előtt mindig ellenőrizd, hogy a dátum, időszak és típus helyesen 
                  van-e megadva. Később nem lehet módosítani!
                </AlertDescription>
              </Alert>
            </div>
          </section>

          <Separator />

          {/* Support */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Segítség és támogatás</h2>
            
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Ha problémád van a rendszer használatával, vagy kérdésed merül fel:
              </p>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Fordulj az osztályfőnöködhöz</h4>
                <p className="text-sm text-muted-foreground">
                  Az osztályfőnökök segítenek a rendszer használatában és a technikai problémák 
                  megoldásában.
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium">Ellenőrizd az adatokat</h4>
                <p className="text-sm text-muted-foreground">
                  Gyakori hibaforrás a helytelen dátum megadás vagy nem megfelelő képformátum feltöltése. 
                  Mindig győződj meg róla, hogy minden adat helyes!
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Footer */}
          <footer className="text-center text-sm text-muted-foreground py-8">
            <p>Szent László Gimnázium F Tagozat</p>
            <p>Igazoláskezelő Rendszer - Tanulói útmutató</p>
            <p className="mt-2">© 2025 - Minden jog fenntartva</p>
          </footer>
        </div>
      </div>
    </>
  );
}
