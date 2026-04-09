import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    padding: 16,
    minHeight: "100%" as any,
  },
  errorText: {
    color: "#b42318",
  },
  warningText: {
    color: "#b42318",
    textAlign: "center",
  },
  forgotLink: {
    color: "#25601d",
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 4,
    paddingBottom: 10,
  },
  forgotLinkPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.98 }],
  },
  forgotLinkDisabled: {
    opacity: 0.7,
  },
  buttonWrap: {
    gap: 10,
  },
});