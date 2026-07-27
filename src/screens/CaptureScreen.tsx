import React, { useRef, useState } from "react";
import { View, StyleSheet, Text, Pressable, Image, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { colors, radius, spacing, typography } from "@/theme/colors";
import PrimaryButton from "@/components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

// Der Nutzer macht mehrere Fotos vom selben Raum (Regal, Ecke, Schrank ...),
// bevor die Analyse startet. Das erhöht die Trefferquote deutlich gegenüber
// einem einzigen Übersichtsfoto, weil Gemini pro Bild mehr Details erkennt.
export default function CaptureScreen({ route, navigation }: Props) {
  const { roomId, roomName } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.permissionText}>
          Wir benötigen Kamerazugriff, um {roomName} zu scannen.
        </Text>
        <PrimaryButton label="Kamera erlauben" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  const takePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) setPhotoUris((prev) => [...prev, photo.uri]);
  };

  const goToAnalysis = () => {
    if (photoUris.length === 0) return;
    navigation.replace("Analyzing", { roomId, photoUris });
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.roomLabel}>{roomName}</Text>
          <View style={{ width: 40 }} />
        </View>

        {photoUris.length > 0 && (
          <ScrollView horizontal style={styles.thumbRow} showsHorizontalScrollIndicator={false}>
            {photoUris.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.thumb} />
            ))}
          </ScrollView>
        )}

        <View style={styles.bottomBar}>
          <Pressable onPress={takePhoto} style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </Pressable>

          {photoUris.length > 0 && (
            <PrimaryButton
              label={`Analysieren (${photoUris.length} Foto${photoUris.length > 1 ? "s" : ""})`}
              onPress={goToAnalysis}
              style={styles.analyzeButton}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { alignItems: "center", justifyContent: "center", padding: spacing.lg, gap: spacing.md },
  permissionText: { ...typography.body, color: colors.text, textAlign: "center" },
  overlay: { flex: 1, justifyContent: "space-between" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 18 },
  roomLabel: { color: "#fff", ...typography.heading },
  thumbRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    marginRight: spacing.xs,
    borderWidth: 2,
    borderColor: "#fff",
  },
  bottomBar: { alignItems: "center", paddingBottom: spacing.lg, gap: spacing.md },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff" },
  analyzeButton: { width: "80%" },
});
