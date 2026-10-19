import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { Image } from "expo-image";
import {
  Bell,
  Search,
  Sparkles,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Plus,
  Coffee,
  Flame,
  PartyPopper,
  Heart,
  Gift,
  Wine,
  Briefcase,
  Sun,
  Wind,
  MapPin,
  Phone,
  Instagram,
  Facebook,
  Compass,
} from "lucide-react-native";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const primary = useColor("primary");
  const background = useColor("background");
  const textMuted = useColor("textMuted");
  const border = useColor("border");

  // Custom colors matching Heaven Wellness design system
  const brownGold = "#9B7C56";
  const lightBeige = "#F8F5F2";
  const darkBrown = "#3D2E24";

  const { t } = useTranslation();

  const styles = createStyles(
    background,
    border,
    textMuted,
    primary,
    brownGold,
    lightBeige,
    darkBrown,
    insets,
  );

  return (
    <Layout title={t("tabs.home")}>
      {/* User Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source="https://i.pravatar.cc/150?u=akash"
            style={styles.avatar}
          />
          <View>
            <Text variant="caption" style={styles.welcomeText}>
              {t("home.welcomeBack")}
            </Text>
            <Text style={styles.userName}>Akash</Text>
          </View>
        </View>
        <Pressable
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
        >
          <Icon name={Bell} size={24} color={primary} />
        </Pressable>
      </View>

      {/* Hero Banner Section */}
      <Card style={styles.heroCard}>
        <View style={styles.heroTaglineBadge}>
          <Sparkles size={14} color={brownGold} />
          <Text style={styles.heroTaglineText}>
            {t("home.hero.tagline")}
          </Text>
        </View>
        <Text style={styles.heroHeadline}>
          {t("home.hero.headline")}
        </Text>
        <Text style={styles.heroDescription}>
          {t("home.hero.description")}
        </Text>
        <Button
          style={styles.heroBookBtn}
          onPress={() => router.push("/bookings")}
        >
          <Text style={styles.heroBookBtnText}>
            {t("home.hero.bookNow")}
          </Text>
          <ChevronRight size={18} color="white" />
        </Button>
      </Card>

      {/* Search Bar */}
      <Input
        placeholder={t("home.search")}
        icon={Search}
        variant="outline"
        borderRadius={12}
      />

      {/* Next Visit Card */}
      <View style={styles.nextVisitCard}>
        <View style={styles.cardHeader}>
          <View style={styles.nextVisitBadge}>
            <Sparkles size={16} color="white" />
            <Text style={styles.nextVisitLabel}>
              {t("home.nextVisit.label")}
            </Text>
          </View>
          <Text style={styles.serviceName}>Private Sauna</Text>
        </View>

        <View style={styles.cardDetails}>
          <DetailItem
            icon={Calendar}
            label={t("booking.details.labels.date")}
            value="Sun 15 Feb"
            iconBg={lightBeige}
          />
          <DetailItem
            icon={Clock}
            label={t("booking.details.labels.time")}
            value="10:00 AM"
            iconBg={lightBeige}
          />
          <DetailItem
            icon={Users}
            label={t("booking.details.labels.guests")}
            value="2 people"
            iconBg={lightBeige}
          />

          <Button
            style={styles.viewDetailsButton}
            onPress={() => router.push("/(tabs)/booking/1")}
          >
            <Text style={styles.viewDetailsText}>
              {t("home.nextVisit.details")}
            </Text>
            <ChevronRight size={18} color={"#6B5D54"} />
          </Button>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.quickActions.title")}</Text>
        <View style={styles.quickActionsGrid}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => router.push("/bookings")}
          >
            <ActionCard
              icon={Plus}
              title={t("home.quickActions.newBooking")}
              subTitle={t("home.quickActions.newBookingSub")}
              labelBg={lightBeige}
            />
          </Pressable>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => router.push("/(tabs)/booking")}
          >
            <ActionCard
              icon={Calendar}
              title={t("home.quickActions.myBookings")}
              subTitle={t("home.quickActions.myBookingsSub", { count: 2 })}
              labelBg={lightBeige}
            />
          </Pressable>
        </View>
      </View>

      {/* Our Services Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.ourServices.title")}</Text>
        <View style={styles.servicesGrid}>
          <ServiceCard
            icon={Coffee}
            title={t("home.ourServices.lunchroom.title")}
            description={t("home.ourServices.lunchroom.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
          <ServiceCard
            icon={Flame}
            title={t("home.ourServices.sauna.title")}
            description={t("home.ourServices.sauna.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
          <ServiceCard
            icon={PartyPopper}
            title={t("home.ourServices.events.title")}
            subtitle={t("home.ourServices.events.subtitle")}
            description={t("home.ourServices.events.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
        </View>
      </View>

      {/* Relax. Enjoy. Story Section */}
      <Card style={styles.relaxCard}>
        <View style={styles.relaxHeader}>
          <Compass size={24} color={brownGold} />
          <Text style={styles.relaxTitle}>
            {t("home.relaxEnjoy.title")}
          </Text>
        </View>
        <Text style={styles.relaxSubtitle}>
          {t("home.relaxEnjoy.subtitle")}
        </Text>
        <Text style={styles.relaxBody}>
          {t("home.relaxEnjoy.description1")}
        </Text>
        <Text style={styles.relaxBody}>
          {t("home.relaxEnjoy.description2")}
        </Text>
      </Card>

      {/* Activities Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.activities.title")}</Text>
        <View style={styles.activitiesGrid}>
          <ActivityCard
            icon={Heart}
            title={t("home.activities.weddings.title")}
            description={t("home.activities.weddings.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
          <ActivityCard
            icon={Gift}
            title={t("home.activities.babyshowers.title")}
            subtitle={t("home.activities.babyshowers.subtitle")}
            description={t("home.activities.babyshowers.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
          <ActivityCard
            icon={Wine}
            title={t("home.activities.bachelorParties.title")}
            subtitle={t("home.activities.bachelorParties.subtitle")}
            description={t("home.activities.bachelorParties.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
          <ActivityCard
            icon={Briefcase}
            title={t("home.activities.corporateEvents.title")}
            subtitle={t("home.activities.corporateEvents.subtitle")}
            description={t("home.activities.corporateEvents.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
          <ActivityCard
            icon={Sun}
            title={t("home.activities.mindfulness.title")}
            description={t("home.activities.mindfulness.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
          <ActivityCard
            icon={Wind}
            title={t("home.activities.saltRoom.title")}
            description={t("home.activities.saltRoom.description")}
            brownGold={brownGold}
            lightBeige={lightBeige}
          />
        </View>
      </View>

      {/* Get in Touch & Opening Hours */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.contact.title")}</Text>
        <Card style={styles.contactCard}>
          {/* Address & Phone */}
          <View style={styles.contactRow}>
            <View style={styles.contactIconBg}>
              <MapPin size={22} color={brownGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactSubTitle}>
                {t("home.contact.addressTitle")}
              </Text>
              <Text style={styles.contactValue}>
                {t("home.contact.address")}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${t("home.contact.phone").replace(/[^0-9+]/g, "")}`)}
          >
            <View style={styles.contactIconBg}>
              <Phone size={22} color={brownGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactSubTitle}>
                {t("home.contact.phoneTitle")}
              </Text>
              <Text style={styles.contactValueHighlight}>
                {t("home.contact.phone")}
              </Text>
            </View>
          </Pressable>

          {/* Lunchroom Hours */}
          <View style={styles.hoursBlock}>
            <Text style={styles.hoursBlockTitle}>
              {t("home.contact.lunchroomHoursTitle")}
            </Text>
            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>{t("home.contact.mon")}:</Text>
              <Text style={styles.hourValue}>{t("home.contact.closed")}</Text>
            </View>
            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>{t("home.contact.tue")}:</Text>
              <Text style={styles.hourValue}>{t("home.contact.closed")}</Text>
            </View>
            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>
                {t("home.contact.wed")} – {t("home.contact.sun")}:
              </Text>
              <Text style={styles.hourValue}>09:00 – 16:00</Text>
            </View>
          </View>

          {/* Wellness & Events Hours */}
          <View style={styles.hoursBlock}>
            <Text style={styles.hoursBlockTitle}>
              {t("home.contact.wellnessHoursTitle")}
            </Text>
            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>
                {t("home.contact.mon")} – {t("home.contact.thu")}:
              </Text>
              <Text style={styles.hourValue}>06:00 – 00:00</Text>
            </View>
            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>
                {t("home.contact.fri")} – {t("home.contact.sat")}:
              </Text>
              <Text style={styles.hourValue}>06:00 – 02:00</Text>
            </View>
            <View style={styles.hourRow}>
              <Text style={styles.dayLabel}>{t("home.contact.sun")}:</Text>
              <Text style={styles.hourValue}>06:00 – 00:00</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Booking CTA Footer Card */}
      <Card style={styles.bookingFooterCard}>
        <Text style={styles.bookingFooterTitle}>
          {t("home.bookingFooter.title")}
        </Text>
        <Text style={styles.bookingFooterSubtitle}>
          {t("home.bookingFooter.subtitle")}
        </Text>
        <Button
          style={styles.bookingFooterBtn}
          onPress={() => router.push("/bookings")}
        >
          <Text style={styles.bookingFooterBtnText}>
            {t("home.bookingFooter.ctaText")}
          </Text>
        </Button>
        <Text style={styles.bookingFooterWelcome}>
          {t("home.bookingFooter.welcomeText")}
        </Text>
      </Card>

      {/* Social Media Footer (Bigger Facebook & Instagram Logos) */}
      <View style={styles.socialFooter}>
        <Pressable
          style={styles.socialButton}
          onPress={() => Linking.openURL("https://facebook.com")}
        >
          <Facebook size={36} color={brownGold} />
        </Pressable>
        <Pressable
          style={styles.socialButton}
          onPress={() => Linking.openURL("https://instagram.com")}
        >
          <Instagram size={36} color={brownGold} />
        </Pressable>
      </View>
    </Layout>
  );
}

function DetailItem({ icon: IconComp, label, value, iconBg }: any) {
  const textMuted = useColor("textMuted");
  const styles = itemStyles(iconBg, textMuted);

  return (
    <View style={styles.detailItemCon}>
      <View style={styles.iconBatch}>
        <IconComp size={20} color="#9B7C56" />
      </View>
      <View>
        <Text variant="caption" style={styles.label}>
          {label}
        </Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function ActionCard({ icon: IconComp, title, subTitle, labelBg }: any) {
  const border = useColor("border");
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";

  const styles = actionCardStyles(border, labelBg, brownGold, textMuted);

  return (
    <Card style={styles.actionCard}>
      <View style={styles.actionIcon}>
        <IconComp size={24} color={brownGold} />
      </View>
      <View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text variant="caption" style={styles.actionSubTitle}>
          {subTitle}
        </Text>
      </View>
    </Card>
  );
}

function ServiceCard({ icon: IconComp, title, subtitle, description, brownGold, lightBeige }: any) {
  return (
    <Card style={stylesService.card}>
      <View style={stylesService.headerRow}>
        <View style={[stylesService.iconBox, { backgroundColor: lightBeige }]}>
          <IconComp size={22} color={brownGold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={stylesService.title}>{title}</Text>
          {subtitle && <Text style={stylesService.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={stylesService.description}>{description}</Text>
    </Card>
  );
}

function ActivityCard({ icon: IconComp, title, subtitle, description, brownGold, lightBeige }: any) {
  return (
    <Card style={stylesActivity.card}>
      <View style={stylesActivity.headerRow}>
        <View style={[stylesActivity.iconBox, { backgroundColor: lightBeige }]}>
          <IconComp size={22} color={brownGold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={stylesActivity.title}>{title}</Text>
          {subtitle && <Text style={stylesActivity.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={stylesActivity.description}>{description}</Text>
    </Card>
  );
}

const stylesService = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.title,
  },
  subtitle: {
    fontSize: 12,
    color: "#9B7C56",
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#6B5D54",
    lineHeight: 20,
  },
});

const stylesActivity = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: Fonts.title,
  },
  subtitle: {
    fontSize: 13,
    color: "#9B7C56",
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    color: "#6B5D54",
    lineHeight: 20,
  },
});

const createStyles = (
  background: string,
  border: string,
  textMuted: string,
  primary: string,
  brownGold: string,
  lightBeige: string,
  darkBrown: string,
  insets: any,
) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    welcomeText: {
      color: textMuted,
    },
    userName: {
      fontSize: 24,
      fontWeight: "700",
      fontFamily: Fonts.title,
    },
    notificationButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: border,
      justifyContent: "center",
      alignItems: "center",
    },
    heroCard: {
      padding: 22,
      borderRadius: 24,
      backgroundColor: lightBeige,
      borderWidth: 1,
      borderColor: "#EBE3DA",
      gap: 12,
    },
    heroTaglineBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    heroTaglineText: {
      fontSize: 13,
      fontWeight: "600",
      color: brownGold,
    },
    heroHeadline: {
      fontSize: 22,
      fontWeight: "700",
      color: darkBrown,
      fontFamily: Fonts.title,
      lineHeight: 28,
    },
    heroDescription: {
      fontSize: 14,
      color: "#6B5D54",
      lineHeight: 20,
    },
    heroBookBtn: {
      backgroundColor: brownGold,
      borderRadius: 30,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
      paddingVertical: 12,
    },
    heroBookBtnText: {
      color: "white",
      fontWeight: "700",
      fontSize: 15,
    },
    nextVisitCard: {
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: background,
      borderWidth: 1,
      borderColor: border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    cardHeader: {
      backgroundColor: brownGold,
      padding: 20,
      gap: 8,
    },
    nextVisitBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    nextVisitLabel: {
      color: "white",
      fontSize: 12,
      fontWeight: "600",
      opacity: 0.9,
    },
    serviceName: {
      color: "white",
      fontSize: 22,
      fontWeight: "700",
      fontFamily: Fonts.title,
    },
    cardDetails: {
      padding: 20,
      gap: 16,
    },
    viewDetailsButton: {
      marginTop: 8,
      backgroundColor: lightBeige,
      borderRadius: 30,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    viewDetailsText: {
      color: "#6B5D54",
      fontWeight: "600",
    },
    sectionHeader: {
      gap: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: darkBrown,
      fontFamily: Fonts.serif,
    },
    quickActionsGrid: {
      flexDirection: "row",
      gap: 16,
    },
    servicesGrid: {
      gap: 16,
    },
    relaxCard: {
      padding: 22,
      borderRadius: 24,
      backgroundColor: "#FAF8F5",
      borderWidth: 1,
      borderColor: "#EBE3DA",
      gap: 12,
    },
    relaxHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    relaxTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: brownGold,
      fontFamily: Fonts.title,
    },
    relaxSubtitle: {
      fontSize: 15,
      fontWeight: "600",
      color: darkBrown,
      lineHeight: 22,
    },
    relaxBody: {
      fontSize: 14,
      color: "#6B5D54",
      lineHeight: 22,
    },
    activitiesGrid: {
      gap: 16,
    },
    contactCard: {
      padding: 20,
      borderRadius: 22,
      gap: 20,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    contactIconBg: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: lightBeige,
      justifyContent: "center",
      alignItems: "center",
    },
    contactSubTitle: {
      fontSize: 12,
      color: textMuted,
      fontWeight: "600",
    },
    contactValue: {
      fontSize: 15,
      fontWeight: "600",
      color: darkBrown,
      lineHeight: 20,
    },
    contactValueHighlight: {
      fontSize: 16,
      fontWeight: "700",
      color: brownGold,
    },
    hoursBlock: {
      borderTopWidth: 1,
      borderTopColor: border,
      paddingTop: 14,
      gap: 8,
    },
    hoursBlockTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: darkBrown,
    },
    hourRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dayLabel: {
      fontSize: 14,
      color: textMuted,
    },
    hourValue: {
      fontSize: 14,
      fontWeight: "600",
      color: darkBrown,
    },
    bookingFooterCard: {
      padding: 24,
      borderRadius: 24,
      backgroundColor: brownGold,
      alignItems: "center",
      gap: 12,
    },
    bookingFooterTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "white",
      textAlign: "center",
      fontFamily: Fonts.title,
    },
    bookingFooterSubtitle: {
      fontSize: 14,
      color: "rgba(255,255,255,0.9)",
      textAlign: "center",
      lineHeight: 20,
    },
    bookingFooterBtn: {
      backgroundColor: "white",
      borderRadius: 30,
      paddingHorizontal: 24,
      paddingVertical: 14,
      marginTop: 6,
    },
    bookingFooterBtnText: {
      color: brownGold,
      fontWeight: "700",
      fontSize: 15,
    },
    bookingFooterWelcome: {
      fontSize: 13,
      color: "rgba(255,255,255,0.85)",
      fontStyle: "italic",
      textAlign: "center",
      marginTop: 4,
    },
    socialFooter: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 28,
      paddingVertical: 20,
    },
    socialButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: lightBeige,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#EBE3DA",
    },
  });

const itemStyles = (iconBg: string, textMuted: string) =>
  StyleSheet.create({
    detailItemCon: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconBatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: iconBg,
      justifyContent: "center",
      alignItems: "center",
    },
    label: {
      color: textMuted,
    },
    value: {
      fontWeight: "700",
      fontSize: 16,
      fontFamily: Fonts.subtitle,
    },
  });

const actionCardStyles = (
  border: string,
  labelBg: string,
  brownGold: string,
  textMuted: string,
) =>
  StyleSheet.create({
    actionCard: {
      flex: 1,
      padding: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: border,
      gap: 12,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: labelBg,
      justifyContent: "center",
      alignItems: "center",
    },
    actionTitle: {
      fontWeight: "700",
      fontSize: 16,
    },
    actionSubTitle: {
      color: textMuted,
    },
  });
