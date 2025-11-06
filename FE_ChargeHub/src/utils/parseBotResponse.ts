/**
 * Parse bot response from API to extract message text
 * Handles different response formats from the chatbot API
 */
export function parseBotResponse(response: any): string {
  if (typeof response === 'string') {
    return response;
  }
  
  if (response && typeof response === 'object') {
    // Check for reply field first (common chatbot format)
    if (response.reply) {
      return response.reply;
    }
    
    if (response.message) {
      return response.message;
    }
    
    if (response.data?.message) {
      return response.data.message;
    }
    
    if (response.data?.reply) {
      return response.data.reply;
    }
    
    if (response.text) {
      return response.text;
    }
    
    if (response.response) {
      return response.response;
    }
    
    // Fallback: stringify the response
    return JSON.stringify(response);
  }
  
  return String(response);
}

