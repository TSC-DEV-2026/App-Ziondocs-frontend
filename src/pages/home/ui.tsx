import React from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

export function HomeDocumentCard({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.documentCard,
        pressed ? styles.documentCardPressed : null,
      ]}
    >
      <Ionicons name="document-outline" size={42} color="#ffffff" />
      <Text style={styles.documentCardTitle}>{title}</Text>
    </Pressable>
  );
}

type SideMenuProps = {
  visible: boolean;
  fullName: string;
  documentValue: string;
  firstName: string;
  onClose: () => void;
  onGoHome: () => void;
  onLogout: () => void;
};

export function SideMenu({
  visible,
  fullName,
  documentValue,
  onClose,
  onGoHome,
  onLogout,
}: SideMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.menuOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.menuBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.menuPanel}>
          <View style={styles.menuTop}>
            <Text style={styles.menuTitle}>Menu</Text>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <Ionicons name="person-circle-outline" size={42} color="#ffffff" />
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileDocument}>{documentValue}</Text>
          </View>

          <Pressable onPress={onGoHome} style={styles.menuItemPlain}>
            <Ionicons name="home-outline" size={20} color="#ffffff" />
            <Text style={styles.menuItemPlainText}>Início</Text>
          </Pressable>

          <Pressable style={styles.menuItemBorder}>
            <Ionicons name="sunny-outline" size={20} color="#ffffff" />
            <Text style={styles.menuItemBorderText}>Tema</Text>
          </Pressable>

          <Pressable onPress={onLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#ff2d20" />
            <Text style={styles.logoutButtonText}>Sair</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}