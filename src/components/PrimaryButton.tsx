import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/colors";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: Props) {
  const backgroundColor =
    variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.surface;
  const textColor = variant === "secondary" ? colors.text : colors.primaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, opacity: pressed ? 0.85 : disabled ? 0.5 : 1 },
        variant === "secondary" && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.body,
    fontWeight: "600",
  },
});
