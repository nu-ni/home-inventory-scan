import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/theme/colors";

export default function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, alignItems: "center" },
  title: { ...typography.heading, color: colors.text, textAlign: "center" },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
