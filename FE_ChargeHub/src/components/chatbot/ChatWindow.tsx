import { Card, CardContent } from "../ui/card";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { Message } from "../../hooks/useChat";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export default function ChatWindow({
  messages,
  isLoading,
  inputMessage,
  setInputMessage,
  messagesEndRef,
  inputRef,
  onSendMessage,
  onKeyPress,
  onClose,
}: ChatWindowProps) {
  return (
    <Card className="shadow-2xl border border-gray-200 bg-white h-full w-full flex flex-col rounded-t-lg overflow-hidden" style={{ height: '100%', maxHeight: '100%' }}>
      <ChatHeader onClose={onClose} />
      <CardContent className="p-3 flex-1 flex flex-col overflow-hidden min-h-0 bg-gray-50" style={{ minHeight: 0, maxHeight: '100%', height: 0 }}>
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading} 
          messagesEndRef={messagesEndRef} 
        />
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isLoading={isLoading}
          inputRef={inputRef}
          onSendMessage={onSendMessage}
          onKeyPress={onKeyPress}
        />
      </CardContent>
    </Card>
  );
}

