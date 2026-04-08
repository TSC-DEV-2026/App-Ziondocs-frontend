import React from "react";
import { Alert, Platform, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, Card, Screen, Subtitle, Title } from "@/components/ui";
import { HeaderCard } from "@/components/HeaderCard";
import { sharePdf } from "@/lib/pdf";
import { acceptDocument } from "@/lib/documentApi";

export function DocumentPreviewScreen() {
  const params = useLocalSearchParams<{
    base64?: string;
    title?: string;
    kind?: string;
    cpf?: string;
    matricula?: string;
    empresa?: string;
    competencia?: string;
    lote?: string;
  }>();

  const title = params.title || "Documento";
  const base64 = params.base64 || "";

  const onShare = async () => {
    if (!base64) {
      Alert.alert("Aviso", "Este documento não possui conteúdo PDF.");
      return;
    }

    try {
      await sharePdf(base64, `${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível compartilhar o PDF.");
    }
  };

  const onAccept = async () => {
    try {
      await acceptDocument({
        aceito: true,
        tipo_doc: String(params.kind || "documento"),
        base64,
        cpf: String(params.cpf || ""),
        matricula: String(params.matricula || ""),
        unidade: String(params.empresa || ""),
        competencia: String(params.competencia || ""),
        id_ged: params.lote ? String(params.lote) : undefined,
      });
      Alert.alert("Sucesso", "Aceite registrado com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.detail || "Não foi possível registrar o aceite.");
    }
  };

  return (
    <Screen>
      <HeaderCard title={String(title)} subtitle="Preview e compartilhamento do PDF" />

      <Card>
        <Title>PDF gerado</Title>
        <Subtitle>
          No app nativo, o Expo Go não oferece um visualizador PDF embutido confiável em Android/iOS.
          Por isso esta tela gera o arquivo localmente e abre o compartilhamento para visualização externa.
        </Subtitle>

        <View style={{ gap: 12 }}>
          <Text>Plataforma atual: {Platform.OS}</Text>
          <Text>Documento pronto: {base64 ? "sim" : "não"}</Text>
          <Button title="Abrir / compartilhar PDF" onPress={onShare} />
          <Button title="Registrar aceite" onPress={onAccept} variant="secondary" />
        </View>
      </Card>
    </Screen>
  );
}