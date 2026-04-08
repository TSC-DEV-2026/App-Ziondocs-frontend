import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { listDocumentTypes } from "@/lib/documentApi";
import type { DocumentoTipo } from "@/types/documents";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomeDocumentCard, SideMenu } from "./ui";
import { styles } from "./styles";

const AST_CLIENTES = new Set<string>(["6685", "6862", "6683", "13603", "5715"]);
const WECAN_CLIENTES = new Set<string>([
  "14002",
  "14003",
  "5238",
  "123",
  "6852",
  "6689",
]);

type DocumentKind = "holerite" | "beneficios" | "trct" | "generico";
type BrandType = "ast" | "wecan" | "default";

function getClienteCode(user: any): string | null {
  const direct = user?.cliente;

  if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
    return String(direct).trim();
  }

  const fromDados = user?.dados?.[0]?.id;

  if (
    fromDados !== undefined &&
    fromDados !== null &&
    String(fromDados).trim() !== ""
  ) {
    return String(fromDados).trim();
  }

  return null;
}

function getBrandType(user: any): BrandType {
  const code = getClienteCode(user);
  if (!code) return "default";

  if (AST_CLIENTES.has(code)) return "ast";
  if (WECAN_CLIENTES.has(code)) return "wecan";

  return "default";
}

function getTemplateId(nomeDocumento: string): string {
  const nome = (nomeDocumento || "").toLowerCase();

  if (/recibo\s*va|vale\s*alimenta(ç|c)[aã]o/i.test(nome)) {
    return "3";
  }

  if (/trtc|trct|informe\s*rendimento/i.test(nome)) {
    return "6";
  }

  return "3";
}

function getDocumentKind(nomeDocumento: string): DocumentKind {
  const nome = (nomeDocumento || "").toLowerCase();

  if (
    nome.includes("holerite") ||
    nome.includes("folha") ||
    nome.includes("pagamento")
  ) {
    return "holerite";
  }

  if (
    nome.includes("beneficio") ||
    nome.includes("benefícios") ||
    nome.includes("vale")
  ) {
    return "beneficios";
  }

  if (
    nome.includes("trtc") ||
    nome.includes("trct") ||
    nome.includes("informe rendimento")
  ) {
    return "trct";
  }

  return "generico";
}

export default function HomePage() {
  const {
    isLoading,
    isAuthenticated,
    logout,
    user,
    mustChangePassword,
    mustValidateInternalToken,
  } = useAuth();

  const [items, setItems] = useState<DocumentoTipo[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    }
  }, [
    isLoading,
    isAuthenticated,
    mustChangePassword,
    mustValidateInternalToken,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoadingDocs(true);

    listDocumentTypes()
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
        setItems(sorted);
      })
      .catch((error) => {
        Alert.alert(
          "Erro",
          error?.response?.data?.detail ||
            "Não foi possível carregar os documentos.",
        );
      })
      .finally(() => setLoadingDocs(false));
  }, [isAuthenticated]);

  const firstName = useMemo(() => {
    if (!user?.nome) return "Usuário";
    return String(user.nome).trim().split(" ")[0];
  }, [user?.nome]);

  const fullName = useMemo(() => {
    if (!user?.nome) return "Usuário";
    return String(user.nome);
  }, [user?.nome]);

  const userDocument = useMemo(() => {
    return user?.cpf || "";
  }, [user]);

  const brandType = useMemo(() => getBrandType(user), [user]);

  const onOpenDocument = (item: DocumentoTipo) => {
    const kind = getDocumentKind(item.nome);
    const template = getTemplateId(item.nome);

    router.push({
      pathname: "/listar" as any,
      params: {
        id: String(item.id),
        nome: item.nome,
        kind,
        template,
      },
    } as any);
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <Header brandType={brandType} onMenuPress={() => setMenuOpen(true)} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>
            {loadingDocs ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#0b4c1b" />
                <Text style={styles.loadingText}>Carregando documentos...</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Nenhum documento encontrado</Text>
                <Text style={styles.emptyDescription}>
                  Sua conta não retornou tipos de documento disponíveis.
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {items.map((item) => (
                  <HomeDocumentCard
                    key={`${item.id}-${item.nome}`}
                    title={item.nome}
                    onPress={() => onOpenDocument(item)}
                  />
                ))}
              </View>
            )}
          </View>

          <Footer />
        </ScrollView>
      </SafeAreaView>

      <SideMenu
        visible={menuOpen}
        fullName={fullName}
        documentValue={userDocument}
        firstName={firstName}
        onClose={() => setMenuOpen(false)}
        onGoHome={() => {
          setMenuOpen(false);
          router.replace("/home");
        }}
        onLogout={() => {
          setMenuOpen(false);
          logout();
        }}
      />
    </>
  );
}