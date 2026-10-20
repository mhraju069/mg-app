
export interface BookingState {
  serviceId: string | number;
  serviceType: string;
  serviceTitle: string;
  serviceSubtitle?: string;
  serviceImage?: string;
  price: number;
  date: string;
  timeSlot: string;
  guestsCount: number;
  fullName: string;
  email: string;
  phone: string;
  specialRequests: string;
  paymentMethod: "card" | "ideal";
  isFree?: boolean;
  // Extended sauna & customization options
  saunaType?: "private" | "shared";
  isSharedSauna?: boolean;
  durationHours?: number;
  basePrice?: number;
  extraPersonFee?: number;
  selectedExtras?: Array<{ id: string; name: string; price: number }>;

  // Extended saltroom & pass options
  isSaltRoom?: boolean;
  passType?: "single" | "10_session_pass" | "once_a_week" | "unlimited";
  isPassCovered?: boolean;
  planId?: number | string;
  passId?: number | string;
  purchaseId?: string;
  paymentMode?: "card" | "pass" | "subscription" | "weekly_subscription" | "unlimited_subscription" | "ideal";
  activeMembershipInfo?: any;
}

const initialState = {
  serviceId: "1",
  serviceType: "sauna",
  serviceTitle: "Private Sauna Experience",
  serviceSubtitle: "Your own exclusive sanctuary",
  serviceImage: "",
  price: 90,
  date: "2026-10-30",
  timeSlot: "10:00 - 13:00",
  guestsCount: 2,
  fullName: "Akash",
  email: "akash@example.com",
  phone: "+31 6 12345678",
  specialRequests: "",
  paymentMethod: "card" as const,
  isFree: false,
  saunaType: "private" as "private" | "shared",
  isSharedSauna: false,
  durationHours: 3,
  basePrice: 90,
  isSaltRoom: false,
  passType: "single" as const,
  isPassCovered: false,
  planId: undefined as number | string | undefined,
  passId: undefined as number | string | undefined,
  purchaseId: undefined as string | undefined,
  paymentMode: "card" as const,
  activeMembershipInfo: null as any,
};

let listeners: Array<() => void> = [];
let memoryState: BookingState = { ...initialState };

export const useBookingStore = {
  getState: (): BookingState => memoryState,
  setState: (updater: Partial<BookingState> | ((prev: BookingState) => Partial<BookingState>)) => {
    const next = typeof updater === "function" ? updater(memoryState) : updater;
    memoryState = { ...memoryState, ...next };
    listeners.forEach((l) => l());
  },
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
