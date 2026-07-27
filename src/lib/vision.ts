/**
 * vision.ts – Bild-Hilfsfunktionen
 *
 * Kapselt das Lesen von lokalen Fotos als Base64-String.
 * Wird von ai.ts genutzt und kann später für Bild-Komprimierung
 * oder Upload-Logik erweitert werden.
 */

import { File } from "expo-file-system";

/**
 * Liest eine lokale Bild-URI und gibt den Inhalt als Base64-String zurück.
 * Unterstützt alle von expo-camera / expo-image-picker gelieferten file://-URIs.
 */
export async function readImageAsBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}
