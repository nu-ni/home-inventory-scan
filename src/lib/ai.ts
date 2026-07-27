/**
 * ai.ts – Provider-agnostic AI service layer via OpenRouter
 *
 * Standardmodell : google/gemini-2.5-flash (kostenlos, Vision, JSON)
 * Fallback       : openai/gpt-4.1-mini
 *
 * Modell wechseln: EXPO_PUBLIC_AI_MODEL=anthropic/claude-sonnet-4
 * API-Key holen  : https://openrouter.ai/keys  (kein Kreditkarte nötig)
 */

import { readImageAsBase64 } from "@/lib/vision";
import type { DetectedItem } from "@/types";

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

const API_KEY = (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? "").trim();
const PRIMARY_MODEL = (
  process.env.EXPO_PUBLIC_AI_MODEL ?? "google/gemini-2.5-flash"
).trim();
const FALLBACK_MODEL = (
  process.env.EXPO_PUBLIC_AI_FALLBACK_MODEL ?? "openai/gpt-4.1-mini"
).trim();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ---------------------------------------------------------------------------
// Stage 1 Prompt – Gegenstände identifizieren
// ---------------------------------------------------------------------------

const STAGE1_PROMPT = `
Du bist ein Bild-Analyse-System für eine Home-Inventory-App.
Schau dir dieses Foto eines Raums an und liste ALLE eindeutig erkennbaren,
dauerhaften Wertgegenstände auf.

REGELN:
- NUR physische Objekte mit Wiederverkaufswert
- KEINE Wände, Böden, Decken, Türen, Steckdosen, Fenster
- KEINE Lebensmittel, Pflanzen, Deko-Kerzen, Müll
- Maximal 20 Gegenstände pro Foto
- Falls gar nichts erkennbar: leere Liste

Gib NUR eine JSON-Liste zurück:
["Gegenstand 1", "Gegenstand 2", ...]
`.trim();

// ---------------------------------------------------------------------------
// Stage 2 Prompt – Detailanalyse
// ---------------------------------------------------------------------------

function buildStage2Prompt(itemList: string[]): string {
  return `
Du bist ein Experte für Gebrauchtwaren-Bewertung in der Schweiz.
Für jeden der folgenden Gegenstände erstelle einen strukturierten Eintrag.

Gegenstände: ${itemList.join(", ")}

Für jeden Gegenstand:
- name: konkreter Name auf Deutsch (z.B. "Sony Bravia 55\" OLED", nicht "Fernseher")
- category: Elektronik | Möbel | Haushalt | Werkzeug | Sport | Musik | Kleidung | Sonstiges
- brand: Marke falls erkennbar, sonst null
- model: Modellbezeichnung falls bekannt, sonst null
- color: Hauptfarbe
- condition: neu | sehr_gut | gut | gebraucht | defekt
- estimated_value_chf: realistischer CHF-Gebrauchtwert als Zahl (gerundet auf 10er)
- confidence: 0.0–1.0 wie sicher du dir bist

Gib NUR gültiges JSON zurück, keine Erklärungen:
{
  "items": [
    {
      "name": "...",
      "category": "...",
      "brand": null,
      "model": null,
      "color": "...",
      "condition": "gut",
      "estimated_value_chf": 0,
      "confidence": 0.0
    }
  ]
}
`.trim();
}

// ---------------------------------------------------------------------------
// OpenRouter fetch helper
// ---------------------------------------------------------------------------

async function callOpenRouter(
  messages: { role: string; content: any }[],
  model: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "EXPO_PUBLIC_OPENROUTER_API_KEY fehlt.\n" +
        "Kostenlosen Key unter openrouter.ai/keys erstellen und in .env eintragen."
    );
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/nu-ni/home-inventory-scan",
      "X-Title": "Home Inventory Scan",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = errText;
    try {
      msg = JSON.parse(errText)?.error?.message ?? errText;
    } catch {}
    throw new Error(`OpenRouter Fehler (${res.status}) [${model}]: ${msg}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Keine Antwort von Modell '${model}'.`);
  return text;
}

/** Parst JSON sicher aus einem LLM-Text (entfernt Markdown-Codeblöcke falls vorhanden) */
function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ---------------------------------------------------------------------------
// Öffentliche API
// ---------------------------------------------------------------------------

/**
 * 2-Stage-Pipeline:
 *   Stage 1 – Vision-Modell erkennt Gegenstände im Foto (Liste)
 *   Stage 2 – Sprachmodell bereichert jeden Eintrag mit Details + CHF-Schätzwert
 *
 * Fällt Stage 1 mit dem primären Modell fehl, wird automatisch auf
 * FALLBACK_MODEL ausgewichen.
 */
export async function detectItemsInPhoto(localUri: string): Promise<DetectedItem[]> {
  const base64 = await readImageAsBase64(localUri);

  // --- Stage 1: Gegenstände erkennen ---
  const stage1Messages = [
    {
      role: "user",
      content: [
        { type: "text", text: STAGE1_PROMPT },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${base64}` },
        },
      ],
    },
  ];

  let stage1Raw: string;
  try {
    stage1Raw = await callOpenRouter(stage1Messages, PRIMARY_MODEL);
  } catch (primaryErr) {
    console.warn(
      `[AI] Primärmodell '${PRIMARY_MODEL}' fehlgeschlagen, versuche Fallback '${FALLBACK_MODEL}'.`,
      primaryErr
    );
    stage1Raw = await callOpenRouter(stage1Messages, FALLBACK_MODEL);
  }

  let itemList: string[] = [];
  try {
    itemList = parseJson<string[]>(stage1Raw);
  } catch {
    // Falls das Modell trotzdem keinen sauberen JSON-Array zurückgibt
    const match = stage1Raw.match(/\[.*?\]/s);
    if (match) itemList = parseJson<string[]>(match[0]);
  }

  if (itemList.length === 0) return [];

  // --- Stage 2: Details + Werte anreichern ---
  const stage2Messages = [
    {
      role: "user",
      content: buildStage2Prompt(itemList),
    },
  ];

  const stage2Raw = await callOpenRouter(stage2Messages, PRIMARY_MODEL);
  const { items } = parseJson<{ items: DetectedItem[] }>(stage2Raw);
  return items ?? [];
}

/**
 * Führt Ergebnisse mehrerer Fotos desselben Raums zusammen.
 * Duplikate (gleicher Name + Marke) werden eliminiert; bei Konflikt
 * gewinnt der Eintrag mit höherem confidence-Wert.
 */
export function mergeDetectedItems(batches: DetectedItem[][]): DetectedItem[] {
  const merged: DetectedItem[] = [];

  for (const batch of batches) {
    for (const item of batch) {
      const key = `${item.name.toLowerCase()}|${(item.brand ?? "").toLowerCase()}`;
      const existing = merged.find(
        (m) => `${m.name.toLowerCase()}|${(m.brand ?? "").toLowerCase()}` === key
      );
      if (!existing) {
        merged.push(item);
      } else if ((item.confidence ?? 0) > (existing.confidence ?? 0)) {
        Object.assign(existing, item);
      }
    }
  }

  return merged.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
}
