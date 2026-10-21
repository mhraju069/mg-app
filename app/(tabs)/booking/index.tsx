import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { router } from "expo-router";
import {
  Calendar,
  ChevronRight,
  Clock,
  Plus,
  Users,
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { dashboardApi, DashboardBookingItem } from "@/utils/dashboardApi";
import { useAuthStore } from "@/utils/authStore";

type BookingStatus = "Upcoming" | "Past";

export default function MyReservationsScreen() {
  const [activeTab, setActiveTab] = useState<BookingStatus>("Upcoming");
  const translateX = useSharedValue(0);

  const [upcomingList, setUpcomingList] = useState<DashboardBookingItem[]>([]);
  const [pastList, setPastList] = useState<DashboardBookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleTabChange = (tab: BookingStatus) => {
    setActiveTab(tab);
    translateX.value = withTiming(tab === "Upcoming" ? 0 : 1, {
      duration: 250,
    });
  };

  const buttonStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    width: (250 - 8) / 2,
    transform: [{ translateX: translateX.value * ((250 - 8) / 2) }],
    backgroundColor: "#D4C4B0",
    borderRadius: 10,
  }));

  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const secondary = useColor("secondary");
  const brownGold = "#9B7C56";
  const lightBeige = "#FCF2E9";
  const { t } = useTranslation();

  const fetchBookings = async () => {
    const auth = useAuthStore.getState();
    if (!auth.accessToken) {
      setLoading(false);
      return;
    }

    try {
      const data = await dashboardApi.getUserDashboard();
      if (data && data.my_bookings) {
        setUpcomingList(data.my_bookings.upcoming || []);
        setPastList(data.my_bookings.past || []);
      }
    } catch (e) {
      console.warn("Failed to fetch user bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return "10:00 AM";
    try {
      const parts = timeStr.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1] || "00";
      const period = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      return `${h12}:${minutes} ${period}`;
    } catch {
      return timeStr;
    }
  };

  const renderBookingCard = (booking: DashboardBookingItem) => (
    <Pressable
      key={booking.booking_id || booking.id}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/booking/[id]",
          params: {
            id: booking.booking_id || String(booking.id),
            type: booking.service_type,
            title: booking.service_name,
            date: booking.date,
            time: booking.time,
            guests: String(booking.guests),
            status: booking.status,
            paymentStatus: booking.payment_status,
            total_price: booking.total_price,
            access_code: booking.access_code,
          },
        })
      }
    >
      <Card style={[styles.bookingCard, { borderColor: border }]}>
        <View style={styles.cardHeader}>
          <View style={{ width: "70%" }}>
            <Text style={styles.bookingTitle}>{booking.service_name}</Text>
            <Text variant="caption" style={{ color: textMuted, textTransform: "capitalize" }}>
              {booking.service_type}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{booking.status || "Confirmed"}</Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Calendar size={14} color={brownGold} />
            <Text variant="caption" style={styles.infoText}>
              {booking.date}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color={brownGold} />
            <Text variant="caption" style={styles.infoText}>
              {formatDisplayTime(booking.time)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Users size={14} color={brownGold} />
            <Text variant="caption" style={styles.infoText}>
              {booking.guests} {booking.guests > 1 ? "guests" : "guest"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.paymentStatus}>
            {booking.payment_status ? booking.payment_status.replace(/_/g, " ").toUpperCase() : "PAID"}
          </Text>
          <ChevronRight size={18} color={textMuted} />
        </View>
      </Card>
    </Pressable>
  );

  const currentList = activeTab === "Upcoming" ? upcomingList : pastList;

  return (
    <Layout title={t("tabs.booking")}>
      <View>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("booking.title")}</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>
              {t("booking.subtitle")}
            </Text>
          </View>
          <Pressable
            style={[styles.addButton, { borderColor: border, borderWidth: 1 }]}
            onPress={() => router.push("/bookings")}
          >
            <Plus
              size={24}
              color="black"
              style={{ backgroundColor: secondary, borderRadius: 22 }}
            />
          </Pressable>
        </View>

        <View style={styles.tabsContainer}>
          <Animated.View style={buttonStyle} />

          <Pressable
            style={styles.tab}
            onPress={() => handleTabChange("Upcoming")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Upcoming" && styles.activeTabText,
              ]}
            >
              {t("booking.tabs.upcoming", { count: upcomingList.length }) || `Upcoming (${upcomingList.length})`}
            </Text>
          </Pressable>

          <Pressable style={styles.tab} onPress={() => handleTabChange("Past")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "Past" && styles.activeTabText,
              ]}
            >
              {t("booking.tabs.past", { count: pastList.length }) || `Past (${pastList.length})`}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="small" color={brownGold} />
            <Text style={{ marginTop: 12, color: textMuted, fontSize: 13 }}>
              Loading your reservations...
            </Text>
          </View>
        ) : currentList.length > 0 ? (
          <View style={styles.list}>
            {currentList.map(renderBookingCard)}
          </View>
        ) : (
          <Card
            style={{
              padding: 32,
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
            }}
          >
            <View
              style={[styles.emptyIconCircle, { backgroundColor: lightBeige }]}
            >
              <Calendar size={32} color={brownGold} />
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={styles.emptyTitle}>{t("booking.empty.title")}</Text>
              <Text style={[styles.emptySubtitle, { color: textMuted }]}>
                {t("booking.empty.subtitle")}
              </Text>
            </View>
            <Button onPress={() => router.push("/bookings")}>
              {t("booking.empty.button")}
            </Button>
          </Card>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Fonts.title,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Fonts.subtitle,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FCF2E9",
    width: 250,
    height: 48,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717A",
  },
  activeTabText: {
    color: "black",
    fontWeight: "700",
  },
  list: {
    gap: 16,
  },
  bookingCard: {
    padding: 20,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.title,
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
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardInfo: {
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
    paddingBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#3F3F46",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentStatus: {
    fontSize: 13,
    color: "#71717A",
    fontWeight: "600",
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.title,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: Fonts.subtitle,
  },
  bookNowText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
