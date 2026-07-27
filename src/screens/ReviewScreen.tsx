import React, { useState } from "react";
import { View, FlatList, StyleSheet, Text, Pressable, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme/colors";
import PrimaryButton from "@/components/PrimaryButton";
import EmptyState from "@/components/EmptyState";
import type { DetectedItem } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "Review">;

export default function ReviewScreen({ route, navigation }: Props) {
  const { roomId, roomName, detectedItems, photoUri } = route.params;
  const saveDetectedItems = useAppStore((s) => s.saveDetectedItems);

  // Standardmässig sind alle Treffer mit confidence >= 0.5 vorausgewählt.
  const [selected, setSelected] = useState<Set<number>>(
    new Set(detectedItems.map((_, i) => i).filter((i) => detectedItems[i].confidence >= 0.5))
  );
  const [saving, setSaving] = useState(false);

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleSave = async () => {
    const toSave: DetectedItem[] = detectedItems.filter((_, i) => selected.has(i));
    if (toSave.length === 0) {
      Alert.alert("Keine Auswahl", "Wähle mindestens einen Gegenstand aus.");
      return;
    }
    setSaving(true);
    try {
      await saveDetectedItems({ roomId, detected: toSave, photoUri });
      // Nach dem Speichern direkt zur Raumliste – Stack wird dabei aufgeräumt.
      // popToTop() + goBack() würde crashen weil Review via replace() eingesetzt wurde.
      navigation.navigate("RoomDetail", { roomId, roomName });
    } catch (e: any) {
      Alert.alert("Fehler beim Speichern", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (detectedItems.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Nichts erkannt"
          subtitle="Versuche es mit besserer Beleuchtung oder näher am Gegenstand."
        />
        <View style={styles.footer}>
          <PrimaryButton label="Zurück zur Kamera" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        {selected.size} von {detectedItems.length} Gegenständen ausgewählt. Antippen zum
        Ein-/Ausblenden.
      </Text>

      <FlatList
        data={detectedItems}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item, index }) => {
          const isSelected = selected.has(index);
          return (
            <Pressable
              onPress={() => toggle(index)}
              style={[styles.row, isSelected ? styles.rowSelected : styles.rowUnselected]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.caption}>
                  {[item.brand, item.category].filter(Boolean).join(" · ") || "Kategorie unklar"}
                  {item.confidence < 0.5 ? " · niedrige Sicherheit" : ""}
                </Text>
              </View>
              {item.estimated_value_chf != null && (
                <Text style={styles.value}>CHF {item.estimated_value_chf.toFixed(0)}</Text>
              )}
              <Text style={styles.checkbox}>{isSelected ? "✅" : "⬜️"}</Text>
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <PrimaryButton
          label={`${selected.size} Gegenstände speichern`}
          onPress={handleSave}
          loading={saving}
          disabled={selected.size === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { ...typography.caption, color: colors.textMuted, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
  },
  rowSelected: { backgroundColor: colors.surface, borderColor: colors.primary },
  rowUnselected: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: 0.6 },
  name: { ...typography.body, fontWeight: "600", color: colors.text },
  caption: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  value: { ...typography.body, fontWeight: "700", color: colors.primary },
  checkbox: { fontSize: 18 },
  footer: { padding: spacing.md },
});
