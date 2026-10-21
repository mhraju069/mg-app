import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { Copy, Info, Key, Zap } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useToast } from "@/components/ui/toast";
import { Layout } from "@/components/layout/Layout";
import Header from "@/components/shared/inside-header";
import { dashboardApi, DashboardAccessCodeItem } from "@/utils/dashboardApi";
import { useAuthStore } from "@/utils/authStore";

export default function AccessScreen() {
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const lightBlue = "#EFF6FF";
  const blueText = "#1D4ED8";
  const border = useColor("border");
  const { toast } = useToast();
  const { t } = useTranslation();

  const [codes, setCodes] = useState<DashboardAccessCodeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCodes = async () => {
      const auth = useAuthStore.getState();
      if (!auth.accessToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await dashboardApi.getUserDashboard();
        if (data?.access_codes?.all_sauna) {
          setCodes(data.access_codes.all_sauna);
        }
      } catch (e) {
        console.warn("Failed to fetch access codes:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, []);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showToast(text);
  };

  const showToast = (code: string) => {
    toast({
      title: "Success!",
      description: t("access.copied", { code }) || `Copied access code: ${code}`,
      variant: "success",
    });
  };

  return (
    <Layout title={t("access.title")}>
      <Header
        title={t("access.title")}
        subtitle={t("access.subtitle")}
        space={8}
      />

      {loading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator size="small" color={brownGold} />
          <Text style={{ marginTop: 12, color: textMuted, fontSize: 13 }}>
            Loading your access codes...
          </Text>
        </View>
      ) : codes.length > 0 ? (
        <View style={{ gap: 16 }}>
          {codes.map((item) => (
            <Card key={item.booking_id} style={[styles.mainCard, { borderColor: border }]}>
              <View style={styles.cardHeader}>
                <View
                  style={{
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Text style={styles.serviceTitle}>
                    {item.sauna_type ? `${item.sauna_type.toUpperCase()} SAUNA` : "SAUNA EXPERIENCE"}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status || "Confirmed"}</Text>
                  </View>
                </View>
                <Text variant="body" style={{ color: textMuted }}>
                  {item.date} {item.time ? `at ${item.time}` : ""}
                </Text>
              </View>

              <View style={[styles.codeCard, { backgroundColor: brownGold }]}>
                <View style={styles.codeHeader}>
                  <Key size={20} color="white" opacity={0.8} />
                  <Text style={styles.codeLabel}>{t("access.label")}</Text>
                </View>

                <View style={styles.codeRow}>
                  <Text style={styles.codeValue}>{item.access_code}</Text>
                  <Pressable
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(item.access_code)}
                  >
                    <Copy size={16} color="#fff" />
                    <Text style={styles.copyText}>{t("access.copy")}</Text>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.infoBox, { backgroundColor: lightBlue }]}>
                <Info size={18} color={blueText} />
                <Text variant="body" style={{ color: blueText, flex: 1 }}>
                  {t("access.instruction")}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <Card style={[styles.mainCard, { borderColor: border, padding: 32, alignItems: "center", gap: 12 }]}>
          <Key size={36} color={brownGold} />
          <Text style={{ fontSize: 16, fontWeight: "700" }}>No Active Access Codes</Text>
          <Text style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            When you book a sauna session, your personalized smart door access code will appear here.
          </Text>
        </Card>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    gap: 20,
    padding: 20,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 4,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.title,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  codeCard: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeLabel: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    letterSpacing: 2,
    fontFamily: Fonts.mono || undefined,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
