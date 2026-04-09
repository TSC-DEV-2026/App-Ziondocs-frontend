import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { api, friendlyErrorMessage } from "@/lib/api";
import { mountPdf, searchDocuments } from "@/lib/documentApi";
import { normalizeYYYYMM, onlyDigits } from "@/lib/validators";
import type { SearchDocumentItem } from "@/types/documents";
import { Header } from "@/components/layout/Header";
import {
  DiscoveryActionCard,
  DiscoveryGridSection,
  DiscoveryInfoBanner,
  DiscoveryOption,
  FiltersCard,
  ListarSideMenu,
  ResultsTable,
} from "./ui";
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

type BrandType = "ast" | "wecan" | "default";
type PickerMode = "month-year" | "year";
type DocumentMode =
  | "holerite"
  | "beneficios"
  | "ferias"
  | "informe_rendimentos"
  | "generico";

type GenericSearchDocument = {
  id_documento?: string | number;
  id_ged?: string | number;
  id?: string | number;
  anomes?: string;
  _norm_anomes?: string;
  ano?: string | number;
  ANO?: string | number;
  competencia?: string | number;
  nomearquivo?: string;
  tipodedoc?: string;
  descricao?: string;
  uuid?: string;
};

type GenericSearchResponse = {
  total_bruto?: number;
  ultimos_6_meses?: string[];
  total_encontrado?: number;
  documentos?: GenericSearchDocument[];
  anomes?: Array<{ ano: number; mes: number }>;
  anos?: Array<{ ano: number }>;
};

type MeEmpresaItem = {
  id: string;
  nome: string;
  matricula: string;
};

type EmpresaAgrupada = {
  id: string;
  nome: string;
  matriculas: string[];
};

type CompetenciaItem = {
  ano: number;
  mes: string;
};

type AnoOnlyItem = {
  ano: number;
};

type HoleriteItemExt = SearchDocumentItem & {
  tipo_calculo?: string;
};

type InformeEmpresaItem = {
  empresa: string;
  filial?: string;
  nome_empresa?: string;
};

type UserMeResponse = {
  cpf?: string;
  dados?: Array<{ id: string; nome: string; matricula: string }>;
  empresa?: Array<{
    empresa: string | number;
    filial?: string | number;
    nome_empresa?: string | null;
  }>;
};

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

function normalizeText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stripBuscarPrefix(value: string) {
  return String(value || "")
    .replace(/^buscar\s+/i, "")
    .trim();
}

function isReciboDocumentName(value: string) {
  const doc = normalizeText(value);
  return doc.includes("recibo va") || doc.includes("recibo vt");
}

function isTrctDocumentName(value: string, kind?: string) {
  const doc = normalizeText(value);
  const tipo = normalizeText(kind || "");
  return tipo === "trct" || doc.includes("trct") || doc.includes("rescis");
}

function isInformeDocumentName(value: string) {
  const doc = normalizeText(value);
  return (
    doc.includes("informe de rendimentos") ||
    doc.includes("informe rendimentos") ||
    doc.includes("informe rendimento")
  );
}

function resolveDocumentMode(kind?: string, nome?: string): DocumentMode {
  const tipoParam = normalizeText(kind || "");
  const docParam = normalizeText(nome || "");
  const joined = `${tipoParam} ${docParam}`.trim();

  if (
    joined.includes("informe de rendimentos") ||
    joined.includes("informe rendimentos") ||
    joined.includes("informe rendimento") ||
    (joined.includes("informe") && joined.includes("rend"))
  ) {
    return "informe_rendimentos";
  }

  if (joined.includes("beneficio") || joined.includes("beneficios")) {
    return "beneficios";
  }

  if (joined.includes("ferias")) {
    return "ferias";
  }

  if (joined.includes("holerite")) {
    return "holerite";
  }

  return "generico";
}

