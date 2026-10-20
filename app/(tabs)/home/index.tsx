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
  Check,
} from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Linking, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";
import { useBookingStore } from "@/utils/bookingStore";

const DEFAULT_FALLBACK_IMAGES: Record<string, string> = {
  sauna: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2070&auto=format&fit=crop",
  saltroom: "https://images.unsplash.com/photo-1544161515-436cefd54cbf?q=80&w=2070&auto=format&fit=crop",
  activity: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2070&auto=format&fit=crop",
  lunchroom: "https://images.unsplash.com/photo-1547573854-74d2a71d0826?q=80&w=2070&auto=format&fit=crop",
  package: "https://images.unsplash.com/photo-1576013551627-0cc20b96862c?q=80&w=2070&auto=format&fit=crop",
  event: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2070&auto=format&fit=crop",
};

interface ServiceItemData {
  id: number | string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
}

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

  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<ServiceItemData[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost/api/services/");
        if (response.ok) {
          const resJson = await response.json();
          const list = resJson?.data || (Array.isArray(resJson) ? resJson : []);
          if (isMounted && Array.isArray(list) && list.length > 0) {
            setServices(list);
            return;
          }
        }
      } catch {
        // Fallback or offline support
      }

      if (isMounted) {
        // Fallback default services if API cannot be reached
        setServices([
          {
            id: 1,
            type: "sauna",
            title: "Sauna Experience",
            subtitle: "Heat. Release. Renew.",
            description: "Your own exclusive sanctuary for ultimate privacy and relaxation.",
            image: DEFAULT_FALLBACK_IMAGES.sauna,
          },
          {
            id: 2,
            type: "saltroom",
            title: "Salt Room",
            subtitle: "Breathe. Purify. Restore.",
            description: "Natural microclimate therapy designed to promote deep healing.",
            image: DEFAULT_FALLBACK_IMAGES.saltroom,
          },
          {
            id: 3,
            type: "activity",
            title: "Activities & Yoga",
            subtitle: "Movement. Breath. Flow.",
            description: "Find your center with guided movement in our serenity studio.",
            image: DEFAULT_FALLBACK_IMAGES.activity,
          },
          {
            id: 4,
            type: "lunchroom",
            title: "Lunchroom Experience",
            subtitle: "Nourishment for body and soul",
            description: "Seasonal, organic culinary creations curated for well-being.",
            image: DEFAULT_FALLBACK_IMAGES.lunchroom,
          },
          {
            id: 5,
            type: "package",
            title: "Curated Packages",
            subtitle: "Complete journeys of renewal",
            description: "Combined wellness rituals, sauna, and nourishment packages.",
            image: DEFAULT_FALLBACK_IMAGES.package,
          },
          {
            id: 9,
            type: "event",
            title: "Events & Private Bookings",
            subtitle: "Celebrate memorable moments",
            description: "Exclusive hosting for special occasions, meetings, and parties.",
            image: DEFAULT_FALLBACK_IMAGES.event,
          },
        ]);
      }
    };

    const fetchPlans = async () => {
      try {
        const res = await fetch("http://localhost/api/payments/subscription-plans/");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setPlans(data);
            return;
          }
        }
      } catch {
        // Fallback below
      }

      if (isMounted) {
        setPlans([
          {
            id: 1,
            name: "Once a Week",
            price: "70.00",
            duration_weeks: 4,
            max_reservations: 4,
            features: [
              { id: 1, feature: "1 Salt Room session per week included" },
              { id: 2, feature: "Maximum 4 included sessions per 4-week period" },
              { id: 3, feature: "Exclusive Member access & lounge" },
            ],
          },
          {
            id: 2,
            name: "Unlimited",
            price: "100.00",
            duration_weeks: 4,
            max_reservations: 10,
            features: [
              { id: 4, feature: "Unlimited use within available capacity" },
              { id: 5, feature: "1-hour Salt Room halotherapy access" },
              { id: 6, feature: "Priority booking window & VIP perks" },
            ],
          },
        ]);
      }
    };

    Promise.all([
      fetchServices().finally(() => {
        if (isMounted) setLoadingServices(false);
      }),
      fetchPlans().finally(() => {
        if (isMounted) setLoadingPlans(false);
      }),
    ]);

    return () => {
      isMounted = false;
    };
  }, []);

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

  const getLocalizedTitle = (item: any) => {
    const lang = i18n?.language?.split("-")[0] || "en";
    return item[`title_${lang}`] || item.title || "";
  };

  const getLocalizedSubtitle = (item: any) => {
    const lang = i18n?.language?.split("-")[0] || "en";
    return item[`subtitle_${lang}`] || item.subtitle || "";
  };

  const getLocalizedDescription = (item: any) => {
    const lang = i18n?.language?.split("-")[0] || "en";
    return item[`description_${lang}`] || item.description || "";
  };

  const getServiceImage = (item: any) => {
    if (item.image && typeof item.image === "string") {
      if (item.image.startsWith("http://") || item.image.startsWith("https://")) {
        return item.image;
      }
      return `http://localhost${item.image.startsWith("/") ? "" : "/"}${item.image}`;
    }
    const cleanType = (item.type || "").toLowerCase().trim();
    return DEFAULT_FALLBACK_IMAGES[cleanType] || DEFAULT_FALLBACK_IMAGES.sauna;
  };

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

      {/* Services Section (Matching Web Reserve Section with Images) */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.sectionTitle}>{t("home.ourServices.title") || "Services"}</Text>
          <Pressable onPress={() => router.push("/bookings")}>
            <Text style={{ color: brownGold, fontWeight: "600", fontSize: 14 }}>
              {t("home.hero.bookNow") || "Reserve Now"} &rsaquo;
            </Text>
          </Pressable>
        </View>

        {loadingServices ? (
          <View style={{ padding: 30, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color={brownGold} />
          </View>
        ) : (
          <View style={styles.servicesGrid}>
            {services.map((item) => {
              const title = getLocalizedTitle(item);
              const subtitle = getLocalizedSubtitle(item);
              const description = getLocalizedDescription(item);
              const imgUrl = getServiceImage(item);
              const serviceType = (item.type || "").toLowerCase().trim();

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (serviceType === "lunchroom") {
                      useBookingStore.setState({
                        serviceId: "lunchroom-reservation",
                        serviceType: "lunchroom",
                        serviceTitle: "Lunchroom Table Reservation",
                        serviceSubtitle: "Nourishment for body and soul",
                        price: 0,
                        isFree: true,
                        durationHours: undefined,
                        guestsCount: 2,
                        selectedExtras: [],
                      });
                      router.push("/(bookings)/information");
                      return;
                    }

                    router.push({
                      pathname: "/(bookings)/[category]",
                      params: { category: serviceType || "sauna" },
                    });
                  }}
                >
                  <Card style={stylesServiceCard.card}>
                    {/* Service Image with Dark Gradient Overlay */}
                    <View style={stylesServiceCard.imageWrapper}>
                      <Image
                        source={{ uri: imgUrl }}
                        style={stylesServiceCard.image}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={stylesServiceCard.imageOverlay}>
                        <View style={stylesServiceCard.tagBadge}>
                          <Sparkles size={12} color="#fff" />
                          <Text style={stylesServiceCard.tagText}>
                            {serviceType.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={stylesServiceCard.overlayTitle}>{title}</Text>
                        {subtitle ? (
                          <Text style={stylesServiceCard.overlaySubtitle}>
                            {subtitle}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Card Content & Description */}
                    <View style={stylesServiceCard.body}>
                      {description ? (
                        <Text style={stylesServiceCard.description} numberOfLines={3}>
                          {description}
                        </Text>
                      ) : null}

                      <View style={stylesServiceCard.footerRow}>
                        <Text style={stylesServiceCard.reserveLink}>
                          {t("home.bookingFooter.ctaText") || "Reserve"}
                        </Text>
                        <ChevronRight size={16} color={brownGold} />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Subscription Plans Section */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={styles.sectionTitle}>
              {t("memberships.title") || "Memberships & Plans"}
            </Text>
            <Text style={{ fontSize: 13, color: "#6B5D54", marginTop: 2 }}>
              {t("memberships.subtitle") || "Flexible renewal passes for consistent wellness"}
            </Text>
          </View>
        </View>

        {loadingPlans ? (
          <View style={{ padding: 24, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color={brownGold} />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {plans.map((plan, index) => {
              const isPopular = index === 1;
              const planName = plan[`name_${i18n?.language?.split("-")[0]}`] || plan.name;
              const priceNumber = Number(plan.price) || 0;

              return (
                <Card
                  key={plan.id}
                  style={[
                    stylesPlanCard.card,
                    isPopular ? stylesPlanCard.popularCard : null,
                  ]}
                >
                  {isPopular && (
                    <View style={stylesPlanCard.popularBadge}>
                      <Sparkles size={12} color="#fff" />
                      <Text style={stylesPlanCard.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}

                  <View style={{ gap: 6 }}>
                    <Text style={[stylesPlanCard.planName, isPopular && { color: "#fff" }]}>
                      {planName}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                      <Text style={[stylesPlanCard.priceSign, isPopular && { color: "#EBE3DA" }]}>
                        €
                      </Text>
                      <Text style={[stylesPlanCard.priceValue, isPopular && { color: "#fff" }]}>
                        {priceNumber}
                      </Text>
                      <Text style={[stylesPlanCard.priceCycle, isPopular && { color: "rgba(255,255,255,0.8)" }]}>
                        / {plan.duration_weeks ? `${plan.duration_weeks} weeks` : "month"}
                      </Text>
                    </View>
                    <Text style={[stylesPlanCard.reservationLimit, isPopular && { color: "rgba(255,255,255,0.85)" }]}>
                      Includes {plan.max_reservations} sessions
                    </Text>
                  </View>

                  {/* Plan Features */}
                  <View style={stylesPlanCard.featureList}>
                    {plan.features?.map((f: any, fIdx: number) => {
                      const featText = f[`feature_${i18n?.language?.split("-")[0]}`] || f.feature;
                      return (
                        <View key={f.id || fIdx} style={stylesPlanCard.featureRow}>
                          <View
                            style={[
                              stylesPlanCard.checkCircle,
                              isPopular ? { backgroundColor: "rgba(255,255,255,0.25)" } : { backgroundColor: lightBeige },
                            ]}
                          >
                            <Check size={14} color={isPopular ? "#fff" : brownGold} strokeWidth={2.5} />
                          </View>
                          <Text
                            style={[
                              stylesPlanCard.featureText,
                              isPopular && { color: "rgba(255,255,255,0.95)" },
                            ]}
                          >
                            {featText}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Subscribe / Choose Button */}
                  <Button
                    style={[
                      stylesPlanCard.actionBtn,
                      isPopular
                        ? { backgroundColor: "#fff" }
                        : { backgroundColor: brownGold },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/(bookings)/[category]",
                        params: { category: "saltroom" },
                      })
                    }
                  >
                    <Text
                      style={[
                        stylesPlanCard.actionBtnText,
                        isPopular ? { color: darkBrown } : { color: "#fff" },
                      ]}
                    >
                      Choose Plan
                    </Text>
                    <ChevronRight size={18} color={isPopular ? darkBrown : "#fff"} />
                  </Button>
                </Card>
              );
            })}
          </View>
        )}
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

const stylesServiceCard = StyleSheet.create({
  card: {
    padding: 0,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBE3DA",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrapper: {
    width: "100%",
    height: 190,
    position: "relative",
    backgroundColor: "#E9DED1",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
    padding: 16,
    gap: 4,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  tagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.serif,
  },
  overlaySubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  body: {
    padding: 16,
    gap: 12,
  },
  description: {
    fontSize: 13,
    color: "#6B5D54",
    lineHeight: 19,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: "#F1EBE4",
  },
  reserveLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9B7C56",
  },
});

const stylesPlanCard = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  popularCard: {
    backgroundColor: "#9B7C56",
    borderColor: "#886C4B",
    shadowColor: "#9B7C56",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3D2E24",
    fontFamily: Fonts.title,
  },
  priceSign: {
    fontSize: 20,
    fontWeight: "700",
    color: "#9B7C56",
  },
  priceValue: {
    fontSize: 34,
    fontWeight: "800",
    color: "#3D2E24",
    fontFamily: Fonts.serif,
  },
  priceCycle: {
    fontSize: 14,
    color: "#6B5D54",
    fontWeight: "500",
  },
  reservationLimit: {
    fontSize: 13,
    color: "#6B5D54",
    fontWeight: "500",
  },
  featureList: {
    gap: 10,
    paddingVertical: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  actionBtn: {
    borderRadius: 25,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

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
