
import React from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { Card, Subtitle, Title } from "@/components/ui";
import { styles } from "./styles";

export function RegisterCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <Title>Cadastro</Title>
      <Subtitle>Preencha seus dados para criar o acesso.</Subtitle>
      {children}
      <View style={styles.footerWrap}>
        <Link href="/login" asChild>
          <Text style={styles.footerLink}>Voltar para login</Text>
        </Link>
      </View>
    </Card>
  );
}
