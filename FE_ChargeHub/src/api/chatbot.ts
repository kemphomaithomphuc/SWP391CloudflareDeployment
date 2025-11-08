import { api } from '../services/api';

// Chatbot API Types
export interface ChatResponse {
  message: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface ChatMessagePayload {
  message: string;
  location?: LocationData;
}

// Chatbot API Function
export const sendChatMessage = async (
  message: string, 
  location?: LocationData
): Promise<any> => {
  try {
    console.log('Sending chat message to:', '/api/chatbot/send');
    
    const payload: ChatMessagePayload = { message };
    if (location) {
      payload.location = location;
    }
    
    console.log('Message payload:', payload);
    const response = await api.post('/api/chatbot/send', payload);
    console.log('Chat API full response:', response);
    console.log('Chat API response.data:', response.data);
    console.log('Chat API response.data type:', typeof response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error calling chatbot API:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

