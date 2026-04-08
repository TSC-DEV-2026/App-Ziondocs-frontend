import { z } from "zod";
import { api } from "@/lib/api";

export const MessageSchema = z.object({
  id: z.number(),
  date: z.string().nullable().optional(),
  author_id: z.array(z.union([z.number(), z.string()])).nullable().optional(),
  body: z.string().nullable().optional(),
  attachments: z.array(z.any()).optional().default([])
});
export type Message = z.infer<typeof MessageSchema>;

export const OpenSessionSchema = z.object({
  channel_id: z.number(),
  channel_name: z.string(),
  last_message_date: z.string().nullable().optional()
});
export type OpenSession = z.infer<typeof OpenSessionSchema>;

export async function listOpenSessions(limit = 50): Promise<OpenSession[]> {
  const { data } = await api.get("/livechat/open-sessions", { params: { limit } });
  const parsed = z.array(OpenSessionSchema).safeParse(data);
  if (!parsed.success) throw new Error("Resposta inválida de /livechat/open-sessions");
  return parsed.data;
}

export async function getMessages(channel_id: number, limit = 100): Promise<Message[]> {
  const { data } = await api.get("/livechat/messages", { params: { channel_id, limit } });
  const parsed = z.array(MessageSchema).safeParse(data);
  if (!parsed.success) throw new Error("Resposta inválida de /livechat/messages");
  return parsed.data;
}

export async function sendMessage(channel_id: number, body: string): Promise<number> {
  const { data } = await api.post("/livechat/send", { channel_id, body });
  if (typeof data !== "number") throw new Error("Resposta inválida de /livechat/send");
  return data;
}

export async function createTicket(channel_id: number, title: string, description: string) {
  const { data } = await api.post("/livechat/ticket", { channel_id, title, description });
  return data;
}

export async function setPresenceOnline() {
  await api.post("/livechat/presence/online");
}

export async function setPresenceOffline() {
  await api.post("/livechat/presence/offline");
}