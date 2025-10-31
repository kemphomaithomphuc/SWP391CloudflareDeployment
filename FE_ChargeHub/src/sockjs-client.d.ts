declare module 'sockjs-client' {
  export default class SockJS {
    constructor(url: string, _reserved?: any, options?: any);
    close(code?: number, reason?: string): void;
    send(data: string): void;

    onopen: ((e: Event) => any) | null;
    onmessage: ((e: MessageEvent) => any) | null;
    onclose: ((e: CloseEvent) => any) | null;
    onerror: ((e: Event) => any) | null;

    readyState: number;

    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;
  }
}

