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
    width: 64,
    height: 46,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  logoImage: {
    width: "100%",
    height: "100%",
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