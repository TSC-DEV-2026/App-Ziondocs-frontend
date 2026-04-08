import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCompetencias, mountPdf, searchDocuments } from "@/lib/documentApi";
import { friendlyErrorMessage } from "@/lib/api";
import { normalizeYYYYMM, onlyDigits } from "@/lib/validators";
import type { SearchDocumentItem } from "@/types/documents";
import { Badge, Button, Card, EmptyState, InputField, LoadingBlock, Screen, Subtitle, Title, colors } from "@/components/ui";
import { HeaderCard } from "@/components/HeaderCard";

function makeCompetenciaLabel(value: string) {
  if (/^\d{6}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4)}`;
  return value;
}

export function DocumentsScreen() {
  const { id, nome, kind } = useLocalSearchParams<{ id?: string; nome?: string; kind?: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [cpf, setCpf] = useState(user?.cpf ?? "");
  const [matricula, setMatricula] = useState(user?.matricula ?? user?.dados?.[0]?.matricula ?? "");
  const [empresa, setEmpresa] = useState(user?.cliente ?? user?.dados?.[0]?.id ?? "");
  const [competencia, setCompetencia] = useState("");
  const [competencias, setCompetencias] = useState<string[]>([]);
  const [items, setItems] = useState<SearchDocumentItem[]>([]);
  const [loadingCompetencias, setLoadingCompetencias] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated]);

  const screenTitle = useMemo(() => nome || "Documentos", [nome]);

  const loadCompetencias = async () => {
    try {
      setLoadingCompetencias(true);
      const result = await fetchCompetencias(kind || "generico", {
        cpf: onlyDigits(cpf),
        matricula,
        empresa,
        cliente: empresa
      });
      const list = result.map((item) => `${item.ano}${item.mes}`);
      setCompetencias(list);
      if (!competencia && list[0]) {
        setCompetencia(list[0]);
      }
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao carregar competências."));
    } finally {
      setLoadingCompetencias(false);
    }
  };

  const doSearch = async () => {
    try {
      setLoadingSearch(true);
      const data = await searchDocuments({
        kind: kind || "generico",
        idTipo: id,
        cpf: onlyDigits(cpf),
        matricula,
        empresa,
        competencia
      });

      let normalized: SearchDocumentItem[] = [];

      if (Array.isArray(data)) {
        normalized = data as SearchDocumentItem[];
      } else if (Array.isArray((data as any)?.holerites)) {
        normalized = (data as any).holerites.map((item: any, index: number) => ({
          id_documento: String(item?.cabecalho?.lote ?? index + 1),
          uuid: item?.uuid,
          anomes: (data as any)?.competencia_utilizada,
          descricao: item?.descricao,
          tipo_calculo: item?.tipo_calculo
        }));
      } else if (Array.isArray((data as any)?.ferias)) {
        normalized = (data as any).ferias.map((_: any, index: number) => ({
          id_documento: String(index + 1),
          anomes: (data as any)?.competencia,
          descricao: "Recibo de férias"
        }));
      } else if (Array.isArray((data as any)?.informes)) {
        normalized = [{
          id_documento: "1",
          anomes: (data as any)?.competencia,
          descricao: "Informe de rendimentos"
        }];
      }

      setItems(normalized);
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao buscar documentos."));
      setItems([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const openItem = async (item: SearchDocumentItem) => {
    try {
      const pdf = await mountPdf({
        kind: kind || "generico",
        item,
        cpf: onlyDigits(cpf),
        matricula,
        empresa,
        competencia
      });

      if (!pdf?.pdf_base64) {
        Alert.alert("Aviso", "O backend não retornou um PDF para este documento.");
        return;
      }

      router.push({
        pathname: "/visualizar" as any,
        params: {
          base64: pdf.pdf_base64,
          title: item.descricao || nome || "Documento",
          kind: String(kind || "generico"),
          cpf: onlyDigits(cpf),
          matricula,
          empresa,
          competencia: normalizeYYYYMM(competencia),
          lote: String(item.id_documento || "")
        }
      });
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao montar PDF."));
    }
  };

  return (
    <Screen>
      <HeaderCard title={String(screenTitle)} subtitle="Busca e abertura de documentos" />

      <Card>
        <Title>Filtros</Title>
        <Subtitle>Preencha os campos e carregue as competências antes da busca.</Subtitle>

        <InputField label="CPF" value={cpf} onChangeText={setCpf} keyboardType="numeric" />
        <InputField label="Matrícula" value={matricula} onChangeText={setMatricula} />
        <InputField label="Empresa / Cliente" value={empresa} onChangeText={setEmpresa} />
        <InputField label="Competência (YYYYMM ou YYYY-MM)" value={competencia} onChangeText={setCompetencia} />

        <View style={{ gap: 10 }}>
          <Button title="Carregar competências" onPress={loadCompetencias} variant="secondary" loading={loadingCompetencias} />
          <Button title="Buscar documentos" onPress={doSearch} loading={loadingSearch} />
        </View>
      </Card>

      {competencias.length > 0 ? (
        <Card>
          <Title>Competências retornadas</Title>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {competencias.map((item) => (
              <Pressable key={item} onPress={() => setCompetencia(item)}>
                <Badge>{makeCompetenciaLabel(item)}</Badge>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      {loadingSearch ? <LoadingBlock text="Buscando documentos..." /> : null}

      {!loadingSearch && items.length === 0 ? (
        <EmptyState title="Nenhum documento na lista" description="Depois da busca, os resultados aparecem aqui." />
      ) : null}

      {items.map((item, index) => (
        <Pressable key={`${item.id_documento}-${index}`} onPress={() => void openItem(item)} style={({ pressed }) => [styles.resultCard, pressed ? styles.resultCardPressed : null]}>
          <Text style={styles.resultTitle}>{item.descricao || item.nomearquivo || `Documento ${index + 1}`}</Text>
          <Text style={styles.resultMeta}>Lote/ID: {item.id_documento || "-"}</Text>
          <Text style={styles.resultMeta}>Competência: {item.anomes || normalizeYYYYMM(competencia) || "-"}</Text>
          {item.tipo_calculo ? <Text style={styles.resultMeta}>Tipo cálculo: {item.tipo_calculo}</Text> : null}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4
  },
  resultCardPressed: {
    opacity: 0.9
  },
  resultTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  resultMeta: {
    color: colors.muted,
    fontSize: 13
  }
});