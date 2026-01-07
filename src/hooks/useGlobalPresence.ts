import { useEffect, useRef, useState } from 'react';

interface UserStatus {
  isOnline: boolean;
  isTyping: boolean;
}

interface TypingStatus {
  [matchId: string]: {
    [userId: string]: boolean;
  };
}

interface NewMessageData {
  match_id: string;
  message_id: string;
  sender_id: string;
}

interface MessageStatusUpdate {
  message_id: string;
  status: 'sent' | 'delivered' | 'read';
}

interface MatchStatusUpdate {
  match_id: string;
  is_active: boolean;
}

export function useGlobalPresence() {
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const [typingStatuses, setTypingStatuses] = useState<TypingStatus>({});
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const messageListenersRef = useRef<Set<(data: NewMessageData) => void>>(new Set());
  const messageStatusListenersRef = useRef<Set<(data: MessageStatusUpdate) => void>>(new Set());
  const matchStatusListenersRef = useRef<Set<(data: MatchStatusUpdate) => void>>(new Set());

  // Watch for auth token changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('auth_token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return; // Don't connect if not authenticated

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${import.meta.env.VITE_API_BASE_URL
        ? new URL(import.meta.env.VITE_API_BASE_URL).host
        : window.location.host}/ws/presence/?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'initial_statuses') {
          const statuses: Record<string, UserStatus> = {};
          Object.entries(data.statuses).forEach(([userId, isOnline]) => {
            statuses[userId] = {
              isOnline: isOnline as boolean,
              isTyping: false,
            };
          });
          setUserStatuses(statuses);
        } else if (data.type === 'user_status') {
          setUserStatuses(prev => ({
            ...prev,
            [data.user_id]: {
              isOnline: data.is_online,
              isTyping: data.is_typing || false,
            }
          }));
        } else if (data.type === 'typing_status') {
          const key = `${data.match_id}-${data.user_id}`;
          
          if (typingTimeoutsRef.current[key]) {
            clearTimeout(typingTimeoutsRef.current[key]);
          }

          setTypingStatuses(prev => ({
            ...prev,
            [data.match_id]: {
              ...prev[data.match_id],
              [data.user_id]: data.is_typing
            }
          }));

          if (data.is_typing) {
            typingTimeoutsRef.current[key] = setTimeout(() => {
              setTypingStatuses(prev => ({
                ...prev,
                [data.match_id]: {
                  ...prev[data.match_id],
                  [data.user_id]: false
                }
              }));
              delete typingTimeoutsRef.current[key];
            }, 3000);
          }
        } else if (data.type === 'new_message') {
          // Notify all listeners about the new message
          messageListenersRef.current.forEach(listener => {
            listener({
              match_id: data.match_id,
              message_id: data.message_id,
              sender_id: data.sender_id,
            });
          });
        } else if (data.type === 'message_status_update') {
          // Notify all listeners about message status changes
          messageStatusListenersRef.current.forEach(listener => {
            listener({
              message_id: data.message_id,
              status: data.status,
            });
          });
        } else if (data.type === 'match_status_update') {
          // Notify all listeners about match status change
          matchStatusListenersRef.current.forEach(listener => {
            listener({
              match_id: data.match_id,
              is_active: data.is_active,
            });
          });
        }
      };

      ws.onerror = () => {
        // Connection error
      };

      ws.onclose = () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Only reconnect if we still have a token
        const currentToken = localStorage.getItem('auth_token');
        if (currentToken) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    };

    connect();

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      Object.values(typingTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]); // Re-run when token changes!

  const sendTypingStatus = (matchId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        match_id: matchId,
        is_typing: isTyping
      }));
    }
  };

  const getUserStatus = (userId: string): UserStatus => {
    return userStatuses[userId] || { isOnline: false, isTyping: false };
  };

  const isUserTypingInMatch = (userId: string, matchId: string): boolean => {
    return typingStatuses[matchId]?.[userId] || false;
  };

  const onNewMessage = (callback: (data: NewMessageData) => void) => {
    messageListenersRef.current.add(callback);
    return () => {
      messageListenersRef.current.delete(callback);
    };
  };

  const onMessageStatusUpdate = (callback: (data: MessageStatusUpdate) => void) => {
    messageStatusListenersRef.current.add(callback);
    return () => {
      messageStatusListenersRef.current.delete(callback);
    };
  };

  const onMatchStatusUpdate = (callback: (data: MatchStatusUpdate) => void) => {
    matchStatusListenersRef.current.add(callback);
    return () => {
      matchStatusListenersRef.current.delete(callback);
    };
  };  

  return {
    userStatuses,
    getUserStatus,
    isUserTypingInMatch,
    sendTypingStatus,
    onNewMessage,
    onMessageStatusUpdate,
    onMatchStatusUpdate,
  };
}