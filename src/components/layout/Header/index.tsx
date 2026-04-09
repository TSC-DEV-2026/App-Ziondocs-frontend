import React from "react";
import { Image, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

export type BrandType = "ast" | "wecan" | "default";

function BrandLogo({ brandType }: { brandType: BrandType }) {
  const logoSource =
    brandType === "ast"
      ? require("../../../../assets/ast.jpg")
      : brandType === "wecan"
      ? require("../../../../assets/wecan.jpg")
      : require("../../../../assets/logo.png");

  return (
    <View style={styles.logoBox}>
      <Image
        source={logoSource}
        style={styles.logoImage}
        resizeMode="contain"
      />
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