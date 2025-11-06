/**
 * Storage utilities for chatbot
 * Can be used to persist chat history, settings, etc.
 */

const CHAT_STORAGE_KEY = 'chatbot_messages';
const CHAT_SETTINGS_KEY = 'chatbot_settings';

export interface ChatSettings {
  isOpen?: boolean;
  isMinimized?: boolean;
}

/**
 * Save messages to localStorage
 */
export function saveMessages(messages: any[]) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
}

/**
 * Load messages from localStorage
 */
export function loadMessages(): any[] {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      const messages = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
  return [];
}

/**
 * Clear messages from localStorage
 */
export function clearMessages() {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear messages:', error);
  }
}

/**
 * Save chat settings
 */
export function saveChatSettings(settings: ChatSettings) {
  try {
    localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save chat settings:', error);
  }
}

/**
 * Load chat settings
 */
export function loadChatSettings(): ChatSettings {
  try {
    const stored = localStorage.getItem(CHAT_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load chat settings:', error);
  }
  return {};
}

