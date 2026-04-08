import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Card, colors } from "@/components/ui";

export function HeaderCard({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <View style={styles.row}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 12
  },
  texts: {
    flex: 1,
    gap: 2
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13
  }
});