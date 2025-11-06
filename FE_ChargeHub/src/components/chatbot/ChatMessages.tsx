import { motion } from "motion/react";
import { MessageSquare } from "lucide-react";
import { Message } from "../../hooks/useChat";
import { useLanguage } from "../../contexts/LanguageContext";
import TypingIndicator from "./TypingIndicator";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
  const { language } = useLanguage();

  return (
    <div className="flex-1 overflow-y-auto pr-2 min-h-0" style={{ maxHeight: '100%' }}>
      <div className="space-y-2 px-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {language === 'vi' 
                ? 'Chào mừng bạn đến với hỗ trợ trực tuyến! Chúng tôi có thể giúp gì cho bạn?'
                : 'Welcome to online support! How can we help you?'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  message.sender === 'user'
                    ? 'bg-green-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                }`}
                style={{ 
                  wordBreak: 'break-word', 
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  overflow: 'hidden',
                  whiteSpace: 'normal'
                }}
              >
                <p className="text-sm leading-relaxed break-words whitespace-normal" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {message.text}
                </p>
                <p className={`text-[10px] mt-1 ${
                  message.sender === 'user' 
                    ? 'text-white/70' 
                    : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </motion.div>
          ))
        )}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

