import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { downloadPdfWithSuccessAlert, downloadAndSharePdf } from "@/lib/pdf";
import {
  acceptDocument,
  consultDocumentStatus,
  mountPdf,
  searchDocuments,
} from "@/lib/documentApi";
import {
  PreviewActionsFooter,
  PreviewDocumentCard,
  PreviewKind,
  PreviewSectionTitle,
  PreviewTopBar,
  PreviewPdfBox,
} from "./ui";
import { ListarSideMenu } from "../listar/ui";
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

type Evento = {
  evento?: number | string;
  evento_nome?: string;
  referencia?: number | string;
  valor?: number | string;
  tipo?: "V" | "D" | string;
};

type BeneficioItem = {
  codigo?: number | string;
  codigo_beneficio?: number | string;
  cod?: number | string;
  descricao?: string;
  descricao_beneficio?: string;
  descricaoBeneficio?: string;
  tipo?: string;
  tipo_beneficio?: string;
  tipoBeneficio?: string;
  unitario?: number | string;
  valor_unitario?: number | string;
  vl_unit?: number | string;
  dia?: number | string;
  mes?: number | string;
  total?: number | string;
  valor_total?: number | string;
  vl_total?: number | string;
  empresa?: number | string;
  filial?: number | string;
  cliente?: number | string;
  cliente_nome?: string;
  cliente_cnpj?: string;
  empresa_nome?: string;
  empresa_cnpj?: string;
  matricula?: number | string;
  competencia?: number | string;
  cpf?: string;
  nome?: string;
  funcao_nome?: string;
  admissao?: string;
  lote?: number | string;
  uuid?: string;
};

type InformeItem = {
  codigo_empresa?: number | string;
  codigo_cliente?: number | string;
  cpf_cnpj_cliente?: string;
  nome_cliente?: string;
  matricula?: number | string;
  cpf?: number | string;
  nome?: string;
  competencia?: number | string;
  rendimento_ferias_01?: number | string;
  inss_02?: number | string;
  prevprivada_03?: number | string;
  pensao_04?: number | string;
  irrf_irrfferias_05?: number | string;
  ajucusto_02?: number | string;
  avisoprevio_06?: number | string;
  feriasabono_07?: number | string;
  rendimento_irrf_inss_dependente_01?: number | string;
  irrf_02?: number | string;
  plucro_03?: number | string;
  abono_pecuniario?: number | string;
  rendimentos_isentos?: number | string;
};

type Cabecalho = {
  empresa?: string | number;
  filial?: string | number;
  empresa_nome?: string;
  empresa_cnpj?: string;
  cliente?: string | number;
  cliente_nome?: string;
  cliente_cnpj?: string;
  matricula?: string | number;
  nome?: string;
  funcao_nome?: string;
  admissao?: string;
  competencia?: string | number;
  lote?: string | number;
  uuid?: string;
  cpf?: string;
  tipo_calculo?: string;
};

