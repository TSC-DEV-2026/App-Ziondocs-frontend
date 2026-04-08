import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";

function cleanBase64Pdf(base64?: string): string {
  return String(base64 || "").replace(/^data:application\/pdf;base64,/, "");
}

function sanitizeFileName(fileName?: string): string {
  const safe = String(fileName || "documento.pdf")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_");

  if (!safe.toLowerCase().endsWith(".pdf")) {
    return `${safe}.pdf`;
  }

  return safe;
}

async function ensureDirExists(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export async function writeBase64Pdf(
  base64: string,
  fileName = "documento.pdf",
): Promise<string> {
  const cleanBase64 = cleanBase64Pdf(base64);

  if (!cleanBase64) {
    throw new Error("PDF inválido ou vazio.");
  }

  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) {
    throw new Error("Diretório local indisponível.");
  }

  const safeFileName = sanitizeFileName(fileName);
  const path = `${dir}${safeFileName}`;

  await FileSystem.writeAsStringAsync(path, cleanBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return path;
}

export async function savePdfToAppDocuments(
  base64: string,
  fileName = "documento.pdf",
): Promise<string> {
  const cleanBase64 = cleanBase64Pdf(base64);

  if (!cleanBase64) {
    throw new Error("PDF inválido ou vazio.");
  }

  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error("Diretório de documentos indisponível.");
  }

  const safeFileName = sanitizeFileName(fileName);
  const downloadsDir = `${baseDir}downloads/`;

  await ensureDirExists(downloadsDir);

  const path = `${downloadsDir}${safeFileName}`;

  await FileSystem.writeAsStringAsync(path, cleanBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return path;
}

export async function savePdfToDownloadsAndroid(
  base64: string,
  fileName = "documento.pdf",
): Promise<string> {
  const cleanBase64 = cleanBase64Pdf(base64);

  if (!cleanBase64) {
    throw new Error("PDF inválido ou vazio.");
  }

  if (Platform.OS !== "android") {
    return savePdfToAppDocuments(cleanBase64, fileName);
  }

  const safeFileName = sanitizeFileName(fileName);

  const permissions =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permissions.granted || !permissions.directoryUri) {
    throw new Error(
      "Permissão negada. Selecione a pasta Downloads para salvar o arquivo.",
    );
  }

  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    safeFileName,
    "application/pdf",
  );

  await FileSystem.writeAsStringAsync(fileUri, cleanBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

export async function downloadPdf(
  base64: string,
  fileName = "documento.pdf",
): Promise<string> {
  if (Platform.OS === "web") {
    const path = await writeBase64Pdf(base64, fileName);
    await WebBrowser.openBrowserAsync(path);
    return path;
  }

  if (Platform.OS === "android") {
    return savePdfToDownloadsAndroid(base64, fileName);
  }

  return savePdfToAppDocuments(base64, fileName);
}

export async function shareSavedPdf(path: string): Promise<string> {
  if (!path) {
    throw new Error("Arquivo PDF não encontrado.");
  }

  if (Platform.OS === "web") {
    await WebBrowser.openBrowserAsync(path);
    return path;
  }

  if (!(await Sharing.isAvailableAsync())) {
    return path;
  }

  await Sharing.shareAsync(path, {
    mimeType: "application/pdf",
    dialogTitle: "Compartilhar PDF",
    UTI: "com.adobe.pdf",
  });

  return path;
}

export async function sharePdf(
  base64: string,
  fileName = "documento.pdf",
): Promise<string> {
  const path = await writeBase64Pdf(base64, fileName);
  await shareSavedPdf(path);
  return path;
}

export async function downloadAndSharePdf(
  base64: string,
  fileName = "documento.pdf",
): Promise<string> {
  const downloadedPath = await downloadPdf(base64, fileName);
  await shareSavedPdf(downloadedPath);
  return downloadedPath;
}

export async function downloadPdfWithSuccessAlert(
  base64: string,
  fileName = "documento.pdf",
): Promise<string> {
  const path = await downloadPdf(base64, fileName);

  Alert.alert(
    "Download concluído",
    Platform.OS === "android"
      ? "Documento salvo. Se você escolheu a pasta Downloads, ele já está lá."
      : "Documento salvo no armazenamento do app.",
  );

  return path;
}