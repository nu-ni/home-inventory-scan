import type { DetectedItem } from "@/types";

// Zentrale Definition aller Screens + ihrer Parameter. So bleibt Navigation
// type-safe (navigation.navigate("RoomDetail", { roomId }) wird von TS geprüft)
// statt String-basiert und fehleranfällig.
export type RootStackParamList = {
  Homes: undefined;
  Rooms: { homeId: string; homeName: string };
  RoomDetail: { roomId: string; roomName: string };
  Capture: { roomId: string; roomName: string };
  Analyzing: { roomId: string; photoUris: string[] };
  Review: {
    roomId: string;
    roomName: string; // neu: wird für die Rücknavigation nach RoomDetail benötigt
    detectedItems: DetectedItem[];
    photoUri: string | null;
  };
  ItemDetail: { itemId: string };
};
