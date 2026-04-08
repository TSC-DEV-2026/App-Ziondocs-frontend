import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export const colors = {
  primary: "#2fa146",
  primaryDark: "#25601d",
  primaryLight: "#2fa146",
  bg: "#f3f7f4",
  card: "#E1F9E2",
  text: "#0b2b14",
  muted: "#5f7467",
  border: "#d8efe0",
  danger: "#b42318",
};

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  gradientColors,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  gradientColors?: readonly [string, string, ...string[]];
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[contentContainerStyle]}>
      {children}
    </View>
  );

  if (gradientColors?.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.safe}
        >
          {body}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={styles.safe}>{body}</SafeAreaView>;
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

export function Divider({
  style,
  marginVertical = 1,
}: {
  style?: StyleProp<ViewStyle>;
  marginVertical?: number;
}) {
  return (
    <LinearGradient
      colors={[colors.primaryLight, colors.primaryDark]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.divider, { marginVertical }, style]}
    />
  );
}

export function InputField({
  label,
  error,
  secureTextEntry,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = !!secureTextEntry;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          isFocused && !error ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor="#7b8b82"
          secureTextEntry={isPasswordField ? !showPassword : false}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {isPasswordField ? (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            hitSlop={10}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.primaryDark}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  variant = "primary",
  loading = false,
}: {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}) {
  const isPrimary = variant === "primary";

  const viewStyles =
    variant === "secondary"
      ? styles.buttonSecondary
      : variant === "danger"
        ? styles.buttonDanger
        : styles.buttonPrimary;

  const textStyles =
    variant === "secondary"
      ? styles.buttonTextSecondary
      : styles.buttonTextPrimary;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => void onPress()}
      style={({ pressed }) => [
        styles.buttonBase,
        viewStyles,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !(disabled || loading) ? styles.buttonPressed : null,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={["#25601D", "#2FA045"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={textStyles}>{title}</Text>
          )}
        </LinearGradient>
      ) : loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },
  divider: {
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    width: 100,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 15,
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingVertical: 12,
  },
  eyeButton: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  inputFocused: {
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 15,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.danger,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
  buttonBase: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  buttonPrimary: {
    backgroundColor: "transparent",
  },
  buttonGradient: {
    width: "100%",
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  buttonSecondary: {
    backgroundColor: "#eef6f0",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextPrimary: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonTextSecondary: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});