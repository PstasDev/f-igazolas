<div align="center">

# 🎓 Igazoláskezelő (f-igazolas)

**Kőbányai Szent László Gimnázium - F Tagozat Igazoláskezelő Rendszer**

*Központi platform hiányzások, késések és stúdiós távollétek kezelésére*

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-Backend-092E20?style=for-the-badge&logo=django)](https://github.com/PstasDev/f-igazolas-backend)

</div>

---

## 🚀 Áttekintés

Az **Igazoláskezelő (f-igazolas)** egy átfogó igazoláskezelő rendszer, amelyet kifejezetten a **Kőbányai Szent László Gimnázium F tagozata (Osztott Informatika-Média)** számára fejlesztettek. A rendszer célja, hogy központosítsa és egyszerűsítse az osztályfőnökök munkáját a különböző típusú hiányzások kezelésében.

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

#### 🚇 BKK Integráció (Kísérleti Innováció)
- 📡 **Forgalmi Zavarok** - Valós idejű BKK riasztások nyomonkövetése
- 🚍 **Jármű Információk** - Menetrend módosítások és késések hitelesítése
- ✅ **Automatikus Validáció** - Diák késések összevetése valós BKK eseményekkel

#### 🎨 Modern Felület
- 🌓 **Világos/Sötét Téma** - Egyedi témák támogatása
- 📱 **Reszponzív Design** - Mobil, tablet, desktop
- 🚦 **Közlekedési Ikonok** - Teljes BKK vonal ikonkészlet
- 🗂️ **Export/Import** - CSV, TSV és XLSX támogatás

---

## 🛠️ Technológiai Stack

### Frontend (Ez a Repository)
- **Keretrendszer:** [Next.js 15](https://nextjs.org/) Turbopack-kel
- **Nyelv:** [TypeScript 5](https://www.typescriptlang.org/)
- **Stílus:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Komponensek:** [Radix UI](https://www.radix-ui.com/)
- **Animációk:** [Framer Motion](https://www.framer.com/motion/)
- **Táblázatok:** [@tanstack/react-table](https://tanstack.com/table/)
- **Diagramok:** [Recharts](https://recharts.org/)
- **Dátumkezelés:** [date-fns](https://date-fns.org/)
- **Validáció:** [Zod](https://zod.dev/)
- **Excel Export:** [XLSX](https://sheetjs.com/)

### Backend
- **Repository:** [PstasDev/f-igazolas-backend](https://github.com/PstasDev/f-igazolas-backend)
- **Keretrendszer:** Django
- **API:** NinjaAPI
- **Adatbázis:** SQLite (vagy környezet szerinti)
- **BKK API Integráció:** GTFS-RT protokoll, GTFS protokoll, OpenData API és állandó megálló-, valamint járatinformációk

---

## 📦 Kezdő Lépések

### Előfeltételek

- Node.js 20.x vagy újabb
- npm vagy yarn vagy pnpm

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

3. **Fejlesztői szerver indítása**
```bash
npm run dev
```

4. **Böngésző megnyitása**
```
http://localhost:3000
```

### Éles Build Készítése

```bash
npm run build
npm start
```

---

## 🏗️ Projekt Struktúra

```
f-igazolas/
├── app/
│   ├── components/          # Megosztott alkalmazás komponensek
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── Navigation.tsx
│   ├── context/             # React context-ek
│   │   ├── RoleContext.tsx  # Diák/Tanár szerepkör kezelés
│   │   └── ThemeContext.tsx # Téma váltás
│   ├── dashboard/           # Fő dashboard
│   │   ├── student/        # Diák nézetek (igazolás beadás)
│   │   ├── teacher/        # Tanári nézetek (jóváhagyás, kezelés)
│   │   └── data.json       # Minta adatok
│   ├── login/              # Bejelentkezés
│   └── utmutato/           # Felhasználói útmutatók
│       ├── tanuloi/        # Diák kézikönyv
│       └── osztalyfonoki/  # Osztályfőnöki kézikönyv
├── components/
│   ├── ui/                 # Újrafelhasználható UI komponensek
│   │   ├── BKKAlertCard.tsx        # BKK forgalmi zavar kártyák
│   │   ├── BKKVerificationCard.tsx # Késés hitelesítés
│   │   ├── RouteBadge.tsx          # Járat badge-ek
│   │   └── ...
│   └── icons/              # Közlekedési ikonok
│       ├── MetroIcon.tsx   # M1, M2, M3, M4 metró
│       ├── BuszIcon.tsx    # Busz vonalak
│       ├── VillamosIcon.tsx # Villamos vonalak
│       └── ...             # Trolibusz, HÉV, hajó, vonat
├── lib/
│   ├── bkk-processor.ts    # BKK GTFS-RT adat feldolgozás
│   ├── bkk-types.ts        # TypeScript típusok a BKK API-hoz
│   ├── bkk-verification-schema.ts # Késés validációs logika
│   ├── hungarian-grammar.ts # Magyar nyelvi segédeszközök
│   ├── periods.ts          # Iskolai órarend/tanítási órák logika
│   └── api.ts              # Backend API kommunikáció
├── hooks/
│   └── use-ftv-sync.ts     # FTV forgatás szinkronizálás
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
- � Útvonalzárások, pótlóbuszok, rendkívüli események
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

Az alábbi BKK GTFS-RT végpontokat használja a backend (API kulcs szükséges - [igénylés itt](https://opendata.bkk.hu/keys/)):

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

### 🎒 Diákok (F Tagozatos Tanulók)
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

Frontend `.env.local` fájl:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# BKK API Kulcs (backend használja, opcionális frontendhez)
NEXT_PUBLIC_BKK_API_KEY=api_kulcsod_ide
```


### Vercel Telepítés

1. **Frontend telepítése:**
   - Push GitHub-ra
   - Importálás [Vercel](https://vercel.com)-be
   - Környezeti változók beállítása
   - Automatikus telepítés

2. **Backend telepítés** (ajánlott: Railway, Render, vagy VPS):
   - Django backend külön szerveren
   - Környezeti változók konfigurálása

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
- **BKK API Példák:** [`public/BKK Examples/README.md`](public/BKK%20Examples/README.md)
- **Backend Repository:** [PstasDev/f-igazolas-backend](https://github.com/PstasDev/f-igazolas-backend)

---

## 📄 Licensz

Ez a projekt a **Kőbányai Szent László Gimnázium** belső használatára készült.


---

<div align="center">

**💙 Készítette: Balla Botond (PstasDev), a 23F osztály tanulója**

**❤️ A Kőbányai Szent László Gimnázium F Tagozata számára**

[🐛 Hiba Bejelentése](https://github.com/PstasDev/f-igazolas/issues) · [💡 Funkció Kérése](https://github.com/PstasDev/f-igazolas/issues) · [📖 Backend Repo](https://github.com/PstasDev/f-igazolas-backend)


</div>
