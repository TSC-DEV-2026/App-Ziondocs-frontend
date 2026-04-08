
import React from "react";
import { LoadingBlock, Screen } from "@/components/ui";
import { styles } from "./styles";

export function SplashLoading() {
  return (
    <Screen scroll={false} contentContainerStyle={styles.container}>
      <LoadingBlock text="Abrindo aplicativo..." />
    </Screen>
  );
}
