import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/store/useAppStore";
import { colors, spacing } from "@/theme/colors";
import RoomCard from "@/components/RoomCard";
import PrimaryButton from "@/components/PrimaryButton";
import EmptyState from "@/components/EmptyState";

type Props = NativeStackScreenProps<RootStackParamList, "Homes">;

export default function HomesScreen({ navigation }: Props) {
  const { homes, loading, loadHomes, createHome } = useAppStore();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadHomes().catch((e) => Alert.alert("Fehler", e.message));
  }, []);

  // Alert.prompt existiert nur auf iOS. Für Android/Web hier später ein
  // echtes Modal mit TextInput einbauen (z.B. in einer kleinen <CreateHomeModal />).
  const handleCreate = () => {
    Alert.prompt?.(
      "Neues Zuhause",
      "Wie soll es heissen?",
      async (name) => {
        if (!name?.trim()) return;
        setCreating(true);
        try {
          await createHome(name.trim());
        } catch (e: any) {
          Alert.alert("Fehler", e.message);
        } finally {
          setCreating(false);
        }
      },
      "plain-text",
      "Mein Zuhause"
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={homes}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
        refreshing={loading}
        onRefresh={loadHomes}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="Noch kein Zuhause angelegt"
              subtitle="Erstelle dein erstes Zuhause, um mit dem Scannen zu starten."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <RoomCard
            id={item.id}
            name={item.name}
            onPress={() => navigation.navigate("Rooms", { homeId: item.id, homeName: item.name })}
          />
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton label="+ Neues Zuhause" onPress={handleCreate} loading={creating} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  footer: { padding: spacing.md },
});
