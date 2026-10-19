
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
  // Extended sauna & customization options
  saunaType?: "private" | "shared";
  isSharedSauna?: boolean;
  durationHours?: number;
  basePrice?: number;
  extraPersonFee?: number;
  selectedExtras?: Array<{ id: string; name: string; price: number }>;
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
  extraPersonFee: 50,
  selectedExtras: [] as Array<{ id: string; name: string; price: number }>,
};

let listeners: Array<() => void> = [];
let memoryState = { ...initialState };

export const useBookingStore = {
  getState: () => memoryState,
  setState: (updater: Partial<typeof memoryState> | ((prev: typeof memoryState) => Partial<typeof memoryState>)) => {
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
