import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { listDocumentTypes } from "@/lib/documentApi";
import { detectDocumentKind } from "@/lib/validators";
import type { DocumentoTipo } from "@/types/documents";
import { Button, Card, EmptyState, LoadingBlock, Screen, Title, Subtitle, colors } from "@/components/ui";
import { HeaderCard } from "@/components/HeaderCard";

export function HomeScreen() {
  const { isLoading, isAuthenticated, logout, user, mustChangePassword, mustValidateInternalToken } = useAuth();
  const [items, setItems] = useState<DocumentoTipo[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (mustChangePassword) {
      router.replace("/change-password");
      return;
    }

    if (mustValidateInternalToken) {
      router.replace("/token");
      return;
    }
  }, [isLoading, isAuthenticated, mustChangePassword, mustValidateInternalToken]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingDocs(true);
    listDocumentTypes()
      .then((data) => setItems(data.sort((a, b) => a.nome.localeCompare(b.nome))))
      .catch((error) => Alert.alert("Erro", error?.response?.data?.detail || "Não foi possível carregar os documentos."))
      .finally(() => setLoadingDocs(false));
  }, [isAuthenticated]);

  const hello = useMemo(() => {
    if (!user?.nome) return "Portal do funcionário";
    const firstName = user.nome.split(" ")[0];
    return `Olá, ${firstName}`;
  }, [user?.nome]);

  return (
    <Screen>
      <HeaderCard title={hello} subtitle="Consulta de documentos mobile em Expo" />

      <Card>
        <Title>Documentos disponíveis</Title>
        <Subtitle>Selecione o tipo de documento para abrir a tela de busca.</Subtitle>
      </Card>

      {loadingDocs ? <LoadingBlock text="Carregando documentos..." /> : null}

      {!loadingDocs && items.length === 0 ? (
        <EmptyState title="Nenhum documento encontrado" description="Sua conta não retornou tipos de documento disponíveis." />
      ) : null}

      {items.map((item) => {
        const kind = detectDocumentKind(item.nome);
        return (
          <Pressable
            key={`${item.id}-${item.nome}`}
            onPress={() =>
              router.push({
                pathname: "/listar" as any,
                params: {
                  id: String(item.id),
                  nome: item.nome,
                  kind
                }
              })
            }
            style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}
          >
            <Text style={styles.itemTitle}>{item.nome}</Text>
            <Text style={styles.itemSubtitle}>Tipo interno: {kind}</Text>
          </Pressable>
        );
      })}

      <View style={{ gap: 12 }}>
        <Button title="Chat RH" onPress={() => router.push("/chat")} variant="secondary" />
        <Button title="Sair" onPress={logout} variant="danger" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4
  },
  itemPressed: {
    opacity: 0.92
  },
  itemTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  itemSubtitle: {
    color: colors.muted,
    fontSize: 13
  }
});