function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9, 11)}`;
}

function normalizeHoleriteTipoCalculo(value?: unknown): string {
  const raw = String(value ?? "").trim().toUpperCase();

  if (raw === "A") return "A";
  if (raw === "P") return "P";

  const normalized = normalizeText(String(value ?? ""));

  if (normalized.includes("adiant")) return "A";
  if (normalized.includes("pagamento")) return "P";

  return raw || "";
}

function resolveHoleriteDescricao(args: {
  tipo_calculo?: unknown;
  descricao?: unknown;
}): string {
  const tipo = normalizeHoleriteTipoCalculo(args.tipo_calculo);
  const descricao = normalizeText(String(args.descricao ?? ""));

  if (descricao.includes("adiant")) return "Adiantamento";
  if (descricao.includes("pagamento")) return "Pagamento";

  if (tipo === "A") return "Adiantamento";
  if (tipo === "P") return "Pagamento";

  return String(args.descricao ?? "").trim() || "Holerite";
}

function getHoleriteResolvedLabel(item: {
  tipo_calculo?: unknown;
  descricao?: unknown;
}) {
  return resolveHoleriteDescricao({
    tipo_calculo: item.tipo_calculo,
    descricao: item.descricao,
  });
}

function buildHoleriteIdentityKey(item: SearchDocumentItem) {
  const holerite = item as HoleriteItemExt;

  const uuid = String(holerite.uuid || "").trim();
  const lote = String(holerite.id_documento || "").trim();
  const competencia = normalizeYYYYMM(String(holerite.anomes || ""));
  const tipo = normalizeHoleriteTipoCalculo(holerite.tipo_calculo);
  const descricao = getHoleriteResolvedLabel(holerite);

  return [
    uuid || "sem-uuid",
    lote || "sem-lote",
    competencia || "sem-competencia",
    tipo || descricao,
  ]
    .join("|")
    .toLowerCase();
}

function normalizeAndDedupeHoleriteItems(
  docs: SearchDocumentItem[],
): SearchDocumentItem[] {
  const unique = new Map<string, SearchDocumentItem>();

  for (const rawItem of docs) {
    const item = rawItem as HoleriteItemExt;

    const normalizedItem: HoleriteItemExt = {
      ...item,
      tipo_calculo: normalizeHoleriteTipoCalculo(item.tipo_calculo),
      descricao: getHoleriteResolvedLabel(item),
    };

    const key = buildHoleriteIdentityKey(normalizedItem);

    if (!unique.has(key)) {
      unique.set(key, normalizedItem);
      continue;
    }

    const current = unique.get(key) as HoleriteItemExt;

    const candidateScore =
      (normalizedItem.uuid ? 4 : 0) +
      (normalizedItem.itemJson ? 3 : 0) +
      (normalizedItem.id_ged ? 2 : 0) +
      (normalizedItem.descricao ? 1 : 0);

    const currentScore =
      (current.uuid ? 4 : 0) +
      (current.itemJson ? 3 : 0) +
      (current.id_ged ? 2 : 0) +
      (current.descricao ? 1 : 0);

    if (candidateScore > currentScore) {
      unique.set(key, normalizedItem);
    }
  }

  return Array.from(unique.values());
}

function groupHoleriteItems(items: SearchDocumentItem[]) {
  const pagamento: SearchDocumentItem[] = [];
  const adiantamento: SearchDocumentItem[] = [];
  const outros: SearchDocumentItem[] = [];

  for (const item of normalizeAndDedupeHoleriteItems(items)) {
    const holerite = item as HoleriteItemExt;
    const tipo = normalizeHoleriteTipoCalculo(holerite.tipo_calculo);
    const descricao = normalizeText(getHoleriteResolvedLabel(holerite));

    if (tipo === "P" || descricao.includes("pagamento")) {
      pagamento.push({
        ...holerite,
        descricao: "Pagamento",
        tipo_calculo: "P",
      });
      continue;
    }

    if (tipo === "A" || descricao.includes("adiant")) {
      adiantamento.push({
        ...holerite,
        descricao: "Adiantamento",
        tipo_calculo: "A",
      });
      continue;
    }

    outros.push({
      ...holerite,
      descricao: getHoleriteResolvedLabel(holerite),
    });
  }

  return { pagamento, adiantamento, outros };
}

function normalizeGenericDocumentToItem(
  doc: GenericSearchDocument,
  competenciaFallback: string,
  templateId: string,
): SearchDocumentItem {
  const idDocumento = doc?.id_documento ?? doc?.id_ged ?? doc?.id ?? "";

  const anoMesRaw =
    doc?._norm_anomes ??
    doc?.anomes ??
    doc?.competencia ??
    doc?.ano ??
    doc?.ANO ??
    competenciaFallback;

  const anoMesStr = String(anoMesRaw || competenciaFallback || "");

  return {
    id_documento: String(idDocumento),
    id_ged:
      doc?.id_ged !== undefined && doc?.id_ged !== null
        ? String(doc.id_ged)
        : undefined,
    uuid:
      doc?.uuid !== undefined && doc?.uuid !== null
        ? String(doc.uuid)
        : undefined,
    anomes: anoMesStr,
    descricao:
      doc?.descricao || doc?.tipodedoc || doc?.nomearquivo || "Documento",
    itemJson: JSON.stringify({
      ...doc,
      templateId,
    }),
  } as SearchDocumentItem;
}

function normalizeSearchResult(
  data: unknown,
  competencia: string,
  mode: DocumentMode,
  templateId: string,
): SearchDocumentItem[] {
  if (Array.isArray(data)) {
    return data as SearchDocumentItem[];
  }

  const asAny = data as any;

  if (Array.isArray(asAny?.documentos)) {
    return asAny.documentos.map((doc: GenericSearchDocument) =>
      normalizeGenericDocumentToItem(doc, competencia, templateId),
    );
  }

  if (Array.isArray(asAny?.holerites)) {
    const normalized = asAny.holerites.map((item: any, index: number) => {
      const tipo_calculo =
        item?.tipo_calculo ?? item?.cabecalho?.tipo_calculo ?? "";

      const descricao = resolveHoleriteDescricao({
        tipo_calculo,
        descricao: item?.descricao,
      });

      return {
        id_documento: String(item?.cabecalho?.lote ?? index + 1),
        uuid: item?.uuid ?? item?.cabecalho?.uuid,
        id_ged: item?.id_ged,
        anomes: asAny?.competencia_utilizada || competencia,
        descricao,
        tipo_calculo: normalizeHoleriteTipoCalculo(tipo_calculo),
        itemJson: JSON.stringify({
          ...item,
          descricao,
          tipo_calculo: normalizeHoleriteTipoCalculo(tipo_calculo),
        }),
      } as HoleriteItemExt;
    });

    return normalizeAndDedupeHoleriteItems(normalized);
  }

  if (Array.isArray(asAny?.ferias)) {
    return asAny.ferias.map((item: any, index: number) => ({
      id_documento: String(index + 1),
      uuid: item?.uuid ?? item?.cabecalho?.uuid,
      id_ged: item?.id_ged,
      anomes: asAny?.competencia || competencia,
      descricao: "Recibo de férias",
      itemJson: JSON.stringify({
        ...item,
        competencia: asAny?.competencia || competencia,
        cpf: asAny?.cpf,
        matricula: asAny?.matricula,
        cliente: asAny?.cliente,
      }),
    }));
  }

  if (Array.isArray(asAny?.informes)) {
    return [
      {
        id_documento: "1",
        anomes: String(asAny?.competencia || competencia),
        descricao: "Informe de rendimentos",
        itemJson: JSON.stringify(asAny),
      },
    ];
  }

  if (mode === "holerite" && asAny?.cabecalho) {
    const tipo_calculo =
      asAny?.tipo_calculo ?? asAny?.cabecalho?.tipo_calculo ?? "";
    const descricao = resolveHoleriteDescricao({
      tipo_calculo,
      descricao: asAny?.descricao,
    });

    return [
      {
        id_documento: String(asAny?.cabecalho?.lote ?? "1"),
        uuid: asAny?.uuid ?? asAny?.cabecalho?.uuid,
        id_ged: asAny?.id_ged ? String(asAny.id_ged) : undefined,
        anomes: normalizeYYYYMM(
          String(
            asAny?.competencia_utilizada ??
              asAny?.cabecalho?.competencia ??
              competencia,
          ),
        ),
        descricao,
        tipo_calculo: normalizeHoleriteTipoCalculo(tipo_calculo),
        itemJson: JSON.stringify({
          ...asAny,
          descricao,
          tipo_calculo: normalizeHoleriteTipoCalculo(tipo_calculo),
        }),
      } as HoleriteItemExt,
    ];
  }

  if (asAny?.cabecalho || Array.isArray(asAny?.beneficios)) {
    const cabecalho = asAny?.cabecalho ?? asAny?.["cabeçalho"] ?? null;
    const beneficios = Array.isArray(asAny?.beneficios) ? asAny.beneficios : [];

    const lote =
      cabecalho?.lote ??
      (beneficios.length > 0 ? beneficios[0]?.lote : undefined) ??
      1;

    const uuid = cabecalho?.uuid ?? asAny?.uuid ?? undefined;

    const competenciaBeneficio =
      asAny?.competencia ?? cabecalho?.competencia ?? competencia;

    return [
      {
        id_documento: String(lote),
        uuid: uuid ? String(uuid) : undefined,
        id_ged: asAny?.id_ged ? String(asAny.id_ged) : undefined,
        anomes:
          mode === "informe_rendimentos"
            ? String(competenciaBeneficio || competencia)
            : normalizeYYYYMM(String(competenciaBeneficio || competencia)),
        descricao: mode === "beneficios" ? "Benefícios" : "Documento",
        itemJson: JSON.stringify({
          ...asAny,
          templateId,
        }),
      },
    ];
  }

  return [];
}

function getDefaultPickerMode(mode: DocumentMode): PickerMode {
  return mode === "informe_rendimentos" ? "year" : "month-year";
}

function normalizeCompetenciaForSearch(
  competencia: string,
  pickerMode: PickerMode,
): string {
  if (!competencia) return "";

  if (pickerMode === "year") {
    if (/^\d{4}$/.test(competencia)) return competencia;
    if (/^\d{4}-\d{2}$/.test(competencia)) return competencia.slice(0, 4);
    if (/^\d{6}$/.test(competencia)) return competencia.slice(0, 4);
    return String(competencia).replace(/\D/g, "").slice(0, 4);
  }

  return normalizeYYYYMM(competencia);
}

function formatCompetenciaForGenericSearch(competenciaYYYYMM: string) {
  if (/^\d{6}$/.test(competenciaYYYYMM)) {
    return `${competenciaYYYYMM.slice(0, 4)}-${competenciaYYYYMM.slice(4, 6)}`;
  }

  if (/^\d{4}-\d{2}$/.test(competenciaYYYYMM)) {
    return competenciaYYYYMM;
  }

  return competenciaYYYYMM;
}

function buildRecibosPayload(args: {
  templateId: string;
  nomeDocumento: string;
  cpf: string;
  matricula: string;
  empresa: string;
  competenciaYYYYMM: string;
}) {
  const competenciaFormatada = formatCompetenciaForGenericSearch(
    args.competenciaYYYYMM,
  );

  return {
    id_template: Number(args.templateId),
    cp: [
      { nome: "tipodedoc", valor: args.nomeDocumento },
      { nome: "matricula", valor: args.matricula.trim() },
      { nome: "colaborador", valor: args.cpf },
      { nome: "cliente", valor: String(args.empresa).trim() },
    ],
    campo_anomes: "anomes",
    anomes: competenciaFormatada,
  };
}

function sortEmpresas(items: EmpresaAgrupada[]) {
  return [...items].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function makeYYYYMMValue(ano: number, mes: string | number) {
  return `${ano}${String(mes).padStart(2, "0")}`;
}

function makeYYYYMMLabel(ano: number, mes: string | number) {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function uniqueYears(items: CompetenciaItem[]) {
  return Array.from(new Set(items.map((x) => x.ano))).sort((a, b) => b - a);
}

function monthsByYear(items: CompetenciaItem[], year: number | null) {
  if (!year) return [];
  return Array.from(
    new Set(items.filter((x) => x.ano === year).map((x) => x.mes)),
  ).sort((a, b) => Number(b) - Number(a));
}

export default function ListarPage() {
  const params = useLocalSearchParams<{
    id?: string;
    template?: string;
    nome?: string;
    kind?: string;
    cpf?: string;
    matricula?: string;
    empresa?: string;
    competencia?: string;
    selectedEmpresaId?: string;
    selectedMatricula?: string;
    selectedEmpresaIdGen?: string;
    selectedMatriculaGen?: string;
    selectedEmpresaInforme?: string;
  }>();

  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const holeriteCompetenciasRequestRef = useRef(0);
  const meInitializedRef = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [cpf, setCpf] = useState(onlyDigits(String(params.cpf ?? "")));
  const [matricula, setMatricula] = useState(String(params.matricula ?? ""));
  const [empresa, setEmpresa] = useState(String(params.empresa ?? ""));
  const [competencia, setCompetencia] = useState(
    String(params.competencia ?? ""),
  );
  const [items, setItems] = useState<SearchDocumentItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [meLoading, setMeLoading] = useState(false);
  const [meCpf, setMeCpf] = useState("");
  const [meData, setMeData] = useState<MeEmpresaItem[]>([]);
  const [meInformeEmpresas, setMeInformeEmpresas] = useState<
    InformeEmpresaItem[]
  >([]);

  const [selectedEmpresaId, setSelectedEmpresaId] = useState(
    String(params.selectedEmpresaId ?? ""),
  );
  const [selectedMatricula, setSelectedMatricula] = useState(
    String(params.selectedMatricula ?? ""),
  );

  const [selectedEmpresaIdGen, setSelectedEmpresaIdGen] = useState(
    String(params.selectedEmpresaIdGen ?? ""),
  );
  const [selectedMatriculaGen, setSelectedMatriculaGen] = useState(
    String(params.selectedMatriculaGen ?? ""),
  );

  const [selectedEmpresaInforme, setSelectedEmpresaInforme] = useState(
    String(params.selectedEmpresaInforme ?? ""),
  );

  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [loadingHolCompetencias, setLoadingHolCompetencias] = useState(false);

  const [competenciasHol, setCompetenciasHol] = useState<CompetenciaItem[]>([]);
  const [selectedYearHol, setSelectedYearHol] = useState<number | null>(null);
  const [competenciasHolLoaded, setCompetenciasHolLoaded] = useState(false);

  const [competenciasBen, setCompetenciasBen] = useState<CompetenciaItem[]>([]);
  const [selectedYearBen, setSelectedYearBen] = useState<number | null>(null);
  const [competenciasBenLoaded, setCompetenciasBenLoaded] = useState(false);

  const [competenciasFerias, setCompetenciasFerias] = useState<
    CompetenciaItem[]
  >([]);
  const [selectedYearFerias, setSelectedYearFerias] = useState<number | null>(
    null,
  );
  const [competenciasFeriasLoaded, setCompetenciasFeriasLoaded] =
    useState(false);

  const [competenciasGen, setCompetenciasGen] = useState<CompetenciaItem[]>([]);
  const [selectedYearGen, setSelectedYearGen] = useState<number | null>(null);
  const [competenciasGenLoaded, setCompetenciasGenLoaded] = useState(false);

  const [competenciasInforme, setCompetenciasInforme] = useState<AnoOnlyItem[]>(
    [],
  );
  const [competenciasInformeLoaded, setCompetenciasInformeLoaded] =
    useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    setCpf(onlyDigits(String(params.cpf ?? "")));
    setMatricula(String(params.matricula ?? ""));
    setEmpresa(String(params.empresa ?? ""));
    setCompetencia(String(params.competencia ?? ""));
    setSelectedEmpresaId(String(params.selectedEmpresaId ?? ""));
    setSelectedMatricula(String(params.selectedMatricula ?? ""));
    setSelectedEmpresaIdGen(String(params.selectedEmpresaIdGen ?? ""));
    setSelectedMatriculaGen(String(params.selectedMatriculaGen ?? ""));
    setSelectedEmpresaInforme(String(params.selectedEmpresaInforme ?? ""));
  }, [
    params.cpf,
    params.matricula,
    params.empresa,
    params.competencia,
    params.selectedEmpresaId,
    params.selectedMatricula,
    params.selectedEmpresaIdGen,
    params.selectedMatriculaGen,
    params.selectedEmpresaInforme,
  ]);

  const screenTitle = useMemo(() => {
    const raw = String(params.nome || "Documentos").trim();
    const normalized = normalizeText(raw);

    if (normalized === "holerites") return "Holerite";
    if (normalized === "beneficios") return "Benefícios";
    if (normalized === "ferias") return "Férias";
    if (
      normalized.includes("informe de rendimentos") ||
      normalized.includes("informe rendimentos")
    ) {
      return "Informe de Rendimentos";
    }

    return raw;
  }, [params.nome]);

  const fullName = useMemo(() => {
    if (!user?.nome) return "Usuário";
    return String(user.nome);
  }, [user?.nome]);

  const userDocument = useMemo(() => {
    return user?.cpf || "";
  }, [user]);

  const brandType = useMemo(() => getBrandType(user), [user]);

  const documentMode = useMemo(
    () =>
      resolveDocumentMode(String(params.kind || ""), String(params.nome || "")),
    [params.kind, params.nome],
  );

  const isRecibo = useMemo(() => {
    return isReciboDocumentName(screenTitle);
  }, [screenTitle]);

  const isTrct = useMemo(() => {
    return isTrctDocumentName(screenTitle, String(params.kind || ""));
  }, [screenTitle, params.kind]);

  const isInforme = useMemo(() => {
    return (
      isInformeDocumentName(screenTitle) ||
      documentMode === "informe_rendimentos"
    );
  }, [screenTitle, documentMode]);

  const pickerMode = useMemo<PickerMode>(
    () => getDefaultPickerMode(documentMode),
    [documentMode],
  );

  const isNonGestor = !!user && !user.gestor;

  const showEmpresaField = useMemo(() => {
    return (
      documentMode === "holerite" ||
      documentMode === "beneficios" ||
      documentMode === "ferias" ||
      documentMode === "generico"
    );
  }, [documentMode]);

  const showMatriculaField = useMemo(() => {
    return documentMode !== "informe_rendimentos";
  }, [documentMode]);

  const resultsTableMode = useMemo<DocumentMode>(
    () => documentMode,
    [documentMode],
  );

  const searchDocumentName = useMemo(() => {
    return stripBuscarPrefix(screenTitle);
  }, [screenTitle]);

  const templateId = useMemo(() => {
    return String(params.template || params.id || "0");
  }, [params.template, params.id]);

  const empresasMap = useMemo(() => {
    const map = new Map<string, EmpresaAgrupada>();

    for (const item of meData) {
      const id = String(item.id || "").trim();
      const nome = String(item.nome || "").trim();
      const matriculaItem = String(item.matricula || "").trim();

      if (!id) continue;

      if (!map.has(id)) {
        map.set(id, {
          id,
          nome,
          matriculas: matriculaItem ? [matriculaItem] : [],
        });
        continue;
      }

      const current = map.get(id)!;
      if (matriculaItem && !current.matriculas.includes(matriculaItem)) {
        current.matriculas.push(matriculaItem);
      }
    }

    return map;
  }, [meData]);

  const empresaOptions = useMemo(() => {
    return sortEmpresas(Array.from(empresasMap.values()));
  }, [empresasMap]);

  const informeEmpresaOptions = useMemo(() => {
    const map = new Map<string, InformeEmpresaItem>();

    for (const item of meInformeEmpresas) {
      const id = String(item.empresa || "").trim();
      if (!id) continue;

      if (!map.has(id)) {
        map.set(id, {
          empresa: id,
          filial: String(item.filial || "").trim(),
          nome_empresa: String(item.nome_empresa || "").trim(),
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      String(a.nome_empresa || a.empresa).localeCompare(
        String(b.nome_empresa || b.empresa),
        "pt-BR",
      ),
    );
  }, [meInformeEmpresas]);

  const selectedEmpresaObj = useMemo(() => {
    if (!selectedEmpresaId) return null;
    return empresasMap.get(selectedEmpresaId) ?? null;
  }, [empresasMap, selectedEmpresaId]);

  const selectedEmpresaObjGen = useMemo(() => {
    if (!selectedEmpresaIdGen) return null;
    return empresasMap.get(selectedEmpresaIdGen) ?? null;
  }, [empresasMap, selectedEmpresaIdGen]);

  const selectedEmpresaInformeObj = useMemo(() => {
    if (!selectedEmpresaInforme) return null;
    return (
      informeEmpresaOptions.find(
        (item) => String(item.empresa) === String(selectedEmpresaInforme),
      ) ?? null
    );
  }, [informeEmpresaOptions, selectedEmpresaInforme]);

  const matriculaOptions = useMemo(() => {
    return selectedEmpresaObj?.matriculas ?? [];
  }, [selectedEmpresaObj]);

  const matriculaOptionsGen = useMemo(() => {
    return selectedEmpresaObjGen?.matriculas ?? [];
  }, [selectedEmpresaObjGen]);

  const requerEscolherMatricula = useMemo(() => {
    return matriculaOptions.length > 1;
  }, [matriculaOptions]);

  const requerEscolherMatriculaGen = useMemo(() => {
    return matriculaOptionsGen.length > 1;
  }, [matriculaOptionsGen]);

  const anosHol = useMemo(() => uniqueYears(competenciasHol), [competenciasHol]);
  const mesesHol = useMemo(
    () => monthsByYear(competenciasHol, selectedYearHol),
    [competenciasHol, selectedYearHol],
  );

  const anosBen = useMemo(() => uniqueYears(competenciasBen), [competenciasBen]);
  const mesesBen = useMemo(
    () => monthsByYear(competenciasBen, selectedYearBen),
    [competenciasBen, selectedYearBen],
  );

  const anosFerias = useMemo(
    () => uniqueYears(competenciasFerias),
    [competenciasFerias],
  );
  const mesesFerias = useMemo(
    () => monthsByYear(competenciasFerias, selectedYearFerias),
    [competenciasFerias, selectedYearFerias],
  );

  const anosGen = useMemo(() => uniqueYears(competenciasGen), [competenciasGen]);
  const mesesGen = useMemo(
    () => monthsByYear(competenciasGen, selectedYearGen),
    [competenciasGen, selectedYearGen],
  );

  const anosInforme = useMemo(() => {
    return [...competenciasInforme].map((x) => x.ano).sort((a, b) => b - a);
  }, [competenciasInforme]);

  const groupedHoleriteItems = useMemo(() => {
    if (documentMode !== "holerite") {
      return {
        pagamento: [] as SearchDocumentItem[],
        adiantamento: [] as SearchDocumentItem[],
        outros: [] as SearchDocumentItem[],
      };
    }

    return groupHoleriteItems(items);
  }, [documentMode, items]);

  const isHoleriteSelectionLocked = useMemo(() => {
    return loadingHolCompetencias || loadingSearch || !!loadingPreviewId;
  }, [loadingHolCompetencias, loadingSearch, loadingPreviewId]);

  const saveParams = (
    next?: Partial<{
      cpf: string;
      matricula: string;
      empresa: string;
      competencia: string;
      selectedEmpresaId: string;
      selectedMatricula: string;
      selectedEmpresaIdGen: string;
      selectedMatriculaGen: string;
      selectedEmpresaInforme: string;
    }>,
  ) => {
    router.setParams({
      id: params.id,
      template: params.template,
      nome: params.nome,
      kind: params.kind,
      cpf: next?.cpf ?? formatCpfInput(cpf),
      matricula: next?.matricula ?? matricula,
      empresa: next?.empresa ?? empresa,
      competencia: next?.competencia ?? competencia,
      selectedEmpresaId: next?.selectedEmpresaId ?? selectedEmpresaId,
      selectedMatricula: next?.selectedMatricula ?? selectedMatricula,
      selectedEmpresaIdGen: next?.selectedEmpresaIdGen ?? selectedEmpresaIdGen,
      selectedMatriculaGen: next?.selectedMatriculaGen ?? selectedMatriculaGen,
      selectedEmpresaInforme:
        next?.selectedEmpresaInforme ?? selectedEmpresaInforme,
    } as any);
  };

  const openPdfRoute = (args: {
    pdfBase64: string;
    title: string;
    kind: string;
    cpf: string;
    matricula?: string;
    empresa?: string;
    competencia?: string;
    lote?: string;
    uuid?: string;
    idGed?: string;
    itemJson?: string;
  }) => {
    const empresaNome =
      args.kind === "holerite"
        ? selectedEmpresaObj?.nome || ""
        : args.kind === "informe_rendimentos"
          ? selectedEmpresaInformeObj?.nome_empresa || ""
          : selectedEmpresaObjGen?.nome || "";

    router.push({
      pathname: "/visualizar" as any,
      params: {
        base64: args.pdfBase64,
        title: args.title,
        kind: args.kind,
        id: String(params.id || ""),
        template: String(params.template || ""),
        nome: String(params.nome || ""),
        cpf: args.cpf,
        matricula: args.matricula || "",
        empresa: args.empresa || "",
        empresaNome,
        competencia: args.competencia || "",
        lote: args.lote || "",
        uuid: args.uuid,
        idGed: args.idGed,
        itemJson: args.itemJson,
        selectedEmpresaId,
        selectedMatricula,
        selectedEmpresaIdGen,
        selectedMatriculaGen,
        selectedEmpresaInforme,
      },
    } as any);
  };

  const scrollToResults = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: 520,
        animated: true,
      });
    }, 180);
  };

  const resetHoleriteFlow = (opts?: {
    keepEmpresa?: boolean;
    keepMatricula?: boolean;
  }) => {
    holeriteCompetenciasRequestRef.current += 1;
    setLoadingHolCompetencias(false);

    if (!opts?.keepEmpresa) {
      setSelectedEmpresaId("");
    }
    if (!opts?.keepMatricula) {
      setSelectedMatricula("");
    }
    setCompetenciasHol([]);
    setSelectedYearHol(null);
    setItems([]);
    setCompetenciasHolLoaded(false);
  };

  const resetGenericFlow = (opts?: {
    keepEmpresa?: boolean;
    keepMatricula?: boolean;
  }) => {
    if (!opts?.keepEmpresa) {
      setSelectedEmpresaIdGen("");
    }
    if (!opts?.keepMatricula) {
      setSelectedMatriculaGen("");
    }

    setCompetenciasBen([]);
    setCompetenciasFerias([]);
    setCompetenciasGen([]);
    setSelectedYearBen(null);
    setSelectedYearFerias(null);
    setSelectedYearGen(null);
    setItems([]);
    setCompetenciasBenLoaded(false);
    setCompetenciasFeriasLoaded(false);
    setCompetenciasGenLoaded(false);
  };

  const resetInformeFlow = (keepEmpresa = false) => {
    if (!keepEmpresa) {
      setSelectedEmpresaInforme("");
    }
    setCompetenciasInforme([]);
    setItems([]);
    setCompetenciasInformeLoaded(false);
  };

  useEffect(() => {
    if (!isNonGestor) return;
    if (meInitializedRef.current) return;

    const loadMe = async () => {
      try {
        setMeLoading(true);

        const response = await api.get<UserMeResponse>("/user/me");

        const cpfApi = onlyDigits(response.data?.cpf || user?.cpf || "");
        const dadosApi = Array.isArray(response.data?.dados)
          ? response.data.dados
          : Array.isArray(user?.dados)
            ? user.dados
            : [];

        const empresasInformeApi = Array.isArray(response.data?.empresa)
          ? response.data.empresa
          : [];

        const normalized: MeEmpresaItem[] = dadosApi.map((item) => ({
          id: String(item.id || "").trim(),
          nome: String(item.nome || "").trim(),
          matricula: String(item.matricula || "").trim(),
        }));

        const normalizedInforme: InformeEmpresaItem[] = empresasInformeApi.map(
          (item) => ({
            empresa: String(item.empresa || "").trim(),
            filial: String(item.filial || "").trim(),
            nome_empresa: String(item.nome_empresa || "").trim(),
          }),
        );

        setMeCpf(cpfApi);
        setMeData(normalized);
        setMeInformeEmpresas(normalizedInforme);
        setCpf(cpfApi);

        const map = new Map<string, EmpresaAgrupada>();
        for (const item of normalized) {
          const id = String(item.id || "").trim();
          const nome = String(item.nome || "").trim();
          const matriculaItem = String(item.matricula || "").trim();

          if (!id) continue;

          if (!map.has(id)) {
            map.set(id, {
              id,
              nome,
              matriculas: matriculaItem ? [matriculaItem] : [],
            });
            continue;
          }

          const current = map.get(id)!;
          if (matriculaItem && !current.matriculas.includes(matriculaItem)) {
            current.matriculas.push(matriculaItem);
          }
        }

        const empresasOrdenadas = sortEmpresas(Array.from(map.values()));

        let nextEmpresaId = String(params.selectedEmpresaId || "").trim();
        let nextMatricula = String(params.selectedMatricula || "").trim();
        let nextEmpresaIdGen = String(params.selectedEmpresaIdGen || "").trim();
        let nextMatriculaGen = String(params.selectedMatriculaGen || "").trim();
        let nextEmpresaInforme = String(params.selectedEmpresaInforme || "").trim();

        if (
          !nextEmpresaId &&
          !nextEmpresaIdGen &&
          empresasOrdenadas.length === 1
        ) {
          nextEmpresaId = empresasOrdenadas[0].id;
          nextEmpresaIdGen = empresasOrdenadas[0].id;
        }

        if (!nextEmpresaInforme && normalizedInforme.length === 1) {
          nextEmpresaInforme = normalizedInforme[0].empresa;
        }

        const empresaHol = nextEmpresaId ? map.get(nextEmpresaId) : null;
        const empresaGen = nextEmpresaIdGen ? map.get(nextEmpresaIdGen) : null;

        if (empresaHol && !nextMatricula && empresaHol.matriculas.length === 1) {
          nextMatricula = empresaHol.matriculas[0];
        }

        if (empresaGen && !nextMatriculaGen && empresaGen.matriculas.length === 1) {
          nextMatriculaGen = empresaGen.matriculas[0];
        }

        setSelectedEmpresaId(nextEmpresaId);
        setSelectedMatricula(nextMatricula);
        setSelectedEmpresaIdGen(nextEmpresaIdGen);
        setSelectedMatriculaGen(nextMatriculaGen);
        setSelectedEmpresaInforme(nextEmpresaInforme);

        saveParams({
          cpf: formatCpfInput(cpfApi),
          selectedEmpresaId: nextEmpresaId,
          selectedMatricula: nextMatricula,
          selectedEmpresaIdGen: nextEmpresaIdGen,
          selectedMatriculaGen: nextMatriculaGen,
          selectedEmpresaInforme: nextEmpresaInforme,
        });

        meInitializedRef.current = true;
      } catch {
        setMeCpf(onlyDigits(user?.cpf || ""));
      } finally {
        setMeLoading(false);
      }
    };

    void loadMe();
  }, [isNonGestor, user, params.selectedEmpresaInforme]);

  useEffect(() => {
    if (!isNonGestor) return;

    if (selectedEmpresaId) {
      const empresaData = empresasMap.get(selectedEmpresaId);
      if (empresaData) {
        const next =
          empresaData.matriculas.length === 1
            ? empresaData.matriculas[0]
            : selectedMatricula &&
                empresaData.matriculas.includes(selectedMatricula)
              ? selectedMatricula
              : "";
        setSelectedMatricula(next);
      }
    }
  }, [selectedEmpresaId, empresasMap, isNonGestor, selectedMatricula]);

  useEffect(() => {
    if (!isNonGestor) return;

    if (selectedEmpresaIdGen) {
      const empresaData = empresasMap.get(selectedEmpresaIdGen);
      if (empresaData) {
        const next =
          empresaData.matriculas.length === 1
            ? empresaData.matriculas[0]
            : selectedMatriculaGen &&
                empresaData.matriculas.includes(selectedMatriculaGen)
              ? selectedMatriculaGen
              : "";
        setSelectedMatriculaGen(next);
      }
    }
  }, [selectedEmpresaIdGen, empresasMap, isNonGestor, selectedMatriculaGen]);

  useEffect(() => {
    if (!isNonGestor || documentMode !== "holerite") return;
    if (!selectedEmpresaId) return;

    const empresaData = empresasMap.get(selectedEmpresaId);
    const matriculaEfetiva =
      empresaData?.matriculas.length === 1
        ? empresaData.matriculas[0]
        : selectedMatricula;

    if (!matriculaEfetiva) return;

    const requestId = ++holeriteCompetenciasRequestRef.current;
    let cancelled = false;

    const loadCompetencias = async () => {
      try {
        setLoadingHolCompetencias(true);
        setCompetenciasHolLoaded(false);
        setCompetenciasHol([]);
        setSelectedYearHol(null);
        setItems([]);

        const res = await api.post<{
          competencias: Array<{ ano: number; mes: number }>;
        }>("/documents/holerite/competencias", {
          cpf: onlyDigits(meCpf),
          matricula: String(matriculaEfetiva).trim(),
          empresa: selectedEmpresaId,
        });

        if (cancelled) return;
        if (requestId !== holeriteCompetenciasRequestRef.current) return;

        const lista = (res.data?.competencias ?? []).map((x) => ({
          ano: x.ano,
          mes: String(x.mes).padStart(2, "0"),
        }));

        setCompetenciasHol(lista);
      } catch {
        if (cancelled) return;
        if (requestId !== holeriteCompetenciasRequestRef.current) return;
        setCompetenciasHol([]);
      } finally {
        if (cancelled) return;
        if (requestId !== holeriteCompetenciasRequestRef.current) return;
        setLoadingHolCompetencias(false);
        setCompetenciasHolLoaded(true);
      }
    };

    void loadCompetencias();

    return () => {
      cancelled = true;
    };
  }, [
    isNonGestor,
    documentMode,
    selectedEmpresaId,
    selectedMatricula,
    empresasMap,
    meCpf,
  ]);

  useEffect(() => {
    if (!isNonGestor || documentMode !== "beneficios") return;
    if (!selectedEmpresaIdGen) return;

    const empresaData = empresasMap.get(selectedEmpresaIdGen);
    const matriculaEfetiva =
      empresaData?.matriculas.length === 1
        ? empresaData.matriculas[0]
        : selectedMatriculaGen;

    if (!matriculaEfetiva) return;

    const loadCompetencias = async () => {
      try {
        setCompetenciasBenLoaded(false);
        setCompetenciasBen([]);
        setSelectedYearBen(null);
        setItems([]);

        const res = await api.post<{
          competencias: Array<{ ano: number; mes: number }>;
        }>("/documents/beneficios/competencias", {
          cpf: onlyDigits(meCpf),
          matricula: String(matriculaEfetiva).trim(),
          empresa: selectedEmpresaIdGen,
        });

        const lista = (res.data?.competencias ?? []).map((x) => ({
          ano: x.ano,
          mes: String(x.mes).padStart(2, "0"),
        }));

        setCompetenciasBen(lista);
      } catch {
        setCompetenciasBen([]);
      } finally {
        setCompetenciasBenLoaded(true);
      }
    };

    void loadCompetencias();
  }, [
    isNonGestor,
    documentMode,
    selectedEmpresaIdGen,
    selectedMatriculaGen,
    empresasMap,
    meCpf,
  ]);

  useEffect(() => {
    if (!isNonGestor || documentMode !== "ferias") return;
    if (!selectedEmpresaIdGen) return;

    const empresaData = empresasMap.get(selectedEmpresaIdGen);
    const matriculaEfetiva =
      empresaData?.matriculas.length === 1
        ? empresaData.matriculas[0]
        : selectedMatriculaGen;

    if (!matriculaEfetiva) return;

    const loadCompetencias = async () => {
      try {
        setCompetenciasFeriasLoaded(false);
        setCompetenciasFerias([]);
        setSelectedYearFerias(null);
        setItems([]);

        const res = await api.post<{
          competencias: Array<{ ano: number; mes: number }>;
        }>("/documents/ferias/competencias", {
          cpf: onlyDigits(meCpf),
          matricula: String(matriculaEfetiva).trim(),
          cliente: selectedEmpresaIdGen,
        });

        const lista = (res.data?.competencias ?? []).map((x) => ({
          ano: x.ano,
          mes: String(x.mes).padStart(2, "0"),
        }));

        setCompetenciasFerias(lista);
      } catch {
        setCompetenciasFerias([]);
      } finally {
        setCompetenciasFeriasLoaded(true);
      }
    };

    void loadCompetencias();
  }, [
    isNonGestor,
    documentMode,
    selectedEmpresaIdGen,
    selectedMatriculaGen,
    empresasMap,
    meCpf,
  ]);

  useEffect(() => {
    if (!isNonGestor || !isInforme) return;
    if (!selectedEmpresaInforme) return;

    const loadCompetencias = async () => {
      try {
        setCompetenciasInformeLoaded(false);
        setCompetenciasInforme([]);
        setItems([]);

        const res = await api.post<{ competencias: Array<{ ano: number }> }>(
          "/documents/informe-rendimentos/competencias",
          {
            cpf: onlyDigits(meCpf),
            empresa: String(selectedEmpresaInforme),
          },
        );

        setCompetenciasInforme(
          (res.data?.competencias ?? []).map((x) => ({ ano: x.ano })),
        );
      } catch {
        setCompetenciasInforme([]);
      } finally {
        setCompetenciasInformeLoaded(true);
      }
    };

    void loadCompetencias();
  }, [isNonGestor, isInforme, selectedEmpresaInforme, meCpf]);

  useEffect(() => {
    if (
      !isNonGestor ||
      documentMode === "holerite" ||
      documentMode === "beneficios" ||
      documentMode === "ferias" ||
      isInforme
    ) {
      return;
    }

    if (!selectedEmpresaIdGen) return;

    const empresaData = empresasMap.get(selectedEmpresaIdGen);
    const matriculaEfetiva =
      empresaData?.matriculas.length === 1
        ? empresaData.matriculas[0]
        : selectedMatriculaGen;

    if (!matriculaEfetiva) return;

    const loadCompetencias = async () => {
      try {
        setCompetenciasGenLoaded(false);
        setCompetenciasGen([]);
        setSelectedYearGen(null);
        setItems([]);

        let cp: { nome: string; valor: string }[] = [
          { nome: "tipodedoc", valor: searchDocumentName },
          { nome: "matricula", valor: String(matriculaEfetiva).trim() },
          { nome: "colaborador", valor: onlyDigits(meCpf) },
        ];

        let campo_anomes = "anomes";

        if (isRecibo) {
          cp.push({ nome: "cliente", valor: String(selectedEmpresaIdGen) });
        }

        if (isTrct) {
          cp = [
            { nome: "tipodedoc", valor: searchDocumentName },
            { nome: "cpf", valor: onlyDigits(meCpf) },
          ];
          campo_anomes = "ano";
        }

        const endpoint = isTrct
          ? "/documents/search/informetrct"
          : isRecibo
            ? "/documents/search/recibos"
            : "/documents/search";

        const res = await api.post<GenericSearchResponse>(endpoint, {
          id_template: Number(templateId),
          cp,
          campo_anomes,
          anomes: "",
        });

        if (isTrct) {
          const anos = (res.data?.anos ?? []).map((x) => ({
            ano: x.ano,
            mes: "01",
          }));
          setCompetenciasGen(anos);
        } else {
          const lista = (res.data?.anomes ?? []).map((x) => ({
            ano: x.ano,
            mes: String(x.mes).padStart(2, "0"),
          }));
          setCompetenciasGen(lista);
        }
      } catch {
        setCompetenciasGen([]);
      } finally {
        setCompetenciasGenLoaded(true);
      }
    };

    void loadCompetencias();
  }, [
    isNonGestor,
    documentMode,
    isInforme,
    selectedEmpresaIdGen,
    selectedMatriculaGen,
    empresasMap,
    meCpf,
    isRecibo,
    isTrct,
    searchDocumentName,
    templateId,
  ]);

  const effectiveCpf = useMemo(() => {
    if (isNonGestor) return onlyDigits(meCpf || user?.cpf || "");
    return onlyDigits(cpf);
  }, [cpf, isNonGestor, meCpf, user?.cpf]);

  const effectiveEmpresa = useMemo(() => {
    if (isNonGestor) {
      if (documentMode === "holerite") {
        return String(selectedEmpresaId || "").trim();
      }
      if (documentMode === "informe_rendimentos") {
        return String(selectedEmpresaInforme || "").trim();
      }
      return String(selectedEmpresaIdGen || "").trim();
    }

    return String(empresa || "").trim();
  }, [
    documentMode,
    empresa,
    isNonGestor,
    selectedEmpresaId,
    selectedEmpresaIdGen,
    selectedEmpresaInforme,
  ]);

  const effectiveMatricula = useMemo(() => {
    if (documentMode === "informe_rendimentos") return "";

    if (isNonGestor) {
      if (documentMode === "holerite") {
        if (selectedEmpresaId) {
          const empresaData = empresasMap.get(selectedEmpresaId);
          if (empresaData?.matriculas.length === 1) {
            return String(empresaData.matriculas[0] || "").trim();
          }
        }
        return String(selectedMatricula || "").trim();
      }

      if (selectedEmpresaIdGen) {
        const empresaData = empresasMap.get(selectedEmpresaIdGen);
        if (empresaData?.matriculas.length === 1) {
          return String(empresaData.matriculas[0] || "").trim();
        }
      }

      return String(selectedMatriculaGen || "").trim();
    }

    return String(matricula || "").trim();
  }, [
    documentMode,
    isNonGestor,
    matricula,
    selectedEmpresaId,
    selectedEmpresaIdGen,
    selectedMatricula,
    selectedMatriculaGen,
    empresasMap,
  ]);

  const mountSelectedHolerite = async (item: SearchDocumentItem) => {
    const holeriteItem = item as HoleriteItemExt;
    const itemJsonObj =
      item?.itemJson && typeof item.itemJson === "string"
        ? JSON.parse(item.itemJson)
        : item;

    const itemCabecalho =
      itemJsonObj?.cabecalho ?? itemJsonObj?.["cabeçalho"] ?? undefined;

    const itemTipoCalculo =
      normalizeHoleriteTipoCalculo(
        holeriteItem.tipo_calculo ??
          itemJsonObj?.tipo_calculo ??
          itemCabecalho?.tipo_calculo,
      ) || undefined;

    const payload: Record<string, unknown> = {
      cpf: effectiveCpf,
      matricula: effectiveMatricula,
      competencia: normalizeCompetenciaForSearch(
        competencia || String(item.anomes || ""),
        pickerMode,
      ),
      lote: String(holeriteItem.id_documento || ""),
    };

    if (effectiveEmpresa) {
      payload.empresa = effectiveEmpresa;
    }

    if (holeriteItem.uuid) {
      payload.uuid = String(holeriteItem.uuid);
    }

    if (itemTipoCalculo) {
      payload.tipo_calculo = itemTipoCalculo;
    }

    const response = await api.post<any>("/documents/holerite/montar", payload);

    return {
      pdf: response.data,
      itemJsonObj,
      itemTipoCalculo,
    };
  };

  const openItem = async (item: SearchDocumentItem) => {
    try {
      if (documentMode === "holerite" && isHoleriteSelectionLocked) {
        return;
      }

      setLoadingPreviewId(String(item.id_documento));

      const cpfDigits = effectiveCpf;

      saveParams({
        cpf: formatCpfInput(cpfDigits),
        matricula: effectiveMatricula,
        empresa: effectiveEmpresa,
        competencia,
        selectedEmpresaId,
        selectedMatricula,
        selectedEmpresaIdGen,
        selectedMatriculaGen,
        selectedEmpresaInforme,
      });

      const itemJsonObj =
        item?.itemJson && typeof item.itemJson === "string"
          ? JSON.parse(item.itemJson)
          : item;

      let pdf: any = null;
      let itemTipoCalculo: string | undefined;

      if (documentMode === "holerite") {
        const mounted = await mountSelectedHolerite(item);
        pdf = mounted.pdf;
        itemTipoCalculo = mounted.itemTipoCalculo;
      } else {
        const competenciaNormalizada = normalizeCompetenciaForSearch(
          competencia || String(item.anomes || ""),
          pickerMode,
        );

        pdf = await mountPdf({
          kind: isRecibo ? "generico" : documentMode,
          item: itemJsonObj,
          cpf: cpfDigits,
          matricula: showMatriculaField ? effectiveMatricula : "",
          empresa:
            showEmpresaField || documentMode === "informe_rendimentos"
              ? effectiveEmpresa
              : "",
          competencia: competenciaNormalizada,
        });
      }

      if (!(pdf as any)?.pdf_base64) {
        Alert.alert(
          "Aviso",
          "O backend não retornou um PDF para este documento.",
        );
        return;
      }

      const routeItemJson =
        documentMode === "holerite"
          ? JSON.stringify({
              ...itemJsonObj,
              ...(pdf || {}),
              tipo_calculo:
                itemTipoCalculo ??
                (item as HoleriteItemExt)?.tipo_calculo ??
                itemJsonObj?.tipo_calculo,
              descricao:
                getHoleriteResolvedLabel(item as HoleriteItemExt) ||
                itemJsonObj?.descricao,
            })
          : JSON.stringify(itemJsonObj);

      openPdfRoute({
        pdfBase64: (pdf as any).pdf_base64,
        title:
          documentMode === "holerite"
            ? getHoleriteResolvedLabel(item as HoleriteItemExt)
            : item.descricao || params.nome || "Documento",
        kind: isRecibo ? "generico" : documentMode,
        cpf: formatCpfInput(cpfDigits),
        matricula: showMatriculaField ? effectiveMatricula : "",
        empresa: effectiveEmpresa,
        competencia: competencia || String(item.anomes || ""),
        lote: String(item.id_documento || ""),
        uuid:
          item.uuid
            ? String(item.uuid)
            : (pdf as any)?.uuid
              ? String((pdf as any).uuid)
              : (pdf as any)?.cabecalho?.uuid
                ? String((pdf as any).cabecalho.uuid)
                : undefined,
        idGed: item.id_ged ? String(item.id_ged) : undefined,
        itemJson: routeItemJson,
      });
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao montar PDF."));
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const doSearch = async () => {
    try {
      if (!competencia) {
        Alert.alert(
          "Aviso",
          pickerMode === "year"
            ? "Selecione um ano antes de buscar."
            : "Selecione um período antes de buscar.",
        );
        return;
      }

      const cpfDigits = effectiveCpf;
      const competenciaNormalizada = normalizeCompetenciaForSearch(
        competencia,
        pickerMode,
      );

      if (!cpfDigits || cpfDigits.length !== 11) {
        Alert.alert("Aviso", "Informe um CPF válido.");
        return;
      }

      if (showMatriculaField && !String(effectiveMatricula || "").trim()) {
        Alert.alert("Aviso", "Informe a matrícula antes de buscar.");
        return;
      }

      if (
        (showEmpresaField || documentMode === "informe_rendimentos") &&
        !String(effectiveEmpresa || "").trim()
      ) {
        Alert.alert("Aviso", "Informe a empresa antes de buscar.");
        return;
      }

      if (isRecibo && !String(effectiveEmpresa || "").trim()) {
        Alert.alert("Aviso", "Informe a empresa antes de buscar o recibo.");
        return;
      }

      if (isRecibo && (!templateId || templateId === "0")) {
        Alert.alert("Erro", "Template do recibo não foi informado na rota.");
        return;
      }

      setLoadingSearch(true);
      saveParams({
        cpf: formatCpfInput(cpfDigits),
        matricula: effectiveMatricula,
        empresa: effectiveEmpresa,
        competencia,
        selectedEmpresaId,
        selectedMatricula,
        selectedEmpresaIdGen,
        selectedMatriculaGen,
        selectedEmpresaInforme,
      });

      let data: unknown;

      if (isRecibo) {
        const payload = buildRecibosPayload({
          templateId,
          nomeDocumento: searchDocumentName,
          cpf: cpfDigits,
          matricula: effectiveMatricula,
          empresa: effectiveEmpresa,
          competenciaYYYYMM: competenciaNormalizada,
        });

        const response = await api.post<GenericSearchResponse>(
          "/documents/search/recibos",
          payload,
        );

        data = response.data;
      } else {
        data = await searchDocuments({
          kind: documentMode,
          idTipo: params.id,
          cpf: cpfDigits,
          matricula: showMatriculaField ? effectiveMatricula : "",
          empresa: effectiveEmpresa,
          competencia: competenciaNormalizada,
          documentoNome: searchDocumentName,
        });
      }

      const normalizedItems = normalizeSearchResult(
        data,
        competenciaNormalizada,
        documentMode,
        templateId,
      );

      setItems(normalizedItems);
      scrollToResults();
    } catch (error: any) {
      const rawMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "";

      if (
        isRecibo &&
        String(rawMessage)
          .toLowerCase()
          .includes("campo 'anomes' não existe no template")
      ) {
        Alert.alert(
          "Erro",
          `O template enviado para o recibo não é o mesmo do site. Verifique se a rota está passando o parâmetro "template". Template atual: ${templateId}`,
        );
      } else {
        Alert.alert(
          "Erro",
          friendlyErrorMessage(error, "Falha ao buscar documentos."),
        );
      }

      setItems([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleNonGestorHolerite = async (ano: number, mes: string) => {
    try {
      const empresaData = empresasMap.get(selectedEmpresaId);
      const matriculaEfetiva =
        empresaData?.matriculas.length === 1
          ? empresaData.matriculas[0]
          : selectedMatricula;

      if (!selectedEmpresaId || !matriculaEfetiva) {
        Alert.alert("Aviso", "Selecione empresa e matrícula.");
        return;
      }

      setLoadingSearch(true);
      setItems([]);

      const competenciaYYYYMM = normalizeYYYYMM(makeYYYYMMValue(ano, mes));

      const res = await api.post<any>("/documents/holerite/buscar", {
        cpf: onlyDigits(meCpf),
        matricula: String(matriculaEfetiva).trim(),
        competencia: competenciaYYYYMM,
        empresa: selectedEmpresaId,
      });

      const docs = normalizeAndDedupeHoleriteItems(
        normalizeSearchResult(
          res.data,
          competenciaYYYYMM,
          "holerite",
          templateId,
        ),
      );

      setItems(docs);
      setCompetencia(competenciaYYYYMM);

      saveParams({
        competencia: competenciaYYYYMM,
        selectedEmpresaId,
        selectedMatricula: String(matriculaEfetiva),
      });

      scrollToResults();
    } catch (error) {
      Alert.alert(
        "Erro",
        friendlyErrorMessage(error, "Falha ao buscar holerite."),
      );
      setItems([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleNonGestorBeneficios = async (ano: number, mes: string) => {
    try {
      const empresaData = empresasMap.get(selectedEmpresaIdGen);
      const matriculaEfetiva =
        empresaData?.matriculas.length === 1
          ? empresaData.matriculas[0]
          : selectedMatriculaGen;

      if (!selectedEmpresaIdGen || !matriculaEfetiva) {
        Alert.alert("Aviso", "Selecione empresa e matrícula.");
        return;
      }

      setLoadingSearch(true);

      const competenciaYYYYMM = normalizeYYYYMM(makeYYYYMMValue(ano, mes));

      const res = await api.post<any>("/documents/beneficios/buscar", {
        cpf: onlyDigits(meCpf),
        matricula: String(matriculaEfetiva).trim(),
        competencia: competenciaYYYYMM,
        empresa: String(selectedEmpresaIdGen),
      });

      const docs = normalizeSearchResult(
        res.data,
        competenciaYYYYMM,
        "beneficios",
        templateId,
      );

      setItems(docs);
      setCompetencia(competenciaYYYYMM);
      saveParams({
        competencia: competenciaYYYYMM,
        selectedEmpresaIdGen,
        selectedMatriculaGen: String(matriculaEfetiva),
      });

      if (docs[0]) {
        await openItem(docs[0]);
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        friendlyErrorMessage(error, "Falha ao buscar benefícios."),
      );
      setItems([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleNonGestorFerias = async (ano: number, mes: string) => {
    try {
      const empresaData = empresasMap.get(selectedEmpresaIdGen);
      const matriculaEfetiva =
        empresaData?.matriculas.length === 1
          ? empresaData.matriculas[0]
          : selectedMatriculaGen;

      if (!selectedEmpresaIdGen || !matriculaEfetiva) {
        Alert.alert("Aviso", "Selecione empresa e matrícula.");
        return;
      }

      setLoadingSearch(true);

      const competenciaYYYYMM = normalizeYYYYMM(makeYYYYMMValue(ano, mes));

      const res = await api.post<any>("/documents/ferias/buscar", {
        cpf: onlyDigits(meCpf),
        matricula: String(matriculaEfetiva).trim(),
        competencia: competenciaYYYYMM,
        cliente: String(selectedEmpresaIdGen),
      });

      const docs = normalizeSearchResult(
        res.data,
        competenciaYYYYMM,
        "ferias",
        templateId,
      );

      setItems(docs);
      setCompetencia(competenciaYYYYMM);
      saveParams({
        competencia: competenciaYYYYMM,
        selectedEmpresaIdGen,
        selectedMatriculaGen: String(matriculaEfetiva),
      });

      if (docs[0]) {
        await openItem(docs[0]);
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        friendlyErrorMessage(error, "Falha ao buscar férias."),
      );
      setItems([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleNonGestorInforme = async (ano: number) => {
    try {
      if (!selectedEmpresaInforme) {
        Alert.alert("Aviso", "Selecione a empresa para carregar o informe.");
        return;
      }

      setLoadingSearch(true);

      const payload = {
        cpf: onlyDigits(meCpf),
        competencia: String(ano),
        empresa: String(selectedEmpresaInforme),
      };

      const buscarRes = await api.post<any>(
        "/documents/informe-rendimentos/buscar",
        payload,
      );

      if (!buscarRes?.data?.informes?.length) {
        Alert.alert(
          "Aviso",
          "Nenhum informe de rendimentos encontrado para o ano selecionado.",
        );
        return;
      }

      const montarRes = await api.post<any>(
        "/documents/informe-rendimentos/montar",
        payload,
      );

      if (!montarRes?.data?.pdf_base64) {
        Alert.alert(
          "Aviso",
          "O backend não retornou um PDF para o informe de rendimentos.",
        );
        return;
      }

      setCompetencia(String(ano));
      saveParams({
        competencia: String(ano),
        selectedEmpresaInforme: String(selectedEmpresaInforme),
      });

      openPdfRoute({
        pdfBase64: montarRes.data.pdf_base64,
        title: "Informe de Rendimentos",
        kind: "informe_rendimentos",
        cpf: formatCpfInput(onlyDigits(meCpf)),
        matricula: String(buscarRes?.data?.informes?.[0]?.matricula ?? ""),
        empresa: String(selectedEmpresaInforme),
        competencia: String(ano),
        lote: "1",
        itemJson: JSON.stringify({
          ...buscarRes.data,
          pdf_base64: montarRes.data.pdf_base64,
        }),
      });
    } catch (error) {
      Alert.alert(
        "Erro",
        friendlyErrorMessage(error, "Falha ao buscar informe de rendimentos."),
      );
      setItems([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleNonGestorGenerico = async (ano: number, mes?: string) => {
    try {
      const empresaData = empresasMap.get(selectedEmpresaIdGen);
      const matriculaEfetiva =
        empresaData?.matriculas.length === 1
          ? empresaData.matriculas[0]
          : selectedMatriculaGen;

      if (!selectedEmpresaIdGen || !matriculaEfetiva) {
        Alert.alert("Aviso", "Selecione empresa e matrícula.");
        return;
      }

      setLoadingSearch(true);

      let cp: { nome: string; valor: string }[] = [
        { nome: "tipodedoc", valor: searchDocumentName },
        { nome: "matricula", valor: String(matriculaEfetiva).trim() },
        { nome: "colaborador", valor: onlyDigits(meCpf) },
      ];

      let campo_anomes = "anomes";
      let anomesValor = mes ? `${ano}-${mes}` : String(ano);

      if (isRecibo) {
        cp.push({ nome: "cliente", valor: String(selectedEmpresaIdGen) });
      }

      if (isTrct) {
        cp = [
          { nome: "tipodedoc", valor: searchDocumentName },
          { nome: "cpf", valor: onlyDigits(meCpf) },
        ];
        campo_anomes = "ano";
        anomesValor = String(ano);
      }

      const endpoint = isTrct
        ? "/documents/search/informetrct"
        : isRecibo
          ? "/documents/search/recibos"
          : "/documents/search";

      const res = await api.post<GenericSearchResponse>(endpoint, {
        id_template: Number(templateId),
        cp,
        campo_anomes,
        anomes: anomesValor,
      });

      const competenciaLocal = isTrct
        ? String(ano)
        : normalizeYYYYMM(String(anomesValor));

      const docs = normalizeSearchResult(
        res.data,
        competenciaLocal,
        "generico",
        templateId,
      );

      setItems(docs);
      setCompetencia(competenciaLocal);
      saveParams({
        competencia: competenciaLocal,
        selectedEmpresaIdGen,
        selectedMatriculaGen: String(matriculaEfetiva),
      });

      if (docs[0]) {
        await openItem(docs[0]);
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        friendlyErrorMessage(error, "Falha ao buscar documento."),
      );
      setItems([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const empresaButtonsHol: DiscoveryOption[] = useMemo(
    () =>
      empresaOptions.map((item) => ({
        key: item.id,
        label: item.nome,
        badge:
          item.matriculas.length > 1
            ? `${item.matriculas.length} matr.`
            : undefined,
        onPress: () => {
          if (isHoleriteSelectionLocked) return;

          resetHoleriteFlow({ keepEmpresa: true, keepMatricula: false });
          setSelectedEmpresaId(item.id);
          saveParams({ selectedEmpresaId: item.id, selectedMatricula: "" });
        },
      })),
    [empresaOptions, isHoleriteSelectionLocked],
  );

  const empresaButtonsGen: DiscoveryOption[] = useMemo(
    () =>
      empresaOptions.map((item) => ({
        key: item.id,
        label: item.nome,
        badge:
          item.matriculas.length > 1
            ? `${item.matriculas.length} matr.`
            : undefined,
        onPress: () => {
          resetGenericFlow({ keepEmpresa: true, keepMatricula: false });
          setSelectedEmpresaIdGen(item.id);
          saveParams({
            selectedEmpresaIdGen: item.id,
            selectedMatriculaGen: "",
          });
        },
      })),
    [empresaOptions],
  );

  const empresaButtonsInforme: DiscoveryOption[] = useMemo(
    () =>
      informeEmpresaOptions.map((item) => ({
        key: item.empresa,
        label: item.nome_empresa || `Empresa ${item.empresa}`,
        onPress: () => {
          resetInformeFlow(true);
          setSelectedEmpresaInforme(item.empresa);
          saveParams({ selectedEmpresaInforme: item.empresa });
        },
      })),
    [informeEmpresaOptions],
  );

  const matriculaButtonsHol: DiscoveryOption[] = useMemo(
    () =>
      matriculaOptions.map((m) => ({
        key: m,
        label: `Matrícula ${m}`,
        onPress: () => {
          if (isHoleriteSelectionLocked) return;

          resetHoleriteFlow({ keepEmpresa: true, keepMatricula: true });
          setSelectedMatricula(m);
          saveParams({ selectedMatricula: m });
        },
      })),
    [matriculaOptions, isHoleriteSelectionLocked],
  );

  const matriculaButtonsGen: DiscoveryOption[] = useMemo(
    () =>
      matriculaOptionsGen.map((m) => ({
        key: m,
        label: `Matrícula ${m}`,
        onPress: () => {
          resetGenericFlow({ keepEmpresa: true, keepMatricula: true });
          setSelectedMatriculaGen(m);
          saveParams({ selectedMatriculaGen: m });
        },
      })),
    [matriculaOptionsGen],
  );

  function renderEmpresaSection() {
    return (
      <DiscoveryGridSection
        title="Empresa"
        options={empresaButtonsGen}
        selectedLabel={selectedEmpresaObjGen?.nome || ""}
        onReset={
          selectedEmpresaIdGen
            ? () => {
                resetGenericFlow();
                saveParams({
                  selectedEmpresaIdGen: "",
                  selectedMatriculaGen: "",
                });
              }
            : undefined
        }
        resetLabel="Trocar empresa"
        emptyText="Nenhuma empresa encontrada."
      />
    );
  }

  function renderMatriculaSection() {
    return (
      <DiscoveryGridSection
        title="Matrícula"
        options={matriculaButtonsGen}
        selectedLabel={
          requerEscolherMatriculaGen
            ? selectedMatriculaGen
              ? `Matrícula ${selectedMatriculaGen}`
              : ""
            : matriculaOptionsGen[0]
              ? `Matrícula ${matriculaOptionsGen[0]}`
              : ""
        }
        onReset={
          requerEscolherMatriculaGen && selectedMatriculaGen
            ? () => {
                resetGenericFlow({
                  keepEmpresa: true,
                  keepMatricula: false,
                });
                saveParams({ selectedMatriculaGen: "" });
              }
            : undefined
        }
        resetLabel="Trocar matrícula"
        emptyText={
          !selectedEmpresaIdGen
            ? "Selecione uma empresa acima."
            : "Nenhuma matrícula encontrada."
        }
        autoInfo={
          !requerEscolherMatriculaGen &&
          selectedEmpresaIdGen &&
          matriculaOptionsGen[0]
            ? "Selecionada automaticamente (empresa com uma única matrícula)."
            : undefined
        }
        selectedVariant={!requerEscolherMatriculaGen ? "auto" : "default"}
      />
    );
  }

  const renderNonGestorFlow = () => {
    if (!isNonGestor) return null;

    if (documentMode === "holerite") {
      const renderHoleriteGroup = (
        title: string,
        docs: SearchDocumentItem[],
      ) => {
        if (!docs.length) return null;

        return (
          <DiscoveryActionCard
            key={title}
            title={title}
            loading={!!loadingPreviewId}
            compact
            topDivider
          >
            <DiscoveryGridSection
              title=""
              gridVariant="compact"
              options={docs.map((item) => {
                const itemHolerite = item as HoleriteItemExt;

                return {
                  key: `${item.uuid || item.id_documento}-${itemHolerite.tipo_calculo || itemHolerite.descricao || "doc"}`,
                  label: getHoleriteResolvedLabel(itemHolerite),
                  onPress: () => void openItem(item),
                };
              })}
            />
          </DiscoveryActionCard>
        );
      };

      return (
        <>
          <DiscoveryGridSection
            title="Empresa"
            options={empresaButtonsHol}
            selectedLabel={selectedEmpresaObj?.nome || ""}
            onReset={
              selectedEmpresaId && !isHoleriteSelectionLocked
                ? () => {
                    resetHoleriteFlow();
                    saveParams({
                      selectedEmpresaId: "",
                      selectedMatricula: "",
                    });
                  }
                : undefined
            }
            resetLabel="Trocar empresa"
            emptyText="Nenhuma empresa encontrada."
          />

          <DiscoveryGridSection
            title="Matrícula"
            options={matriculaButtonsHol}
            selectedLabel={
              requerEscolherMatricula
                ? selectedMatricula
                  ? `Matrícula ${selectedMatricula}`
                  : ""
                : matriculaOptions[0]
                  ? `Matrícula ${matriculaOptions[0]}`
                  : ""
            }
            onReset={
              requerEscolherMatricula &&
              selectedMatricula &&
              !isHoleriteSelectionLocked
                ? () => {
                    resetHoleriteFlow({
                      keepEmpresa: true,
                      keepMatricula: false,
                    });
                    saveParams({ selectedMatricula: "" });
                  }
                : undefined
            }
            resetLabel="Trocar matrícula"
            emptyText={
              !selectedEmpresaId
                ? "Selecione uma empresa acima."
                : "Nenhuma matrícula encontrada."
            }
            autoInfo={
              !requerEscolherMatricula &&
              selectedEmpresaId &&
              matriculaOptions[0]
                ? "Selecionada automaticamente (empresa com uma única matrícula)."
                : undefined
            }
            selectedVariant={!requerEscolherMatricula ? "auto" : "default"}
          />

          <DiscoveryActionCard
            title="Períodos (anos e meses)"
            loading={
              loadingSearch ||
              !!meLoading ||
              !!loadingPreviewId ||
              (!!selectedEmpresaId &&
                (loadingHolCompetencias || !competenciasHolLoaded))
            }
            emptyText="Nenhum período de holerite encontrado para a seleção atual."
          >
            {!selectedEmpresaId ? (
              <DiscoveryInfoBanner text="Selecione uma empresa para carregar os períodos." />
            ) : requerEscolherMatricula && !selectedMatricula ? (
              <DiscoveryInfoBanner text="Selecione a matrícula para carregar os períodos." />
            ) : !selectedYearHol ? (
              <DiscoveryGridSection
                title=""
                options={anosHol.map((ano) => ({
                  key: String(ano),
                  label: String(ano),
                  onPress: () => setSelectedYearHol(ano),
                }))}
                gridVariant="compact"
              />
            ) : (
              <>
                <DiscoveryGridSection
                  title=""
                  gridVariant="compact"
                  options={mesesHol.map((mm) => ({
                    key: `${selectedYearHol}-${mm}`,
                    label: makeYYYYMMLabel(selectedYearHol, mm),
                    onPress: () =>
                      void handleNonGestorHolerite(selectedYearHol, mm),
                  }))}
                />
                <DiscoveryActionCard
                  compact
                  title=""
                  children={null}
                  actionLabel="Escolher outro ano"
                  onAction={() => {
                    setSelectedYearHol(null);
                    setItems([]);
                  }}
                />
              </>
            )}
          </DiscoveryActionCard>

          {groupedHoleriteItems.pagamento.length > 0 ||
          groupedHoleriteItems.adiantamento.length > 0 ||
          groupedHoleriteItems.outros.length > 0 ? (
            <>
              {renderHoleriteGroup(
                "Pagamento",
                groupedHoleriteItems.pagamento,
              )}
              {renderHoleriteGroup(
                "Adiantamento",
                groupedHoleriteItems.adiantamento,
              )}
              {renderHoleriteGroup(
                "Outros documentos",
                groupedHoleriteItems.outros,
              )}
            </>
          ) : null}
        </>
      );
    }

    if (documentMode === "beneficios") {
      return (
        <>
          {renderEmpresaSection()}
          {renderMatriculaSection()}

          <DiscoveryActionCard
            title="Períodos (anos e meses)"
            loading={
              loadingSearch ||
              !!meLoading ||
              (!!selectedEmpresaIdGen && !competenciasBenLoaded)
            }
            emptyText="Nenhum período de benefícios encontrado para a seleção atual."
          >
            {!selectedEmpresaIdGen ? (
              <DiscoveryInfoBanner text="Selecione uma empresa para carregar os períodos." />
            ) : requerEscolherMatriculaGen && !selectedMatriculaGen ? (
              <DiscoveryInfoBanner text="Selecione a matrícula para carregar os períodos." />
            ) : !selectedYearBen ? (
              <DiscoveryGridSection
                title=""
                options={anosBen.map((ano) => ({
                  key: String(ano),
                  label: String(ano),
                  onPress: () => setSelectedYearBen(ano),
                }))}
                gridVariant="compact"
              />
            ) : (
              <>
                <DiscoveryGridSection
                  title=""
                  gridVariant="compact"
                  options={mesesBen.map((mm) => ({
                    key: `${selectedYearBen}-${mm}`,
                    label: makeYYYYMMLabel(selectedYearBen, mm),
                    onPress: () =>
                      void handleNonGestorBeneficios(selectedYearBen, mm),
                  }))}
                />
                <DiscoveryActionCard
                  compact
                  title=""
                  children={null}
                  actionLabel="Escolher outro ano"
                  onAction={() => {
                    setSelectedYearBen(null);
                    setItems([]);
                  }}
                />
              </>
            )}
          </DiscoveryActionCard>
        </>
      );
    }

    if (documentMode === "ferias") {
      return (
        <>
          {renderEmpresaSection()}
          {renderMatriculaSection()}

          <DiscoveryActionCard
            title="Períodos (anos e meses)"
            loading={
              loadingSearch ||
              !!meLoading ||
              (!!selectedEmpresaIdGen && !competenciasFeriasLoaded)
            }
            emptyText="Nenhum período de férias encontrado para a seleção atual."
          >
            {!selectedEmpresaIdGen ? (
              <DiscoveryInfoBanner text="Selecione uma empresa para carregar os períodos." />
            ) : requerEscolherMatriculaGen && !selectedMatriculaGen ? (
              <DiscoveryInfoBanner text="Selecione a matrícula para carregar os períodos." />
            ) : !selectedYearFerias ? (
              <DiscoveryGridSection
                title=""
                options={anosFerias.map((ano) => ({
                  key: String(ano),
                  label: String(ano),
                  onPress: () => setSelectedYearFerias(ano),
                }))}
                gridVariant="compact"
              />
            ) : (
              <>
                <DiscoveryGridSection
                  title=""
                  gridVariant="compact"
                  options={mesesFerias.map((mm) => ({
                    key: `${selectedYearFerias}-${mm}`,
                    label: makeYYYYMMLabel(selectedYearFerias, mm),
                    onPress: () =>
                      void handleNonGestorFerias(selectedYearFerias, mm),
                  }))}
                />
                <DiscoveryActionCard
                  compact
                  title=""
                  children={null}
                  actionLabel="Escolher outro ano"
                  onAction={() => {
                    setSelectedYearFerias(null);
                    setItems([]);
                  }}
                />
              </>
            )}
          </DiscoveryActionCard>
        </>
      );
    }

    if (isInforme) {
      return (
        <>
          <DiscoveryGridSection
            title="Empresa"
            options={empresaButtonsInforme}
            selectedLabel={
              selectedEmpresaInformeObj?.nome_empresa ||
              (selectedEmpresaInforme
                ? `Empresa ${selectedEmpresaInforme}`
                : "")
            }
            onReset={
              selectedEmpresaInforme
                ? () => {
                    resetInformeFlow();
                    saveParams({ selectedEmpresaInforme: "" });
                  }
                : undefined
            }
            resetLabel="Trocar empresa"
            emptyText="Nenhuma empresa encontrada."
          />

          <DiscoveryActionCard
            title="Competências disponíveis"
            loading={
              loadingSearch ||
              !!meLoading ||
              (!!selectedEmpresaInforme && !competenciasInformeLoaded)
            }
            emptyText="Nenhuma competência encontrada para informe de rendimentos."
          >
            {!selectedEmpresaInforme ? (
              <DiscoveryInfoBanner text="Selecione uma empresa para carregar as competências." />
            ) : (
              <DiscoveryGridSection
                title=""
                options={anosInforme.map((ano) => ({
                  key: String(ano),
                  label: String(ano),
                  onPress: () => void handleNonGestorInforme(ano),
                }))}
                gridVariant="compact"
              />
            )}
          </DiscoveryActionCard>
        </>
      );
    }

    return (
      <>
        {renderEmpresaSection()}
        {renderMatriculaSection()}

        <DiscoveryActionCard
          title={
            isTrct ? "Competências disponíveis" : "Períodos (anos e meses)"
          }
          loading={
            loadingSearch ||
            !!meLoading ||
            (!!selectedEmpresaIdGen && !competenciasGenLoaded)
          }
          emptyText={`Nenhum período de ${searchDocumentName} encontrado para a seleção atual.`}
        >
          {!selectedEmpresaIdGen ? (
            <DiscoveryInfoBanner text="Selecione uma empresa para carregar os períodos." />
          ) : requerEscolherMatriculaGen && !selectedMatriculaGen ? (
            <DiscoveryInfoBanner text="Selecione a matrícula para carregar os períodos." />
          ) : isTrct ? (
            <DiscoveryGridSection
              title=""
              options={anosGen.map((ano) => ({
                key: String(ano),
                label: String(ano),
                onPress: () => void handleNonGestorGenerico(ano),
              }))}
              gridVariant="compact"
            />
          ) : !selectedYearGen ? (
            <DiscoveryGridSection
              title=""
              options={anosGen.map((ano) => ({
                key: String(ano),
                label: String(ano),
                onPress: () => setSelectedYearGen(ano),
              }))}
              gridVariant="compact"
            />
          ) : (
            <>
              <DiscoveryGridSection
                title=""
                gridVariant="compact"
                options={mesesGen.map((mm) => ({
                  key: `${selectedYearGen}-${mm}`,
                  label: makeYYYYMMLabel(selectedYearGen, mm),
                  onPress: () =>
                    void handleNonGestorGenerico(selectedYearGen, mm),
                }))}
              />
              <DiscoveryActionCard
                compact
                title=""
                children={null}
                actionLabel="Escolher outro ano"
                onAction={() => {
                  setSelectedYearGen(null);
                  setItems([]);
                }}
              />
            </>
          )}
        </DiscoveryActionCard>
      </>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.backgroundLayer} />

          <Header brandType={brandType} onMenuPress={() => setMenuOpen(true)} />

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.page}>
              {isNonGestor ? (
                <View style={styles.nonGestorContentShell}>
                  <View style={styles.nonGestorStack}>
                    <FiltersCard
                      title={screenTitle}
                      cpf={meCpf}
                      setCpf={() => {}}
                      matricula=""
                      setMatricula={() => {}}
                      empresa=""
                      setEmpresa={() => {}}
                      competencia=""
                      setCompetencia={() => {}}
                      onBack={() => router.back()}
                      onSearch={() => {}}
                      loadingSearch={false}
                      showEmpresaField={false}
                      showMatriculaField={false}
                      hideSearchButton
                      hidePeriodPicker
                      hideCpfField
                      isNonGestor
                    />

                    {renderNonGestorFlow()}
                  </View>
                </View>
              ) : (
                <>
                  <FiltersCard
                    title={screenTitle}
                    cpf={cpf}
                    setCpf={(value) => {
                      const digits = onlyDigits(value).slice(0, 11);
                      setCpf(digits);
                      saveParams({ cpf: formatCpfInput(digits) });
                    }}
                    matricula={matricula}
                    setMatricula={(value) => {
                      setMatricula(value);
                      saveParams({ matricula: value });
                    }}
                    empresa={empresa}
                    setEmpresa={(value) => {
                      setEmpresa(value);
                      saveParams({ empresa: value });
                    }}
                    competencia={competencia}
                    setCompetencia={(value) => {
                      setCompetencia(value);
                      saveParams({ competencia: value });
                    }}
                    onBack={() => router.back()}
                    onSearch={doSearch}
                    loadingSearch={loadingSearch}
                    showEmpresaField={showEmpresaField}
                    showMatriculaField={showMatriculaField}
                    pickerMode={pickerMode}
                  />

                  <ResultsTable
                    items={items}
                    loading={loadingSearch}
                    competencia={competencia}
                    onOpenItem={openItem}
                    mode={resultsTableMode}
                  />
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ListarSideMenu
        visible={menuOpen}
        fullName={fullName}
        documentValue={userDocument}
        onClose={() => setMenuOpen(false)}
        onGoHome={() => {
          setMenuOpen(false);
          router.replace("/");
        }}
        onLogout={() => {
          setMenuOpen(false);
          logout();
        }}
      />
    </>
  );
}