import { Platform } from "react-native";

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  bio?: string;
  language?: string;
  address?: string;
  image?: string | null;
  avatar?: string | null;
  profile_picture?: string | null;
  is_verified?: boolean;
  role?: string;
  is_staff?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY_AUTH = "haven_wellness_auth_state_v1";

const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

let listeners: Array<() => void> = [];
let memoryAuthState: AuthState = { ...initialAuthState };

// Helper to save to browser localStorage or fallback
const persistAuthState = (state: AuthState) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        STORAGE_KEY_AUTH,
        JSON.stringify({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        })
      );
    }
  } catch (e) {
    console.warn("Failed to persist auth state:", e);
  }
};

const loadPersistedAuthState = (): Partial<AuthState> | null => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {
    console.warn("Failed to load persisted auth state:", e);
  }
  return null;
};

// Auto-hydrate on startup
const persisted = loadPersistedAuthState();
if (persisted && persisted.accessToken) {
  memoryAuthState = {
    ...memoryAuthState,
    ...persisted,
    isAuthenticated: true,
    isLoading: false,
  };
} else {
  memoryAuthState.isLoading = false;
}

export const useAuthStore = {
  getState: (): AuthState => memoryAuthState,
  setState: (updater: Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>)) => {
    const next = typeof updater === "function" ? updater(memoryAuthState) : updater;
    memoryAuthState = { ...memoryAuthState, ...next };
    persistAuthState(memoryAuthState);
    listeners.forEach((l) => l());
  },
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  login: (data: { user: UserProfile; access: string; refresh: string }) => {
    memoryAuthState = {
      ...memoryAuthState,
      user: data.user,
      accessToken: data.access,
      refreshToken: data.refresh,
      isAuthenticated: true,
      isLoading: false,
    };
    persistAuthState(memoryAuthState);
    listeners.forEach((l) => l());
  },
  logout: () => {
    memoryAuthState = {
      ...memoryAuthState,
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    };
    persistAuthState(memoryAuthState);
    listeners.forEach((l) => l());
  },
  setUser: (user: UserProfile) => {
    memoryAuthState = {
      ...memoryAuthState,
      user,
    };
    persistAuthState(memoryAuthState);
    listeners.forEach((l) => l());
  },
};
