import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#68c187",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 26,
    alignItems: "center",
  },

  title: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },

  subtitle: {
    color: "#153423",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    maxWidth: 260,
    marginBottom: 16,
  },

  divider: {
    width: "78%",
    height: 1,
    backgroundColor: "rgba(53, 111, 77, 0.35)",
    marginBottom: 12,
  },

  copy: {
    color: "#10271a",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
});