import React, { useEffect } from "react";
import { Slot, router } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/components/ui";

export default function ProtectedLayout() {
  const {
    isLoading,
    isAuthenticated,
    mustChangePassword,
    mustValidateInternalToken,
  } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (mustChangePassword) {
      router.replace("/change-password");
      return;
    }

    if (mustValidateInternalToken) {
      router.replace("/token");
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    mustChangePassword,
    mustValidateInternalToken,
  ]);

  if (
    isLoading ||
    !isAuthenticated ||
    mustChangePassword ||
    mustValidateInternalToken
  ) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}