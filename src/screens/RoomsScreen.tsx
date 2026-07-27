import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/store/useAppStore";
import { colors, spacing } from "@/theme/colors";
import RoomCard from "@/components/RoomCard";
import PrimaryButton from "@/components/PrimaryButton";
import EmptyState from "@/components/EmptyState";

type Props = NativeStackScreenProps<RootStackParamList, "Rooms">;

const SUGGESTED_ROOMS = ["Wohnzimmer", "Schlafzimmer", "Küche", "Bad", "Garage", "Keller"];

export default function RoomsScreen({ route, navigation }: Props) {
  const { homeId } = route.params;
  const { rooms, loading, loadRooms, createRoom } = useAppStore();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRooms(homeId).catch((e) => Alert.alert("Fehler", e.message));
  }, [homeId]);

  const handleCreate = () => {
    Alert.prompt?.(
      "Neuer Raum",
      `Vorschläge: ${SUGGESTED_ROOMS.join(", ")}`,
      async (name) => {
        if (!name?.trim()) return;
        setCreating(true);
        try {
          await createRoom(homeId, name.trim());
        } catch (e: any) {
          Alert.alert("Fehler", e.message);
        } finally {
          setCreating(false);
        }
      },
      "plain-text",
      "Wohnzimmer"
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        refreshing={loading}
        onRefresh={() => loadRooms(homeId)}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Noch keine Räume"
              subtitle="Lege Räume an, um sie einzeln zu scannen (z.B. Wohnzimmer, Küche, Keller)."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <RoomCard
            id={item.id}
            name={item.name}
            onPress={() =>
              navigation.navigate("RoomDetail", { roomId: item.id, roomName: item.name })
            }
          />
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton label="+ Neuer Raum" onPress={handleCreate} loading={creating} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  footer: { padding: spacing.md },
});
