# AI Home Inventory – Prototyp

Grundarchitektur für die im Konzept beschriebene App: Räume filmen/fotografieren,
Gegenstände automatisch per KI erkennen, als Inventarliste speichern.

## Techstack & Begründung

| Bereich | Wahl | Warum |
|---|---|---|
| App-Framework | **React Native + Expo** (TypeScript) | Eine Codebasis für iOS/Android, läuft direkt über die **Expo Go**-App auf deinem iPhone – kein Xcode-Build für die ersten Wochen nötig. Auf dem Mac mit VS Code sehr angenehm (Hot Reload, TS-Autocomplete). |
| Backend | **Supabase** | Postgres-Datenbank, Auth (Magic Link) und Datei-Storage aus einer Hand, grosszügiges Gratis-Tier, Row-Level-Security direkt in SQL – kein eigenes Backend nötig für den Prototyp. |
| Objekterkennung | **Google Gemini API** (`gemini-3.5-flash`, via Google AI Studio) | Siehe unten. |
| State | **Zustand** | Minimaler Boilerplate im Vergleich zu Redux, reicht für den App-State eines Prototyps völlig aus. |
| Navigation | **React Navigation** (Native Stack) | Der Quasi-Standard in der RN-Welt, type-safe mit TypeScript. |

## Warum Gemini für die Objekterkennung?

Du wolltest einen **einfachen, kostenlosen** Dienst, der gut in Objekterkennung ist. Kurze Einordnung:

- **Klassische Vision-APIs** (z.B. Google Cloud Vision, AWS Rekognition) liefern gute
  Bounding-Boxes und generische Labels ("Fernseher", "Möbel"), aber **keine** verlässliche
  Marken-/Modellerkennung oder strukturierte Aufbereitung – dafür bräuchtest du zusätzliche Logik.
- **Gemini** (wie auch GPT-4o/4.1 Vision) ist ein multimodales Sprachmodell: Es sieht das Bild
  UND kann direkt strukturiertes JSON zurückgeben ("LG OLED TV", Kategorie, Marke, geschätzter
  Wert in CHF) – genau das, was die App laut Konzept braucht.
- **Kostenpunkt:** Google AI Studio bietet für `gemini-3.5-flash` einen dauerhaft kostenlosen
  Tier ohne Kreditkarte (Stand Juli 2026 u.a. 1'500 Requests/Tag, 15 Requests/Minute – für
  einen Prototyp mit gelegentlichem Scannen mehr als ausreichend). Google darf dabei allerdings
  die Anfragen zur Modellverbesserung nutzen; für einen echten Produktivbetrieb später auf den
  bezahlten Tier oder Vertex AI wechseln, wo das nicht der Fall ist.
- **Alternative, falls Gemini mal nicht passt:** Roboflow (gutes Gratis-Tier, spezialisiert auf
  klassische Objekterkennung/Bounding-Boxes) oder ein lokales YOLO-Modell (komplett kostenlos,
  aber mehr Infrastruktur-Aufwand, keine Marken-/Texterkennung).

