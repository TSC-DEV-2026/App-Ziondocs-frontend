
import React from "react";
import { Link } from "expo-router";
import { Text } from "react-native";
import { Card, Subtitle, Title } from "@/components/ui";
import { styles } from "./styles";

export function ResetPasswordCard({
  title,
  subtitle,
  lockedUser,
  children,
}: {
  title: string;
  subtitle: string;
  lockedUser?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Title>{title}</Title>
      <Subtitle>{subtitle}</Subtitle>

      {lockedUser ? <Text style={styles.lockedUser}>Usuário: {lockedUser}</Text> : null}

      {children}

      <Link href="/login" asChild>
        <Text style={styles.footerLink}>Voltar para o login</Text>
      </Link>
    </Card>
  );
}
