import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";
import { parseBotResponse } from "../utils/parseBotResponse";
import { scrollToBottom } from "../utils/scrollToBottom";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "sonner";

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function useChat() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (textToSend && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: textToSend.trim(),
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      if (!messageText) {
        setInputMessage("");
      }
      setIsLoading(true);
      
      try {
        const response = await sendChatMessage(userMessage.text);
        console.log('Full API response:', response);
        
        const botResponseText = parseBotResponse(response);
        console.log('Extracted bot response:', botResponseText);
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: botResponseText,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (error: any) {
        console.error("Error sending message:", error);
        const errorText = error.response?.data?.message || error.message || 
          (language === 'vi' 
            ? 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
            : 'Sorry, an error occurred. Please try again later.');
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        toast.error(language === 'vi' ? 'Lỗi gửi tin nhắn' : 'Failed to send message');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    await sendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    messagesEndRef,
    inputRef,
    handleSendMessage,
    sendMessage,
    handleKeyPress,
  };
}

