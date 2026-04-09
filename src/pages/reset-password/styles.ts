import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    padding: 16,
    minHeight: "100%" as any,
  },

  cardBody: {
    gap: 14,
  },

  headerWrap: {
    alignItems: "center",
    marginBottom: 4,
  },

  subtitle: {
    textAlign: "center",
  },

  lockedUserWrap: {
    backgroundColor: "rgba(37, 96, 29, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(37, 96, 29, 0.18)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  lockedUser: {
    color: "#25601d",
    fontWeight: "700",
    textAlign: "center",
  },

  errorWrap: {
    backgroundColor: "#fef3f2",
    borderWidth: 1,
    borderColor: "#fecdca",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  errorText: {
    color: "#b42318",
    textAlign: "center",
    fontWeight: "600",
  },

  successWrap: {
    backgroundColor: "#ecfdf3",
    borderWidth: 1,
    borderColor: "#abefc6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  successText: {
    color: "#067647",
    textAlign: "center",
    fontWeight: "600",
  },

  footerLinkPressable: {
    alignSelf: "center",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  footerLink: {
    color: "#25601d",
    fontWeight: "700",
    textAlign: "center",
  },

  footerLinkPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.98 }],
  },

  footerLinkDisabled: {
    opacity: 0.7,
  },

  footerLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  buttonWrap: {
    gap: 10,
  },
});