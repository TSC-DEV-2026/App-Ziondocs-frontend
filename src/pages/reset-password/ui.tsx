import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Card, Divider, Subtitle, Title } from "@/components/ui";
import { styles } from "./styles";

export function ResetPasswordCard({
  title,
  subtitle,
  lockedUser,
  pageError,
  successMessage,
  isLeaving,
  onBackToLogin,
  children,
}: {
  title: string;
  subtitle: string;
  lockedUser?: string;
  pageError?: string;
  successMessage?: string;
  isLeaving: boolean;
  onBackToLogin: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <View style={styles.cardBody}>
        <View style={styles.headerWrap}>
          <Title>{title}</Title>
          <Subtitle style={styles.subtitle}>{subtitle}</Subtitle>
        </View>

        <Divider />

        {lockedUser ? (
          <View style={styles.lockedUserWrap}>
            <Text style={styles.lockedUser}>Usuário: {lockedUser}</Text>
          </View>
        ) : null}

        {pageError ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{pageError}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successWrap}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {children}

        <Pressable
          onPress={onBackToLogin}
          disabled={isLeaving}
          style={({ pressed }) => [
            styles.footerLinkPressable,
            pressed && !isLeaving ? styles.footerLinkPressed : null,
            isLeaving ? styles.footerLinkDisabled : null,
          ]}
        >
          <View style={styles.footerLinkRow}>
            {isLeaving ? <ActivityIndicator size="small" color="#25601d" /> : null}
            <Text style={styles.footerLink}>
              {isLeaving ? "Voltando para o login..." : "Voltar para o login"}
            </Text>
          </View>
        </Pressable>
      </View>
    </Card>
  );
}