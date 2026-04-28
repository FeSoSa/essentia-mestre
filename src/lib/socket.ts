import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client: Client | null = null;

export function getStompClient(): Client {
  if (!client) {
    client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws') as WebSocket,
      reconnectDelay: 5000,
      onStompError: (frame) => console.error('[STOMP] error', frame),
    });
  }
  return client;
}
