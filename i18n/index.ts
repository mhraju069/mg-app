import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "language-storage" });

// Import translation files
import en from "./en.json";
import nl from "./nl.json";
import de from "./de.json";

const resources = {
  en: { translation: en },
  nl: { translation: nl },
  de: { translation: de },
};

const LANGUAGE_DETECTOR = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // 1. Check browser/web localStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const localLang = window.localStorage.getItem("user-language");
        if (localLang && (localLang === "en" || localLang === "nl" || localLang === "de")) {
          return callback(localLang);
        }
      }

      // 2. Check native MMKV storage
      try {
        const savedLanguage = storage.getString("user-language");
        if (savedLanguage && (savedLanguage === "en" || savedLanguage === "nl" || savedLanguage === "de")) {
          return callback(savedLanguage);
        }
      } catch {}

      // Fallback
      return callback("en");
    } catch (error) {
      console.log("Error detecting language:", error);
      callback("en");
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("user-language", language);
      }
      try {
        storage.set("user-language", language);
      } catch {}
    } catch (error) {
      console.log("Error caching language:", error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Important for React Native
    },
  });

export default i18n;
