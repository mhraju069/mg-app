import { ScreenView } from "@/components/layout/screen-view";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import {
  Bell,
  ChevronRight,
  CheckCheck,
  Calendar,
  Sparkles,
  Info,
  Clock,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Tag,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { useNotifications, NotificationData } from "@/utils/notificationStore";

export default function NotificationsScreen() {
  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const brownGold = "#9B7C56";
  const { t } = useTranslation();

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (item: NotificationData) => {
    // 1. Mark as read on backend & local store
    if (!item.is_read) {
      await markAsRead(item.id);
    }
    // 2. Open Notification Details Modal
    setSelectedNotification(item);
  };

  const handleNavigateFromModal = async () => {
    if (!selectedNotification) return;

    const link = selectedNotification.link || selectedNotification.data?.link;
    const bookingId = selectedNotification.data?.booking_id;
    setSelectedNotification(null);

    if (link && typeof link === "string") {
      try {
        if (link.startsWith("/bookings/")) {
          const id = link.replace("/bookings/", "");
          router.push(`/(tabs)/booking/${id}` as any);
          return;
        }

        if (link.startsWith("/")) {
          router.push(link as any);
          return;
        } else if (link.startsWith("http://") || link.startsWith("https://")) {
          const { Linking } = await import("react-native");
          Linking.openURL(link);
          return;
        }
      } catch (e) {
        console.warn("Could not navigate to notification link:", link, e);
      }
    }

    if (bookingId) {
      router.push(`/(tabs)/booking/${bookingId}` as any);
      return;
    }

    // Default fallback
    router.push("/(tabs)/booking" as any);
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getGroupLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recent";
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (target.getTime() === today.getTime()) {
        return "Today";
      } else if (target.getTime() === yesterday.getTime()) {
        return "Yesterday";
      } else {
        return d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch {
      return "Recent";
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((acc, item) => {
    const group = getGroupLabel(item.created_at);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NotificationData[]>);

  const hasActionLink = Boolean(
    selectedNotification?.link ||
      selectedNotification?.data?.link ||
      selectedNotification?.data?.booking_id
  );

  return (
    <View style={styles.container}>
      <BackHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 110, paddingBottom: 40, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brownGold}
          />
        }
      >
        {/* Header Title with Mark All Read Action */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{t("notifications.title") || "Notifications"}</Text>
            {unreadCount > 0 && (
              <Text style={{ fontSize: 13, color: brownGold, fontWeight: "600", marginTop: -18, marginBottom: 12 }}>
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </Text>
            )}
          </View>

          {unreadCount > 0 && (
            <Pressable
              style={styles.markAllBtn}
              onPress={() => markAllAsRead()}
            >
              <CheckCheck size={16} color={brownGold} />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          )}
        </View>

        {isLoading && notifications.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={brownGold} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Bell size={32} color={brownGold} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={[styles.emptySubtitle, { color: textMuted }]}>
              When you receive booking updates, reminders, or access codes, they will appear here in real time.
            </Text>
          </View>
        ) : (
          Object.entries(groupedNotifications).map(([group, items], groupIndex) => (
            <View key={group} style={styles.groupContainer}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: textMuted }]}>{group}</Text>
                {groupIndex > 0 && (
                  <View style={[styles.separator, { backgroundColor: border }]} />
                )}
              </View>

              <View style={styles.notificationsList}>
                {items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.notificationItem,
                      !item.is_read && styles.unreadNotificationItem,
                    ]}
                    onPress={() => handleNotificationPress(item)}
                  >
                    <View
                      style={[
                        styles.iconCircle,
                        { borderColor: border },
                        !item.is_read && { backgroundColor: "#FCF2E9", borderColor: brownGold },
                      ]}
                    >
                      <Bell size={20} color={brownGold} />
                      {!item.is_read && <View style={styles.unreadDot} />}
                    </View>

                    <View style={styles.content}>
                      <View style={styles.itemHeader}>
                        <Text
                          style={[
                            styles.itemTitle,
                            !item.is_read && { fontWeight: "800", color: "#1F2937" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <ChevronRight size={18} color={textMuted} />
                      </View>

                      <Text
                        style={[
                          styles.itemDescription,
                          { color: item.is_read ? textMuted : "#374151" },
                        ]}
                      >
                        {item.body}
                      </Text>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <Text style={[styles.itemTime, { color: textMuted }]}>
                          {formatTimestamp(item.created_at)}
                        </Text>
                        {hasActionLink && (
                          <Text style={{ fontSize: 12, color: brownGold, fontWeight: "600" }}>
                            • View details
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* DETAILED NOTIFICATION MODAL */}
      <Modal
        visible={Boolean(selectedNotification)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalBadgeRow}>
                <View style={styles.modalIconBox}>
                  <Bell size={20} color={brownGold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTypeLabel}>
                    {selectedNotification?.notification_type?.toUpperCase() || "NOTIFICATION"}
                  </Text>
                  <Text style={styles.modalTimeLabel}>
                    {selectedNotification?.created_at ? formatFullDate(selectedNotification.created_at) : ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedNotification(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Title & Body */}
              <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
              <Text style={styles.modalBody}>{selectedNotification?.body}</Text>

              {/* Booking & Extra Data details box */}
              {selectedNotification?.data && Object.keys(selectedNotification.data).length > 0 && (
                <View style={styles.dataBox}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Info size={16} color={brownGold} />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1F2937" }}>
                      Booking & Service Details
                    </Text>
                  </View>

                  {selectedNotification.data.booking_id && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Booking Ref:</Text>
                      <Text style={[styles.dataValue, { color: brownGold, fontWeight: "800" }]}>
                        {selectedNotification.data.booking_id}
                      </Text>
                    </View>
                  )}

                  {selectedNotification.data.type && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Service Type:</Text>
                      <Text style={styles.dataValue}>{selectedNotification.data.type}</Text>
                    </View>
                  )}

                  {selectedNotification.data.date && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Date:</Text>
                      <Text style={styles.dataValue}>{selectedNotification.data.date}</Text>
                    </View>
                  )}

                  {selectedNotification.data.time && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Time:</Text>
                      <Text style={styles.dataValue}>{selectedNotification.data.time}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              {hasActionLink ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleNavigateFromModal}
                >
                  <Text style={styles.actionBtnText}>View Booking Details</Text>
                  <ExternalLink size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#9B7C56" }]}
                  onPress={() => setSelectedNotification(null)}
                >
                  <Text style={styles.actionBtnText}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7F3",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: Fonts.title,
    color: "#1F2937",
    marginBottom: 20,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F3EDE5",
    marginTop: -16,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9B7C56",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FCF2E9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#EADCCF",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  groupContainer: {
    marginBottom: 28,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  separator: {
    flex: 1,
    height: 1,
  },
  notificationsList: {
    gap: 14,
  },
  notificationItem: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0EAE1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadNotificationItem: {
    backgroundColor: "#FFFFFF",
    borderColor: "#9B7C56",
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#FAF7F3",
  },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  itemTime: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCF2E9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EADCCF",
  },
  modalTypeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9B7C56",
    letterSpacing: 0.5,
  },
  modalTimeLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F1EBE4",
    marginVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
    fontFamily: Fonts.title,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
    marginBottom: 16,
  },
  dataBox: {
    backgroundColor: "#FAF7F3",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EFE8DE",
    gap: 8,
    marginBottom: 10,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dataLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  dataValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
  },
  modalFooter: {
    marginTop: 18,
  },
  actionBtn: {
    backgroundColor: "#9B7C56",
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

