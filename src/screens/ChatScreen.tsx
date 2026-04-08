import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { listOpenSessions, getMessages, sendMessage, setPresenceOffline, setPresenceOnline, type Message } from "@/lib/livechatApi";
import { friendlyErrorMessage } from "@/lib/api";
import { Button, Card, EmptyState, LoadingBlock, Screen, Subtitle, Title, colors } from "@/components/ui";
import { HeaderCard } from "@/components/HeaderCard";

export function ChatScreen() {
  const [channelId, setChannelId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessions = await listOpenSessions(20);
      if (sessions[0]) {
        setChannelId(sessions[0].channel_id);
        const msgs = await getMessages(sessions[0].channel_id, 100);
        setMessages(msgs);
      } else {
        setChannelId(null);
        setMessages([]);
      }
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao carregar o chat."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void setPresenceOnline();
    void loadSession();

    const interval = setInterval(() => {
      void loadSession();
    }, 12000);

    return () => {
      clearInterval(interval);
      void setPresenceOffline();
    };
  }, []);

  const ordered = useMemo(() => [...messages].sort((a, b) => a.id - b.id), [messages]);

  const onSend = async () => {
    if (!channelId) {
      Alert.alert("Aviso", "Nenhum canal aberto foi encontrado para esta conta.");
      return;
    }

    if (!text.trim()) return;

    try {
      setSending(true);
      await sendMessage(channelId, text.trim());
      setText("");
      const msgs = await getMessages(channelId, 100);
      setMessages(msgs);
    } catch (error) {
      Alert.alert("Erro", friendlyErrorMessage(error, "Falha ao enviar mensagem."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen scroll={false}>
      <HeaderCard title="Chat RH" subtitle="Canal nativo usando as rotas /livechat" />

      {loading ? <LoadingBlock text="Carregando conversa..." /> : null}

      {!loading && !channelId ? (
        <EmptyState title="Nenhuma conversa ativa" description="Seu backend não retornou uma sessão aberta de livechat para este usuário." />
      ) : null}

      {!loading && channelId ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Card>
            <Title>Canal #{channelId}</Title>
            <Subtitle>As mensagens são atualizadas por polling.</Subtitle>
          </Card>

          <FlatList
            data={ordered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <View style={styles.msg}>
                <Text style={styles.msgDate}>{item.date || "Sem data"}</Text>
                <Text style={styles.msgBody}>{(item.body || "").replace(/<[^>]+>/g, "").trim() || "[mensagem vazia]"}</Text>
              </View>
            )}
            style={{ flex: 1 }}
          />

          <View style={styles.sendWrap}>
            <TextInput
              value={text}
              onChangeText={setText}
              style={styles.input}
              placeholder="Digite sua mensagem"
              placeholderTextColor="#7b8b82"
              multiline
            />
            <Button title="Enviar" onPress={onSend} loading={sending} />
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  msg: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 6
  },
  msgDate: {
    color: colors.muted,
    fontSize: 12
  },
  msgBody: {
    color: colors.text,
    lineHeight: 20
  },
  sendWrap: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg
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
    paddingVertical: 12
  }
});