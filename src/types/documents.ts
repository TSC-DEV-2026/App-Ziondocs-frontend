export interface DocumentoTipo {
  id: number;
  nome: string;
  tipodoc?: string;
}

export interface SearchDocumentItem {
  id_documento?: string;
  id_ged?: string;
  uuid?: string;
  anomes?: string;
  nomearquivo?: string;
  situacao?: string;
  matricula?: string;
  descricao?: string;
  tipo_calculo?: string;
  cliente?: string;
  [key: string]: unknown;
}

export interface CompetenciaItem {
  ano: number;
  mes: string;
}

export interface PdfResponse {
  pdf_base64?: string;
  [key: string]: unknown;
}

export type DocumentKind =
  | "holerite"
  | "beneficios"
  | "ferias"
  | "informe_rendimentos"
  | "trct"
  | "recibos"
  | "generico";

export interface DocumentRouteParams {
  id?: string;
  nome?: string;
  kind?: DocumentKind;
}
