import { MessageSquare, X } from "lucide-react";
import { Button } from "../ui/button";
import { useLanguage } from "../../contexts/LanguageContext";

interface ChatHeaderProps {
  onClose: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export default function ChatHeader({ onClose, onMouseDown }: ChatHeaderProps) {
  const { language } = useLanguage();

  return (
    <div 
      className="bg-green-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0 cursor-move"
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{language === 'vi' ? 'Hỗ trợ trực tuyến' : 'Online Support'}</h3>
          <p className="text-xs text-white/80">Online</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        onMouseDown={(e) => e.stopPropagation()}
        className="h-6 w-6 p-0 text-white hover:bg-white/20 rounded-full cursor-pointer"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

