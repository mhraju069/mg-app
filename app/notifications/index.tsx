import { ScreenView } from "@/components/layout/screen-view";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { Bell, ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  group: string;
}

export default function NotificationsScreen() {
  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const brownGold = "#9B7C56";
  const lightBeige = "#FCF2E9";
  const { t } = useTranslation();

  const notifications: NotificationItem[] = [
    {
      id: "1",
      title: t("notifications.items.bookingConfirmed.title"),
      description: t("notifications.items.bookingConfirmed.description"),
      time: "09:00 AM",
      group: t("notifications.groups.today"),
    },
    {
      id: "2",
      title: t("notifications.items.reminder.title"),
      description: t("notifications.items.reminder.description"),
      time: "09:00 AM",
      group: t("notifications.groups.yesterday"),
    },
    {
      id: "3",
      title: t("notifications.items.accessCode.title"),
      description: t("notifications.items.accessCode.description"),
      time: "09:00 AM",
      group: t("notifications.groups.yesterday"),
    },
    {
      id: "4",
      title: t("notifications.items.cancelled.title"),
      description: t("notifications.items.cancelled.description"),
      time: "09:00 AM",
      group: "jan 25, 2025",
    },
  ];

  const groupedNotifications = notifications.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  return (
    <View style={styles.container}>
      <BackHeader />
      <ScreenView safe={false} contentContainerStyle={{ paddingTop: 120 }}>
        <Text style={styles.title}>{t("notifications.title")}</Text>

        {Object.entries(groupedNotifications).map(([group, items], groupIndex) => (
          <View key={group} style={styles.groupContainer}>
            <View style={styles.groupHeader}>
              <Text style={[styles.groupTitle, { color: textMuted }]}>{group}</Text>
              {groupIndex > 0 && <View style={[styles.separator, { backgroundColor: border }]} />}
            </View>

            <View style={styles.notificationsList}>
              {items.map((item) => (
                <Pressable key={item.id} style={styles.notificationItem}>
                  <View style={[styles.iconCircle, { borderColor: border }]}>
                    <Bell size={20} color={brownGold} />
                  </View>
                  <View style={styles.content}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <ChevronRight size={18} color={textMuted} />
                    </View>
                    <Text style={[styles.itemDescription, { color: textMuted }]}>
                      {item.description}
                    </Text>
                    <Text style={[styles.itemTime, { color: textMuted }]}>
                      {item.time}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScreenView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: Fonts.title,
    marginBottom: 24,
  },
  groupContainer: {
    marginBottom: 32,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  separator: {
    flex: 1,
    height: 1,
  },
  notificationsList: {
    gap: 24,
  },
  notificationItem: {
    flexDirection: "row",
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.title,
  },
  itemDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.subtitle,
  },
  itemTime: {
    fontSize: 13,
    marginTop: 2,
  },
});
