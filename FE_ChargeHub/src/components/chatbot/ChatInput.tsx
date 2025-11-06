import { Send } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useLanguage } from "../../contexts/LanguageContext";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function ChatInput({
  inputMessage,
  setInputMessage,
  isLoading,
  inputRef,
  onSendMessage,
  onKeyPress,
}: ChatInputProps) {
  const { language } = useLanguage();

  return (
    <div className="border-t border-gray-200 bg-white px-3 py-2 flex items-center space-x-2 flex-shrink-0">
      <Input
        ref={inputRef}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={language === 'vi' ? 'Nhập tin nhắn...' : 'Type a message...'}
        className="flex-1 border-0 bg-gray-100 rounded-full px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-green-600"
        disabled={isLoading}
      />
      <Button
        onClick={onSendMessage}
        disabled={!inputMessage.trim() || isLoading}
        className="bg-green-600 hover:bg-green-700 text-white rounded-full h-8 w-8 p-0 flex-shrink-0"
        size="icon"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}

