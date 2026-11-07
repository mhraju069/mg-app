import i18n from "@/i18n";
import { useAuthStore } from "@/utils/authStore";

/**
 * Helper to pick localized value from an API object:
 * priority: current language field (title_nl) -> if empty, i18n key fallback -> English DB value -> empty string.
 * Never show English DB value when a Dutch/German translation exists in i18n.
 */
export function getLocalizedField(
  obj: any,
  fieldName: string,
  lang: string = i18n.language || "en",
  i18nFallbackKey?: string
): string {
  if (!obj || typeof obj !== "object") return "";

  const cleanLang = (lang || "en").toLowerCase().split("-")[0];

  // 1. Direct language key from DB/API (e.g. title_nl, description_de)
  const langKey = `${fieldName}_${cleanLang}`;
  if (obj[langKey] !== undefined && obj[langKey] !== null && String(obj[langKey]).trim() !== "") {
    return String(obj[langKey]);
  }

  // 2. Nested dictionary format from DB/API (e.g. { title: { en: '...', nl: '...' } })
  if (obj[fieldName] && typeof obj[fieldName] === "object") {
    if (obj[fieldName][cleanLang]) return String(obj[fieldName][cleanLang]);
  }

  // 3. Fallback to i18n dictionary key if specified, or auto-derived lookup
  if (i18nFallbackKey && i18n.exists(i18nFallbackKey)) {
    return i18n.t(i18nFallbackKey);
  }

  // If active language is non-English, check if i18n has a service translation before falling back to English DB string
  if (cleanLang !== "en") {
    const rawVal = obj[fieldName] || obj[`${fieldName}_en`];
    if (rawVal && typeof rawVal === "string") {
      const serviceKey = `bookingFlow.services.${rawVal}`;
      if (i18n.exists(serviceKey)) {
        return i18n.t(serviceKey);
      }
    }
    // Also check saltroom specific translations if field is for salt room
    const isSalt = obj.title === "Salt Room" || obj.service_type === "saltroom" || obj.max_capacity === 2;
    if (isSalt) {
      if (fieldName === "title") {
        if (i18n.exists("bookingFlow.saltroom.title")) return i18n.t("bookingFlow.saltroom.title");
        if (i18n.exists("bookingFlow.saltRoom.title")) return i18n.t("bookingFlow.saltRoom.title");
      }
      if (fieldName === "subtitle" || fieldName === "description") {
        if (i18n.exists("bookingFlow.saltroom.subtitle")) return i18n.t("bookingFlow.saltroom.subtitle");
        if (i18n.exists("bookingFlow.saltRoom.subtitle")) return i18n.t("bookingFlow.saltRoom.subtitle");
      }
    }
  }

  // 4. Fallback to English direct field (e.g. title_en)
  const enKey = `${fieldName}_en`;
  if (obj[enKey] !== undefined && obj[enKey] !== null && String(obj[enKey]).trim() !== "") {
    return String(obj[enKey]);
  }

  // 5. Default base property (e.g. obj.title)
  if (obj[fieldName] !== undefined && obj[fieldName] !== null && typeof obj[fieldName] !== "object") {
    const val = String(obj[fieldName]);
    if (val.trim() !== "" && val !== "null" && val !== "undefined") {
      return val;
    }
  }

  // 6. First available language variant
  for (const fallback of ["nl", "de"]) {
    const key = `${fieldName}_${fallback}`;
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "") {
      return String(obj[key]);
    }
  }

  return "";
}

/**
 * Centralized fetch client that injects Accept-Language and lang headers
 * based on currently active i18next language.
 */
export async function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const currentLang = (i18n.language || "en").toLowerCase().split("-")[0];

  const headers = new Headers(init?.headers || {});

  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", currentLang);
  }
  if (!headers.has("lang")) {
    headers.set("lang", currentLang);
  }

  // Inject Bearer token if user is authenticated (matching website ApiClient behavior)
  const auth = useAuthStore.getState();
  if (auth?.accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }

  // Also append ?lang= to URL if not already present, ensuring cache busting across languages
  let finalInput = input;
  if (typeof input === "string") {
    if (!input.includes("lang=")) {
      const separator = input.includes("?") ? "&" : "?";
      finalInput = `${input}${separator}lang=${currentLang}`;
    }
  }

  return fetch(finalInput, {
    ...init,
    headers,
  });
}

