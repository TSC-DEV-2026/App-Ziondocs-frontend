import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login/index" />
        <Stack.Screen name="change-password/index" />
        <Stack.Screen name="token/index" />
        <Stack.Screen name="(protected)/(protected)" />
      </Stack>
    </AuthProvider>
  );
}