import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, friendlyErrorMessage } from "@/lib/api";
import { isEmail, isValidCPF } from "@/lib/validators";
import { Button, InputField, Screen } from "@/components/ui";
import { ResetPasswordCard } from "./ui";
import { styles } from "./styles";

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
    codigo: z
      .string()
      .min(4, "Informe o código")
      .max(12, "Código inválido")
      .refine((v) => /^\d+$/.test(v), {
        message: "O código deve conter apenas números",
      }),
    novaSenha: z
      .string()
      .min(8, "A nova senha deve ter no mínimo 8 caracteres")
      .max(128, "A nova senha é muito longa"),
    confirmarSenha: z.string().min(8, "Confirme sua nova senha"),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    path: ["confirmarSenha"],
    message: "As senhas não conferem",
  });

type RequestForm = z.infer<typeof requestSchema>;
type ResetForm = z.infer<typeof resetSchema>;
type Step = "request" | "reset";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [usuarioLocked, setUsuarioLocked] = useState("");
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [codigoInput, setCodigoInput] = useState("");

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
    mode: "onSubmit",
  });

  useEffect(() => {
    resetForm.setValue("codigo", codigoInput, {
      shouldDirty: true,
      shouldValidate: false,
      shouldTouch: false,
    });
  }, [codigoInput, resetForm]);

  const onRequest = async (data: RequestForm) => {
    if (loadingRequest || loadingReset || isLeaving) return;

    try {
      setPageError("");
      setSuccessMessage("");
      setLoadingRequest(true);

      await api.post("/user/request-password-reset", {
        usuario: data.usuario,
      });

      setUsuarioLocked(data.usuario);
      setCodigoInput("");
      resetForm.reset({
        codigo: "",
        novaSenha: "",
        confirmarSenha: "",
      });
      setStep("reset");
      setSuccessMessage("Código enviado para seu e-mail.");
    } catch (error) {
      setPageError(friendlyErrorMessage(error, "Falha ao solicitar redefinição."));
    } finally {
      setLoadingRequest(false);
    }
  };

  const onReset = async (data: ResetForm) => {
    if (loadingRequest || loadingReset || isLeaving) return;

    try {
      if (!usuarioLocked) {
        setPageError("Usuário não identificado. Solicite o código novamente.");
        setStep("request");
        return;
      }

      setPageError("");
      setSuccessMessage("");
      setLoadingReset(true);

      await api.post("/user/reset-password", {
        usuario: usuarioLocked,
        token: data.codigo,
        nova_senha: data.novaSenha,
      });

      setSuccessMessage("Senha alterada com sucesso. Redirecionando para o login...");

      setTimeout(() => {
        router.replace("/login");
      }, 900);
    } catch (error) {
      setPageError(friendlyErrorMessage(error, "Falha ao redefinir a senha."));
    } finally {
      setLoadingReset(false);
    }
  };

  const handleBackToLogin = async () => {
    if (loadingRequest || loadingReset || isLeaving) return;

    try {
      setIsLeaving(true);
      setPageError("");
      setSuccessMessage("");
      router.replace("/login");
    } catch {
      setIsLeaving(false);
    }
  };

  const isBusy = loadingRequest || loadingReset || isLeaving;

  return (
    <Screen
      gradientColors={["#44F020", "#2ECC4A"]}
      contentContainerStyle={styles.container}
    >
      <ResetPasswordCard
        title="Redefinir Senha"
        subtitle={
          step === "request"
            ? "Informe seu CPF ou e-mail para enviarmos um código para seu e-mail."
            : "Digite o código recebido e defina sua nova senha."
        }
        lockedUser={step === "reset" ? usuarioLocked : undefined}
        pageError={pageError}
        successMessage={successMessage}
        isLeaving={isLeaving}
        onBackToLogin={handleBackToLogin}
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
                  editable={!isBusy}
                />
              )}
            />

            <Button
              title={loadingRequest ? "Enviando..." : "Enviar código"}
              onPress={requestForm.handleSubmit(onRequest)}
              loading={loadingRequest}
              disabled={isBusy}
            />
          </>
        ) : (
          <>
            <InputField
              label="Código"
              value={codigoInput}
              onChangeText={(text) => {
                const next = (text ?? "").replace(/\D/g, "").slice(0, 12);
                setCodigoInput(next);

                if (resetForm.formState.errors.codigo) {
                  resetForm.clearErrors("codigo");
                }
              }}
              onBlur={() => {
                resetForm.trigger("codigo");
              }}
              error={resetForm.formState.errors.codigo?.message}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isBusy}
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
                  editable={!isBusy}
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
                  editable={!isBusy}
                />
              )}
            />

            <Button
              title={loadingReset ? "Redefinindo..." : "Redefinir Senha"}
              onPress={resetForm.handleSubmit(onReset)}
              loading={loadingReset}
              disabled={isBusy}
            />
          </>
        )}
      </ResetPasswordCard>
    </Screen>
  );
}