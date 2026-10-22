/**
 * Legal & Contact API Service for Terms & Conditions, Privacy Policy, Contact/Support Messages,
 * and Social Media Links (/api/others/social-media/)
 */

import { useAuthStore } from "@/utils/authStore";

export interface TermsAndConditionsData {
  id?: number;
  effective_date?: string | null;
  acceptance_of_terms?: string | null;
  user_responsibilities?: string | null;
  ticket_purchase?: string | null;
  refund_policy?: string | null;
  limitation_of_liability?: string | null;
  changes_to_terms?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface PrivacyPolicyData {
  id?: number;
  effective_date?: string | null;
  info_we_collect?: string | null;
  how_we_use_data?: string | null;
  child_safety?: string | null;
  user_rights?: string | null;
  security?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ContactInfoData {
  id?: number;
  email: string;
  phone: string;
  address: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface SocialMediaLinksData {
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
}

export interface SendMessagePayload {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  return "http://localhost";
};

export const fallbackTerms: TermsAndConditionsData = {
  effective_date: "2026-10-14",
  acceptance_of_terms:
    "By accessing our facilities or booking services via our platform, you agree to comply with and be bound by these terms and conditions.",
  user_responsibilities:
    "Guests must follow all health and safety guidelines, shower before using sauna or pool facilities, and maintain a quiet, respectful atmosphere.",
  ticket_purchase:
    "All bookings, passes, and event admissions must be paid in full prior to arrival unless otherwise specified.",
  refund_policy: "Full refund up to 48 hours prior to appointment.",
  limitation_of_liability:
    "Our facility is not liable for loss or damage to personal belongings or injuries resulting from failure to adhere to posted wellness safety rules.",
  changes_to_terms:
    "We reserve the right to revise these terms at any time. Updates take effect immediately upon publication on this platform.",
};

export const fallbackPrivacy: PrivacyPolicyData = {
  effective_date: "2026-11-01",
  info_we_collect:
    "We collect basic account information such as your name, email address, phone number, and booking preferences to deliver a personalized wellness experience.",
  how_we_use_data:
    "Your data is used solely to facilitate reservations, process secure payments, communicate booking updates, and improve our services.",
  child_safety:
    "Our services are intended for adults. We do not knowingly collect personal information from children under 16 without parental consent.",
  user_rights:
    "You have the right to access, rectify, or request deletion of your personal data at any time by contacting our support team.",
  security:
    "We implement industry-standard encryption, secure cloud infrastructure, and access control policies to safeguard your personal data.",
};

export const fallbackContactInfo: ContactInfoData = {
  email: "drzraju@gmail.com",
  phone: "+8801401541283",
  address: "Middle Badda, Dhaka",
};

export const fallbackSocialLinks: SocialMediaLinksData = {
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  twitter: "https://twitter.com",
};

export function formatEffectiveDate(dateStr?: string | null): string {
  if (!dateStr) return "Effective date: Recently updated";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return `Effective date: ${date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      }
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return `Effective date: ${parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
  } catch {
    // fallback to raw string
  }
  return `Effective date: ${dateStr}`;
}

export const legalApi = {
  /**
   * Fetch active Terms and Conditions
   */
  async getTermsAndConditions(): Promise<TermsAndConditionsData> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/contact/terms/`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const altRes = await fetch(`${baseUrl}/api/contact/terms-and-conditions/`, {
          headers: {
            Accept: "application/json",
          },
        });
        if (altRes.ok) {
          const json = await altRes.json();
          return json.data || json;
        }
        return fallbackTerms;
      }

      const json = await res.json();
      return json.data || json || fallbackTerms;
    } catch (e) {
      console.warn("legalApi: Failed to fetch terms and conditions, using fallback:", e);
      return fallbackTerms;
    }
  },

  /**
   * Fetch active Privacy Policy
   */
  async getPrivacyPolicy(): Promise<PrivacyPolicyData> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/contact/privacy-policy/`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        return fallbackPrivacy;
      }

      const json = await res.json();
      return json.data || json || fallbackPrivacy;
    } catch (e) {
      console.warn("legalApi: Failed to fetch privacy policy, using fallback:", e);
      return fallbackPrivacy;
    }
  },

  /**
   * Fetch active business contact details (email, phone, address)
   */
  async getContactInfo(): Promise<ContactInfoData> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/contact/contact/`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const altRes = await fetch(`${baseUrl}/api/others/contact-info/`, {
          headers: {
            Accept: "application/json",
          },
        });
        if (altRes.ok) {
          const json = await altRes.json();
          return json.data || json;
        }
        return fallbackContactInfo;
      }

      const json = await res.json();
      return json.data || json || fallbackContactInfo;
    } catch (e) {
      console.warn("legalApi: Failed to fetch contact info, using fallback:", e);
      return fallbackContactInfo;
    }
  },

  /**
   * Fetch social media links (/api/others/social-media/)
   */
  async getSocialMediaLinks(): Promise<SocialMediaLinksData> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/others/social-media/`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        return fallbackSocialLinks;
      }

      const json = await res.json();
      const links = json?.links || {};
      const dataArr: Array<{ media_type: string; url: string }> = Array.isArray(json?.data)
        ? json.data
        : [];

      // Extract from links dictionary or array
      const fbFromArr = dataArr.find((item) => item.media_type === "facebook")?.url;
      const instaFromArr = dataArr.find((item) => item.media_type === "instagram")?.url;
      const twFromArr = dataArr.find((item) => item.media_type === "twitter")?.url;

      const fb = links.facebook || fbFromArr || fallbackSocialLinks.facebook;
      const insta = links.instagram || instaFromArr || fallbackSocialLinks.instagram;
      const tw = links.twitter || twFromArr || fallbackSocialLinks.twitter;

      const ensureUrl = (url?: string | null, fallback?: string | null) => {
        if (!url || !url.trim()) return fallback || "";
        const trimmed = url.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          return trimmed;
        }
        return `https://${trimmed}`;
      };

      return {
        facebook: ensureUrl(fb, fallbackSocialLinks.facebook),
        instagram: ensureUrl(insta, fallbackSocialLinks.instagram),
        twitter: ensureUrl(tw, fallbackSocialLinks.twitter),
      };
    } catch (e) {
      console.warn("legalApi: Failed to fetch social media links, using fallback:", e);
      return fallbackSocialLinks;
    }
  },

  /**
   * Submit a contact / support message
   */
  async sendMessage(payload: SendMessagePayload): Promise<{ success: boolean; message: string }> {
    const baseUrl = getBaseUrl();
    const auth = useAuthStore.getState();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (auth.accessToken) {
      headers["Authorization"] = `Bearer ${auth.accessToken}`;
    }

    try {
      const res = await fetch(`${baseUrl}/api/contact/messages/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && (json.success !== false)) {
        return {
          success: true,
          message:
            json.message || "Your message has been sent successfully. We will get back to you shortly.",
        };
      }

      return {
        success: false,
        message:
          json.message ||
          json.detail ||
          (json.message && typeof json.message === "object"
            ? Object.values(json.message).flat().join(" ")
            : "Failed to send message. Please try again."),
      };
    } catch (e) {
      console.warn("legalApi: Failed to submit message:", e);
      return {
        success: false,
        message: "Network error occurred while sending your message. Please check your connection.",
      };
    }
  },
};

export default legalApi;
