import React, { useState } from "react";
import { Alert } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { InputField, Screen } from "@/components/ui";
import { ChangePasswordCard } from "./ui";
import { styles } from "./styles";

const schema = z
  .object({
    novaSenha: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres"),
    confirmarSenha: z.string().min(8, "Confirme a nova senha"),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    path: ["confirmarSenha"],
    message: "As senhas não conferem",
  });

type FormData = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const {
    user,
    loginPassword,
    clearLoginPassword,
    logout,
    mustChangePassword,
  } = useAuth();

  const [pageError, setPageError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isLeaving) return;

      setPageError("");

      if (!user?.cpf) {
        const msg = "Não foi possível identificar o CPF do usuário.";
        setPageError(msg);
        Alert.alert("Erro", msg);
        return;
      }

      if (!loginPassword) {
        const msg = "A senha atual não está mais disponível. Faça login novamente.";
        setPageError(msg);
        Alert.alert("Erro", msg);
        return;
      }

      await api.put("/user/update-password", {
        cpf: user.cpf,
        senha_atual: loginPassword,
        senha_nova: data.novaSenha,
      });

      clearLoginPassword();
      Alert.alert("Sucesso", "Senha atualizada. Faça login novamente.");
      await logout();
    } catch (error) {
      const msg = friendlyErrorMessage(error, "Falha ao atualizar a senha.");
      setPageError(msg);
      Alert.alert("Erro", msg);
    }
  };

  const handleBackToLogin = async () => {
    if (isLeaving || isSubmitting) return;

    try {
      setIsLeaving(true);
      await logout();
    } catch {
      setIsLeaving(false);
    }
  };

  return (
    <Screen
      gradientColors={["#44F020", "#2ECC4A"]}
      contentContainerStyle={styles.container}
    >
      <ChangePasswordCard
        showWarning={!loginPassword}
        pageError={pageError}
        isSubmitting={isSubmitting}
        isLeaving={isLeaving}
        onSubmit={handleSubmit(onSubmit)}
        onBackToLogin={handleBackToLogin}
        disableSubmit={!mustChangePassword || !loginPassword || isLeaving}
      >
        <Controller
          control={control}
          name="novaSenha"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Nova senha"
              value={value}
              onChangeText={onChange}
              error={errors.novaSenha?.message}
              secureTextEntry
            />
          )}
        />

        <Controller
          control={control}
          name="confirmarSenha"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Confirmar nova senha"
              value={value}
              onChangeText={onChange}
              error={errors.confirmarSenha?.message}
              secureTextEntry
            />
          )}
        />
      </ChangePasswordCard>
    </Screen>
  );
}