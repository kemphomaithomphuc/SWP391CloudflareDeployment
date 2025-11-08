import { MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "sonner";

interface SuggestedMessagesProps {
  onSendMessage: (message: string, location?: { latitude: number; longitude: number }) => void;
  isLoading: boolean;
}

export default function SuggestedMessages({ onSendMessage, isLoading }: SuggestedMessagesProps) {
  const { language } = useLanguage();

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ định vị'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleFindNearbyStations = async () => {
    try {
      // Lấy vị trí hiện tại
      const location = await getCurrentLocation();
      
      // Gửi tin nhắn kèm theo vị trí
      const message = language === 'vi' 
        ? 'Tìm trạm sạc gần đây' 
        : 'Find nearby charging stations';
      
      onSendMessage(message, location);
      
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      let errorMessage = language === 'vi' 
        ? 'Không thể lấy vị trí hiện tại. Vui lòng cho phép truy cập vị trí trong trình duyệt.' 
        : 'Unable to get current location. Please allow location access in your browser.';
      
      if (error.code === 1) {
        errorMessage = language === 'vi' 
          ? 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.' 
          : 'Location access denied. Please enable it in your browser settings.';
      }
      
      toast.error(errorMessage);
    }
  };

  const suggestedMessages = [
    {
      icon: <MapPin className="w-4 h-4" />,
      text: language === 'vi' ? 'Tìm trạm gần đây' : 'Find nearby stations',
      action: handleFindNearbyStations,
    },
  ];

  return (
    <div className="px-3 py-2 flex flex-wrap gap-2 border-t border-gray-200 bg-gray-50">
      {suggestedMessages.map((msg, index) => (
        <Button
          key={index}
          onClick={msg.action}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="text-xs rounded-full bg-white hover:bg-gray-100 border-gray-300 text-gray-700 flex items-center gap-1.5 px-3 py-1.5 h-auto"
        >
          {msg.icon}
          <span>{msg.text}</span>
        </Button>
      ))}
    </div>
  );
}

