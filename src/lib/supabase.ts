import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY fehlen. .env aus .env.example erstellen."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// --- Storage Helper -------------------------------------------------------

const ITEM_PHOTOS_BUCKET = "item-photos";

/**
 * Lädt ein lokal aufgenommenes Foto (via Capture-Flow) in den Supabase Storage
 * hoch und gibt die öffentliche URL zurück, die dann in items.image_url landet.
 */
export async function uploadItemPhoto(params: {
  localUri: string;
  roomId: string;
}): Promise<string> {
  const { localUri, roomId } = params;

  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileExt = localUri.split(".").pop() ?? "jpg";
  const path = `${roomId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(ITEM_PHOTOS_BUCKET)
    .upload(path, blob, { contentType: `image/${fileExt}`, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(ITEM_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
