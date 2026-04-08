import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e7eee8",
  },

  keyboardContainer: {
    flex: 1,
  },

  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#e7eee8",
  },

  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },

  scrollContent: {
    paddingBottom: 28,
  },

  page: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: "transparent",
  },

  nonGestorContentShell: {
    width: "95%",
    alignSelf: "center",
    backgroundColor: "#f4f6f4",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#d6dcd6",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  nonGestorStack: {
    gap: 12,
  },

  filtersCard: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 10,
  },

  staticInfoBox: {
    backgroundColor: "#eef5f0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e3da",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  staticInfoText: {
    color: "#405646",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  backRow: {
    alignItems: "flex-start",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  backButtonText: {
    color: "#1f2a22",
    fontSize: 16,
    fontWeight: "700",
  },

  pageTitle: {
    textAlign: "center",
    color: "#111111",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 10,
    marginBottom: 2,
  },

  fieldWrap: {
    width: "100%",
    gap: 8,
  },

  fieldLabel: {
    color: "#233428",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 2,
  },

  fieldInput: {
    width: "100%",
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c9d5ca",
    backgroundColor: "#f9fbf9",
    paddingHorizontal: 16,
    color: "#213126",
    fontSize: 15,
  },

  fieldInputDisabled: {
    backgroundColor: "#edf2ee",
    color: "#5d6f62",
  },

  selectButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c9d5ca",
    backgroundColor: "#f9fbf9",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectButtonDisabled: {
    opacity: 0.7,
    backgroundColor: "#edf2ee",
  },

  selectButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },

  selectButtonText: {
    color: "#35483a",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },

  selectButtonPlaceholder: {
    color: "#8a978d",
  },

  selectorScrollWrapper: {
    maxHeight: 360,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e3da",
    backgroundColor: "#f8fbf8",
    overflow: "hidden",
  },

  selectorOption: {
    borderWidth: 1,
    borderColor: "#d7e3da",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    gap: 4,
  },

  selectorOptionActive: {
    backgroundColor: "#0d4f24",
    borderColor: "#0d4f24",
  },

  selectorOptionTitle: {
    color: "#274130",
    fontSize: 14,
    fontWeight: "700",
  },

  selectorOptionTitleActive: {
    color: "#ffffff",
  },

  selectorOptionDescription: {
    color: "#607466",
    fontSize: 12,
    fontWeight: "500",
  },

  selectorOptionDescriptionActive: {
    color: "#d9f2df",
  },

  selectorEmptyBox: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  selectorEmptyText: {
    color: "#66796d",
    fontSize: 14,
    fontWeight: "600",
  },

  periodRow: {
    width: "100%",
    gap: 8,
  },

  periodButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c9d5ca",
    backgroundColor: "#f9fbf9",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  periodButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  periodButtonText: {
    color: "#35483a",
    fontSize: 15,
    fontWeight: "600",
  },

  pickerOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  pickerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    maxHeight: "80%",
  },

  pickerTitle: {
    textAlign: "center",
    color: "#0b2b14",
    fontSize: 18,
    fontWeight: "800",
  },

  scrollHintBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: -2,
  },

  scrollHintText: {
    color: "#7c927f",
    fontSize: 12,
    fontWeight: "600",
  },

  pickerColumns: {
    flexDirection: "row",
    gap: 12,
  },

  pickerColumn: {
    flex: 1,
    gap: 8,
  },

  pickerColumnTitle: {
    color: "#45614d",
    fontSize: 13,
    fontWeight: "700",
  },

  pickerScrollWrapper: {
    height: 280,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e3da",
    backgroundColor: "#f8fbf8",
    overflow: "hidden",
  },

  pickerScrollWrapperYear: {
    height: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d7e3da",
    backgroundColor: "#f8fbf8",
    overflow: "hidden",
  },

  pickerScroll: {
    flexGrow: 0,
    height: "100%",
  },

  pickerScrollContent: {
    padding: 8,
    paddingBottom: 8,
  },

  pickerOption: {
    borderWidth: 1,
    borderColor: "#d7e3da",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },

  pickerOptionActive: {
    backgroundColor: "#0d4f24",
    borderColor: "#0d4f24",
  },

  pickerOptionText: {
    color: "#274130",
    fontSize: 14,
    fontWeight: "600",
  },

  pickerOptionTextActive: {
    color: "#ffffff",
  },

  pickerActions: {
    gap: 10,
  },

  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#2f8b1d",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonDisabled: {
    opacity: 0.5,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#eef5f0",
    borderWidth: 1,
    borderColor: "#d7e3da",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#203126",
    fontSize: 15,
    fontWeight: "700",
  },

  searchButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: "#2ec35a",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  searchButtonDisabled: {
    opacity: 0.7,
  },

  searchButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  loadingBox: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: "#13351f",
    fontSize: 14,
    fontWeight: "600",
  },

  discoveryCard: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#f2f4f2",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d5d8d5",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  discoveryCardCompact: {
    width: "100%",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 10,
  },

  discoveryCardTopDivider: {
    borderTopWidth: 1,
    borderTopColor: "#d8d8d8",
    paddingTop: 18,
    marginTop: 6,
  },

  discoveryTitle: {
    textAlign: "center",
    color: "#181818",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },

  discoveryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },

  discoveryGridCompact: {
    justifyContent: "center",
  },

  discoveryPrimaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: "#53a850",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  discoveryPrimaryButtonFull: {
    width: "100%",
  },

  discoveryPrimaryButtonHalf: {
    width: "48%",
  },

  discoveryPrimaryButtonCompact: {
    minWidth: 84,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  discoveryPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  discoveryBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.16)",
    alignSelf: "center",
  },

  discoveryBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },

  discoverySelectedBox: {
    gap: 10,
    alignItems: "center",
    paddingVertical: 2,
  },

  discoverySelectedLabel: {
    color: "#6a6a6a",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 22,
  },

  discoverySelectedLabelStrong: {
    color: "#171717",
    fontWeight: "900",
  },

  discoverySelectedAutoBox: {
    width: "100%",
    minHeight: 54,
    borderRadius: 10,
    backgroundColor: "#8dc69c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  discoverySelectedAutoText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  discoverySecondaryButton: {
    minHeight: 46,
    minWidth: 180,
    borderRadius: 8,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  discoverySecondaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  discoveryAutoInfo: {
    color: "#747474",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },

  discoveryBanner: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    width: "100%",
    alignSelf: "center",
  },

  discoveryBannerText: {
    color: "#707070",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  discoveryLoadingBox: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  discoveryLoadingText: {
    color: "#13351f",
    fontSize: 14,
    fontWeight: "700",
  },

  tableCard: {
    backgroundColor: "#eff4f0",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cfdbd0",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d8e4d9",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  tableHeaderTextLeft: {
    flex: 1.05,
    color: "#4a5f4d",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "left",
  },

  tableHeaderTextCenter: {
    flex: 0.85,
    color: "#4a5f4d",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  tableHeaderTextRight: {
    flex: 1.1,
    color: "#4a5f4d",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  tableBody: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7faf7",
  },

  emptyTableText: {
    color: "#839486",
    fontSize: 14,
    textAlign: "center",
  },

  tableRow: {
    borderTopWidth: 1,
    borderTopColor: "#d9e5dc",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },

  tableRowMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  tableColLeft: {
    flex: 1.05,
    justifyContent: "center",
    paddingRight: 8,
  },

  tableColCenter: {
    flex: 0.85,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  tableColRight: {
    flex: 1.1,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },

  tableColRightWide: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },

  tableCellLeft: {
    color: "#1b2d22",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
  },

  tableCellCenter: {
    color: "#1b2d22",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  visualizarButton: {
    width: "100%",
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#4f972f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  visualizarButtonPressed: {
    opacity: 0.85,
  },

  visualizarButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  menuOverlay: {
    flex: 1,
    flexDirection: "row",
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  menuPanel: {
    width: "78%",
    maxWidth: 320,
    backgroundColor: "#23831f",
    paddingTop: 32,
    paddingHorizontal: 22,
  },

  menuTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  menuTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },

  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  profileCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 24,
  },

  profileName: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 20,
  },

  profileDocument: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
  },

  menuItemPlain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  menuItemPlainText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },

  menuItemBorder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 22,
  },

  menuItemBorderText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  logoutButtonText: {
    color: "#ff2d20",
    fontSize: 16,
    fontWeight: "500",
  },

  yearPickerBlock: {
    width: "100%",
  },
});