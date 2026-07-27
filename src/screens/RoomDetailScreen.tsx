import React, { useEffect } from "react";
import { View, FlatList, StyleSheet, Alert, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/store/useAppStore";
import { colors, spacing, typography } from "@/theme/colors";
import ItemCard from "@/components/ItemCard";
import PrimaryButton from "@/components/PrimaryButton";
import EmptyState from "@/components/EmptyState";

type Props = NativeStackScreenProps<RootStackParamList, "RoomDetail">;

export default function RoomDetailScreen({ route, navigation }: Props) {
  const { roomId, roomName } = route.params;
  const { items, loading, loadItems } = useAppStore();

  useEffect(() => {
    loadItems(roomId).catch((e) => Alert.alert("Fehler", e.message));
  }, [roomId]);

  const roomItems = items.filter((i) => i.room_id === roomId);
  const totalValue = roomItems.reduce((sum, i) => sum + (i.estimated_value_chf ?? 0), 0);

  return (
    <View style={styles.container}>
      {roomItems.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {roomItems.length} Gegenstände · geschätzt CHF {totalValue.toFixed(0)}
          </Text>
        </View>
      )}

      <FlatList
        data={roomItems}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        refreshing={loading}
        onRefresh={() => loadItems(roomId)}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Noch keine Gegenstände"
              subtitle="Scanne den Raum, um automatisch Gegenstände zu erkennen."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })} />
        )}
      />

      <View style={styles.footer}>
        <PrimaryButton
          label="📷 Raum scannen"
          onPress={() => navigation.navigate("Capture", { roomId, roomName })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summary: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  summaryText: { ...typography.caption, color: colors.textMuted },
  footer: { padding: spacing.md },
});
