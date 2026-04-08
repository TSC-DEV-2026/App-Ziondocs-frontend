import React, { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Divider, Subtitle, Title } from "@/components/ui";
import { styles } from "./styles";

type TokenCardProps = {
  title: string;
  subtitle: string;
  infoMessage?: string;
  showDivider?: boolean;
  children: React.ReactNode;
};

export function TokenCard({
  title,
  subtitle,
  infoMessage,
  showDivider = false,
  children,
}: TokenCardProps) {
  return (
    <Card style={styles.card}>
      <Title style={styles.title}>{title}</Title>
      {showDivider ? <Divider style={styles.divider} marginVertical={2} /> : null}
      <Subtitle style={styles.subtitle}>{subtitle}</Subtitle>

      {infoMessage ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{infoMessage}</Text>
        </View>
      ) : null}

      {children}
    </Card>
  );
}

type TokenInputFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TokenInputField({
  label,
  error,
  secureTextEntry = false,
  ...props
}: TokenInputFieldProps) {
  const [showValue, setShowValue] = useState(false);

  const shouldHide = secureTextEntry && !showValue;

  return (
    <View style={styles.tokenFieldWrap}>
      <Text style={styles.tokenLabel}>{label}</Text>

      <View style={styles.tokenInputWrapper}>
        <TextInput
          style={styles.tokenInput}
          placeholderTextColor="#8a948d"
          secureTextEntry={shouldHide}
          {...props}
        />

        <Pressable
          onPress={() => setShowValue((prev) => !prev)}
          style={styles.tokenEyeButton}
          hitSlop={10}
        >
          <Ionicons
            name={showValue ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#44564a"
          />
        </Pressable>
      </View>

      {error ? <Text style={styles.tokenError}>{error}</Text> : null}
    </View>
  );
}