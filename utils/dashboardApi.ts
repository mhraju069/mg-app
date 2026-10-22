/**
 * Dashboard & Bookings API Service for Mobile App
 * Synchronized with Website User Dashboard (/api/dashboard/user/) & Backend Cancel API
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

export interface CancelBookingResponse {
  success: boolean;
  message: string;
  cancellation_allowed?: boolean;
  booking_id?: string;
  status?: string;
  credit_restored?: boolean;
  remaining_sessions?: number;
  hours_until_start?: number;
  required_notice_hours?: number;
  data?: any;
}

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  return "http://localhost";
};

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
      const res = await fetch(`${getBaseUrl()}/api/dashboard/user/`, {
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
   * Cancel booking via backend endpoint (/api/bookings/<booking_id>/cancel/)
   * Returns complete backend response payload with detailed error messages and credit info.
   */
  async cancelBooking(
    bookingId: string | number,
    reason?: string
  ): Promise<CancelBookingResponse> {
    const auth = useAuthStore.getState();
    const baseUrl = getBaseUrl();

    try {
      const payload: Record<string, any> = {
        booking_id: String(bookingId),
      };
      if (reason && reason.trim()) {
        payload.reason = reason.trim();
      }

      const res = await fetch(`${baseUrl}/api/bookings/${bookingId}/cancel/`, {
        method: "POST",
        headers: {
          Authorization: auth.accessToken ? `Bearer ${auth.accessToken}` : "",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json) {
        return {
          success: json.success !== false,
          message: json.message || "Booking has been cancelled successfully.",
          credit_restored: json.credit_restored,
          remaining_sessions: json.remaining_sessions,
          hours_until_start: json.hours_until_start,
          cancellation_allowed: json.cancellation_allowed ?? true,
          booking_id: json.booking_id,
          status: json.status || "cancelled",
          data: json.data,
        };
      }

      // Backend returned error (e.g. 400 Bad Request - within 24 hours, or 403 Forbidden)
      const errorMsg =
        json?.message ||
        json?.detail ||
        (json && typeof json === "object"
          ? Object.values(json).flat().join(" ")
          : "Cancellation could not be processed.");

      return {
        success: false,
        message: errorMsg,
        cancellation_allowed: json?.cancellation_allowed ?? false,
        hours_until_start: json?.hours_until_start,
        required_notice_hours: json?.required_notice_hours || 24,
      };
    } catch (e: any) {
      console.warn("dashboardApi: cancelBooking error:", e);
      return {
        success: false,
        message:
          e?.message ||
          "Network error occurred while processing cancellation. Please try again.",
      };
    }
  },
};

export default dashboardApi;
