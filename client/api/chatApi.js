import axiosInstance from "./axiosInstance";

export const sendMessage = async ({ message, conversationId }) => {
  const { data } = await axiosInstance.post("/api/chat/send-message", { message, conversationId });
  return data; // { conversation, userMessage, modelMessage }
};

export const getConversations = async () => {
  const { data } = await axiosInstance.get("/api/chat/conversations");
  return data.conversations;
};

export const getMessages = async (conversationId) => {
  const { data } = await axiosInstance.get(`/api/chat/conversations/${conversationId}/messages`);
  return data.messages;
};

export const deleteConversation = async (conversationId) => {
  await axiosInstance.delete(`/api/chat/conversations/${conversationId}`);
};
