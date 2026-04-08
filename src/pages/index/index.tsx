
import React, { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { SplashLoading } from "./ui";

export default function IndexPage() {
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

    router.replace("/home");
  }, [isLoading, isAuthenticated, mustChangePassword, mustValidateInternalToken]);

  return <SplashLoading />;
}
