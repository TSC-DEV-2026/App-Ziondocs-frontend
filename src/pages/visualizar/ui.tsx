import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

export type PreviewKind =
  | "holerite"
  | "beneficios"
  | "generico"
  | "informe_rendimentos"
  | "ferias";

function cleanBase64Pdf(base64?: string) {
  return String(base64 || "").replace(/^data:application\/pdf;base64,/, "");
}

function buildPdfHtml(base64: string, mode: "inline" | "fullscreen" = "inline") {
  const safeBase64 = JSON.stringify(base64);
  const isFullscreen = mode === "fullscreen";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
  />
  <title>PDF Viewer</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: ${isFullscreen ? "#111111" : "#f5faf6"};
      font-family: Arial, sans-serif;
      width: 100%;
      min-height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    #app {
      padding: ${isFullscreen ? "10px" : "12px"};
      box-sizing: border-box;
    }

    #status {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
      color: ${isFullscreen ? "#ffffff" : "#25601d"};
      font-size: 14px;
      font-weight: 600;
      text-align: center;
    }

    #hint {
      text-align: center;
      font-size: 12px;
      color: ${isFullscreen ? "#cfcfcf" : "#40634d"};
      margin-bottom: 10px;
    }

    .page-wrap {
      margin-bottom: 14px;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      cursor: pointer;
      border: 1px solid ${isFullscreen ? "rgba(255,255,255,0.08)" : "#dceadf"};
    }

    canvas {
      display: block;
      width: 100%;
      height: auto;
      background: #ffffff;
      image-rendering: auto;
    }

    .page-label {
      padding: 8px 10px;
      font-size: 12px;
      color: #40634d;
      background: #eef8f1;
      border-bottom: 1px solid #dfe9df;
      font-weight: 600;
    }

    .error {
      color: #b42318;
      white-space: pre-wrap;
      line-height: 1.4;
      padding: 16px;
      text-align: center;
      background: #ffffff;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <div id="app">
    ${
      isFullscreen
        ? '<div id="hint">Toque e use zoom do sistema para ampliar.</div>'
        : ""
    }
    <div id="status">Carregando PDF...</div>
    <div id="pages"></div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    const base64 = ${safeBase64};
    const statusEl = document.getElementById("status");
    const pagesEl = document.getElementById("pages");

    function sendMessage(payload) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      } catch (_) {}
    }

    function base64ToUint8Array(base64Text) {
      const binaryString = atob(base64Text);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes;
    }

    async function renderPdf() {
      try {
        if (!window["pdfjsLib"]) {
          throw new Error("pdf.js não foi carregado.");
        }

        const pdfjsLib = window["pdfjsLib"];
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const pdfData = base64ToUint8Array(base64);
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        statusEl.style.display = "none";

        const containerWidth = Math.max(window.innerWidth - ${isFullscreen ? 20 : 24}, 280);
        const pixelRatio = Math.max(window.devicePixelRatio || 1, ${isFullscreen ? 2 : 1.5});

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const initialViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / initialViewport.width;
          const viewport = page.getViewport({ scale });

          const wrapper = document.createElement("div");
          wrapper.className = "page-wrap";
          wrapper.addEventListener("click", function () {
            sendMessage({ type: "open-fullscreen", page: pageNum });
          });

          const label = document.createElement("div");
          label.className = "page-label";
          label.textContent = "Página " + pageNum;

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          canvas.style.width = viewport.width + "px";
          canvas.style.height = viewport.height + "px";

          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

          wrapper.appendChild(label);
          wrapper.appendChild(canvas);
          pagesEl.appendChild(wrapper);

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
        }
      } catch (error) {
        statusEl.style.display = "none";
        pagesEl.innerHTML =
          '<div class="error">Não foi possível renderizar o PDF.\\n\\n' +
          (error && error.message ? error.message : String(error)) +
          "</div>";
      }
    }

    renderPdf();
  </script>
