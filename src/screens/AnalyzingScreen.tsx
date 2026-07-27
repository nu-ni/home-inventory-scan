import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { detectItemsInPhoto, mergeDetectedItems } from "@/lib/ai";
import { colors, spacing, typography } from "@/theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Analyzing">;

const STAGES = [
  "Fotos werden hochgeladen...",
  "Gegenstände werden erkannt...",
  "Marken & Modelle werden zugeordnet...",
  "Werte werden geschätzt...",
];

export default function AnalyzingScreen({ route, navigation }: Props) {
  const { roomId, photoUris } = route.params;
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 1400);

    async function run() {
      try {
        const batches = [];
        for (const uri of photoUris) {
          batches.push(await detectItemsInPhoto(uri));
        }
        const merged = mergeDetectedItems(batches);

        navigation.replace("Review", {
          roomId,
          roomName: route.params.roomName ?? "",
          detectedItems: merged,
          photoUri: photoUris[0] ?? null,
        });
      } catch (e: any) {
        Alert.alert("Analyse fehlgeschlagen", e.message, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    }

    run();
    return () => clearInterval(stageTimer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.stage}>{STAGES[stageIndex]}</Text>
      <Text style={styles.hint}>{photoUris.length} Foto(s) werden analysiert</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.background },
  stage: { ...typography.heading, color: colors.text, marginTop: spacing.md },
  hint: { ...typography.caption, color: colors.textMuted },
});
