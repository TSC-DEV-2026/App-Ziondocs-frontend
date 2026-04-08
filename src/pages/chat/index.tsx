
import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  getMessages,
  listOpenSessions,
  sendMessage,
  setPresenceOffline,
  setPresenceOnline,
  type Message,
} from "@/lib/livechatApi";
import { friendlyErrorMessage } from "@/lib/api";
import { EmptyState, LoadingBlock, Screen } from "@/components/ui";
import { HeaderCard } from "@/components/HeaderCard";
import { ChatConversation } from "./ui";

export default function ChatPage() {
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
        <EmptyState
          title="Nenhuma conversa ativa"
          description="Seu backend não retornou uma sessão aberta de livechat para este usuário."
        />
      ) : null}

      {!loading && channelId ? (
        <ChatConversation
          channelId={channelId}
          messages={ordered}
          text={text}
          onChangeText={setText}
          onSend={() => void onSend()}
          sending={sending}
        />
      ) : null}
    </Screen>
  );
}