type Rodape = {
  total_vencimentos?: number | string;
  total_descontos?: number | string;
  valor_liquido?: number | string;
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

function safeJsonParse<T>(value?: string): T | null {
  try {
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function onlyDigits(value: string | number | undefined | null): string {
  return String(value || "").replace(/\D/g, "");
}

function normalizeCompetencia(
  value: string | number | undefined | null,
): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  if (/^\d{6}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) return s.replace("-", "");
  if (/^\d{2}\/\d{4}$/.test(s)) {
    const [mm, yyyy] = s.split("/");
    return `${yyyy}${mm.padStart(2, "0")}`;
  }
  const digits = s.replace(/\D/g, "");
  if (/^\d{6}$/.test(digits)) return digits;
  return digits;
}

function normalizeCompetenciaLabel(
  value: string | number | undefined | null,
): string {
  const normalized = normalizeCompetencia(value);
  if (/^\d{6}$/.test(normalized)) {
    return normalized.replace(/(\d{4})(\d{2})/, "$1-$2");
  }
  return String(value ?? "").trim() || "-";
}

function cleanBase64Pdf(base64: string): string {
  return String(base64 || "").replace(/^data:application\/pdf;base64,/, "");
}

function padLeft(
  value: string | number | undefined | null,
  width: number,
): string {
  return String(value ?? "")
    .trim()
    .padStart(width, "0");
}

function parsePtBrNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  if (raw.includes(",")) {
    const normalized = raw.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function fmtNum(value: number | string | undefined | null): string {
  const n = parsePtBrNumber(value);
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtRef(value: number | string | undefined | null): string {
  const n = parsePtBrNumber(value);
  if (!n) return "";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function truncate(text: string | undefined | null, maxLen: number): string {
  const safe = String(text ?? "");
  return safe.length <= maxLen ? safe : `${safe.slice(0, maxLen - 3)}...`;
}

function resolveTipoDoc(kind?: string): PreviewKind {
  const s = String(kind || "").toLowerCase();

  if (s.includes("benef")) return "beneficios";
  if (s.includes("ferias")) return "ferias";
  if (s.includes("informe") && s.includes("rend")) return "informe_rendimentos";
  if (s.includes("holerite")) return "holerite";
  return "generico";
}

function buildDownloadName(params: {
  tipo: PreviewKind;
  title?: string;
  matricula?: string;
  competencia?: string;
}) {
  const competencia = normalizeCompetencia(params.competencia);
  const matricula = String(params.matricula || "").trim();

  if (params.tipo === "holerite") {
    return `holerite_${matricula || "mat"}_${competencia || "YYYYMM"}.pdf`;
  }

  if (params.tipo === "beneficios") {
    return `beneficios_${matricula || "mat"}_${competencia || "YYYYMM"}.pdf`;
  }

  if (params.tipo === "ferias") {
    return `ferias_${matricula || "mat"}_${competencia || "YYYYMM"}.pdf`;
  }

  if (params.tipo === "informe_rendimentos") {
    return `informe_rendimentos_${matricula || "matricula"}_${competencia || "ano"}.pdf`;
  }

  const cleanTitle = String(params.title || "documento")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();

  return `${cleanTitle || "documento"}.pdf`;
}

function coerceNumber(value: number | string | undefined | null): number {
  return parsePtBrNumber(value);
}

function mapBeneficiosToUi(list: BeneficioItem[]) {
  if (!Array.isArray(list)) return [];

  return list.map((item) => ({
    codigo: Number(item.codigo_beneficio ?? item.codigo ?? item.cod ?? 0),
    descricao: String(
      item.descricao_beneficio ??
        item.descricao ??
        item.descricaoBeneficio ??
        "",
    ),
    tipo_beneficio: String(
      item.tipo_beneficio ?? item.tipo ?? item.tipoBeneficio ?? "",
    ),
    unitario: coerceNumber(
      item.unitario ?? item.valor_unitario ?? item.vl_unit ?? 0,
    ),
    dia: coerceNumber(item.dia),
    mes: coerceNumber(item.mes),
    total: coerceNumber(item.total ?? item.valor_total ?? item.vl_total ?? 0),
  }));
}

function getCabecalho(obj: any): any {
  if (!obj) return undefined;
  if (obj.cabecalho) return obj.cabecalho;
  if (obj["cabeçalho"]) return obj["cabeçalho"];
  return undefined;
}

function getRodape(obj: any): any {
  if (!obj) return undefined;
  if (obj.rodape) return obj.rodape;
  if (obj["rodapé"]) return obj["rodapé"];
  return undefined;
}

function looksLikeUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-fA-F-]{16,}$/.test(value);
}

function extractUuidFromAny(input: any): string | undefined {
  if (!input) return undefined;

  const tryObject = (obj: any): string | undefined => {
    if (!obj) return undefined;

    if (looksLikeUuid(obj.uuid)) return obj.uuid;
    if (looksLikeUuid(obj.UUID)) return obj.UUID;
    if (looksLikeUuid(obj.id_uuid)) return obj.id_uuid;
    if (looksLikeUuid(obj.uuid_beneficio)) return obj.uuid_beneficio;

    const cab = getCabecalho(obj);
    if (looksLikeUuid(cab?.uuid)) return cab.uuid;

    const maybeArrays = ["items", "data", "beneficios", "eventos", "results"];
    for (const key of maybeArrays) {
      const arr = obj?.[key];
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const found = tryObject(item);
          if (found) return found;
        }
      }
    }

    return undefined;
  };

  if (Array.isArray(input)) {
    for (const item of input) {
      const found = tryObject(item);
      if (found) return found;
    }
    return undefined;
  }

  return tryObject(input);
}

function asString(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function findFirstArrayByKeys<T = any>(input: any, keys: string[]): T[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    if (input.length > 0 && !isObject(input[0])) return [];
    for (const item of input) {
      const nested = findFirstArrayByKeys<T>(item, keys);
      if (nested.length > 0) return nested;
    }
    return [];
  }

  if (!isObject(input)) return [];

  for (const key of keys) {
    if (Array.isArray(input[key])) return input[key] as T[];
  }

  for (const value of Object.values(input)) {
    const nested = findFirstArrayByKeys<T>(value, keys);
    if (nested.length > 0) return nested;
  }

  return [];
}

function extractHoleritePayload(input: any): {
  cabecalho?: Cabecalho;
  eventos: Evento[];
  rodape?: Rodape;
  raw?: any;
} {
  if (!input) {
    return { eventos: [] };
  }

  if (
    getCabecalho(input) ||
    getRodape(input) ||
    Array.isArray(input?.eventos)
  ) {
    return {
      cabecalho: getCabecalho(input),
      eventos: Array.isArray(input?.eventos) ? input.eventos : [],
      rodape: getRodape(input),
      raw: input,
    };
  }

  const holerite =
    Array.isArray(input?.holerites) && input.holerites.length > 0
      ? input.holerites[0]
      : null;

  if (holerite) {
    const eventos =
      Array.isArray(holerite?.documentos) && holerite.documentos.length > 0
        ? holerite.documentos.flatMap((doc: any) =>
            Array.isArray(doc?.eventos) ? doc.eventos : [],
          )
        : [];

    return {
      cabecalho: holerite?.cabecalho,
      eventos,
      rodape: holerite?.rodape,
      raw: holerite,
    };
  }

  const directCab = getCabecalho(input);
  const directRod = getRodape(input);
  const directEventos = findFirstArrayByKeys<Evento>(input, ["eventos"]);

  return {
    cabecalho: directCab,
    eventos: directEventos,
    rodape: directRod,
    raw: input,
  };
}

function extractBeneficiosPayload(input: any): {
  cabecalho?: Cabecalho;
  beneficios: BeneficioItem[];
  raw?: any;
} {
  if (!input) return { beneficios: [] };

  const cab = getCabecalho(input);
  const beneficios = findFirstArrayByKeys<BeneficioItem>(input, [
    "beneficios",
    "items",
    "data",
  ]);

  if (cab || beneficios.length > 0) {
    return {
      cabecalho: cab,
      beneficios,
      raw: input,
    };
  }

  return { beneficios: [] };
}

function extractInformeItems(input: any): InformeItem[] {
  if (!input) return [];
  const direct = findFirstArrayByKeys<InformeItem>(input, [
    "informes",
    "items",
    "data",
  ]);
  if (direct.length > 0) return direct;
  if (Array.isArray(input)) return input as InformeItem[];
  return [];
}

function extractFeriasPayload(input: any): {
  cabecalho?: Cabecalho;
  detalhes: any[];
  raw?: any;
} {
  if (!input) return { detalhes: [] };

  const cab = getCabecalho(input);
  const detalhes = findFirstArrayByKeys<any>(input, [
    "detalhes",
    "items",
    "data",
  ]);

  if (cab || detalhes.length > 0) {
    return {
      cabecalho: cab,
      detalhes,
      raw: input,
    };
  }

  return { detalhes: [] };
}

function isMeaningfulPersonName(value: unknown): boolean {
  const s = asString(value).toLowerCase();
  if (!s) return false;

  const invalidValues = new Set([
    "holerites",
    "holerite",
    "beneficios",
    "benefício",
    "benefícios",
    "documento",
    "documentos",
    "informe",
    "ferias",
    "férias",
    "recibo",
  ]);

  return !invalidValues.has(s);
}

function pickMeaningfulString(...values: unknown[]): string {
  for (const value of values) {
    const s = asString(value);
    if (s) return s;
  }
  return "";
}

function hasCompleteHoleritePayload(payload: {
  cabecalho?: Cabecalho;
  eventos: Evento[];
  rodape?: Rodape;
}): boolean {
  return !!payload.cabecalho && payload.eventos.length > 0 && !!payload.rodape;
}

function hasHoleriteIdentityMeta(cabecalho?: Cabecalho): boolean {
  if (!cabecalho) return false;

  const nomeOk = isMeaningfulPersonName(cabecalho.nome);
  const funcaoOk = !!asString(cabecalho.funcao_nome);
  const admissaoOk = !!asString(cabecalho.admissao);

  return nomeOk || funcaoOk || admissaoOk;
}

export default function VisualizarPage() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const params = useLocalSearchParams<{
    base64?: string;
    title?: string;
    kind?: string;
    cpf?: string;
    matricula?: string;
    empresa?: string;
    competencia?: string;
    lote?: string;
    uuid?: string;
    idGed?: string;
    empresaNome?: string;
    empresaCnpj?: string;
    filial?: string;
    cliente?: string;
    clienteNome?: string;
    clienteCnpj?: string;
    nome?: string;
    funcaoNome?: string;
    admissao?: string;
    totalVencimentos?: string;
    totalDescontos?: string;
    valorLiquido?: string;
    eventosJson?: string;
    beneficiosJson?: string;
    informesJson?: string;
    itemJson?: string;
  }>();

  const brandType = useMemo(() => getBrandType(user), [user]);

  const fullName = useMemo(() => {
    if (!user?.nome) return "Usuário";
    return String(user.nome);
  }, [user?.nome]);

  const userDocument = useMemo(() => {
    return user?.cpf || "";
  }, [user]);

  const tipo = useMemo(
    () => resolveTipoDoc(String(params.kind || "")),
    [params.kind],
  );

  const itemJson = useMemo(
    () => safeJsonParse<Record<string, unknown>>(params.itemJson),
    [params.itemJson],
  );

  const title = String(params.title || "Documento");
  const routeBase64 = String(params.base64 || "");
  const [pdfOverride, setPdfOverride] = useState<string>("");
  const [mountedData, setMountedData] = useState<any>(null);

  const effectivePdf = useMemo(
    () => cleanBase64Pdf(pdfOverride || routeBase64),
    [pdfOverride, routeBase64],
  );

  const routeEventos = useMemo<Evento[]>(() => {
    try {
      return params.eventosJson ? JSON.parse(String(params.eventosJson)) : [];
    } catch {
      return [];
    }
  }, [params.eventosJson]);

  const routeBeneficios = useMemo<BeneficioItem[]>(() => {
    try {
      return params.beneficiosJson
        ? JSON.parse(String(params.beneficiosJson))
        : [];
    } catch {
      return [];
    }
  }, [params.beneficiosJson]);

  const routeInformes = useMemo<InformeItem[]>(() => {
    try {
      return params.informesJson ? JSON.parse(String(params.informesJson)) : [];
    } catch {
      return [];
    }
  }, [params.informesJson]);

  const routeCabecalho = useMemo<Cabecalho | undefined>(() => {
    if (isObject(itemJson)) {
      return getCabecalho(itemJson) || undefined;
    }
    return undefined;
  }, [itemJson]);

  const routeRodape = useMemo<Rodape | undefined>(() => {
    if (isObject(itemJson)) {
      return getRodape(itemJson) || undefined;
    }
    return undefined;
  }, [itemJson]);

  const cpfDigits = useMemo(() => {
    return onlyDigits(
      params.cpf ||
        routeCabecalho?.cpf ||
        (itemJson as any)?.cpf ||
        (user as any)?.cpf ||
        "",
    );
  }, [params.cpf, routeCabecalho, itemJson, user]);

  const routeCompetencia = useMemo(
    () =>
      normalizeCompetencia(
        params.competencia ||
          routeCabecalho?.competencia ||
          (itemJson as any)?.competencia ||
          "",
      ),
    [params.competencia, routeCabecalho, itemJson],
  );

  const routeMatricula = useMemo(
    () =>
      String(
        params.matricula ||
          routeCabecalho?.matricula ||
          (itemJson as any)?.matricula ||
          "",
      ).trim(),
    [params.matricula, routeCabecalho, itemJson],
  );

  const [remoteData, setRemoteData] = useState<any>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [aceito, setAceito] = useState<boolean | null>(null);

  const holeriteFromItem = useMemo(
    () => extractHoleritePayload(itemJson),
    [itemJson],
  );
  const holeriteFromMounted = useMemo(
    () => extractHoleritePayload(mountedData),
    [mountedData],
  );
  const holeriteFromRemote = useMemo(
    () => extractHoleritePayload(remoteData),
    [remoteData],
  );

  const beneficiosFromItem = useMemo(
    () => extractBeneficiosPayload(itemJson),
    [itemJson],
  );
  const beneficiosFromMounted = useMemo(
    () => extractBeneficiosPayload(mountedData),
    [mountedData],
  );
  const beneficiosFromRemote = useMemo(
    () => extractBeneficiosPayload(remoteData),
    [remoteData],
  );

  const feriasFromItem = useMemo(
    () => extractFeriasPayload(itemJson),
    [itemJson],
  );
  const feriasFromMounted = useMemo(
    () => extractFeriasPayload(mountedData),
    [mountedData],
  );
  const feriasFromRemote = useMemo(
    () => extractFeriasPayload(remoteData),
    [remoteData],
  );

  const informeFromItem = useMemo(
    () => extractInformeItems(itemJson),
    [itemJson],
  );
  const informeFromMounted = useMemo(
    () => extractInformeItems(mountedData),
    [mountedData],
  );
  const informeFromRemote = useMemo(
    () => extractInformeItems(remoteData),
    [remoteData],
  );

  const holeriteCabecalho = useMemo<Cabecalho | undefined>(() => {
    return (
      routeCabecalho ||
      holeriteFromItem.cabecalho ||
      holeriteFromMounted.cabecalho ||
      holeriteFromRemote.cabecalho
    );
  }, [
    routeCabecalho,
    holeriteFromItem,
    holeriteFromMounted,
    holeriteFromRemote,
  ]);

  const holeriteRodape = useMemo<Rodape | undefined>(() => {
    return (
      routeRodape ||
      holeriteFromItem.rodape ||
      holeriteFromMounted.rodape ||
      holeriteFromRemote.rodape
    );
  }, [routeRodape, holeriteFromItem, holeriteFromMounted, holeriteFromRemote]);

  const resolvedEventos = useMemo<Evento[]>(() => {
    if (routeEventos.length > 0) return routeEventos;
    if (holeriteFromItem.eventos.length > 0) return holeriteFromItem.eventos;
    if (holeriteFromMounted.eventos.length > 0)
      return holeriteFromMounted.eventos;
    if (holeriteFromRemote.eventos.length > 0)
      return holeriteFromRemote.eventos;
    if (Array.isArray(mountedData?.eventos)) return mountedData.eventos;
    if (Array.isArray(remoteData?.eventos)) return remoteData.eventos;
    return [];
  }, [
    routeEventos,
    holeriteFromItem,
    holeriteFromMounted,
    holeriteFromRemote,
    mountedData,
    remoteData,
  ]);

  const resolvedBeneficios = useMemo<BeneficioItem[]>(() => {
    if (routeBeneficios.length > 0) return routeBeneficios;
    if (beneficiosFromItem.beneficios.length > 0)
      return beneficiosFromItem.beneficios;
    if (beneficiosFromMounted.beneficios.length > 0)
      return beneficiosFromMounted.beneficios;
    if (beneficiosFromRemote.beneficios.length > 0)
      return beneficiosFromRemote.beneficios;
    return [];
  }, [
    routeBeneficios,
    beneficiosFromItem,
    beneficiosFromMounted,
    beneficiosFromRemote,
  ]);

  const resolvedInformes = useMemo<InformeItem[]>(() => {
    if (routeInformes.length > 0) return routeInformes;
    if (informeFromItem.length > 0) return informeFromItem;
    if (informeFromMounted.length > 0) return informeFromMounted;
    if (informeFromRemote.length > 0) return informeFromRemote;
    return [];
  }, [routeInformes, informeFromItem, informeFromMounted, informeFromRemote]);

  const feriasCabecalho = useMemo<Cabecalho | undefined>(() => {
    return (
      feriasFromItem.cabecalho ||
      feriasFromMounted.cabecalho ||
      feriasFromRemote.cabecalho
    );
  }, [feriasFromItem, feriasFromMounted, feriasFromRemote]);

  const remoteCabecalho = useMemo(() => {
    return (
      holeriteCabecalho ||
      beneficiosFromItem.cabecalho ||
      beneficiosFromMounted.cabecalho ||
      beneficiosFromRemote.cabecalho ||
      feriasCabecalho ||
      getCabecalho(mountedData) ||
      getCabecalho(remoteData)
    );
  }, [
    holeriteCabecalho,
    beneficiosFromItem.cabecalho,
    beneficiosFromMounted.cabecalho,
    beneficiosFromRemote.cabecalho,
    feriasCabecalho,
    mountedData,
    remoteData,
  ]);

  const mergedMeta = useMemo(() => {
    const firstBeneficio = resolvedBeneficios[0];
    const firstInforme = resolvedInformes[0];

    const nomeCandidato = isMeaningfulPersonName(params.nome)
      ? asString(params.nome)
      : isMeaningfulPersonName(routeCabecalho?.nome)
        ? asString(routeCabecalho?.nome)
        : isMeaningfulPersonName(holeriteCabecalho?.nome)
          ? asString(holeriteCabecalho?.nome)
          : isMeaningfulPersonName(remoteCabecalho?.nome)
            ? asString(remoteCabecalho?.nome)
            : isMeaningfulPersonName(firstBeneficio?.nome)
              ? asString(firstBeneficio?.nome)
              : isMeaningfulPersonName(firstInforme?.nome)
                ? asString(firstInforme?.nome)
                : "";

    return {
      empresa: pickMeaningfulString(
        params.empresa,
        routeCabecalho?.empresa,
        holeriteCabecalho?.empresa,
        remoteCabecalho?.empresa,
        firstBeneficio?.empresa,
      ),
      empresaNome: pickMeaningfulString(
        params.empresaNome,
        routeCabecalho?.empresa_nome,
        holeriteCabecalho?.empresa_nome,
        remoteCabecalho?.empresa_nome,
        firstBeneficio?.empresa_nome,
      ),
      empresaCnpj: pickMeaningfulString(
        params.empresaCnpj,
        routeCabecalho?.empresa_cnpj,
        holeriteCabecalho?.empresa_cnpj,
        remoteCabecalho?.empresa_cnpj,
        firstBeneficio?.empresa_cnpj,
      ),
      filial: pickMeaningfulString(
        params.filial,
        routeCabecalho?.filial,
        holeriteCabecalho?.filial,
        remoteCabecalho?.filial,
        firstBeneficio?.filial,
      ),
      cliente: pickMeaningfulString(
        params.cliente,
        routeCabecalho?.cliente,
        holeriteCabecalho?.cliente,
        remoteCabecalho?.cliente,
        firstBeneficio?.cliente,
        firstInforme?.codigo_cliente,
      ),
      clienteNome: pickMeaningfulString(
        params.clienteNome,
        routeCabecalho?.cliente_nome,
        holeriteCabecalho?.cliente_nome,
        remoteCabecalho?.cliente_nome,
        firstBeneficio?.cliente_nome,
        firstInforme?.nome_cliente,
      ),
      clienteCnpj: pickMeaningfulString(
        params.clienteCnpj,
        routeCabecalho?.cliente_cnpj,
        holeriteCabecalho?.cliente_cnpj,
        remoteCabecalho?.cliente_cnpj,
        firstBeneficio?.cliente_cnpj,
        firstInforme?.cpf_cnpj_cliente,
      ),
      nome: nomeCandidato,
      funcaoNome: pickMeaningfulString(
        params.funcaoNome,
        routeCabecalho?.funcao_nome,
        holeriteCabecalho?.funcao_nome,
        remoteCabecalho?.funcao_nome,
        firstBeneficio?.funcao_nome,
      ),
      admissao: pickMeaningfulString(
        params.admissao,
        routeCabecalho?.admissao,
        holeriteCabecalho?.admissao,
        remoteCabecalho?.admissao,
        firstBeneficio?.admissao,
      ),
      matricula: pickMeaningfulString(
        routeMatricula,
        routeCabecalho?.matricula,
        holeriteCabecalho?.matricula,
        feriasCabecalho?.matricula,
        remoteCabecalho?.matricula,
        firstBeneficio?.matricula,
        firstInforme?.matricula,
      ),
      competencia: normalizeCompetencia(
        routeCompetencia ||
          routeCabecalho?.competencia ||
          holeriteCabecalho?.competencia ||
          feriasCabecalho?.competencia ||
          remoteCabecalho?.competencia ||
          firstBeneficio?.competencia ||
          firstInforme?.competencia,
      ),
      uuid: pickMeaningfulString(
        params.uuid,
        routeCabecalho?.uuid,
        holeriteCabecalho?.uuid,
        feriasCabecalho?.uuid,
        remoteCabecalho?.uuid,
        firstBeneficio?.uuid,
        extractUuidFromAny(mountedData),
        extractUuidFromAny(remoteData),
        extractUuidFromAny(itemJson),
      ),
      lote: pickMeaningfulString(
        params.lote,
        routeCabecalho?.lote,
        holeriteCabecalho?.lote,
        feriasCabecalho?.lote,
        remoteCabecalho?.lote,
      ),
      tipoCalculo: pickMeaningfulString(
        (itemJson as any)?.tipo_calculo,
        routeCabecalho?.tipo_calculo,
        holeriteCabecalho?.tipo_calculo,
        remoteCabecalho?.tipo_calculo,
      ),
      idGed: pickMeaningfulString(params.idGed),
    };
  }, [
    params.empresa,
    params.empresaNome,
    params.empresaCnpj,
    params.filial,
    params.cliente,
    params.clienteNome,
    params.clienteCnpj,
    params.nome,
    params.funcaoNome,
    params.admissao,
    params.uuid,
    params.lote,
    params.idGed,
    routeMatricula,
    routeCompetencia,
    routeCabecalho,
    holeriteCabecalho,
    feriasCabecalho,
    remoteCabecalho,
    resolvedBeneficios,
    resolvedInformes,
    mountedData,
    remoteData,
    itemJson,
  ]);

  const unidade = useMemo(() => {
    if (mergedMeta.clienteNome) {
      return `${mergedMeta.cliente}${mergedMeta.cliente ? " " : ""}${mergedMeta.clienteNome}`.trim();
    }

    if (mergedMeta.empresaNome) {
      return `${mergedMeta.empresa}${mergedMeta.empresa ? " " : ""}${mergedMeta.empresaNome}`.trim();
    }

    return String(mergedMeta.cliente || mergedMeta.empresa || "").trim();
  }, [mergedMeta]);

  useEffect(() => {
    let active = true;

    async function hydrateData() {
      const canSearch =
        !!cpfDigits &&
        (tipo === "holerite" ||
          tipo === "beneficios" ||
          tipo === "ferias" ||
          tipo === "informe_rendimentos");

      if (!canSearch) return;

      const holeriteReadyFromRoute =
        hasCompleteHoleritePayload({
          cabecalho: routeCabecalho,
          eventos: routeEventos,
          rodape: routeRodape,
        }) && hasHoleriteIdentityMeta(routeCabecalho);

      const holeriteReadyFromItem =
        hasCompleteHoleritePayload(holeriteFromItem) &&
        hasHoleriteIdentityMeta(holeriteFromItem.cabecalho);

      const holeriteReadyFromMounted =
        hasCompleteHoleritePayload(holeriteFromMounted) &&
        hasHoleriteIdentityMeta(holeriteFromMounted.cabecalho);

      const holeriteReadyFromRemote =
        hasCompleteHoleritePayload(holeriteFromRemote) &&
        hasHoleriteIdentityMeta(holeriteFromRemote.cabecalho);

      const holeriteReady =
        holeriteReadyFromRoute ||
        holeriteReadyFromItem ||
        holeriteReadyFromMounted ||
        holeriteReadyFromRemote;

      const alreadyEnough =
        tipo === "holerite"
          ? holeriteReady
          : tipo === "beneficios"
            ? resolvedBeneficios.length > 0
            : tipo === "informe_rendimentos"
              ? resolvedInformes.length > 0
              : !!mergedMeta.matricula;

      if (alreadyEnough && (remoteData || mountedData || itemJson)) return;

      try {
        if (
          tipo === "holerite" &&
          (itemJson || mergedMeta.uuid || mergedMeta.lote)
        ) {
          return;
        }

        const result = await searchDocuments({
          kind: tipo,
          cpf: cpfDigits,
          matricula: mergedMeta.matricula,
          empresa: mergedMeta.empresa || mergedMeta.cliente,
          competencia: mergedMeta.competencia,
        });

        if (!active) return;
        setRemoteData(result ?? null);
      } catch {
        if (!active) return;
      }
    }

    void hydrateData();

    return () => {
      active = false;
    };
  }, [
    tipo,
    cpfDigits,
    mergedMeta.matricula,
    mergedMeta.empresa,
    mergedMeta.cliente,
    mergedMeta.competencia,
    resolvedBeneficios.length,
    resolvedInformes.length,
    remoteData,
    mountedData,
    itemJson,
    routeCabecalho,
    routeEventos,
    routeRodape,
    holeriteFromItem,
    holeriteFromMounted,
    holeriteFromRemote,
  ]);

  const itemForMount = useMemo(() => {
    if (itemJson) return itemJson;

    if (tipo === "holerite") {
      return holeriteFromRemote.raw ?? remoteData ?? undefined;
    }

    if (tipo === "beneficios") {
      return beneficiosFromRemote.raw ?? remoteData ?? undefined;
    }

    if (tipo === "ferias") {
      return feriasFromRemote.raw ?? remoteData ?? undefined;
    }

    if (tipo === "informe_rendimentos") {
      return remoteData ?? undefined;
    }

    if (tipo === "generico") {
      return itemJson ?? remoteData ?? undefined;
    }

    return remoteData ?? undefined;
  }, [
    itemJson,
    tipo,
    holeriteFromRemote.raw,
    beneficiosFromRemote.raw,
    feriasFromRemote.raw,
    remoteData,
  ]);

  useEffect(() => {
    let active = true;

    async function hydratePdf() {
      const canMount =
        tipo === "holerite" ||
        tipo === "beneficios" ||
        tipo === "ferias" ||
        tipo === "informe_rendimentos" ||
        tipo === "generico";

      if (!canMount) return;
      if (effectivePdf) return;

      const hasEnoughToMount =
        !!itemForMount ||
        !!cpfDigits ||
        !!mergedMeta.idGed ||
        !!mergedMeta.uuid;

      if (!hasEnoughToMount) return;

      try {
        const pdf = await mountPdf({
          kind: tipo,
          item:
            tipo === "holerite"
              ? {
                  ...(itemForMount || {}),
                  lote: mergedMeta.lote || (itemForMount as any)?.lote,
                  uuid: mergedMeta.uuid || (itemForMount as any)?.uuid,
                  tipo_calculo:
                    mergedMeta.tipoCalculo ||
                    (itemForMount as any)?.tipo_calculo,
                }
              : itemForMount,
          cpf: cpfDigits,
          matricula: mergedMeta.matricula,
          empresa: mergedMeta.empresa || mergedMeta.cliente,
          competencia: mergedMeta.competencia,
        });

        if (!active) return;

        setMountedData(pdf ?? null);

        const mountedBase64 = cleanBase64Pdf(
          String(
            (pdf as any)?.pdf_base64 ||
              (pdf as any)?.base64 ||
              (pdf as any)?.pdf ||
              "",
          ),
        );

        if (mountedBase64) {
          setPdfOverride(mountedBase64);
        }
      } catch {
        if (!active) return;
      }
    }

    void hydratePdf();

    return () => {
      active = false;
    };
  }, [
    effectivePdf,
    tipo,
    cpfDigits,
    itemForMount,
    mergedMeta.matricula,
    mergedMeta.empresa,
    mergedMeta.cliente,
    mergedMeta.competencia,
    mergedMeta.idGed,
    mergedMeta.uuid,
    mergedMeta.lote,
    mergedMeta.tipoCalculo,
  ]);

  useEffect(() => {
    let active = true;

    async function runStatus() {
      try {
        setIsCheckingStatus(true);

        const uuid = mergedMeta.uuid || undefined;
        const idGed = mergedMeta.idGed || undefined;

        if (tipo === "holerite" || tipo === "beneficios" || tipo === "ferias") {
          if (!uuid) {
            if (active) setAceito(null);
            return;
          }

          const result = await consultDocumentStatus({ uuid });
          if (active) setAceito(!!result?.aceito);
          return;
        }

        if (!idGed) {
          if (active) setAceito(null);
          return;
        }

        const result = await consultDocumentStatus({ id_ged: idGed });
        if (active) setAceito(!!result?.aceito);
      } catch {
        if (active) setAceito(null);
      } finally {
        if (active) setIsCheckingStatus(false);
      }
    }

    void runStatus();

    return () => {
      active = false;
    };
  }, [tipo, mergedMeta.uuid, mergedMeta.idGed]);

  const fileName = useMemo(
    () =>
      buildDownloadName({
        tipo,
        title,
        matricula: mergedMeta.matricula,
        competencia: mergedMeta.competencia,
      }),
    [tipo, title, mergedMeta.matricula, mergedMeta.competencia],
  );

  async function onShare() {
    if (!effectivePdf) {
      Alert.alert("Aviso", "Este documento não possui conteúdo PDF.");
      return;
    }

    try {
      setIsBusy(true);
      await downloadPdfWithSuccessAlert(effectivePdf, fileName);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível baixar o PDF.");
    } finally {
      setIsBusy(false);
    }
  }

  async function onAcceptAndShare() {
    if (!effectivePdf) {
      Alert.alert("Aviso", "Não há PDF disponível para registrar o aceite.");
      return;
    }

    if (!cpfDigits || cpfDigits.length !== 11) {
      Alert.alert("Erro", "CPF do usuário indisponível ou inválido.");
      return;
    }

    const requiresMatricula =
      tipo === "holerite" || tipo === "beneficios" || tipo === "ferias";

    if (requiresMatricula && !mergedMeta.matricula) {
      Alert.alert(
        "Erro",
        "Matrícula não encontrada para confirmar o documento.",
      );
      return;
    }

    if (requiresMatricula && !/^\d{6}$/.test(mergedMeta.competencia)) {
      Alert.alert("Erro", "Competência inválida para confirmar o documento.");
      return;
    }

    try {
      setIsBusy(true);

      await acceptDocument({
        aceito: true,
        tipo_doc:
          tipo === "generico" ? String(params.kind || "generico") : tipo,
        base64: effectivePdf,
        cpf: cpfDigits,
        matricula: mergedMeta.matricula,
        unidade,
        competencia: mergedMeta.competencia,
        uuid:
          tipo === "holerite" || tipo === "beneficios" || tipo === "ferias"
            ? mergedMeta.uuid || undefined
            : undefined,
        id_ged:
          tipo === "generico" || tipo === "informe_rendimentos"
            ? mergedMeta.idGed || undefined
            : undefined,
      });

      setAceito(true);
      await downloadAndSharePdf(effectivePdf, fileName);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Não foi possível registrar o aceite.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  const beneficiosUi = useMemo(
    () => mapBeneficiosToUi(resolvedBeneficios),
    [resolvedBeneficios],
  );

  const totalBeneficios = useMemo(
    () => beneficiosUi.reduce((sum, item) => sum + item.total, 0),
    [beneficiosUi],
  );

  const informePrimeiro = resolvedInformes[0];

  const totalVencimentosCalculado = useMemo(() => {
    return resolvedEventos.reduce((acc, item) => {
      return String(item.tipo) === "V"
        ? acc + parsePtBrNumber(item.valor)
        : acc;
    }, 0);
  }, [resolvedEventos]);

  const totalDescontosCalculado = useMemo(() => {
    return resolvedEventos.reduce((acc, item) => {
      return String(item.tipo) === "D"
        ? acc + parsePtBrNumber(item.valor)
        : acc;
    }, 0);
  }, [resolvedEventos]);

  const totalVencimentos = useMemo(() => {
    if (
      holeriteRodape?.total_vencimentos !== undefined &&
      holeriteRodape?.total_vencimentos !== null
    ) {
      return holeriteRodape.total_vencimentos;
    }
    if (params.totalVencimentos) return params.totalVencimentos;
    return totalVencimentosCalculado;
  }, [holeriteRodape, params.totalVencimentos, totalVencimentosCalculado]);

  const totalDescontos = useMemo(() => {
    if (
      holeriteRodape?.total_descontos !== undefined &&
      holeriteRodape?.total_descontos !== null
    ) {
      return holeriteRodape.total_descontos;
    }
    if (params.totalDescontos) return params.totalDescontos;
    return totalDescontosCalculado;
  }, [holeriteRodape, params.totalDescontos, totalDescontosCalculado]);

  const valorLiquido = useMemo(() => {
    if (
      holeriteRodape?.valor_liquido !== undefined &&
      holeriteRodape?.valor_liquido !== null
    ) {
      return holeriteRodape.valor_liquido;
    }
    if (params.valorLiquido) return params.valorLiquido;
    return totalVencimentosCalculado - totalDescontosCalculado;
  }, [
    holeriteRodape,
    params.valorLiquido,
    totalVencimentosCalculado,
    totalDescontosCalculado,
  ]);

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#d9efe2" }}>
        <View style={{ flex: 1, backgroundColor: "#d9efe2" }}>
          <Header brandType={brandType} onMenuPress={() => setMenuOpen(true)} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <PreviewTopBar
              aceito={aceito === true}
              isCheckingStatus={isCheckingStatus}
              onBack={() => router.back()}
            />

            <PreviewDocumentCard>
              {tipo === "generico" && (
                <>
                  <PreviewSectionTitle title={title} />
                  <PreviewPdfBox
                    title="Visualização do documento"
                    hasPdf={!!effectivePdf}
                    base64={effectivePdf}
                  />
                </>
              )}

              {tipo === "ferias" && (
                <>
                  <PreviewSectionTitle title="Recibo de Férias" />
                  <PreviewPdfBox
                    title="Visualização do documento"
                    hasPdf={!!effectivePdf}
                    base64={effectivePdf}
                  />
                </>
              )}

              {tipo === "holerite" && (
                <>
                  <View style={styles.headSection}>
                    <View style={styles.headLeft}>
                      <PreviewSectionTitle title="Recibo de Pagamento de Salário" />

                      <Text style={styles.headText}>
                        <Text style={styles.headTextBold}>Empresa: </Text>
                        {padLeft(mergedMeta.empresa || "", 3)}
                        {mergedMeta.filial ? ` - ${mergedMeta.filial}` : ""}
                        {mergedMeta.empresaNome
                          ? ` ${mergedMeta.empresaNome}`
                          : ""}
                      </Text>

                      {!!mergedMeta.empresaCnpj && (
                        <Text style={styles.headMeta}>
                          <Text style={styles.headTextBold}>
                            Nº Inscrição:{" "}
                          </Text>
                          {mergedMeta.empresaCnpj}
                        </Text>
                      )}

                      {!!mergedMeta.clienteNome || !!mergedMeta.cliente ? (
                        <Text style={styles.headText}>
                          <Text style={styles.headTextBold}>Cliente: </Text>
                          {mergedMeta.cliente || ""}
                          {mergedMeta.clienteNome
                            ? ` ${mergedMeta.clienteNome}`
                            : ""}
                        </Text>
                      ) : null}

                      {!!mergedMeta.clienteCnpj && (
                        <Text style={styles.headMeta}>
                          <Text style={styles.headTextBold}>
                            Nº Inscrição:{" "}
                          </Text>
                          {mergedMeta.clienteCnpj}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.infoGrid5}>
                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Código</Text>
                      <Text style={styles.infoValue}>
                        {padLeft(mergedMeta.matricula || "-", 6)}
                      </Text>
                    </View>

                    {!!mergedMeta.nome && (
                      <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>
                          Nome do Funcionário
                        </Text>
                        <Text style={styles.infoValue}>
                          {truncate(mergedMeta.nome, 30)}
                        </Text>
                      </View>
                    )}

                    {!!mergedMeta.funcaoNome && (
                      <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Função</Text>
                        <Text style={styles.infoValue}>
                          {mergedMeta.funcaoNome}
                        </Text>
                      </View>
                    )}

                    {!!mergedMeta.admissao && (
                      <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Admissão</Text>
                        <Text style={styles.infoValue}>
                          {mergedMeta.admissao}
                        </Text>
                      </View>
                    )}

                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Competência</Text>
                      <Text style={styles.infoValue}>
                        {normalizeCompetenciaLabel(
                          holeriteCabecalho?.competencia ||
                            mergedMeta.competencia,
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <ScrollView
                    horizontal
                    style={styles.tableScroll}
                    contentContainerStyle={styles.tableScrollContent}
                    showsHorizontalScrollIndicator
                  >
                    <View style={[styles.table, styles.tableMinWidthHolerite]}>
                      <View style={styles.tableHeader}>
                        <Text
                          style={[styles.tableHeaderCell, styles.colCodigo]}
                        >
                          Cód.
                        </Text>
                        <Text
                          style={[
                            styles.tableHeaderCell,
                            styles.colDescricaoWide,
                          ]}
                        >
                          Descrição
                        </Text>
                        <Text
                          style={[styles.tableHeaderCell, styles.colReferencia]}
                        >
                          Referência
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colValor]}>
                          Vencimentos
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colValor]}>
                          Descontos
                        </Text>
                      </View>

                      {resolvedEventos.length === 0 ? (
                        <View style={styles.tableRow}>
                          <Text style={styles.emptyText}>
                            Sem eventos para exibir.
                          </Text>
                        </View>
                      ) : (
                        resolvedEventos.map((item, index) => (
                          <View
                            key={`${item.evento}-${index}`}
                            style={[
                              styles.tableRow,
                              index % 2 === 1 ? styles.tableRowAlt : null,
                            ]}
                          >
                            <Text style={[styles.tableCell, styles.colCodigo]}>
                              {String(item.evento ?? "-")}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                styles.colDescricaoWide,
                              ]}
                            >
                              {truncate(String(item.evento_nome ?? "-"), 26)}
                            </Text>
                            <Text
                              style={[styles.tableCell, styles.colReferencia]}
                            >
                              {fmtRef(item.referencia)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colValor]}>
                              {String(item.tipo) === "V"
                                ? fmtNum(item.valor)
                                : ""}
                            </Text>
                            <Text style={[styles.tableCell, styles.colValor]}>
                              {String(item.tipo) === "D"
                                ? fmtNum(item.valor)
                                : ""}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>

                  <View style={styles.separator} />

                  <View style={styles.totalBox}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Vencimentos:</Text>
                      <Text style={styles.totalValue}>
                        {fmtNum(totalVencimentos)}
                      </Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Descontos:</Text>
                      <Text style={styles.totalValue}>
                        {fmtNum(totalDescontos)}
                      </Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Valor Líquido:</Text>
                      <Text style={styles.totalValue}>
                        {fmtNum(valorLiquido)}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {tipo === "beneficios" && (
                <>
                  <View style={styles.headSection}>
                    <View style={styles.headLeft}>
                      <PreviewSectionTitle title="Demonstrativo de Benefícios" />

                      <Text style={styles.headText}>
                        <Text style={styles.headTextBold}>Empresa: </Text>
                        {padLeft(mergedMeta.empresa || "", 3)}
                        {mergedMeta.filial ? ` - ${mergedMeta.filial}` : ""}
                        {mergedMeta.empresaNome
                          ? ` ${mergedMeta.empresaNome}`
                          : ""}
                      </Text>

                      {!!mergedMeta.clienteNome || !!mergedMeta.cliente ? (
                        <Text style={styles.headText}>
                          <Text style={styles.headTextBold}>Cliente: </Text>
                          {mergedMeta.cliente || ""}
                          {mergedMeta.clienteNome
                            ? ` ${mergedMeta.clienteNome}`
                            : ""}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.headRight}>
                      {!!mergedMeta.empresaCnpj && (
                        <Text style={styles.headMeta}>
                          <Text style={styles.headTextBold}>
                            Nº Inscrição:{" "}
                          </Text>
                          {mergedMeta.empresaCnpj}
                        </Text>
                      )}
                      {!!mergedMeta.clienteCnpj && (
                        <Text style={styles.headMeta}>
                          <Text style={styles.headTextBold}>
                            Nº Inscrição:{" "}
                          </Text>
                          {mergedMeta.clienteCnpj}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.infoGrid5}>
                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Código</Text>
                      <Text style={styles.infoValue}>
                        {padLeft(mergedMeta.matricula || "-", 6)}
                      </Text>
                    </View>

                    {!!mergedMeta.nome &&
                      String(mergedMeta.nome).trim().toLowerCase() !==
                        "beneficios" && (
                        <View style={styles.infoBlock}>
                          <Text style={styles.infoLabel}>
                            Nome do Funcionário
                          </Text>
                          <Text style={styles.infoValue}>
                            {truncate(mergedMeta.nome, 30)}
                          </Text>
                        </View>
                      )}

                    {!!mergedMeta.funcaoNome && (
                      <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Função</Text>
                        <Text style={styles.infoValue}>
                          {mergedMeta.funcaoNome}
                        </Text>
                      </View>
                    )}

                    {!!mergedMeta.admissao && (
                      <View style={styles.infoBlock}>
                        <Text style={styles.infoLabel}>Admissão</Text>
                        <Text style={styles.infoValue}>
                          {mergedMeta.admissao}
                        </Text>
                      </View>
                    )}

                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Competência</Text>
                      <Text style={styles.infoValue}>
                        {normalizeCompetenciaLabel(mergedMeta.competencia)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <ScrollView
                    horizontal
                    style={styles.tableScroll}
                    contentContainerStyle={styles.tableScrollContent}
                    showsHorizontalScrollIndicator
                  >
                    <View
                      style={[styles.table, styles.tableMinWidthBeneficios]}
                    >
                      <View style={styles.tableHeader}>
                        <Text
                          style={[styles.tableHeaderCell, styles.colCodigo]}
                        >
                          Código
                        </Text>
                        <Text
                          style={[
                            styles.tableHeaderCell,
                            styles.colDescricaoWide,
                          ]}
                        >
                          Descrição
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colTipo]}>
                          Tipo
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colValor]}>
                          Unitário
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colMini]}>
                          Dia
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colMini]}>
                          Mês
                        </Text>
                        <Text style={[styles.tableHeaderCell, styles.colValor]}>
                          Total
                        </Text>
                      </View>

                      {beneficiosUi.length === 0 ? (
                        <View style={styles.tableRow}>
                          <Text style={styles.emptyText}>Sem lançamentos.</Text>
                        </View>
                      ) : (
                        beneficiosUi.map((item, index) => (
                          <View
                            key={`${item.codigo}-${index}`}
                            style={[
                              styles.tableRow,
                              index % 2 === 1 ? styles.tableRowAlt : null,
                            ]}
                          >
                            <Text style={[styles.tableCell, styles.colCodigo]}>
                              {String(item.codigo || "-")}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                styles.colDescricaoWide,
                              ]}
                            >
                              {truncate(item.descricao, 22)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTipo]}>
                              {truncate(item.tipo_beneficio, 16)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colValor]}>
                              {fmtNum(item.unitario)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colMini]}>
                              {item.dia ? String(item.dia) : ""}
                            </Text>
                            <Text style={[styles.tableCell, styles.colMini]}>
                              {item.mes ? String(item.mes) : ""}
                            </Text>
                            <Text style={[styles.tableCell, styles.colValor]}>
                              {fmtNum(item.total)}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>

                  <View style={styles.separator} />

                  <View style={styles.totalBox}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Geral:</Text>
                      <Text style={styles.totalValue}>
                        {fmtNum(totalBeneficios)}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {tipo === "informe_rendimentos" && (
                <>
                  <View style={styles.headSection}>
                    <View style={styles.headLeft}>
                      <PreviewSectionTitle title="Informe de Rendimentos" />

                      <Text style={styles.headText}>
                        <Text style={styles.headTextBold}>Cliente: </Text>
                        {informePrimeiro?.codigo_cliente ??
                          mergedMeta.cliente ??
                          "-"}{" "}
                        {informePrimeiro?.nome_cliente ??
                          mergedMeta.clienteNome ??
                          "-"}
                      </Text>

                      <Text style={styles.headText}>
                        <Text style={styles.headTextBold}>Nome: </Text>
                        {informePrimeiro?.nome ?? mergedMeta.nome ?? "-"}
                      </Text>
                    </View>

                    <View style={styles.headRight}>
                      {!!(
                        informePrimeiro?.cpf_cnpj_cliente ||
                        mergedMeta.clienteCnpj
                      ) && (
                        <Text style={styles.headMeta}>
                          <Text style={styles.headTextBold}>
                            Nº Inscrição:{" "}
                          </Text>
                          {String(
                            informePrimeiro?.cpf_cnpj_cliente ||
                              mergedMeta.clienteCnpj,
                          )}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.infoGrid4}>
                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Código Empresa</Text>
                      <Text style={styles.infoValue}>
                        {String(
                          informePrimeiro?.codigo_empresa ??
                            mergedMeta.empresa ??
                            "-",
                        )}
                      </Text>
                    </View>

                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>CPF</Text>
                      <Text style={styles.infoValue}>
                        {String((informePrimeiro?.cpf ?? cpfDigits) || "-")}
                      </Text>
                    </View>

                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Matrícula</Text>
                      <Text style={styles.infoValue}>
                        {String(
                          (informePrimeiro?.matricula ??
                            mergedMeta.matricula) ||
                            "-",
                        )}
                      </Text>
                    </View>

                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Competência</Text>
                      <Text style={styles.infoValue}>
                        {String(
                          (informePrimeiro?.competencia ??
                            mergedMeta.competencia) ||
                            "-",
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.informeGrid}>
                    {[
                      [
                        "Rendimento férias",
                        informePrimeiro?.rendimento_ferias_01,
                      ],
                      ["INSS", informePrimeiro?.inss_02],
                      ["Previdência privada", informePrimeiro?.prevprivada_03],
                      ["Pensão", informePrimeiro?.pensao_04],
                      [
                        "IRRF / IRRF férias",
                        informePrimeiro?.irrf_irrfferias_05,
                      ],
                      ["Ajuda de custo", informePrimeiro?.ajucusto_02],
                      ["Aviso prévio", informePrimeiro?.avisoprevio_06],
                      ["Férias abono", informePrimeiro?.feriasabono_07],
                      [
                        "Rendimento IRRF / INSS / dependente",
                        informePrimeiro?.rendimento_irrf_inss_dependente_01,
                      ],
                      ["IRRF", informePrimeiro?.irrf_02],
                      ["PLR / Lucro", informePrimeiro?.plucro_03],
                      ["Abono pecuniário", informePrimeiro?.abono_pecuniario],
                      [
                        "Rendimentos isentos",
                        informePrimeiro?.rendimentos_isentos,
                      ],
                    ].map(([label, value], index) => (
                      <View
                        key={`${label}-${index}`}
                        style={[
                          styles.informeRow,
                          index % 2 === 1 ? styles.informeRowAlt : null,
                        ]}
                      >
                        <Text style={styles.informeLabel}>{label}</Text>
                        <Text style={styles.informeValue}>
                          {fmtNum(value as any)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </PreviewDocumentCard>

            <PreviewActionsFooter
              aceito={aceito === true}
              isBusy={isBusy}
              hasPdf={!!effectivePdf}
              tipo={tipo}
              onPrimaryPress={() =>
                void (aceito ? onShare() : onAcceptAndShare())
              }
            />

            {(isBusy || isCheckingStatus) && (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#25601d" />
                <Text style={styles.loadingText}>
                  {isCheckingStatus
                    ? "Verificando status do documento..."
                    : "Processando documento..."}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ListarSideMenu
        visible={menuOpen}
        fullName={fullName}
        documentValue={userDocument}
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