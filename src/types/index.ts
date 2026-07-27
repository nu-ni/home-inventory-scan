// Diese Typen spiegeln 1:1 die Tabellen in supabase/schema.sql.
// Bei Schema-Änderungen IMMER hier mit nachziehen.

export type ItemCondition = "neu" | "sehr_gut" | "gut" | "gebraucht" | "defekt";

export interface Home {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Room {
  id: string;
  home_id: string;
  name: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  room_id: string;
  name: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  condition: ItemCondition | null;
  estimated_value_chf: number | null;
  quantity: number;
  image_url: string | null;
  notes: string | null;
  source: "ai" | "manual";
  created_at: string;
  updated_at: string;
}

// Rohes Ergebnis, das die Gemini-Analyse pro erkanntem Gegenstand liefert,
// BEVOR der Nutzer es bestätigt/bearbeitet und es zu einem InventoryItem wird.
export interface DetectedItem {
  name: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  condition: ItemCondition | null;
  estimated_value_chf: number | null;
  confidence: number; // 0..1, für die UI (z.B. niedrige Confidence markieren)
}
