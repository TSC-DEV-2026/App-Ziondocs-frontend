import { api } from "@/lib/api";
import type {
  CompetenciaItem,
  DocumentoTipo,
  PdfResponse,
  SearchDocumentItem,
} from "@/types/documents";
import { normalizeYYYYMM } from "@/lib/validators";

export type AcceptDocumentPayload = {
  aceito: boolean;
  tipo_doc: string;
  base64: string;
  matricula: string;
  cpf: string;
  unidade: string;
  competencia: string;
  uuid?: string;
  id_ged?: string;
};

export type ConsultDocumentStatusPayload = {
  uuid?: string;
  id_ged?: string;
};

export type ConsultDocumentStatusResponse = {
  id?: number;
  aceito?: boolean;
};

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cleanString(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function getCabecalho(obj: any): any {
  if (!obj) return undefined;
  if (obj.cabecalho) return obj.cabecalho;
  if (obj["cabeçalho"]) return obj["cabeçalho"];
  return undefined;
}

function getBestItemValue(
  item: Record<string, unknown> | undefined,
  keys: string[],
): string {
  if (!item) return "";

  for (const key of keys) {
    const direct = cleanString((item as any)?.[key]);
    if (direct) return direct;
  }

  const cab = getCabecalho(item);
  if (cab) {
    for (const key of keys) {
      const fromCab = cleanString(cab?.[key]);
      if (fromCab) return fromCab;
    }
  }

  return "";
}

export async function listDocumentTypes() {
  const { data } = await api.get<DocumentoTipo[]>("/documents");
  return safeArray<DocumentoTipo>(data);
}

export async function fetchCompetencias(
  kind: string,
  payload: Record<string, string>,
) {
  switch (kind) {
    case "holerite": {
      const { data } = await api.post<CompetenciaItem[]>(
        "/documents/holerite/competencias",
        payload,
      );
      return safeArray<CompetenciaItem>(data);
    }

    case "beneficios": {
      const { data } = await api.post<CompetenciaItem[]>(
        "/documents/beneficios/competencias",
        payload,
      );
      return safeArray<CompetenciaItem>(data);
    }

    case "ferias": {
      const { data } = await api.post<CompetenciaItem[]>(
        "/documents/ferias/competencias",
        payload,
      );
      return safeArray<CompetenciaItem>(data);
    }

    case "informe_rendimentos": {
      const { data } = await api.post<{ ano: number }[]>(
        "/documents/informe-rendimentos/competencias",
        payload,
      );

      return safeArray<{ ano: number }>(data).map((item) => ({
        ano: item.ano,
        mes: "01",
      }));
    }

    default:
      return [];
  }
}

export async function searchDocuments(params: {
  kind: string;
  idTipo?: string;
  cpf: string;
  matricula?: string;
  empresa?: string;
  competencia?: string;
  documentoNome?: string;
}) {
  const competencia = normalizeYYYYMM(params.competencia ?? "");

  const cpf = cleanString(params.cpf);
  const matricula = cleanString(params.matricula);
  const empresa = cleanString(params.empresa);
  const documentoNome = cleanString(params.documentoNome);

  if (params.kind === "holerite") {
    const { data } = await api.post("/documents/holerite/buscar", {
      cpf,
      matricula,
      empresa,
      competencia,
    });
    return data;
  }

  if (params.kind === "beneficios") {
    const { data } = await api.post("/documents/beneficios/buscar", {
      cpf,
      matricula,
      empresa,
      competencia,
    });
    return data;
  }

  if (params.kind === "ferias") {
    const { data } = await api.post("/documents/ferias/buscar", {
      cpf,
      matricula,
      cliente: empresa,
      competencia,
    });
    return data;
  }

  if (params.kind === "informe_rendimentos") {
    const body: Record<string, string> = {
      cpf,
      competencia: competencia.slice(0, 4),
    };

    if (empresa) {
      body.empresa = empresa;
    }

    const { data } = await api.post("/documents/informe-rendimentos/buscar", body);
    return data;
  }

  if (params.kind === "recibos") {
    const cp = [
      { nome: "tipodedoc", valor: documentoNome },
      { nome: "matricula", valor: matricula },
      { nome: "colaborador", valor: cpf },
      { nome: "cliente", valor: empresa },
    ];

    const payload = {
      id_template: Number(params.idTipo || 3),
      cp,
      campo_anomes: "anomes",
      anomes: competencia
        ? `${competencia.slice(0, 4)}-${competencia.slice(4, 6)}`
        : "",
    };

    const { data } = await api.post("/documents/search/recibos", payload);
    return data;
  }

  if (params.kind === "trct") {
    const payload = {
      id_template: Number(params.idTipo || 3),
      cp: [
        { nome: "tipodedoc", valor: documentoNome },
        { nome: "cpf", valor: cpf },
      ],
      campo_anomes: "ano",
      anomes: competencia.slice(0, 4),
    };

    const { data } = await api.post(
      "/documents/search/informetrct",
      payload,
    );
    return data;
  }

  const { data } = await api.post("/documents/search", {
    id_tipo: cleanString(params.idTipo),
    cpf,
    matricula,
    empresa,
    competencia,
  });

  return safeArray<SearchDocumentItem>(data);
}

export async function mountPdf(params: {
  kind: string;
  item?: Record<string, unknown>;
  cpf: string;
  matricula?: string;
  empresa?: string;
  competencia?: string;
}) {
  const competencia = normalizeYYYYMM(params.competencia ?? "");

  const itemMatricula = getBestItemValue(params.item, ["matricula"]);
  const itemEmpresa = getBestItemValue(params.item, ["empresa", "cliente"]);
  const itemFilial = getBestItemValue(params.item, ["filial"]);
  const itemLote = getBestItemValue(params.item, ["lote", "id_documento"]);
  const itemCpf = getBestItemValue(params.item, ["cpf"]);
  const itemIdGed = getBestItemValue(params.item, [
    "id_ged",
    "id_documento",
    "id",
  ]);
  const itemTemplateId = getBestItemValue(params.item, ["templateId", "id_tipo"]);
  const itemUuid = getBestItemValue(params.item, ["uuid"]);
  const itemTipoCalculo = getBestItemValue(params.item, ["tipo_calculo"]);

  const cpf = cleanString(params.cpf || itemCpf);
  const matricula = cleanString(params.matricula || itemMatricula);
  const empresa = cleanString(params.empresa || itemEmpresa);

  if (params.kind === "holerite") {
    const body: Record<string, string> = {
      cpf,
      matricula,
      competencia,
    };

    if (empresa) body.empresa = empresa;
    if (itemFilial) body.filial = itemFilial;
    if (itemLote) body.lote = itemLote;
    if (itemUuid) body.uuid = itemUuid;
    if (itemTipoCalculo) body.tipo_calculo = itemTipoCalculo;

    const { data } = await api.post<PdfResponse>(
      "/documents/holerite/montar",
      body,
    );
    return data;
  }

  if (params.kind === "beneficios") {
    let uuid = itemUuid;
    let cabecalhoLocal = getCabecalho(params.item);
    let beneficiosLocais = Array.isArray((params.item as any)?.beneficios)
      ? (params.item as any).beneficios
      : [];

    if (!uuid) {
      const buscarPayload: Record<string, string> = {
        cpf,
        matricula,
        competencia,
      };

      if (empresa) {
        buscarPayload.empresa = empresa;
      }

      const { data: buscarData } = await api.post<any>(
        "/documents/beneficios/buscar",
        buscarPayload,
      );

      const cab = getCabecalho(buscarData);
      cabecalhoLocal = cab ?? cabecalhoLocal;
      beneficiosLocais = Array.isArray(buscarData?.beneficios)
        ? buscarData.beneficios
        : beneficiosLocais;

      uuid = cleanString(cab?.uuid || buscarData?.uuid);
    }

    if (!uuid) {
      throw new Error("Não foi possível obter uuid para montar benefícios.");
    }

    const { data } = await api.post<PdfResponse & { cabecalho?: any }>(
      "/documents/beneficios/montar",
      {
        cpf,
        matricula,
        competencia,
        uuid,
      },
    );

    return {
      ...data,
      cabecalho: data?.cabecalho ?? cabecalhoLocal,
      beneficios: beneficiosLocais,
      uuid,
    } as any;
  }

  if (params.kind === "ferias") {
    const body: Record<string, string> = {
      cpf,
      matricula,
      competencia,
    };

    if (empresa) body.cliente = empresa;

    const { data } = await api.post<PdfResponse>(
      "/documents/ferias/montar",
      body,
    );
    return data;
  }

  if (params.kind === "informe_rendimentos") {
    const body: Record<string, string> = {
      cpf,
      competencia: competencia.slice(0, 4),
    };

    if (empresa) {
      body.empresa = empresa;
    }

    const { data } = await api.post<PdfResponse>(
      "/documents/informe-rendimentos/montar",
      body,
    );
    return data;
  }

  const body = {
    id_tipo: Number(itemTemplateId || 3),
    id_documento: Number(itemIdGed || itemLote || 0),
  };

  const { data } = await api.post<{
    erro?: boolean;
    base64?: string;
    base64_raw?: string;
  }>("/searchdocuments/download", body);

  return {
    pdf_base64: data?.base64_raw || data?.base64 || "",
  };
}

export async function acceptDocument(payload: AcceptDocumentPayload) {
  const body: AcceptDocumentPayload = {
    aceito: payload.aceito,
    tipo_doc: cleanString(payload.tipo_doc),
    base64: cleanString(payload.base64).replace(
      /^data:application\/pdf;base64,/,
      "",
    ),
    matricula: cleanString(payload.matricula),
    cpf: cleanString(payload.cpf),
    unidade: cleanString(payload.unidade),
    competencia: normalizeYYYYMM(payload.competencia),
    uuid: payload.uuid ? cleanString(payload.uuid) : undefined,
    id_ged: payload.id_ged ? cleanString(payload.id_ged) : undefined,
  };

  const { data } = await api.post("/status-doc", body);
  return data;
}

export async function consultDocumentStatus(
  payload: ConsultDocumentStatusPayload,
): Promise<ConsultDocumentStatusResponse> {
  const body: ConsultDocumentStatusPayload = {
    uuid: payload.uuid ? cleanString(payload.uuid) : undefined,
    id_ged: payload.id_ged ? cleanString(payload.id_ged) : undefined,
  };

  const { data } = await api.post<ConsultDocumentStatusResponse>(
    "/status-doc/consultar",
    body,
  );

  return data ?? {};
}