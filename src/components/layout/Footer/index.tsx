import React from "react";
import { Text, View } from "react-native";
import { styles } from "./styles";

export function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SuperRH</Text>

      <Text style={styles.subtitle}>
        Conectando colaboradores ao RH com tecnologia, transparência e agilidade.
      </Text>

      <View style={styles.divider} />

      <Text style={styles.copy}>
        © 2026 SuperRH. Todos os direitos reservados.
      </Text>
    </View>
  );
}