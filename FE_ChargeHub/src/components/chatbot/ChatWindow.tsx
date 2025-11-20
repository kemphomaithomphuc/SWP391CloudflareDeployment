import { Card, CardContent } from "../ui/card";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import SuggestedMessages from "./SuggestedMessages";
import { Message } from "../../hooks/useChat";
import { LocationData } from "../../api/chatbot";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSendMessage: () => void;
  onSendMessageWithLocation: (message: string, location?: LocationData) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onHeaderMouseDown?: (e: React.MouseEvent) => void;
}

export default function ChatWindow({
  messages,
  isLoading,
  inputMessage,
  setInputMessage,
  messagesEndRef,
  inputRef,
  onSendMessage,
  onSendMessageWithLocation,
  onKeyPress,
  onClose,
  onHeaderMouseDown,
}: ChatWindowProps) {
  return (
    <Card className="shadow-2xl border border-gray-200 bg-white h-full w-full flex flex-col rounded-t-lg overflow-hidden" style={{ height: '100%', maxHeight: '100%', width: '100%', minWidth: '100%', maxWidth: '100%' }}>
      <ChatHeader
        onClose={onClose}
        {...(onHeaderMouseDown ? { onMouseDown: onHeaderMouseDown } : {})}
      />
      <CardContent className="p-3 flex-1 flex flex-col overflow-hidden min-h-0 bg-gray-50" style={{ minHeight: 0, maxHeight: '100%', height: 0, width: '100%', minWidth: '100%', maxWidth: '100%' }}>
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading} 
          messagesEndRef={messagesEndRef} 
        />
        {messages.length === 0 && (
          <SuggestedMessages 
            onSendMessage={onSendMessageWithLocation}
            isLoading={isLoading}
          />
        )}
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

