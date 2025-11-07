import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ChatbotContextType {
  isChatOpen: boolean;
  isChatMinimized: boolean;
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  restoreChat: () => void;
  sendAutoMessage: (message: string) => void;
  autoMessage: string | null;
  clearAutoMessage: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [autoMessage, setAutoMessage] = useState<string | null>(null);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsChatMinimized(true);
  }, []);

  const restoreChat = useCallback(() => {
    setIsChatMinimized(false);
  }, []);

  const sendAutoMessage = useCallback((message: string) => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
    // Set auto message after a small delay to ensure chat is opening
    setTimeout(() => {
      setAutoMessage(message);
    }, 100);
  }, []);

  const clearAutoMessage = useCallback(() => {
    setAutoMessage(null);
  }, []);

  return (
    <ChatbotContext.Provider
      value={{
        isChatOpen,
        isChatMinimized,
        openChat,
        closeChat,
        minimizeChat,
        restoreChat,
        sendAutoMessage,
        autoMessage,
        clearAutoMessage,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
}

