
import React from "react";
import { Text } from "react-native";
import { Card, Subtitle, Title } from "@/components/ui";
import { styles } from "./styles";

export function ChangePasswordCard({
  showWarning,
  children,
}: {
  showWarning: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Title>Atualizar senha</Title>
      <Subtitle>Para continuar, defina uma nova senha.</Subtitle>

      {showWarning ? (
        <Text style={styles.warningText}>
          Sua senha atual não está mais disponível na memória do app. Faça login novamente.
        </Text>
      ) : null}

      {children}
    </Card>
  );
}
