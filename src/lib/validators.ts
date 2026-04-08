export function onlyDigits(value: string) {
  return (value ?? "").replace(/\D/g, "");
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? "").trim().toLowerCase());
}

export function isValidCPF(raw: string) {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (factor - i);
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function formatCPF(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function normalizeYYYYMM(value: string) {
  if (!value) return value;
  if (/^\d{6}$/.test(value)) return value;
  if (/^\d{4}-\d{2}$/.test(value)) return value.replace("-", "");
  if (/^\d{2}\/\d{4}$/.test(value)) {
    const [mm, yyyy] = value.split("/");
    return `${yyyy}${mm.padStart(2, "0")}`;
  }
  return value.replace(/\D/g, "");
}

export function detectDocumentKind(name: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("holerite") || n.includes("folha") || n.includes("pagamento")) return "holerite" as const;
  if (n.includes("beneficio") || n.includes("benefícios") || n.includes("vale")) return "beneficios" as const;
  if (n.includes("ferias") || n.includes("férias")) return "ferias" as const;
  if (n.includes("informe")) return "informe_rendimentos" as const;
  if (n.includes("trct") || n.includes("trtc")) return "trct" as const;
  if (n.includes("recibo")) return "recibos" as const;
  return "generico" as const;
}