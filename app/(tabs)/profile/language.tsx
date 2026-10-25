import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

const languages = [
  { id: "en", label: "English", sub: "English" },
  { id: "nl", label: "Nederlands", sub: "Dutch" },
  { id: "de", label: "Deutsch", sub: "German" },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const textMuted = useColor("textMuted");
  const [selected, setSelected] = useState(i18n.language || "en");

  const handleSelectLanguage = async (langId: string) => {
    setSelected(langId);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("user-language", langId);
      }
    } catch {}
    await i18n.changeLanguage(langId);
  };

  const handleSave = async () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("user-language", selected);
      }
    } catch {}
    await i18n.changeLanguage(selected);
    router.back();
  };

  return (
    <>
      <BackHeader />
      <Layout title={t("settings.language")}>
        <Header
          title={t("language.title")}
          subtitle={t("language.subtitle")}
        />

        <View style={styles.list}>
          {languages.map((lang) => {
            const isSelected = selected === lang.id;
            return (
              <Pressable
                key={lang.id}
                style={[styles.item, isSelected && styles.selectedItem]}
                onPress={() => handleSelectLanguage(lang.id)}
              >
                <View>
                  <Text
                    style={[styles.label, isSelected && styles.selectedText]}
                  >
                    {lang.label}
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color: isSelected ? "rgba(255,255,255,0.7)" : textMuted,
                    }}
                  >
                    {lang.sub}
                  </Text>
                </View>
                {isSelected && <Check size={20} color="white" />}
              </Pressable>
            );
          })}
        </View>

        <Button onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t("buttons.save")}</Text>
        </Button>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
    marginBottom: 40,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#F4F4F5",
  },
  selectedItem: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  selectedText: {
    color: "white",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "black",
  },
});
