import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#b8d2bd",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#b8d2bd",
  },

  scrollContent: {
    paddingBottom: 0,
  },

  mainContent: {

    paddingHorizontal: 16,
    paddingTop: 28,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 22,
    marginBottom: 16,
  },

  documentCard: {
    width: "43.5%",
    minHeight: 108,
    backgroundColor: "#004c24",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 14,
  },

  documentCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },

  documentCardTitle: {
    marginTop: 10,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 15,
  },

  loadingBox: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: "#13351f",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyBox: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.35)",
    padding: 18,
  },

  emptyTitle: {
    color: "#173422",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },

  emptyDescription: {
    color: "#36513f",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
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
});