import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, TextInput, Alert, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing, typography } from "@/theme/colors";
import PrimaryButton from "@/components/PrimaryButton";
import RootNavigator from "@/navigation/RootNavigator";
import { useAppStore } from "@/store/useAppStore";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const demoMode = useAppStore((state) => state.demoMode);
  const enableDemoMode = useAppStore((state) => state.enableDemoMode);

  useEffect(() => {
    let active = true;

    const initializeSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (active) {
          setSession(data.session ?? null);
        }
      } catch {
        if (active) {
          setSession(null);
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    initializeSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (active) {
        setSession(newSession);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {session || demoMode ? <RootNavigator /> : <AuthScreen />}
    </SafeAreaProvider>
  );
}

// Minimaler Magic-Link-Login für den Prototyp. Für Produktion: echtes
// Passwort/Social-Login, E-Mail-Verifizierung, Onboarding etc. ergänzen.
function AuthScreen() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const enableDemoMode = useAppStore((state) => state.enableDemoMode);

  const handleLogin = async () => {
    if (!email.includes("@")) {
      Alert.alert("Ungültige E-Mail");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setSending(false);
    if (error) {
      Alert.alert("Fehler", error.message);
      return;
    }
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <Text style={styles.title}>AI Home Inventory</Text>
      <Text style={styles.subtitle}>
        Melde dich per Magic Link an – kein Passwort nötig.
      </Text>

      {sent ? (
        <Text style={styles.info}>
          Link an {email} gesendet. Öffne dein E-Mail-Postfach auf diesem Gerät.
        </Text>
      ) : (
        <>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="deine@email.ch"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <PrimaryButton label="Magic Link senden" onPress={handleLogin} loading={sending} />
          <PrimaryButton label="Demo ohne Login starten" onPress={enableDemoMode} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  authContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.md,
  },
  title: { ...typography.title, color: colors.text, textAlign: "center" },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: "center", marginBottom: spacing.md },
  info: { ...typography.body, color: colors.text, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    color: colors.text,
    ...typography.body,
  },
});
