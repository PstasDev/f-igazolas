# Útmutatók

Ez a mappa tartalmazza az igazoláskezelő rendszer felhasználói útmutatóit.

## Elérhető útmutatók

### 1. Tanulói útmutató
- **URL:** `/utmutato/tanuloi`
- **Célcsoport:** Diákok
- **Tartalom:** Részletes útmutató a rendszer diák felületének használatához

### 2. Osztályfőnöki útmutató
- **URL:** `/utmutato/osztalyfonoki`
- **Célcsoport:** Osztályfőnökök
- **Tartalom:** Útmutató az igazolások elbírálásához és diákok kezeléséhez

## Jellemzők

- **Csak URL-en keresztül elérhető:** Ezek az oldalak nincsenek benne a navigációban, csak közvetlen URL beírásával érhetők el
- **Nyomtatható/PDF-be menthető:** Minden útmutató tartalmaz egy "Nyomtatás/PDF" gombot a tetején
- **Színmegőrzés nyomtatáskor:** A színek megmaradnak PDF-be mentéskor, ezzel könnyítve a digitális terjesztést
- **Reszponzív design:** Mind a képernyőn való olvasáshoz, mind a nyomtatáshoz optimalizálva
- **Minimális, clean design:** Hangsúly a tartalom olvashatóságán és érthetőségén

## Használat

### Diákok számára
Osszátok meg velük a linket: `https://your-domain.com/utmutato/tanuloi`

### Osztályfőnökök számára
Osszátok meg velük a linket: `https://your-domain.com/utmutato/osztalyfonoki`

### PDF készítése
1. Nyisd meg az útmutatót böngészőben
2. Kattints a "Nyomtatás / PDF" gombra
3. Válaszd a "Mentés PDF-ként" opciót
4. A színek automatikusan megmaradnak a PDF-ben

## Frissítés

Ha az útmutatókat frissíteni kell, szerkeszd a megfelelő `page.tsx` fájlt:
- Tanulói: `app/utmutato/tanuloi/page.tsx`
- Osztályfőnöki: `app/utmutato/osztalyfonoki/page.tsx`

Az útmutatók tartalmazzák az utolsó frissítés dátumát a fejlécben.
