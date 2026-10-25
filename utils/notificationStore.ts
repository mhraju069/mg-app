import { useEffect, useState } from "react";
import { API_BASE_URL, getWsBaseUrl } from "./constants";
import { useAuthStore } from "./authStore";

export interface NotificationData {
  id: number | string;
  title: string;
  body: string;
  notification_type?: string;
  link?: string;
  data?: any;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at?: string;
}

interface NotificationState {
  unreadCount: number;
  notifications: NotificationData[];
  totalCount: number;
  isLoading: boolean;
  isConnected: boolean;
}

let state: NotificationState = {
  unreadCount: 0,
  notifications: [],
  totalCount: 0,
  isLoading: false,
  isConnected: false,
};

let listeners: Array<() => void> = [];
let wsInstance: WebSocket | null = null;
let reconnectTimer: any = null;

const notifyListeners = () => {
  listeners.forEach((l) => l());
};

export const notificationStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  setUnreadCount: (count: number) => {
    state.unreadCount = count;
    notifyListeners();
  },

  setNotifications: (list: NotificationData[], total?: number) => {
    state.notifications = list;
    if (typeof total === "number") state.totalCount = total;
    notifyListeners();
  },

  addNotification: (item: NotificationData, unreadCount?: number) => {
    // Avoid duplicate
    const exists = state.notifications.some((n) => String(n.id) === String(item.id));
    if (!exists) {
      state.notifications = [item, ...state.notifications];
      state.totalCount += 1;
    }
    if (typeof unreadCount === "number") {
      state.unreadCount = unreadCount;
    } else if (!item.is_read) {
      state.unreadCount += 1;
    }
    notifyListeners();
  },

  // 1. Fetch unread count for badge counter (GET /api/notify/unread-count/)
  fetchUnreadCount: async () => {
    const auth = useAuthStore.getState();
    if (!auth.accessToken) {
      state.unreadCount = 0;
      notifyListeners();
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/notify/unread-count/`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unread_count === "number") {
          state.unreadCount = data.unread_count;
          notifyListeners();
        }
      }
    } catch (e) {
      console.warn("notificationStore: fetchUnreadCount notice:", e);
    }
  },

  // 2. Fetch full notifications history (GET /api/notify/)
  fetchNotifications: async (filter?: { is_read?: boolean; type?: string }) => {
    const auth = useAuthStore.getState();
    if (!auth.accessToken) return;

    state.isLoading = true;
    notifyListeners();

    try {
      let url = `${API_BASE_URL}/notify/`;
      const params = new URLSearchParams();
      if (filter?.is_read !== undefined) params.append("is_read", String(filter.is_read));
      if (filter?.type) params.append("type", filter.type);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.notifications) ? data.notifications : [];
        state.notifications = list;
        if (typeof data.unread_count === "number") state.unreadCount = data.unread_count;
        if (typeof data.total_count === "number") state.totalCount = data.total_count;
      }
    } catch (e) {
      console.warn("notificationStore: fetchNotifications notice:", e);
    } finally {
      state.isLoading = false;
      notifyListeners();
    }
  },

  // 3. Mark single notification as read (PATCH /api/notify/<id>/read/)
  markAsRead: async (id: number | string) => {
    const auth = useAuthStore.getState();
    // Optimistic update
    state.notifications = state.notifications.map((n) =>
      String(n.id) === String(id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
    );
    if (state.unreadCount > 0) state.unreadCount -= 1;
    notifyListeners();

    if (!auth.accessToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notify/${id}/read/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unread_count === "number") {
          state.unreadCount = data.unread_count;
          notifyListeners();
        }
      }
    } catch (e) {
      console.warn("notificationStore: markAsRead error:", e);
    }
  },

  // 4. Mark all notifications as read (POST /api/notify/mark-all-read/)
  markAllAsRead: async () => {
    const auth = useAuthStore.getState();
    // Optimistic update
    state.notifications = state.notifications.map((n) => ({
      ...n,
      is_read: true,
      read_at: new Date().toISOString(),
    }));
    state.unreadCount = 0;
    notifyListeners();

    if (!auth.accessToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notify/mark-all-read/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unread_count === "number") {
          state.unreadCount = data.unread_count;
          notifyListeners();
        }
      }
    } catch (e) {
      console.warn("notificationStore: markAllAsRead error:", e);
    }
  },

  // 5. Connect Real-time WebSocket: ws(s)://<domain>/ws/notifications/?token=<token>
  connectWebSocket: () => {
    const auth = useAuthStore.getState();
    if (!auth.accessToken) {
      notificationStore.disconnectWebSocket();
      return;
    }

    // Already connected or connecting
    if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrl = `${getWsBaseUrl()}/ws/notifications/?token=${encodeURIComponent(auth.accessToken)}`;
      wsInstance = new WebSocket(wsUrl);

      wsInstance.onopen = () => {
        state.isConnected = true;
        notifyListeners();
      };

      wsInstance.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          // Real-time notification event
          if (payload.type === "notification" && payload.data?.notification) {
            const newNotif = payload.data.notification;
            const newUnread = payload.data.unread_count;
            notificationStore.addNotification(newNotif, newUnread);
          } else if (payload.type === "connection_established") {
            // Initial handshake
            notificationStore.fetchUnreadCount();
          }
        } catch (err) {
          console.warn("notificationStore: WS parse message notice:", err);
        }
      };

      wsInstance.onerror = (err) => {
        console.warn("notificationStore: WebSocket notice:", err);
      };

      wsInstance.onclose = () => {
        state.isConnected = false;
        notifyListeners();
        wsInstance = null;

        // Auto-reconnect after 6 seconds if authenticated
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (useAuthStore.getState().accessToken) {
            notificationStore.connectWebSocket();
          }
        }, 6000);
      };
    } catch (e) {
      console.warn("notificationStore: WS connection attempt error:", e);
    }
  },

  disconnectWebSocket: () => {
    clearTimeout(reconnectTimer);
    if (wsInstance) {
      try {
        wsInstance.close();
      } catch {}
      wsInstance = null;
    }
    state.isConnected = false;
    notifyListeners();
  },
};

// React hook to consume notification state
export function useNotifications() {
  const [data, setData] = useState<NotificationState>(notificationStore.getState());

  useEffect(() => {
    const unsubscribe = notificationStore.subscribe(() => {
      setData({ ...notificationStore.getState() });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...data,
    fetchNotifications: notificationStore.fetchNotifications,
    fetchUnreadCount: notificationStore.fetchUnreadCount,
    markAsRead: notificationStore.markAsRead,
    markAllAsRead: notificationStore.markAllAsRead,
  };
}
