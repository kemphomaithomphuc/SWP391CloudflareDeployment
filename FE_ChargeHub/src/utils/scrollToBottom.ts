/**
 * Scroll to bottom of messages container
 */
export function scrollToBottom(messagesEndRef: React.RefObject<HTMLDivElement>) {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}

