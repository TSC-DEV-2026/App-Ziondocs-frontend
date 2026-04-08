
import React from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button, InputField, Screen } from "@/components/ui";
import { HeaderCard } from "@/components/HeaderCard";
import { ChangePasswordCard } from "./ui";

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
  const { user, loginPassword, clearLoginPassword, logout, mustChangePassword } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (!user?.cpf) {
        Alert.alert("Erro", "Não foi possível identificar o CPF do usuário.");
        return;
      }

      if (!loginPassword) {
        Alert.alert("Erro", "A senha atual não está mais disponível. Faça login novamente.");
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
      router.replace("/login");
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao atualizar a senha."));
    }
  };

  return (
    <Screen>
      <HeaderCard
        title="Troca obrigatória de senha"
        subtitle="Primeiro acesso / senha pendente"
      />
      <ChangePasswordCard showWarning={!loginPassword}>
        <Controller
          control={form.control}
          name="novaSenha"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Nova senha"
              value={value}
              onChangeText={onChange}
              error={form.formState.errors.novaSenha?.message}
              secureTextEntry
            />
          )}
        />

        <Controller
          control={form.control}
          name="confirmarSenha"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Confirmar nova senha"
              value={value}
              onChangeText={onChange}
              error={form.formState.errors.confirmarSenha?.message}
              secureTextEntry
            />
          )}
        />

        <Button
          title="Atualizar senha"
          onPress={form.handleSubmit(onSubmit)}
          disabled={!mustChangePassword}
        />
      </ChangePasswordCard>
    </Screen>
  );
}
