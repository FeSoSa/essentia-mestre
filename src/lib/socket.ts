import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client: Client | null = null;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export function getStompClient(): Client {
  if (!client) {
    client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`) as WebSocket,
      reconnectDelay: 5000,
      onStompError: (frame) => console.error('[STOMP] error', frame),
    });
  }
  return client;
}
