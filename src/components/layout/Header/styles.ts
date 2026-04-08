import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: "#00a51e",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoBox: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "#4d5f46",
    fontSize: 13,
    fontWeight: "900",
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});