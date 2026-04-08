
import React from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, Divider, Title } from "@/components/ui";
import { styles } from "./styles";

export function LoginCard({
  children,
  pageError,
  isLoggingIn,
  onSubmit,
}: {
  children: React.ReactNode;
  pageError: string;
  isLoggingIn: boolean;
  onSubmit: () => void;
}) {
  return (
    <Card>
      <Title>Acesso ao Sistema</Title>
      <Divider />

      {children}

      {pageError ? <Text style={styles.errorText}>{pageError}</Text> : null}

      <Link href="/reset-password" asChild>
        <Text style={styles.forgotLink}>Esqueci minha senha</Text>
      </Link>

      <View style={styles.buttonWrap}>
        <Button title="Entrar" onPress={onSubmit} loading={isLoggingIn} />
      </View>
    </Card>
  );
}
