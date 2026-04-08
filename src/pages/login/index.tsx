
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, errorMessage } from "@/contexts/AuthContext";
import { isEmail, isValidCPF } from "@/lib/validators";
import { InputField, Screen } from "@/components/ui";
import { LoginCard } from "./ui";
import { styles } from "./styles";

const schema = z.object({
  usuario: z
    .string()
    .min(1, "Informe seu usuário")
    .transform((v) => v.trim())
    .refine((v) => isEmail(v) || isValidCPF(v), {
      message: "Informe um CPF válido ou um e-mail válido",
    }),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const {
    login,
    isAuthenticated,
    mustChangePassword,
    mustValidateInternalToken,
    isLoggingIn,
  } = useAuth();
  const [pageError, setPageError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      usuario: "",
      senha: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated && mustChangePassword) {
      router.replace("/change-password");
      return;
    }

    if (isAuthenticated && mustValidateInternalToken) {
      router.replace("/token");
      return;
    }

    if (isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, mustChangePassword, mustValidateInternalToken]);

  const onSubmit = async (data: FormData) => {
    try {
      setPageError("");
      const me = await login(data);

      if (!me) {
        setPageError("Não foi possível carregar os dados do usuário.");
        return;
      }

      if (me.senha_trocada !== true) {
        router.replace("/change-password");
        return;
      }

      if (me.interno === true) {
        router.replace("/token");
        return;
      }

      router.replace("/home");
    } catch (error) {
      const msg = errorMessage(error, "Erro ao realizar login.");
      setPageError(msg);
      Alert.alert("Erro", msg);
    }
  };

  return (
    <Screen
      gradientColors={["#44F020", "#2ECC4A"]}
      contentContainerStyle={styles.container}
    >
      <LoginCard
        pageError={pageError}
        isLoggingIn={isLoggingIn}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          control={control}
          name="usuario"
          render={({ field: { value, onChange } }) => (
            <InputField
              label="Usuário"
              value={value}
              onChangeText={onChange}
              error={errors.usuario?.message}
              autoCapitalize="none"
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
      </LoginCard>
    </Screen>
  );
}
