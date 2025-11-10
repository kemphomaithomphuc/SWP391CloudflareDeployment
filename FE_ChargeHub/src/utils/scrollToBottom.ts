/**
 * Scroll to bottom of messages container
 */
import type { RefObject } from "react";

export function scrollToBottom(messagesEndRef: RefObject<HTMLDivElement | null>) {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}

