import React from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Card, Divider, Title, Subtitle } from "@/components/ui";
import { styles } from "./styles";

export function ChangePasswordCard({
  children,
  showWarning,
  pageError,
  isSubmitting,
  isLeaving,
  onSubmit,
  onBackToLogin,
  disableSubmit,
}: {
  children: React.ReactNode;
  showWarning: boolean;
  pageError: string;
  isSubmitting: boolean;
  isLeaving: boolean;
  onSubmit: () => void;
  onBackToLogin: () => void;
  disableSubmit: boolean;
}) {
  return (
    <Card>
      <Title>Atualizar senha</Title>
      <Subtitle>Para continuar, defina uma nova senha.</Subtitle>
      <Divider />

      {showWarning ? (
        <Text style={styles.warningText}>
          Sua senha atual não está mais disponível na memória do app. Faça login novamente.
        </Text>
      ) : null}

      {children}

      {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}

      <Pressable
        onPress={onBackToLogin}
        disabled={isLeaving || isSubmitting}
        style={({ pressed }) => [
          pressed && !isLeaving && !isSubmitting ? styles.forgotLinkPressed : null,
          isLeaving || isSubmitting ? styles.forgotLinkDisabled : null,
        ]}
      >
        <Text style={styles.forgotLink}>
          {isLeaving ? "Voltando para o login..." : "Voltar para o login"}
        </Text>
      </Pressable>

      <View style={styles.buttonWrap}>
        <Button
          title="Atualizar senha"
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={disableSubmit}
        />
      </View>
    </Card>
  );
}