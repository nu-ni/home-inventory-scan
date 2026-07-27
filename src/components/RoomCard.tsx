import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/colors";

// Bewusst generisch (nur id/name statt des vollen Room-Typs), damit dieselbe
// Karte auch in HomesScreen für Home-Einträge wiederverwendet werden kann,
// ohne künstliche Room-Objekte zu basteln.
export default function RoomCard({
  id,
  name,
  subtitle = "Antippen zum Öffnen",
  onPress,
}: {
  id: string;
  name: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.caption}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { ...typography.heading, color: colors.text },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
