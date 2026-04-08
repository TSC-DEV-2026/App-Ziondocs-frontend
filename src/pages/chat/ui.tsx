
import React from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button, Card, Subtitle, Title } from "@/components/ui";
import type { Message } from "@/lib/livechatApi";
import { styles } from "./styles";

export function ChatConversation({
  channelId,
  messages,
  text,
  onChangeText,
  onSend,
  sending,
}: {
  channelId: number;
  messages: Message[];
  text: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Card>
        <Title>Canal #{channelId}</Title>
        <Subtitle>As mensagens são atualizadas por polling.</Subtitle>
      </Card>

      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.msg}>
            <Text style={styles.msgDate}>{item.date || "Sem data"}</Text>
            <Text style={styles.msgBody}>
              {(item.body || "").replace(/<[^>]+>/g, "").trim() || "[mensagem vazia]"}
            </Text>
          </View>
        )}
        style={styles.wrapper}
      />

      <View style={styles.sendWrap}>
        <TextInput
          value={text}
          onChangeText={onChangeText}
          style={styles.input}
          placeholder="Digite sua mensagem"
          placeholderTextColor="#7b8b82"
          multiline
        />
        <Button title="Enviar" onPress={onSend} loading={sending} />
      </View>
    </KeyboardAvoidingView>
  );
}
