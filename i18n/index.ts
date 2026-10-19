import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "language-storage" });

// Import translation files
import en from "./en.json";
import nl from "./nl.json";
import de from "./de.json";
import fr from "./fr.json";

const resources = {
  en: { translation: en },
  nl: { translation: nl },
  de: { translation: de },
  fr: { translation: fr },
};

const LANGUAGE_DETECTOR = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      if (typeof window === "undefined") {
        return callback("en");
      }
      // Get saved language from storage
      const savedLanguage = storage.getString("user-language");
      if (savedLanguage) {
        return callback(savedLanguage);
      }

      // Fallback to device language
      const deviceLanguage = "en";
      return callback(deviceLanguage);
    } catch (error) {
      console.log("Error detecting language:", error);
      callback("en");
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      if (typeof window === "undefined") {
        return;
      }
      storage.set("user-language", language);
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
