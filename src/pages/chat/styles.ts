
import { StyleSheet } from "react-native";
import { colors } from "@/components/ui";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  msg: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6,
  },
  msgDate: {
    color: colors.muted,
    fontSize: 12,
  },
  msgBody: {
    color: colors.text,
    lineHeight: 20,
  },
  sendWrap: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    minHeight: 54,
    maxHeight: 120,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
