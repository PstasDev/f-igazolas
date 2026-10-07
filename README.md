<div align="center">

# 🎓 Igazoláskezelő (f-igazolas)

**Kőbányai Szent László Gimnázium - F Szekció Igazoláskezelő Rendszer**

*Központi platform hiányzások, késések és stúdiós távollétek kezelésére*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-Backend-092E20?style=for-the-badge&logo=django)](https://github.com/PstasDev/f-igazolas-backend)

</div>

---

## 🚀 Áttekintés

Az **Igazoláskezelő (f-igazolas)** egy átfogó igazoláskezelő rendszer, amelyet kifejezetten a **Kőbányai Szent László Gimnázium F Szekciója (Osztott Informatika-Média)** számára fejlesztettek. A rendszer célja, hogy központosítsa és egyszerűsítse az osztályfőnökök munkáját a különböző típusú hiányzások kezelésében.

> Ez a repository a **frontend**. A hozzá tartozó Django/NinjaAPI backend külön projekt, a bejelentkezést pedig az iskola központi **SZLG+** SSO szolgáltatása végzi (lásd [Bejelentkezés](#-bejelentkezés)).

### 🎯 A Probléma, Amit Megold

**Korábban:**
- 📧 Hiányzások **Google Form-okon, Messengeren és Gmail-en** keresztül érkeztek be
- 🎬 **FTV Forgatásszervezési Platform** külön figyelése szükséges volt
- 📝 Minden osztálynak **külön Google Form** volt a stúdiós távollétek követésére
- ⌨️ Ezeket mind manuálisan kell rögzíteni az **eKréta Digitális Naplóba**
- 🔄 Széttagolt, nehezen követhető rendszer

**Most:**
- ✅ **Egy központi felület** minden típusú hiányzásra
- 🎬 **FTV integrált** forgatási távollétek kezelése
- 🚇 **BKK integráció** közlekedési késések automatikus hitelesítésére (kísérleti)
- 🔐 **SZLG+ egyszeri bejelentkezés (SSO)**, jelkulcs és jelszó
- 📊 Strukturált, átlátható adminisztráció

### ✨ Főbb Funkciók

#### 📋 Igazoláskezelés
- 📄 **Általános Hiányzások** - Betegség, családi okok, egyéb
- 🎬 **Stúdiós Távollétek** - FTV forgatási igazolások
- 🚇 **Közlekedési Késések** - BKK integrációval hitelesített késések
- 📊 **Központi Dashboard** - Minden igazolás egy helyen
- ✅ **Jóváhagyás/Elutasítás** - Gyors döntéshozatal

#### 👥 Szerepkörök
- 🎯 **Diák Felület** - Egyszerű igazolás beadás, státusz követés
- 👨‍🏫 **Osztályfőnöki Felület** - Áttekintés, jóváhagyás, kezelés
- 🛠️ **Admin Eszközök** - Jelszókezelés, jogosultságok, statisztikák, karbantartási mód, tanév-archiválás és további adminisztrációs felületek (`components/admin`)

#### 🔐 Bejelentkezés
- 🏫 **SZLG+ SSO** - Belépés a központi iskolai fiókkal (OpenID Connect)
- 🔑 **Jelkulcs** - Jelszó nélküli belépés ujjlenyomattal, arcfelismeréssel vagy eszköz PIN-kóddal (WebAuthn)
- 🔒 **Jelszó** - Felhasználónévvel vagy e-mail-címmel, jelszó-visszaállítással és első jelszó beállításával

#### 🚇 BKK Integráció (Kísérleti Innováció)
- 📡 **Forgalmi Zavarok** - Valós idejű BKK riasztások nyomonkövetése
- 🚍 **Jármű Információk** - Menetrend módosítások és késések hitelesítése
- ✅ **Automatikus Validáció** - Diák késések összevetése valós BKK eseményekkel

#### 🎨 Modern Felület
- 🌓 **Világos/Sötét Téma** - Egyedi témák támogatása
- 📱 **Reszponzív Design** - Mobil, tablet, desktop
- 🚦 **Közlekedési Ikonok** - Teljes BKK vonal ikonkészlet
- 🗂️ **Export/Import** - CSV, TSV és XLSX támogatás
- 🧭 **Bevezető túra** - Első használatkor végigvezeti az új felhasználót (`components/onboarding`)
- 📣 **Rendszerüzenetek és változásnapló** - A backendből érkező közlemények és újdonságok
- ⚙️ **Személyes beállítások** - A felhasználói konfiguráció a backendben tárolódik, így eszközök között is követi a felhasználót

---

## 🛠️ Technológiai Stack

### Frontend (Ez a Repository)
- **Keretrendszer:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI könyvtár:** [React 19](https://react.dev/)
- **Nyelv:** [TypeScript 5](https://www.typescriptlang.org/)
- **Stílus:** [Tailwind CSS 4](https://tailwindcss.com/) + `tw-animate-css`
- **UI Komponensek:** [Radix UI](https://www.radix-ui.com/), [Vaul](https://vaul.emilkowal.ski/), [Sonner](https://sonner.emilkowal.ski/)
- **Ikonok:** [Lucide](https://lucide.dev/), [Tabler Icons](https://tabler.io/icons)
- **Animációk:** [Framer Motion](https://www.framer.com/motion/), [Three.js](https://threejs.org/) (bejelentkező oldal háttere)
- **Táblázatok:** [@tanstack/react-table](https://tanstack.com/table/), húzással rendezés: [dnd-kit](https://dndkit.com/)
- **Diagramok:** [Recharts](https://recharts.org/)
- **Dátumkezelés:** [date-fns](https://date-fns.org/), [react-day-picker](https://daypicker.dev/)
- **Validáció:** [Zod](https://zod.dev/)
- **Témakezelés:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Excel Export:** [XLSX](https://sheetjs.com/)
- **Egyéb:** `js-cookie` (munkamenet-token), `react-markdown` + `remark-gfm` (közlemények)

### Backend
- **Repository:** [PstasDev/f-igazolas-backend](https://github.com/PstasDev/f-igazolas-backend)
- **Keretrendszer:** Django
- **API:** NinjaAPI
- **Adatbázis:** SQLite (vagy környezet szerinti)
- **BKK API Integráció:** GTFS-RT protokoll, GTFS protokoll, OpenData API és állandó megálló-, valamint járatinformációk

### Identitásszolgáltató
- **SZLG+** (`https://sso.szlg.info`) - OpenID Connect szolgáltató (Authorization Code + PKCE). A kódcserét és az ID token ellenőrzését a **backend** végzi, a frontend soha nem kezel kliensjelszót.

---

## 📦 Kezdő Lépések

### Előfeltételek

- Node.js **20.9** vagy újabb (a Next.js 16 követelménye)
- npm (vagy yarn / pnpm)
- Futó backend (alapértelmezetten `http://localhost:8000`)
- A bejelentkezéshez futó SZLG+ (alapértelmezetten `http://localhost:8002`), lásd [Bejelentkezés](#-bejelentkezés)

### Telepítés

1. **Repository klónozása**
```bash
git clone https://github.com/PstasDev/f-igazolas.git
cd f-igazolas
```

2. **Függőségek telepítése**
```bash
npm install
```

3. **Környezeti változók beállítása** (opcionális, lásd [Konfiguráció](#-konfiguráció))
```bash
cp .env.example .env.local
```

4. **Fejlesztői szerver indítása**
```bash
npm run dev
```

5. **Böngésző megnyitása**
```
http://localhost:3000
```

### Elérhető Parancsok

| Parancs | Leírás |
|---|---|
| `npm run dev` | Fejlesztői szerver Turbopack-kel (`http://localhost:3000`) |
| `npm run build` | Éles build készítése |
| `npm start` | Az éles build indítása |
| `npm run lint` | ESLint futtatása |

### Éles Build Készítése

```bash
npm run build
npm start
```

> A `next/font/google` miatt a fejlesztői szervernek és a buildnek internetkapcsolat kell a betűtípusok (Noto Sans, Playfair Display) letöltéséhez.

### Teljes Fejlesztői Környezet

A bejelentkezés három szolgáltatást igényel. Alapértelmezett portok:

| Szolgáltatás | Cím | Indítás |
|---|---|---|
| SZLG+ (SSO) | `http://localhost:8002` | `python manage.py runserver` (a SZLG+ projektben) |
| Backend (API) | `http://localhost:8000` | `python manage.py runserver` (a backend projektben) |
| Frontend | `http://localhost:3000` | `npm run dev` |

---

## 🔐 Bejelentkezés

A `/login` oldalon három belépési mód érhető el (`components/login-form.tsx`):

1. **Jelkulcs** - csak akkor jelenik meg, ha az eszköz támogatja a beépített hitelesítőt. A WebAuthn-hívásokat a `lib/passkey.ts` végzi. A jelkulcsok kezelése a Beállítások ablakban érhető el (`PasskeyAccountSection`), a dashboardon pedig a `PasskeySetupDrawer` kínálja fel a beállítást.
2. **Jelszó** - felhasználónév vagy e-mail-cím és jelszó. Itt érhető el a „Még nincs jelszavam" (első jelszó) és az „Elfelejtett jelszó?" folyamat is.
3. **SZLG+** - „Bejelentkezés SZLG+-szal" gomb.

A sikeres bejelentkezés után a backend JWT-je a `jwt_token` sütiben tárolódik (`js-cookie`), a felhasználó pedig a `/dashboard` oldalra kerül.

### SZLG+ SSO folyamat

1. A frontend a böngészőt a backend `GET /api/auth/sso/start` címére küldi.
2. A backend PKCE-vel és `state`-tel az SZLG+ bejelentkező oldalára irányít, ahol a felhasználó belép és engedélyez.
3. Az SZLG+ a backend `GET /api/auth/sso/callback` címére tér vissza `code`-dal. A backend itt cseréli le a kódot, és ellenőrzi az ID tokent.
4. A backend a `/login?sso_ticket=…` címre irányít vissza egy **egyszer használható jeggyel**.
5. A frontend a jegyet a `POST /api/auth/sso/exchange` hívással váltja be a saját JWT-re (`RoleContext.tsx`), és betölti a profilt.

- A frontend nem kezel kliensjelszót, és az URL-ből a jegyet azonnal eltávolítja.
- Hiba esetén a `/login?sso_error=<kód>` oldal magyar üzenetet jelenít meg (pl. `sso_cancelled`, `sso_email_not_verified`, `sso_account_not_linked`, `sso_token_rejected`).
- Az első SSO belépéskor a backend a **megerősített e-mail-cím** alapján köti össze az SZLG+ fiókot a helyi felhasználóval. Ha egyetlen aktív helyi felhasználó sem egyezik, a belépés `sso_account_not_linked` hibával megáll.

### SSO beállítás (backend `.env`)

Az SSO kliens adatait a **backend** tárolja, nem a frontend:

```env
SSO_ISSUER=http://localhost:8002/o          # éles: https://sso.szlg.info/o
SSO_CLIENT_ID=...
SSO_CLIENT_SECRET=...                       # az EREDETI jelszó, nem a hash!
SSO_TOKEN_AUTH_METHOD=client_secret_basic   # none | client_secret_basic | client_secret_post
SSO_SCOPES=openid profile email groups
SSO_REDIRECT_URI=http://localhost:8000/api/auth/sso/callback
SSO_FRONTEND_URL=http://localhost:3000/login
```

Az SZLG+ adminisztrátor által regisztrált kliensnél pontosan ezt az átirányítási URI-t kell megadni (éles: `https://ikapi.szlg.info/api/auth/sso/callback`).

> ⚠️ A kliensjelszót az SZLG+ csak a létrehozáskor mutatja meg nyers formában, utána hash-elve tárolja. Ha az `SSO_CLIENT_SECRET` helyére a tárolt hash kerül (`pbkdf2_sha256$…`), az SZLG+ minden kérést `invalid_client` hibával utasít el (a frontend ezt a `sso_token_rejected` üzenettel jelzi). Ilyenkor új kliensjelszót kell generálni.

---

## 🏗️ Projekt Struktúra

```
f-igazolas/
├── app/
│   ├── components/          # Megosztott alkalmazás komponensek
│   │   ├── ChangeNotePopup.tsx      # Változásnapló felugró
│   │   ├── PageTransition.tsx
│   │   ├── SettingsDialog.tsx       # Beállítások (téma, jelkulcs, jelszó, verzió)
│   │   ├── SystemMessageBanner.tsx  # Rendszerüzenetek
│   │   └── ThemeToggle.tsx
│   ├── context/             # React context-ek
│   │   ├── RoleContext.tsx            # Hitelesítés, felhasználó, szerepkör, SSO jegy beváltás
│   │   ├── ThemeContext.tsx           # Téma váltás
│   │   ├── FrontendConfigContext.tsx  # Felhasználói konfiguráció (backendben tárolva)
│   │   ├── ChangeNoteContext.tsx
│   │   ├── SystemMessageContext.tsx
│   │   ├── ExperimentalFeaturesContext.tsx
│   │   └── HeadingFontContext.tsx
│   ├── dashboard/           # Fő dashboard
│   │   ├── student/        # Diák nézetek (igazolás beadás)
│   │   ├── teacher/        # Tanári nézetek (jóváhagyás, kezelés)
│   │   ├── components/     # Dashboard-specifikus komponensek
│   │   └── data.json       # Minta adatok
│   ├── login/              # Bejelentkezés (jelkulcs, jelszó, SZLG+ SSO)
│   └── utmutato/           # Felhasználói útmutatók
│       ├── tanuloi/        # Diák kézikönyv
│       └── osztalyfonoki/  # Osztályfőnöki kézikönyv
├── components/
│   ├── ui/                 # Újrafelhasználható UI komponensek (BKK kártyák, badge-ek, ...)
│   ├── icons/              # Közlekedési ikonok (metró, busz, villamos, trolibusz, HÉV, hajó, vonat)
│   ├── admin/              # Adminisztrációs eszközök (jelszókezelés, jogosultságok, statisztikák, ...)
│   ├── onboarding/         # Bevezető túra
│   ├── login-form.tsx      # Belépési módok
│   ├── first-password-form.tsx / forgot-password-form.tsx
│   ├── passkey-setup-drawer.tsx / PasskeyAccountSection.tsx
│   ├── Hyperspeed.tsx      # Animált háttér a bejelentkező oldalon (Three.js)
│   └── ...                 # Oldalsáv, fejléc, táblázatok, diagramok
├── lib/
│   ├── api.ts              # Backend API kommunikáció (JWT süti, hibakezelés)
│   ├── config.ts           # API alap-URL feloldása a környezet alapján
│   ├── passkey.ts          # WebAuthn (jelkulcs) hívások
│   ├── bkk-processor.ts    # BKK GTFS-RT adat feldolgozás
│   ├── bkk-data-manager.ts # BKK adatok gyorsítótárazása
│   ├── bkk-types.ts        # TypeScript típusok a BKK API-hoz
│   ├── bkk-verification-schema.ts # Késés validációs logika
│   ├── periods.ts          # Iskolai órarend/tanítási órák logika
│   ├── hungarian-grammar.ts # Magyar nyelvi segédeszközök
│   └── ...                 # típusok, segédfüggvények, onboarding túrák
├── hooks/
│   ├── use-ftv-sync.ts    # FTV forgatás szinkronizálás
│   └── ...                # use-mobile, use-long-press, use-toast
├── docs/                   # Fejlesztői dokumentáció
└── public/
    ├── BKK Examples/       # Minta BKK API válaszok (fejlesztéshez)
    └── icons/              # Statikus eszközök (logo, stb.)
```

---

## 🚦 BKK Integráció (Kísérleti Innováció)

A rendszer innovatív módon integrálja a **BKK (Budapesti Közlekedési Központ) GTFS-RT API**-ját, amely egy **kísérleti funkció** a közlekedési késések automatikus hitelesítésére.

### 🎯 Funkciók

#### 1️⃣ Forgalmi Zavarok Követése
- 📡 Valós idejű riasztások lekérése szolgáltatási zavarokról
- 🚧 Útvonalzárások, pótlóbuszok, rendkívüli események
- 📍 Érintett megállók és járatok azonosítása

#### 2️⃣ Menetrend Módosítások (Késések)
- 🚇 Járművek pozíciójának és késéseinek valós idejű követése
- ⏱️ Pontos késési idők rögzítése
- 🗺️ Diák útvonalak és időzítések validálása

#### 3️⃣ Automatikus Hitelesítés
- ✅ Diák késések összevetése valós BKK eseményekkel
- 🔍 Útvonal, időpont és késési okok ellenőrzése
- 📊 Hitelesítési részletek automatikus rögzítése

### 🔗 API Végpontok

Az alábbi BKK GTFS-RT végpontokat használja a backend (API kulcs szükséges - [igénylés itt](https://opendata.bkk.hu/keys/)). A kulcsot a **backend** `BKK_TOKEN` változója tartalmazza, a frontendnek nincs szüksége rá.

```bash
# Riasztások (Forgalmi zavarok)
https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/Alerts.pb?key=API_KULCS

# Járműpozíciók
https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/VehiclePositions.pb?key=API_KULCS

# Menetrendi Frissítések (Késések)
https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/TripUpdates.pb?key=API_KULCS
```

### 📂 Fejlesztői Példák

Példa BKK API válaszok találhatók a `public/BKK Examples/` mappában:
- `Alerts.txt` - Forgalmi zavarok, figyelmeztetések
- `VehiclePositions.txt` - Járművek pozíciói
- `TripUpdates.txt` - Menetrend módosítások, késések

Ezek segítenek a fejlesztésben és tesztelésben, API kulcs nélkül is.

### 🔄 Működés

1. **Diák bejelenti** a közlekedési késést az applikációban
2. **Megadja** az érintett járatot, útvonalat és időpontot
3. **Backend lekéri** a BKK valós idejű adatokat
4. **Rendszer összekapcsolja** a bejelentést a BKK eseményekkel
5. **Automatikus hitelesítés** vagy további ellenőrzés szükségessége
6. **Osztályfőnök** látja a hitelesítési részleteket és jóváhagyja

---

## 👥 Felhasználói Szerepkörök

### 🎒 Diákok (F Szekciós Tanulók)
- 📝 **Igazolás Beadás** - Egyszerű, intuitív űrlapok
  - Általános hiányzások (betegség, családi ok, egyéb)
  - Stúdiós távollétek (FTV forgatások)
  - Közlekedési késések (BKK adatokkal)
- 📊 **Státusz Követés** - Beadott igazolások állapotának nyomon követése
- 📜 **Előzmények** - Összes korábbi igazolás megtekintése
- ✅ **Visszajelzés** - Jóváhagyási/elutasítási értesítések

### 👨‍🏫 Osztályfőnökök
- 📋 **Központi Áttekintés** - Összes diák igazolásának egy helyen való kezelése
- ✅ **Jóváhagyás/Elutasítás** - Gyors döntéshozatal részletes információkkal
- 🔍 **BKK Hitelesítés** - Közlekedési késések automatikus validációjának megtekintése
- 📤 **Export Funkció** - Adatok exportálása eKréta rögzítéshez (XLSX)
- 👥 **Diák Kezelés** - Diák adatok, FTV státusz kezelése
- 📈 **Jelentések** - Összesítések időszak szerint

### 🛠️ Adminisztrátorok
- 🔑 **Jelszókezelés** - Jelszavak generálása és visszaállítása
- 🛡️ **Jogosultságok** - Jogosultságok és tanári hozzárendelések kezelése
- 📊 **Statisztikák** - Belépések, adatbázis, API és tárhelyhasználat, jóváhagyási arányok
- 🚧 **Karbantartási mód**, időszak-konfiguráció, tanév-archiválás
- 📝 **Változásnapló** kezelése

> Az admin funkciók tervezett és még függő elemeit a [`docs/pending.md`](docs/pending.md) követi.

### 🎬 FTV Integráció
- 🎥 **Forgatási Naptár** - FTV forgatások nyomon követése
- 📅 **Automatikus Szinkronizálás** - FTV platform adatok beolvasása

---

## 🎨 Dizájn Rendszer

### Színpaletta
- **Témák**: Világos és sötét mód támogatás
- **BKK Vonalszínek:** Autentikus színek metró/villamos/busz vonalakhoz, Arculati útmutatónak megfelelő ikonok és pályaszámok

### Tipográfia
- **Szövegtörzs:** Noto Sans
- **Címsorok:** Playfair Display (elegáns talpas betű)

---

## 🔧 Konfiguráció

### Környezeti Változók

Frontend `.env.local` fájl (a minta: `.env.example`):

```env
# Opcionális API felülírás. Alapértelmezés: lásd alább.
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Az API alap-URL feloldása (`lib/config.ts`):

1. Ha be van állítva a `NEXT_PUBLIC_API_URL`, az érvényes.
2. Ha nincs, fejlesztői módban (`npm run dev`) az alapértelmezés `http://localhost:8000/api`.
3. Éles buildnél, ha az oldal `localhost`-on vagy `127.0.0.1`-en fut: `http://localhost:8000/api`.
4. Egyébként: `https://ikapi.szlg.info/api`.

A következő változókat a build automatikusan tölti ki (a beállítások ablak verzió-információjához), kézzel nem kell megadni: `NEXT_PUBLIC_APP_VERSION` (a `package.json`-ból), `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF`, `NEXT_PUBLIC_VERCEL_ENV`.

> Az SSO és a BKK kulcsok a **backend** konfigurációjában vannak, a frontend `.env` fájljába nem kerülnek.

### Vercel Telepítés

1. **Frontend telepítése:**
   - Push GitHub-ra
   - Importálás [Vercel](https://vercel.com)-be
   - Szükség esetén `NEXT_PUBLIC_API_URL` beállítása
   - Automatikus telepítés

2. **Backend telepítés** (ajánlott: Railway, Render, vagy VPS):
   - Django backend külön szerveren
   - Környezeti változók konfigurálása (SSO, BKK, e-mail, CORS)

---

## 🤝 Közreműködés

A közreműködéseket szívesen fogadjuk! Pull Request-eket várunk.

1. Fork-old a repository-t
2. Hozd létre a feature ágadat (`git checkout -b feature/UjFunkció`)
3. Commit-old a változtatásaidat (`git commit -m '✨ Új funkció hozzáadása'`)
4. Push-old az ágra (`git push origin feature/UjFunkció`)
5. Nyiss egy Pull Request-et

### 🐛 Hibajelentés

Ha hibát találsz, kérjük [nyiss egy Issue-t](https://github.com/PstasDev/f-igazolas/issues) a következő információkkal:
- Hiba leírása
- Lépések a reprodukáláshoz
- Elvárt működés
- Képernyőképek (ha releváns)

---

## 📚 Dokumentáció

- **Diák Útmutató:** [`app/utmutato/tanuloi/`](app/utmutato/tanuloi/)
- **Osztályfőnöki Útmutató:** [`app/utmutato/osztalyfonoki/`](app/utmutato/osztalyfonoki/)
- **Frontend konfigurációs rendszer:** [`docs/frontend-config-system.md`](docs/frontend-config-system.md) ([gyorsreferencia](docs/frontend-config-quickref.md))
- **Admin funkciók terve:** [`docs/admin-features-implementation.md`](docs/admin-features-implementation.md)
- **Függő funkciók:** [`docs/pending.md`](docs/pending.md)
- **BKK API Példák:** [`public/BKK Examples/README.md`](public/BKK%20Examples/README.md)
- **Backend Repository:** [PstasDev/f-igazolas-backend](https://github.com/PstasDev/f-igazolas-backend)

---

## 📄 Licensz

Ez a projekt a **Kőbányai Szent László Gimnázium** belső használatára készült.


---

<div align="center">

**💙 Készítette: Balla Botond (PstasDev), a 23F osztály tanulója**

**❤️ A Kőbányai Szent László Gimnázium F Szekciója számára**

[🐛 Hiba Bejelentése](https://github.com/PstasDev/f-igazolas/issues) · [💡 Funkció Kérése](https://github.com/PstasDev/f-igazolas/issues) · [📖 Backend Repo](https://github.com/PstasDev/f-igazolas-backend)


</div>
