import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import type { RootStackParamList } from "./types";

import HomesScreen from "@/screens/HomesScreen";
import RoomsScreen from "@/screens/RoomsScreen";
import RoomDetailScreen from "@/screens/RoomDetailScreen";
import CaptureScreen from "@/screens/CaptureScreen";
import AnalyzingScreen from "@/screens/AnalyzingScreen";
import ReviewScreen from "@/screens/ReviewScreen";
import ItemDetailScreen from "@/screens/ItemDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id="root"
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Homes" component={HomesScreen} options={{ title: "Meine Zuhause" }} />
        <Stack.Screen
          name="Rooms"
          component={RoomsScreen}
          options={({ route }) => ({ title: route.params.homeName })}
        />
        <Stack.Screen
          name="RoomDetail"
          component={RoomDetailScreen}
          options={({ route }) => ({ title: route.params.roomName })}
        />
        <Stack.Screen
          name="Capture"
          component={CaptureScreen}
          options={{ title: "Raum scannen", headerShown: false }}
        />
        <Stack.Screen
          name="Analyzing"
          component={AnalyzingScreen}
          options={{ title: "Analysiere...", headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ title: "Gegenstände bestätigen" }}
        />
        <Stack.Screen
          name="ItemDetail"
          component={ItemDetailScreen}
          options={{ title: "Gegenstand" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
