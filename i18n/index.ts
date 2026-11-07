import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import translation files
import en from "./en.json";
import nl from "./nl.json";
import de from "./de.json";

const resources = {
  en: { translation: en },
  nl: { translation: nl },
  de: { translation: de },
};

const LANGUAGE_KEY = "user-language";

const LANGUAGE_DETECTOR = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // 1. Check browser/web localStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const localLang = window.localStorage.getItem(LANGUAGE_KEY);
        if (localLang && (localLang === "en" || localLang === "nl" || localLang === "de")) {
          return callback(localLang);
        }
      }

      // 2. Check AsyncStorage for React Native mobile / Expo Go
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
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
        window.localStorage.setItem(LANGUAGE_KEY, language);
      }
      try {
        await AsyncStorage.setItem(LANGUAGE_KEY, language);
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
    supportedLngs: ["en", "nl", "de"],
    returnEmptyString: false,
    returnNull: false,
    parseMissingKeyHandler: (key: string) => {
      // Fallback: missing translation -> friendly last segment or key name formatted
      const parts = key.split(".");
      const last = parts[parts.length - 1];
      return last ? last.replace(/([A-Z])/g, " $1").trim() : key;
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Important for React Native
    },
  });

export default i18n;
