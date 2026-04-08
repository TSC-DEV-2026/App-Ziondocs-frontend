import React from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, friendlyErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatCPF, onlyDigits } from "@/lib/validators";
import { Button, InputField, Screen } from "@/components/ui";
import { HeaderCard } from "@/components/HeaderCard";
import { RegisterCard } from "./ui";

const schema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  cpf: z.string().min(14, "CPF inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      email: "",
      cpf: "",
      senha: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/user/register", {
        pessoa: {
          nome: data.nome,
          empresa: 0,
          cliente: 0,
          cpf: onlyDigits(data.cpf),
        },
        usuario: {
          email: data.email,
          senha: data.senha,
        },
      });

      const me = await login({ usuario: data.email, senha: data.senha });

      if (!me) {
        Alert.alert("Aviso", "Conta criada, mas o login automático não pôde ser concluído.");
        router.replace("/login");
        return;
      }

      router.replace(me.senha_trocada === true ? "/home" : "/change-password");
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao criar conta."));
    }
  };

  return (
    <Screen>
      <HeaderCard title="Criar conta" subtitle="Cadastro mobile" />
      <RegisterCard>
        <Controller
          control={control}
          name="nome"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Nome"
              value={value}
              onChangeText={onChange}
              error={errors.nome?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="E-mail"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="cpf"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="CPF"
              value={value}
              onChangeText={(text) => onChange(formatCPF(text))}
              error={errors.cpf?.message}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="senha"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Senha"
              value={value}
              onChangeText={onChange}
              error={errors.senha?.message}
              secureTextEntry
            />
          )}
        />

        <Button title="Cadastrar" onPress={handleSubmit(onSubmit)} />
      </RegisterCard>
    </Screen>
  );
}
