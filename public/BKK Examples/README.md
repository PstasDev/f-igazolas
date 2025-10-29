# BKK Examples

Ebben a mappában példafájlok találhatóak, melyek valódi válaszok a BKK GTFS-RT API-jából. Ezek a fájlok segíthetnek a fejlesztőknek megérteni, hogyan néznek ki a különböző API válaszok, és hogyan lehet azokat feldolgozni.

## BKK Adatok célja

A projektben a valós idejű BKK adatok felhasználásra kerülnek a közlekedési késések és zavarok hitelesített igazolására. 

## Fájlok

- `Alerts.txt`: Ez a fájl a BKK GTFS-RT API-jából származó figyelmeztetéseket tartalmazza. Ezek a figyelmeztetések információkat nyújtanak a szolgáltatási zavarokról, útlezárásokról és egyéb fontos közlekedési információkról.
- `VehiclePositions.txt`: Ez a fájl a BKK GTFS-RT API-jából származó járműpozíciókat tartalmazza. Ezek az adatok információkat nyújtanak a járművek aktuális helyzetéről és állapotáról.
- `TripUpdates.txt`: Ez a fájl a BKK GTFS-RT API-jából származó útvonalfrissítéseket tartalmazza. Ezek az adatok információkat nyújtanak az útvonalak változásairól, késésekről és egyéb fontos információkról.

## Valós idejű adatok

A valós idejű adatokat ezen rendszerben a backend lekéri a BKK GTFS-RT API-jából, és azokat feldolgozza a megfelelő komponensek számára. A példafájlok segítenek megérteni, hogyan néznek ki ezek az adatok, és hogyan lehet azokat hatékonyan felhasználni a fejlesztés során.

Az adatokat lekérni a következő API végpontokon keresztül lehet, API kulcs birtokában ([igénylés itt](https://opendata.bkk.hu/keys/)):

- Jármű pozíciók
    - fejlesztéshez: ```https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/VehiclePositions.pb?key=IGÉNYELT_KULCS```
    - hibakereséshez: ```https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/VehiclePositions.txt?key=IGÉNYELT_KULCS```
- Menet módosítások
    - fejlesztéshez: ```https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/TripUpdates.pb?key=IGÉNYELT_KULCS```
    - hibakereséshez: ```https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/TripUpdates.txt?key=IGÉNYELT_KULCS```
- Zavarok
    - fejlesztéshez: ```https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/Alerts.pb?key=IGÉNYELT_KULCS```
    - hibakereséshez: ```https://go.bkk.hu/api/query/v1/ws/gtfs-rt/full/Alerts.txt?key=IGÉNYELT_KULCS```

## Fontos megjegyzés
A valós idejű adatok dinamikusan változnak, ezért a példafájlokban található adatok eltérhetnek a tényleges API válaszoktól. A példafájlok célja, hogy segítsék a fejlesztőket az adatok struktúrájának és formátumának megértésében.

## Fájlok dekódolása

A fájlokban található adatok, mint:
    - Megállók azonosítói
    - Vonalak azonosítói

mind olyan adatok, melyek részletes, ember által olvasható formátumban is elérhetőek a BKK GTFS adatcsomagjában, mely letölthető innen: [BKK GTFS Adatcsomag](https://opendata.bkk.hu/dataset/gtfs).