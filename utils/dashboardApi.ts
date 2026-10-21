/**
 * Dashboard & Bookings API Service for Mobile App
 * Synchronized with Website User Dashboard (/api/dashboard/user/)
 */

import { useAuthStore } from "@/utils/authStore";

export interface DashboardBookingItem {
  id: number;
  booking_id: string;
  service_type: string;
  service_name: string;
  date: string;
  time: string;
  end_time?: string | null;
  guests: number;
  status: string;
  payment_status: string;
  total_price: string;
  access_code: string;
  details?: {
    sauna_type?: string;
    time_slot?: string;
    selected_features?: string[];
    special_request?: string;
    celebration_type?: string;
    celebration_date?: string;
    name_of_celebrant?: string;
    age_of_celebrant?: number;
    hobbies?: string;
    celebration_details?: string;
    used_pass?: boolean;
    used_subscription?: boolean;
    is_paid?: boolean;
    total_price?: string;
    activity_id?: number;
    is_custom?: boolean;
    notes?: string;
    [key: string]: any;
  };
}

export interface DashboardAccessCodeItem {
  booking_id: string;
  access_code: string;
  sauna_type: string;
  date: string;
  time: string;
  time_slot: string;
  status: string;
  payment_status: string;
  guests: number;
  details?: {
    selected_features?: string[];
    special_request?: string;
    total_price?: string;
    [key: string]: any;
  };
}

export interface UserDashboardResponse {
  success: boolean;
  home: {
    metrics?: {
      total_bookings: number;
      upcoming_bookings: number;
      upcoming_booking_dates: string[];
      active_subscriptions: number;
      upcoming_saunas: number;
    };
    next_visit: DashboardBookingItem | null;
    subscriptions_and_passes?: any[];
    next_visits?: DashboardBookingItem[];
    other_upcoming_visits: DashboardBookingItem[];
  };
  my_bookings: {
    upcoming: DashboardBookingItem[];
    past: DashboardBookingItem[];
  };
  access_codes: {
    private_sauna: DashboardAccessCodeItem[];
    shared_sauna: DashboardAccessCodeItem[];
    all_sauna: DashboardAccessCodeItem[];
  };
  profile?: any;
}

const BASE_URL = "http://localhost";

export const dashboardApi = {
  /**
   * Fetch authenticated user's dashboard data (/api/dashboard/user/)
   */
  async getUserDashboard(): Promise<UserDashboardResponse | null> {
    const auth = useAuthStore.getState();
    if (!auth.accessToken) {
      return null;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/dashboard/user/`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        return null;
      }

      return (await res.json()) as UserDashboardResponse;
    } catch (e) {
      console.warn("Failed to fetch user dashboard from server:", e);
      return null;
    }
  },

  /**
   * Cancel booking via backend endpoint
   */
  async cancelBooking(bookingId: string | number): Promise<boolean> {
    const auth = useAuthStore.getState();
    try {
      // Try cancel booking directly
      const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/cancel/`, {
        method: "POST",
        headers: {
          Authorization: auth.accessToken ? `Bearer ${auth.accessToken}` : "",
          "Content-Type": "application/json",
        },
      });
      if (res.ok) return true;

      // Fallback to update status via admin bookings patch
      const patchRes = await fetch(`${BASE_URL}/api/dashboard/admin/bookings/${bookingId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      return patchRes.ok;
    } catch {
      return false;
    }
  },
};

export default dashboardApi;
