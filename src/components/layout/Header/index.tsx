import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

export type BrandType = "ast" | "wecan" | "default";

function BrandLogo({ brandType }: { brandType: BrandType }) {
  if (brandType === "ast") {
    return (
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>AST</Text>
      </View>
    );
  }

  if (brandType === "wecan") {
    return (
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>WE CAN</Text>
      </View>
    );
  }

  return (
    <View style={styles.logoBox}>
      <Text style={styles.logoText}>RH</Text>
    </View>
  );
}

export function Header({
  brandType,
  onMenuPress,
}: {
  brandType: BrandType;
  onMenuPress: () => void;
}) {
  return (
    <View style={styles.container}>
      <BrandLogo brandType={brandType} />

      <Pressable onPress={onMenuPress} style={styles.menuButton}>
        <Ionicons name="menu-outline" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}