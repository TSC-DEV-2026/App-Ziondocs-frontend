import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Screen } from "@/components/ui";
import { TokenCard, TokenInputField } from "./ui";

const schema = z.object({
  token: z.string().min(1, "Informe o token"),
});

type FormData = z.infer<typeof schema>;

type ValidateTokenResponse = {
  valid: boolean;
  reason?: string | null;
};

export default function TokenPage() {
  const {
    isAuthenticated,
    internalTokenValidated,
    internalTokenBlockedInSession,
    setInternalTokenValidated,
    setInternalTokenBlockedInSession,
    setInternalTokenPromptedInSession,
  } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: "",
    },
  });

  const [step, setStep] = useState<"send" | "validate">("send");
  const [sending, setSending] = useState(false);
  const [validating, setValidating] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(23);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (internalTokenValidated || internalTokenBlockedInSession) {
      router.replace("/home");
      return;
    }

    void setInternalTokenPromptedInSession(true);
  }, [
    isAuthenticated,
    internalTokenValidated,
    internalTokenBlockedInSession,
    setInternalTokenPromptedInSession,
  ]);

  useEffect(() => {
    if (step !== "validate" || cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, cooldown]);

  const resendText = useMemo(() => {
    if (cooldown > 0) {
      return `Reenviar token (aguarde ${cooldown}s)`;
    }

    return "Reenviar token";
  }, [cooldown]);

  const onSendToken = async () => {
    try {
      setSending(true);
      const { data } = await api.post<{ message?: string }>(
        "/user/internal/send-token",
      );

      setStep("validate");
      setCooldown(23);
      setSendMessage(
        data?.message ||
          "Token enviado para o seu e-mail. Verifique sua caixa de entrada.",
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        friendlyErrorMessage(error, "Falha ao enviar token."),
      );
    } finally {
      setSending(false);
    }
  };

  const onResendToken = async () => {
    if (cooldown > 0 || resending) return;

    try {
      setResending(true);

      const { data } = await api.post<{ message?: string }>(
        "/user/internal/send-token",
      );

      setCooldown(23);
      setSendMessage(
        data?.message ||
          "Token enviado para o seu e-mail. Verifique sua caixa de entrada.",
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        friendlyErrorMessage(error, "Falha ao reenviar token."),
      );
    } finally {
      setResending(false);
    }
  };

  const onValidate = async (data: FormData) => {
    try {
      setValidating(true);

      const response = await api.post<ValidateTokenResponse>(
        "/user/internal/validate-token",
        {
          token: data.token.trim(),
        },
      );

      if (!response.data?.valid) {
        const reason = response.data?.reason
          ? ` (${response.data.reason})`
          : "";
        Alert.alert("Erro", `Token inválido${reason}.`);
        return;
      }

      await setInternalTokenValidated(true);
      await setInternalTokenBlockedInSession(false);
      Alert.alert("Sucesso", "Token validado com sucesso.");
      router.replace("/home");
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Token inválido."));
    } finally {
      setValidating(false);
    }
  };

  return (
    <Screen
      scroll
      contentContainerStyle={styles.content}
      gradientColors={["#7AE942", "#69D24F"]}
    >
      <TokenCard
        title={step === "send" ? "Validação de\nToken" : "Validação de\nToken"}
        subtitle={
          step === "send"
            ? "Digite o token enviado para seu e-mail."
            : "Digite o token enviado para seu e-mail."
        }
        showDivider
        infoMessage={step === "validate" ? sendMessage : undefined}
      >
        {step === "send" ? (
          <Button
            title="Enviar token"
            onPress={onSendToken}
            loading={sending}
          />
        ) : (
          <>
            <Controller
              control={form.control}
              name="token"
              render={({ field: { value, onChange } }) => (
                <TokenInputField
                  label="Token de Acesso"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Digite seu token"
                  error={form.formState.errors.token?.message}
                />
              )}
            />

            <Button
              title="Validar Token"
              onPress={form.handleSubmit(onValidate)}
              loading={validating}
            />

            <View style={styles.footerArea}>
              <Pressable onPress={onResendToken} disabled={cooldown > 0 || resending}>
                <Text
                  style={[
                    styles.resendLink,
                    cooldown > 0 || resending ? styles.resendLinkDisabled : null,
                  ]}
                >
                  {resendText}
                </Text>
              </Pressable>

              <Text style={styles.noteText}>
                Ao reenviar, o token anterior pode ser invalidado. Use sempre o
                último e-mail.
              </Text>
            </View>
          </>
        )}
      </TokenCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  footerArea: {
    gap: 10,
    marginTop: 4,
  },
  resendLink: {
    textAlign: "center",
    color: "#64748b",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  resendLinkDisabled: {
    opacity: 0.85,
  },
  noteText: {
    textAlign: "center",
    color: "#7a857d",
    fontSize: 12,
    lineHeight: 18,
  },
});