API-Key erstellen: [aistudio.google.com/apikey](https://aistudio.google.com/apikey) – kostenlos, kein Kreditkarten-Zwang.

## Setup

### 1. Voraussetzungen (macOS)

```bash
node -v   # Node 18+ empfohlen
npm install -g expo-cli   # optional, "npx expo" reicht auch ohne globale Installation
```

Auf dem iPhone die **Expo Go**-App aus dem App Store installieren, um live zu testen.

### 2. Projekt aufsetzen

Am sichersten ist es, ein frisches Expo-Projekt zu generieren und dann `src/`, `App.tsx`,
`app.json` und `supabase/` aus diesem Scaffold hinüberzukopieren – so bekommst du garantiert
zueinander passende Paketversionen für die aktuelle Expo-SDK-Version:

```bash
npx create-expo-app@latest ai-home-inventory --template blank-typescript
cd ai-home-inventory

# Dateien aus diesem Scaffold reinkopieren (App.tsx, app.json, src/, supabase/ überschreiben)

npx expo install expo-camera expo-file-system expo-image-picker expo-image-manipulator \
  react-native-safe-area-context react-native-screens react-native-url-polyfill \
  @react-native-async-storage/async-storage

npm install @react-navigation/native @react-navigation/native-stack \
  @supabase/supabase-js zustand
```

`npx expo install` sorgt dafür, dass die Native-Pakete zur installierten Expo-SDK-Version passen
(wichtig, das im `package.json` dieses Scaffolds beigelegte Versionsset ist nur ein Startpunkt).

### 3. Supabase einrichten

1. Projekt auf [supabase.com](https://supabase.com) erstellen (Gratis-Tier reicht).
2. SQL Editor öffnen → Inhalt von `supabase/schema.sql` einfügen → **Run**.
   Das legt Tabellen, Row-Level-Security-Policies und den Storage-Bucket `item-photos` an.
3. Unter *Project Settings → API* die `Project URL` und den `anon public` Key kopieren.
4. Unter *Authentication → Providers* sicherstellen, dass **Email (Magic Link)** aktiv ist.

### 4. Umgebungsvariablen

```bash
cp .env.example .env
# .env ausfüllen: Supabase URL/Key + Gemini API Key
```

### 5. Starten

```bash
npx expo start
```

QR-Code mit der Kamera-App (iOS) oder Expo Go (Android) scannen. Auf dem Mac selbst funktioniert
auch `npx expo start --ios`, falls Xcode installiert ist.

## Architekturüberblick

```
App.tsx                  Einstiegspunkt: Auth-Check (Magic Link) -> RootNavigator
src/
  navigation/             Zentrale, type-safe Screen-Definitionen
  screens/
    HomesScreen           Liste der "Zuhause"
    RoomsScreen            Räume innerhalb eines Zuhauses
    RoomDetailScreen        Inventar eines Raums + "Raum scannen"-Button
    CaptureScreen             Kamera: mehrere Fotos pro Raum aufnehmen
    AnalyzingScreen              Ruft Gemini pro Foto auf, führt Ergebnisse zusammen
    ReviewScreen                 Nutzer bestätigt/verwirft erkannte Gegenstände
    ItemDetailScreen        Einzelnes Item ansehen/löschen
  components/             Wiederverwendbare UI-Bausteine (Buttons, Cards, EmptyState)
  lib/
    supabase.ts           Supabase Client + Foto-Upload in Storage
    gemini.ts              Gemini-Aufruf inkl. JSON-Schema für strukturierte Objekterkennung
  store/useAppStore.ts    Zustand-Store: lädt/speichert Homes, Rooms, Items via Supabase
  types/index.ts          Domain-Typen, gespiegelt aus supabase/schema.sql
  theme/colors.ts         Zentrale Design-Tokens (Farben, Spacing, Typografie)
supabase/schema.sql      Tabellen, Row-Level-Security, Storage-Bucket
```

**Der Kernflow** (deckt sich mit dem User Flow aus deinem Konzept-Dokument):

`HomesScreen → RoomsScreen → RoomDetailScreen → CaptureScreen (Fotos) → AnalyzingScreen
(Gemini) → ReviewScreen (Bestätigen) → zurück in RoomDetailScreen (gespeichertes Inventar)`

## Bekannte Prototyp-Vereinfachungen (bewusst offen für dich)

- `Alert.prompt` (Neues Zuhause/Neuer Raum) funktioniert nur auf **iOS**. Für Android/Web
  bräuchte es ein eigenes Modal mit `TextInput` – als Nächstes sinnvoll zu bauen.
- Der Gemini-API-Key liegt im Client-Bundle (`EXPO_PUBLIC_*`). Für den Prototyp auf dem eigenen
  Gerät unkritisch, für eine Veröffentlichung im App Store solltest du den Gemini-Call stattdessen
  über eine kleine Supabase Edge Function laufen lassen, damit der Key nicht im App-Binary steckt.
- Es gibt noch kein Bearbeiten-Formular in `ItemDetailScreen` (nur Ansehen/Löschen) – markiert
  mit `TODO` im Code.
- PDF-Export, OCR für Rechnungen, Verleihmodus, Preis-Nachschlag im Web etc. aus dem Konzept sind
  bewusst noch nicht gebaut – die Architektur (eigene `lib/`-Module, eigene Screens) ist aber so
  angelegt, dass sie sich sauber ergänzen lassen.

## Sinnvolle nächste Schritte

1. Projekt lokal zum Laufen bringen (siehe Setup) und den Flow einmal komplett durchklicken.
2. `AnalyzingScreen`/`gemini.ts` mit echten Fotos testen und den Prompt in `SYSTEM_PROMPT`
   feintunen (z.B. spezifischer für deine Wohnung).
3. Bearbeiten-Formular in `ItemDetailScreen` ergänzen.
4. Versicherungs-PDF-Export als neuer Screen + `lib/pdf.ts` (z.B. mit `expo-print`).
