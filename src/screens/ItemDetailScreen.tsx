import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme/colors";
import PrimaryButton from "@/components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "ItemDetail">;

const FIELD_LABELS: Record<string, string> = {
  category: "Kategorie",
  brand: "Marke",
  model: "Modell",
  color: "Farbe",
  condition: "Zustand",
  quantity: "Anzahl",
};

export default function ItemDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const item = useAppStore((s) => s.items.find((i) => i.id === itemId));
  const deleteItem = useAppStore((s) => s.deleteItem);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.name}>Gegenstand nicht gefunden.</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert("Gegenstand löschen?", item.name, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteItem(item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ color: colors.textMuted }}>Kein Foto</Text>
        </View>
      )}

      <Text style={styles.name}>{item.name}</Text>
      {item.estimated_value_chf != null && (
        <Text style={styles.value}>CHF {item.estimated_value_chf.toFixed(0)}</Text>
      )}

      <View style={styles.fieldList}>
        {Object.entries(FIELD_LABELS).map(([key, label]) => {
          const value = (item as any)[key];
          if (!value) return null;
          return (
            <View key={key} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <Text style={styles.fieldValue}>{String(value)}</Text>
            </View>
          );
        })}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Quelle</Text>
          <Text style={styles.fieldValue}>{item.source === "ai" ? "KI-erkannt" : "Manuell"}</Text>
        </View>
      </View>

      <PrimaryButton
        label="Gegenstand löschen"
        variant="danger"
        onPress={handleDelete}
        style={{ marginTop: spacing.lg }}
      />

      {/* TODO: Bearbeiten-Formular (Name, Wert, Zustand manuell korrigieren) */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  image: { width: "100%", height: 220, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  name: { ...typography.title, color: colors.text, marginTop: spacing.md },
  value: { ...typography.heading, color: colors.primary, marginTop: spacing.xs },
  fieldList: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldLabel: { ...typography.body, color: colors.textMuted },
  fieldValue: { ...typography.body, color: colors.text, fontWeight: "600" },
});
