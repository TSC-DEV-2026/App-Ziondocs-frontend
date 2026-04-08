import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#d9efe2",
  },

  content: {
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#25601d",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 14,
  },

  backButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  topBarRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 1,
    paddingRight: 14,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  statusPending: {
    color: "#40634d",
    fontSize: 13,
    fontWeight: "600",
  },

  acceptedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  acceptedPillText: {
    color: "#25601d",
    fontSize: 14,
    fontWeight: "700",
  },

  documentCard: {
    backgroundColor: "#ffffffee",
    paddingHorizontal: 18,
    paddingVertical: 22,
  },

  sectionTitleWrap: {
    marginBottom: 6,
  },

  documentTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0b2b14",
  },

  titleBar: {
    width: 104,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#2fa146",
    marginTop: 10,
    marginBottom: 16,
  },

  headSection: {
    gap: 10,
  },

  headLeft: {
    gap: 8,
  },

  headRight: {
    gap: 4,
  },

  headText: {
    fontSize: 15,
    color: "#0b2b14",
    lineHeight: 22,
  },

  headTextBold: {
    fontWeight: "700",
  },

  headMeta: {
    fontSize: 13,
    color: "#0b2b14",
    lineHeight: 18,
  },

  infoGrid5: {
    marginTop: 6,
    gap: 14,
  },

  infoGrid4: {
    marginTop: 6,
    gap: 14,
  },

  infoBlock: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
  },

  infoLabel: {
    fontSize: 13,
    color: "#25601d",
    fontWeight: "700",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    color: "#0b2b14",
    fontWeight: "500",
  },

  separator: {
    height: 1,
    backgroundColor: "#c7e6d2",
    marginVertical: 18,
  },

  tableScroll: {
    width: "100%",
  },

  tableScrollContent: {
    paddingBottom: 2,
  },

  table: {
    backgroundColor: "#ffffff",
  },

  tableMinWidthHolerite: {
    minWidth: 540,
  },

  tableMinWidthBeneficios: {
    minWidth: 600,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#edf5ef",
    paddingVertical: 10,
    paddingHorizontal: 0,
    alignItems: "center",
  },

  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0b2b14",
    textAlign: "center",
    lineHeight: 16,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },

  tableRowAlt: {
    backgroundColor: "#edf5ef",
  },

  tableCell: {
    fontSize: 12,
    color: "#0b2b14",
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 4,
  },

  colCodigo: {
    width: 52,
  },

  colDescricaoWide: {
    width: 180,
  },

  colDescricaoMedium: {
    width: 160,
  },

  colTipo: {
    width: 110,
  },

  colReferencia: {
    width: 84,
  },

  colValor: {
    width: 108,
  },

  colMini: {
    width: 52,
  },

  emptyText: {
    width: "100%",
    textAlign: "center",
    color: "#4b6452",
    fontSize: 13,
    paddingVertical: 12,
  },

  totalBox: {
    gap: 6,
    alignItems: "flex-end",
  },

  totalRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#25601d",
  },

  totalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0b2b14",
  },

  informeGrid: {
    overflow: "hidden",
  },

  informeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },

  informeRowAlt: {
    backgroundColor: "#f4fbf6",
  },

  informeLabel: {
    flex: 1,
    fontSize: 13,
    color: "#0b2b14",
  },

  informeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0b2b14",
  },

  genericBox: {
    backgroundColor: "#f7fcf8",
    padding: 14,
    gap: 10,
  },

  genericText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#40634d",
  },

  pdfCard: {
    marginTop: 14,
    backgroundColor: "#f7fcf8",
    overflow: "hidden",
  },

  pdfCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#eef8f1",
  },

  pdfCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0b2b14",
  },

  pdfViewerPlaceholder: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 10,
    backgroundColor: "#ffffff",
  },

  pdfViewerPlaceholderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0b2b14",
    textAlign: "center",
  },

  pdfViewerPlaceholderText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#40634d",
    textAlign: "center",
  },

  pdfRealViewerWrap: {
    width: "100%",
    height: 560,
    backgroundColor: "#ffffff",
  },

  pdfRealViewer: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
  },

  pdfLoadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff",
  },

  pdfLoadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#25601d",
  },

  pdfFullscreenButton: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 14,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: "#25601d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },

  pdfFullscreenButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#111111",
  },

  fullscreenHeader: {
    minHeight: 64,
    backgroundColor: "#1b1b1b",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  fullscreenTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  fullscreenCloseButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#25601d",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  fullscreenCloseButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  fullscreenViewerWrap: {
    flex: 1,
    backgroundColor: "#111111",
  },

  fullscreenViewer: {
    flex: 1,
    backgroundColor: "#111111",
  },

  fullscreenLoadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#111111",
  },

  fullscreenLoadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },

  footerActions: {
    paddingTop: 0,
    paddingBottom: 8,
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  primaryActionButton: {
    width: "100%",
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25601d",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 10,
  },

  primaryActionButtonDisabled: {
    opacity: 0.6,
  },

  primaryActionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    padding: 12,
  },

  loadingText: {
    fontSize: 13,
    color: "#25601d",
    fontWeight: "600",
  },
});