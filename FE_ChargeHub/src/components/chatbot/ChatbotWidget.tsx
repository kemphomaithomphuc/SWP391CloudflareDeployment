import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import ChatWindow from "./ChatWindow";
import { useChat } from "../../hooks/useChat";

export default function ChatbotWidget() {
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
    handleKeyPress,
  } = useChat();

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
            className="fixed bottom-20 right-6 w-1/4 h-[600px] min-w-[300px] max-w-[400px]"
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
              onClose={() => setIsChatOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button (Minimized) */}
      {(!isChatOpen || isChatMinimized) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 right-4"
          style={{ zIndex: 999999 }}
        >
          <Button
            onClick={() => {
              setIsChatOpen(true);
              setIsChatMinimized(false);
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

