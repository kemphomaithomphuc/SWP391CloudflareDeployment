import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import ChatWindow from "./ChatWindow";
import { useChat } from "../../hooks/useChat";
import { useChatbot } from "../../contexts/ChatbotContext";

export default function ChatbotWidget() {
  const {
    isChatOpen: contextIsChatOpen,
    isChatMinimized: contextIsChatMinimized,
    openChat,
    closeChat,
    minimizeChat,
    restoreChat,
    autoMessage,
    clearAutoMessage,
  } = useChatbot();
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  
  const {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    messagesEndRef,
    inputRef,
    handleSendMessage,
    sendMessage,
    handleKeyPress,
  } = useChat();

  // Sync with context
  useEffect(() => {
    setIsChatOpen(contextIsChatOpen);
  }, [contextIsChatOpen]);

  useEffect(() => {
    setIsChatMinimized(contextIsChatMinimized);
  }, [contextIsChatMinimized]);

  // Handle auto message
  useEffect(() => {
    if (autoMessage) {
      // Wait for chat to be fully open before sending
      const timer = setTimeout(() => {
        if (isChatOpen && !isChatMinimized) {
          sendMessage(autoMessage);
          clearAutoMessage();
        }
      }, 300); // Small delay to ensure chat window is rendered
      
      return () => clearTimeout(timer);
    }
  }, [autoMessage, isChatOpen, isChatMinimized, sendMessage, clearAutoMessage]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && !isChatMinimized) {
      inputRef.current?.focus();
    }
  }, [isChatOpen, isChatMinimized, inputRef]);

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {!isChatMinimized && isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 w-1/4 h-[600px] min-w-[300px] max-w-[400px]"
            style={{ zIndex: 999999, height: '600px', maxHeight: '600px' }}
          >
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              onClose={closeChat}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button (Minimized) */}
      {(!isChatOpen || isChatMinimized) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6"
          style={{ zIndex: 999999 }}
        >
          <Button
            onClick={() => {
              openChat();
            }}
            className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            size="icon"
          >
            <MessageSquare className="w-7 h-7 group-hover:scale-110 transition-transform" />
          </Button>
        </motion.div>
      )}
    </>
  );
}