</body>
</html>
  `;
}

export function PreviewTopBar({
  aceito,
  isCheckingStatus,
  onBack,
}: {
  aceito: boolean;
  isCheckingStatus: boolean;
  onBack: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={18} color="#ffffff" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </Pressable>

      <View style={styles.topBarRight}>
        {isCheckingStatus ? (
          <View style={styles.statusPill}>
            <ActivityIndicator size="small" color="#25601d" />
            <Text style={styles.statusPending}>Verificando...</Text>
          </View>
        ) : aceito ? (
          <View style={styles.acceptedPill}>
            <Ionicons name="checkmark-circle" size={18} color="#2fa146" />
            <Text style={styles.acceptedPillText}>Aceito</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function PreviewDocumentCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.documentCard}>{children}</View>;
}

export function PreviewSectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.documentTitle}>{title}</Text>
      <View style={styles.titleBar} />
    </View>
  );
}

export function PreviewPdfBox({
  title = "PDF do documento",
  hasPdf,
  base64,
  loading = false,
}: {
  title?: string;
  hasPdf: boolean;
  base64?: string;
  loading?: boolean;
}) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const cleanBase64 = cleanBase64Pdf(base64);
  const shouldRenderViewer = hasPdf && !!cleanBase64;

  const inlineHtml = useMemo(() => {
    if (!shouldRenderViewer) return "";
    return buildPdfHtml(cleanBase64, "inline");
  }, [shouldRenderViewer, cleanBase64]);

  const fullscreenHtml = useMemo(() => {
    if (!shouldRenderViewer) return "";
    return buildPdfHtml(cleanBase64, "fullscreen");
  }, [shouldRenderViewer, cleanBase64]);

  function handleWebViewMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data || "{}");
      if (data?.type === "open-fullscreen") {
        setIsFullscreenOpen(true);
      }
    } catch {
      setIsFullscreenOpen(true);
    }
  }

  return (
    <>
      <View style={styles.pdfCard}>
        <View style={styles.pdfCardHeader}>
          <Ionicons name="document-text-outline" size={20} color="#25601d" />
          <Text style={styles.pdfCardTitle}>{title}</Text>
        </View>

        {loading ? (
          <View style={styles.pdfViewerPlaceholder}>
            <ActivityIndicator size="large" color="#25601d" />
            <Text style={styles.pdfViewerPlaceholderTitle}>
              Preparando PDF...
            </Text>
            <Text style={styles.pdfViewerPlaceholderText}>
              Aguarde enquanto o documento é carregado.
            </Text>
          </View>
        ) : !shouldRenderViewer ? (
          <View style={styles.pdfViewerPlaceholder}>
            <Ionicons
              name={hasPdf ? "document-attach-outline" : "alert-circle-outline"}
              size={34}
              color={hasPdf ? "#25601d" : "#7a8f82"}
            />
            <Text style={styles.pdfViewerPlaceholderTitle}>
              {hasPdf ? "PDF pronto para abrir ou compartilhar" : "PDF indisponível"}
            </Text>
            <Text style={styles.pdfViewerPlaceholderText}>
              {hasPdf
                ? "O PDF existe, mas não foi possível preparar a visualização agora."
                : "Não foi possível localizar o conteúdo do PDF para este documento."}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.pdfRealViewerWrap}>
              <WebView
                originWhitelist={["*"]}
                source={{ html: inlineHtml }}
                style={styles.pdfRealViewer}
                javaScriptEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                allowsInlineMediaPlayback
                nestedScrollEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.pdfLoadingBox}>
                    <ActivityIndicator size="large" color="#25601d" />
                    <Text style={styles.pdfLoadingText}>Carregando PDF...</Text>
                  </View>
                )}
                onMessage={handleWebViewMessage}
              />
            </View>

            <Pressable
              onPress={() => setIsFullscreenOpen(true)}
              style={styles.pdfFullscreenButton}
            >
              <Ionicons name="expand-outline" size={18} color="#ffffff" />
              <Text style={styles.pdfFullscreenButtonText}>Abrir em tela cheia</Text>
            </Pressable>
          </>
        )}
      </View>

      <Modal
        visible={isFullscreenOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFullscreenOpen(false)}
      >
        <View style={styles.fullscreenContainer}>
          <View style={styles.fullscreenHeader}>
            <Text style={styles.fullscreenTitle}>{title}</Text>

            <Pressable
              onPress={() => setIsFullscreenOpen(false)}
              style={styles.fullscreenCloseButton}
            >
              <Ionicons name="close" size={22} color="#ffffff" />
              <Text style={styles.fullscreenCloseButtonText}>Fechar</Text>
            </Pressable>
          </View>

          <View style={styles.fullscreenViewerWrap}>
            <WebView
              originWhitelist={["*"]}
              source={{ html: fullscreenHtml }}
              style={styles.fullscreenViewer}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              allowsInlineMediaPlayback
              nestedScrollEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.fullscreenLoadingBox}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.fullscreenLoadingText}>
                    Carregando PDF...
                  </Text>
                </View>
              )}
              onMessage={() => {}}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export function PreviewActionsFooter({
  aceito,
  isBusy,
  hasPdf,
  tipo,
  onPrimaryPress,
}: {
  aceito: boolean;
  isBusy: boolean;
  hasPdf: boolean;
  tipo: PreviewKind;
  onPrimaryPress: () => void;
}) {
  function getButtonLabel() {
    if (isBusy) return "Processando...";

    if (tipo === "holerite") {
      return aceito ? "Baixar holerite" : "Aceitar e baixar holerite";
    }

    if (tipo === "beneficios") {
      return aceito ? "Baixar demonstrativo" : "Aceitar e baixar benefícios";
    }

    if (tipo === "ferias") {
      return aceito ? "Baixar férias" : "Aceitar e baixar férias";
    }

    if (tipo === "informe_rendimentos") {
      return "Baixar informe";
    }

    return aceito ? "Baixar documento" : "Aceitar e baixar documento";
  }

  return (
    <View style={styles.footerActions}>
      <Pressable
        onPress={onPrimaryPress}
        disabled={!hasPdf || isBusy}
        style={[
          styles.primaryActionButton,
          !hasPdf || isBusy ? styles.primaryActionButtonDisabled : null,
        ]}
      >
        <Ionicons name="download-outline" size={18} color="#ffffff" />
        <Text style={styles.primaryActionButtonText}>{getButtonLabel()}</Text>
      </Pressable>
    </View>
  );
}