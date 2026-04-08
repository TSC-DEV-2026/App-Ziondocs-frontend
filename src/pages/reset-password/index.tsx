
import React, { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, friendlyErrorMessage } from "@/lib/api";
import { isEmail, isValidCPF } from "@/lib/validators";
import { Button, InputField, Screen } from "@/components/ui";
import { ResetPasswordCard } from "./ui";

const requestSchema = z.object({
  usuario: z
    .string()
    .min(1, "Informe seu usuário")
    .transform((v) => v.trim())
    .refine((v) => isEmail(v) || isValidCPF(v), {
      message: "Informe um CPF válido ou um e-mail válido",
    }),
});

const resetSchema = z
  .object({
    codigo: z.string().min(4, "Informe o código"),
    novaSenha: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres"),
    confirmarSenha: z.string().min(8, "Confirme sua nova senha"),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    path: ["confirmarSenha"],
    message: "As senhas não conferem",
  });

type RequestForm = z.infer<typeof requestSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [usuarioLocked, setUsuarioLocked] = useState("");

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { usuario: "" },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      codigo: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const onRequest = async (data: RequestForm) => {
    try {
      await api.post("/user/request-password-reset", {
        usuario: data.usuario,
      });
      setUsuarioLocked(data.usuario);
      setStep("reset");
      Alert.alert("Sucesso", "Código enviado para seu e-mail.");
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao solicitar redefinição."));
    }
  };

  const onReset = async (data: ResetForm) => {
    try {
      await api.post("/user/reset-password", {
        usuario: usuarioLocked,
        token: data.codigo,
        nova_senha: data.novaSenha,
      });
      Alert.alert("Sucesso", "Senha alterada com sucesso.");
      router.replace("/login");
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao redefinir a senha."));
    }
  };

  return (
    <Screen>
      <ResetPasswordCard
        title={step === "request" ? "Solicitar código" : "Definir nova senha"}
        subtitle={
          step === "request"
            ? "Informe seu CPF ou e-mail para receber o código."
            : "Digite o código enviado e a nova senha."
        }
        lockedUser={step === "reset" ? usuarioLocked : undefined}
      >
        {step === "request" ? (
          <>
            <Controller
              control={requestForm.control}
              name="usuario"
              render={({ field: { value, onChange } }) => (
                <InputField
                  label="Usuário"
                  value={value}
                  onChangeText={onChange}
                  error={requestForm.formState.errors.usuario?.message}
                  autoCapitalize="none"
                />
              )}
            />
            <Button title="Enviar código" onPress={requestForm.handleSubmit(onRequest)} />
          </>
        ) : (
          <>
            <Controller
              control={resetForm.control}
              name="codigo"
              render={({ field: { value, onChange } }) => (
                <InputField
                  label="Código"
                  value={value}
                  onChangeText={onChange}
                  error={resetForm.formState.errors.codigo?.message}
                  keyboardType="numeric"
                />
              )}
            />
            <Controller
              control={resetForm.control}
              name="novaSenha"
              render={({ field: { value, onChange } }) => (
                <InputField
                  label="Nova senha"
                  value={value}
                  onChangeText={onChange}
                  error={resetForm.formState.errors.novaSenha?.message}
                  secureTextEntry
                />
              )}
            />
            <Controller
              control={resetForm.control}
              name="confirmarSenha"
              render={({ field: { value, onChange } }) => (
                <InputField
                  label="Confirmar nova senha"
                  value={value}
                  onChangeText={onChange}
                  error={resetForm.formState.errors.confirmarSenha?.message}
                  secureTextEntry
                />
              )}
            />
            <Button title="Salvar nova senha" onPress={resetForm.handleSubmit(onReset)} />
          </>
        )}
      </ResetPasswordCard>
    </Screen>
  );
}
