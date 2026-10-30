import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  Sparkles,
  Check,
  Boxes,
  Layers,
  Crown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/utils/authStore";
import { dashboardApi } from "@/utils/dashboardApi";
import { API_BASE_URL } from "@/utils/constants";

export default function PlansAndPassesScreen() {
  const { t, i18n } = useTranslation();
  const auth = useAuthStore.getState();
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "passes">("subscriptions");

  // User active items
  const [activePurchases, setActivePurchases] = useState<any[]>([]);

  // All available catalog items
  const [plans, setPlans] = useState<any[]>([]);
  const [sessionPasses, setSessionPasses] = useState<any[]>([]);

  const loadData = async () => {
    try {
      // 1. Fetch User Active Subscriptions & Passes from Dashboard API
      if (auth.accessToken) {
        try {
          const dash = await dashboardApi.getUserDashboard();
          if (dash?.home?.subscriptions_and_passes) {
            setActivePurchases(dash.home.subscriptions_and_passes);
          }
        } catch (e) {
          console.warn("Could not load user active passes:", e);
        }
      }

      // 2. Fetch All Plans and Passes catalog from Backend
      try {
        const res = await fetch(`${API_BASE_URL}/payments/plans-and-passes/`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (Array.isArray(data.subscription_plans)) setPlans(data.subscription_plans);
            if (Array.isArray(data.session_passes)) setSessionPasses(data.session_passes);
          }
        } else {
          // Fallback individual endpoints
          const [subRes, passRes] = await Promise.all([
            fetch(`${API_BASE_URL}/payments/subscription-plans/`).catch(() => null),
            fetch(`${API_BASE_URL}/payments/session-passes/`).catch(() => null),
          ]);
          if (subRes && subRes.ok) {
            const sData = await subRes.json();
            if (Array.isArray(sData)) setPlans(sData);
          }
          if (passRes && passRes.ok) {
            const pData = await passRes.json();
            if (Array.isArray(pData)) setSessionPasses(pData);
          }
        }
      } catch (err) {
        console.warn("Failed to load catalog plans:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const currentLang = i18n?.language?.split("-")[0] || "en";

  return (
    <>
      <BackHeader />
      <Layout>
        <Header
          title={t("profile.menu.premium") || "Plans & Passes"}
          subtitle="Manage active memberships and explore wellness passes"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brownGold} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {loading ? (
            <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={brownGold} />
            </View>
          ) : (
            <View style={{ gap: 24 }}>
              {/* SECTION 1: ACTIVE PLANS & PASSES */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <ShieldCheck size={20} color={brownGold} />
                  <Text style={styles.sectionHeading}>Active Plans & Passes</Text>
                  {activePurchases.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{activePurchases.length}</Text>
                    </View>
                  )}
                </View>

                {activePurchases.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Crown size={32} color={brownGold} style={{ opacity: 0.6, marginBottom: 8 }} />
                    <Text style={{ fontWeight: "700", fontSize: 16, color: "#1F2937" }}>
                      No Active Plan or Pass
                    </Text>
                    <Text style={{ fontSize: 13, color: textMuted, textAlign: "center", marginTop: 4 }}>
                      You do not currently have any active recurring subscriptions or passes. Browse available options below to unlock exclusive wellness sessions.
                    </Text>
                  </Card>
                ) : (
                  <View style={{ gap: 14 }}>
                    {activePurchases.map((item, idx) => {
                      const isSubscription = item.purchase_type === "subscription";
                      const remaining = item.remaining_sessions ?? item.sessions_remaining ?? null;
                      const total = item.total_sessions ?? null;

                      return (
                        <Card key={item.purchase_id || item.id || idx} style={styles.activeCard}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <View style={{ flex: 1, gap: 4 }}>
                              <View style={styles.activeBadgeRow}>
                                <View style={styles.activePill}>
                                  <CheckCircle2 size={12} color="#15803D" />
                                  <Text style={styles.activePillText}>ACTIVE</Text>
                                </View>
                                <Text style={styles.purchaseTypePill}>
                                  {isSubscription ? "SUBSCRIPTION" : "SESSION PASS"}
                                </Text>
                              </View>
                              <Text style={styles.activeTitle}>{item.name}</Text>
                            </View>

                            {item.amount && (
                              <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.activePrice}>€{parseFloat(item.amount).toFixed(0)}</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.activeDivider} />

                          <View style={styles.activeMetaRow}>
                            {remaining !== null && (
                              <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Sessions Remaining</Text>
                                <Text style={styles.metaValue}>
                                  {remaining} {total ? `/ ${total}` : ""}
                                </Text>
                              </View>
                            )}

                            {item.end_date && (
                              <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Valid Until</Text>
                                <Text style={styles.metaValue}>
                                  {new Date(item.end_date).toLocaleDateString()}
                                </Text>
                              </View>
                            )}

                            {item.sessions_per_week && (
                              <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Weekly Limit</Text>
                                <Text style={styles.metaValue}>{item.sessions_per_week} / week</Text>
                              </View>
                            )}
                          </View>
                        </Card>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* SECTION 2: ALL AVAILABLE PLANS & PASSES */}
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Crown size={20} color={brownGold} />
                  <Text style={styles.sectionHeading}>All Available Plans & Passes</Text>
                </View>

                {/* Sub-tab Switcher: Subscriptions vs Passes */}
                <View style={styles.tabContainer}>
                  <Pressable
                    style={[styles.tabButton, activeTab === "subscriptions" && styles.tabButtonActive]}
                    onPress={() => setActiveTab("subscriptions")}
                  >
                    <Layers size={16} color={activeTab === "subscriptions" ? "#fff" : brownGold} />
                    <Text style={[styles.tabText, activeTab === "subscriptions" && styles.tabTextActive]}>
                      Subscriptions ({plans.length})
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.tabButton, activeTab === "passes" && styles.tabButtonActive]}
                    onPress={() => setActiveTab("passes")}
                  >
                    <Boxes size={16} color={activeTab === "passes" ? "#fff" : brownGold} />
                    <Text style={[styles.tabText, activeTab === "passes" && styles.tabTextActive]}>
                      Session Passes ({sessionPasses.length})
                    </Text>
                  </Pressable>
                </View>

                {/* Catalog Rendering */}
                {activeTab === "subscriptions" ? (
                  <View style={{ gap: 16 }}>
                    {plans.map((plan, index) => {
                      const isPopular = index === 1;
                      const planName = plan[`name_${currentLang}`] || plan.name;
                      const priceNumber = Number(plan.price) || 0;

                      return (
                        <Card key={plan.id} style={[styles.catalogCard, isPopular && styles.popularCard]}>
                          {isPopular && (
                            <View style={styles.popularBadge}>
                              <Sparkles size={12} color="#fff" />
                              <Text style={styles.popularBadgeText}>{t("bookingFlow.general.mostPopular", { defaultValue: "MOST POPULAR" })}</Text>
                            </View>
                          )}

                          <View style={{ gap: 6 }}>
                            <Text style={[styles.planName, isPopular && { color: "#fff" }]}>
                              {planName}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                              <Text style={[styles.priceSign, isPopular && { color: "#EBE3DA" }]}>€</Text>
                              <Text style={[styles.priceValue, isPopular && { color: "#fff" }]}>
                                {priceNumber}
                              </Text>
                              <Text style={[styles.priceCycle, isPopular && { color: "rgba(255,255,255,0.8)" }]}>
                                / {plan.duration_weeks ? `${plan.duration_weeks} weeks` : "month"}
                              </Text>
                            </View>
                            <Text style={[styles.sessionText, isPopular && { color: "rgba(255,255,255,0.85)" }]}>
                              Includes {plan.max_reservations} sessions
                            </Text>
                          </View>

                          {/* Features */}
                          <View style={styles.featureList}>
                            {plan.features?.map((f: any, fIdx: number) => {
                              const featText = f[`feature_${currentLang}`] || f.feature;
                              return (
                                <View key={f.id || fIdx} style={styles.featureRow}>
                                  <View style={[styles.checkCircle, isPopular && styles.popularCheckCircle]}>
                                    <Check size={12} color={isPopular ? "#9B7C56" : "#fff"} strokeWidth={3} />
                                  </View>
                                  <Text style={[styles.featureText, isPopular && { color: "rgba(255,255,255,0.95)" }]}>
                                    {featText}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>

                          <Pressable
                            style={[styles.buyBtn, isPopular ? styles.popularBuyBtn : styles.standardBuyBtn]}
                            onPress={() => router.push("/(tabs)/home")}
                          >
                            <Text style={[styles.buyBtnText, isPopular && { color: "#9B7C56" }]}>
                              Select & Purchase
                            </Text>
                            <ArrowRight size={16} color={isPopular ? "#9B7C56" : "#fff"} />
                          </Pressable>
                        </Card>
                      );
                    })}
                  </View>
                ) : (
                  <View style={{ gap: 16 }}>
                    {sessionPasses.map((pass) => {
                      const passName = pass[`name_${currentLang}`] || pass.name;
                      const passPrice = Number(pass.price) || 0;

                      return (
                        <Card key={pass.id} style={styles.passCard}>
                          <View style={styles.passHeader}>
                            <View style={styles.passBadge}>
                              <Boxes size={14} color="#9B7C56" />
                              <Text style={styles.passBadgeText}>{t("bookingFlow.general.sessionPass", { defaultValue: "SESSION PASS" })}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
                              <Text style={{ fontSize: 16, fontWeight: "700", color: "#9B7C56" }}>€</Text>
                              <Text style={{ fontSize: 24, fontWeight: "800", color: "#1F2937" }}>
                                {passPrice}
                              </Text>
                            </View>
                          </View>

                          <View style={{ gap: 4, marginTop: 4 }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F2937" }}>
                              {passName}
                            </Text>
                            <Text style={{ fontSize: 13, color: "#6B5D54", fontWeight: "600" }}>
                              {pass.entry_limit} entries included • Valid for 1 year
                            </Text>
                          </View>

                          {/* Features */}
                          <View style={styles.featureList}>
                            {pass.features?.map((f: any, fIdx: number) => {
                              const featText = f[`feature_${currentLang}`] || f.feature;
                              return (
                                <View key={f.id || fIdx} style={styles.featureRow}>
                                  <View style={[styles.checkCircle, { backgroundColor: "#9B7C56" }]}>
                                    <Check size={12} color="#fff" strokeWidth={3} />
                                  </View>
                                  <Text style={styles.featureText}>{featText}</Text>
                                </View>
                              );
                            })}
                          </View>

                          <Pressable
                            style={[styles.buyBtn, styles.standardBuyBtn]}
                            onPress={() => router.push("/(tabs)/home")}
                          >
                            <Text style={styles.buyBtnText}>Purchase Pass</Text>
                            <ArrowRight size={16} color="#fff" />
                          </Pressable>
                        </Card>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  countBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FAF7F3",
    borderWidth: 1,
    borderColor: "#EFE8DE",
  },
  activeCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#9B7C56",
    shadowColor: "#9B7C56",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803D",
    letterSpacing: 0.5,
  },
  purchaseTypePill: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B5D54",
    backgroundColor: "#F4EEE7",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    letterSpacing: 0.5,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 4,
  },
  activePrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#9B7C56",
  },
  activeDivider: {
    height: 1,
    backgroundColor: "#F1EBE4",
    marginVertical: 12,
  },
  activeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EBE4",
    padding: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: "#9B7C56",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B5D54",
  },
  tabTextActive: {
    color: "#fff",
  },
  catalogCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    position: "relative",
    gap: 16,
  },
  popularCard: {
    backgroundColor: "#9B7C56",
    borderColor: "#886B47",
    shadowColor: "#9B7C56",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  popularBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#B8966C",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },
  priceSign: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9B7C56",
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 36,
  },
  priceCycle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  sessionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B5D54",
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#9B7C56",
    alignItems: "center",
    justifyContent: "center",
  },
  popularCheckCircle: {
    backgroundColor: "#FFFFFF",
  },
  featureText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  buyBtn: {
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  standardBuyBtn: {
    backgroundColor: "#9B7C56",
  },
  popularBuyBtn: {
    backgroundColor: "#FFFFFF",
  },
  buyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  passCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#FAF7F3",
    borderWidth: 1.5,
    borderColor: "#E2D3C4",
    gap: 16,
  },
  passHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FCF2E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F4D9C5",
  },
  passBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9B7C56",
    letterSpacing: 0.5,
  },
});
