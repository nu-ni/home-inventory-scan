import React from "react";
import { Pressable, Text, View, Image, StyleSheet } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/colors";
import type { InventoryItem } from "@/types";

export default function ItemCard({
  item,
  onPress,
}: {
  item: InventoryItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={{ color: colors.textMuted }}>Foto</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.caption} numberOfLines={1}>
          {[item.brand, item.category].filter(Boolean).join(" · ") || "Nicht kategorisiert"}
        </Text>
      </View>

      {item.estimated_value_chf != null && (
        <Text style={styles.value}>CHF {item.estimated_value_chf.toFixed(0)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  thumb: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  name: { ...typography.body, fontWeight: "600", color: colors.text },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  value: { ...typography.body, fontWeight: "700", color: colors.primary },
});
