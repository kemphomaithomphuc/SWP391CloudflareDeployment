import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import ChatWindow from "./ChatWindow";
import { useChat } from "../../hooks/useChat";
import { useChatbot } from "../../contexts/ChatbotContext";

interface Position {
  x: number;
  y: number;
}

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
  
  // Drag state
  const [position, setPosition] = useState<Position>(() => {
    // Load position from localStorage or use default
    const saved = localStorage.getItem('chatbotPosition');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Default position: bottom right
        return { x: window.innerWidth - 400 - 24, y: window.innerHeight - 600 - 96 };
      }
    }
    // Default position: bottom right
    return { x: window.innerWidth - 400 - 24, y: window.innerHeight - 600 - 96 };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  
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

  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chatbotPosition', JSON.stringify(position));
  }, [position]);

  // Handle window resize to keep chatbot in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        // Get actual width/height of chatbot using getBoundingClientRect
        const chatbotElement = chatWindowRef.current || buttonRef.current;
        let chatbotWidth = 400;
        let chatbotHeight = isChatOpen ? 600 : 64;
        
        if (chatbotElement) {
          const rect = chatbotElement.getBoundingClientRect();
          chatbotWidth = rect.width;
          chatbotHeight = rect.height;
        }
        
        const maxX = window.innerWidth - chatbotWidth;
        const maxY = window.innerHeight - chatbotHeight;
        return {
          x: Math.min(Math.max(0, prev.x), maxX),
          y: Math.min(Math.max(0, prev.y), maxY),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isChatOpen]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (chatWindowRef.current) {
      const rect = chatWindowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Get actual width/height of chatbot using getBoundingClientRect for accuracy
        const chatbotElement = chatWindowRef.current || buttonRef.current;
        let chatbotWidth = 400;
        let chatbotHeight = isChatOpen ? 600 : 64;
        
        if (chatbotElement) {
          const rect = chatbotElement.getBoundingClientRect();
          chatbotWidth = rect.width;
          chatbotHeight = rect.height;
        }
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - chatbotWidth;
        const maxY = window.innerHeight - chatbotHeight;
        
        setPosition({
          x: Math.min(Math.max(0, newX), maxX),
          y: Math.min(Math.max(0, newY), maxY),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {!isChatMinimized && isChatOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: isDragging ? 0 : 0.3 }}
            className="fixed h-[600px]"
            style={{ 
              width: '400px',
              minWidth: '300px',
              maxWidth: '400px',
              height: '600px', 
              maxHeight: '600px',
              left: position.x,
              top: position.y,
              zIndex: 9999,
            }}
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
              onHeaderMouseDown={handleMouseDown}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button (Minimized) */}
      {(!isChatOpen || isChatMinimized) && (
        <motion.div
          ref={buttonRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed cursor-move"
          style={{
            left: position.x,
            top: position.y,
            zIndex: 9999,
          }}
          onMouseDown={(e) => {
            if (buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
              setIsDragging(true);
            }
          }}
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

