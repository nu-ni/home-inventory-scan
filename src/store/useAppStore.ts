import { create } from "zustand";
import { supabase, uploadItemPhoto } from "@/lib/supabase";
import type { Home, Room, InventoryItem, DetectedItem } from "@/types";

interface AppState {
  homes: Home[];
  rooms: Room[];
  items: InventoryItem[];
  loading: boolean;
  demoMode: boolean;

  enableDemoMode: () => void;
  loadHomes: () => Promise<void>;
  createHome: (name: string) => Promise<Home>;

  loadRooms: (homeId: string) => Promise<void>;
  createRoom: (homeId: string, name: string) => Promise<Room>;

  loadItems: (roomId: string) => Promise<void>;
  saveDetectedItems: (params: {
    roomId: string;
    detected: DetectedItem[];
    photoUri: string | null;
  }) => Promise<void>;
  updateItem: (id: string, patch: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

// Zustand statt Redux/Context: für einen Prototyp mit überschaubarem State
// deutlich weniger Boilerplate, aber genauso gut in Screens per Selector nutzbar
// (z.B. useAppStore((s) => s.items)).
const createDemoId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createDemoTimestamp = () => new Date().toISOString();

export const useAppStore = create<AppState>((set, get) => ({
  homes: [],
  rooms: [],
  items: [],
  loading: false,
  demoMode: false,

  enableDemoMode: () => set({ demoMode: true }),

  loadHomes: async () => {
    set({ loading: true });
    if (get().demoMode) {
      set({ homes: [], loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("homes")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      set({ homes: data as Home[], loading: false });
    } catch {
      set({ homes: [], loading: false });
    }
  },

  createHome: async (name: string) => {
    if (get().demoMode) {
      const demoHome: Home = {
        id: createDemoId("home"),
        owner_id: "demo-user",
        name,
        created_at: createDemoTimestamp(),
      };
      set({ homes: [...get().homes, demoHome] });
      return demoHome;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nicht eingeloggt.");

    const { data, error } = await supabase
      .from("homes")
      .insert({ name, owner_id: user.id })
      .select()
      .single();
    if (error) throw error;

    set({ homes: [...get().homes, data as Home] });
    return data as Home;
  },

  loadRooms: async (homeId: string) => {
    set({ loading: true });
    if (get().demoMode) {
      set({ rooms: [], loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("home_id", homeId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      set({ rooms: data as Room[], loading: false });
    } catch {
      set({ rooms: [], loading: false });
    }
  },

  createRoom: async (homeId: string, name: string) => {
    if (get().demoMode) {
      const demoRoom: Room = {
        id: createDemoId("room"),
        home_id: homeId,
        name,
        created_at: createDemoTimestamp(),
      };
      set({ rooms: [...get().rooms, demoRoom] });
      return demoRoom;
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert({ home_id: homeId, name })
      .select()
      .single();
    if (error) throw error;

    set({ rooms: [...get().rooms, data as Room] });
    return data as Room;
  },

  loadItems: async (roomId: string) => {
    set({ loading: true });
    if (get().demoMode) {
      set({ items: [], loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      set({ items: data as InventoryItem[], loading: false });
    } catch {
      set({ items: [], loading: false });
    }
  },

  // Wird nach der Review-Screen aufgerufen: der Nutzer hat die von Gemini
  // erkannten Objekte durchgesehen/korrigiert, jetzt werden sie persistiert.
  saveDetectedItems: async ({ roomId, detected, photoUri }) => {
    if (get().demoMode) {
      const demoItems: InventoryItem[] = detected.map((d, index) => ({
        id: createDemoId(`item-${index}`),
        room_id: roomId,
        name: d.name,
        category: d.category,
        brand: d.brand,
        model: d.model,
        color: d.color,
        condition: d.condition,
        estimated_value_chf: d.estimated_value_chf,
        quantity: 1,
        image_url: photoUri ?? null,
        notes: null,
        source: "ai" as const,
        created_at: createDemoTimestamp(),
        updated_at: createDemoTimestamp(),
      }));
      set({ items: [...demoItems, ...get().items] });
      return;
    }

    let imageUrl: string | null = null;
    if (photoUri) {
      imageUrl = await uploadItemPhoto({ localUri: photoUri, roomId });
    }

    const rows = detected.map((d) => ({
      room_id: roomId,
      name: d.name,
      category: d.category,
      brand: d.brand,
      model: d.model,
      color: d.color,
      condition: d.condition,
      estimated_value_chf: d.estimated_value_chf,
      quantity: 1,
      image_url: imageUrl,
      source: "ai" as const,
    }));

    const { data, error } = await supabase.from("items").insert(rows).select();
    if (error) throw error;

    set({ items: [...(data as InventoryItem[]), ...get().items] });
  },

  updateItem: async (id: string, patch: Partial<InventoryItem>) => {
    if (get().demoMode) {
      set({
        items: get().items.map((item) => (item.id === id ? ({ ...item, ...patch } as InventoryItem) : item)),
      });
      return;
    }

    const { data, error } = await supabase
      .from("items")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    set({
      items: get().items.map((i) => (i.id === id ? (data as InventoryItem) : i)),
    });
  },

  deleteItem: async (id: string) => {
    if (get().demoMode) {
      set({ items: get().items.filter((i) => i.id !== id) });
      return;
    }

    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) throw error;
    set({ items: get().items.filter((i) => i.id !== id) });
  },
}));
