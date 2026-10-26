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
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Compass,
  Check,
  Boxes,
  Layers,
  Lock,
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react-native";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";
import { useBookingStore } from "@/utils/bookingStore";
import { useAuthStore } from "@/utils/authStore";
import StripeElementsCheckout, { NativeCardDetails } from "@/components/booking/StripeElementsCheckout";
import { confirmStripeNativePayment } from "@/utils/stripe";
import { dashboardApi, DashboardBookingItem } from "@/utils/dashboardApi";
import { formatImageUrl, API_BASE_URL, getBaseUrl } from "@/utils/constants";
import { useNotifications } from "@/utils/notificationStore";
import legalApi, { fallbackSocialLinks, SocialMediaLinksData } from "@/utils/legalApi";

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
  const [sessionPasses, setSessionPasses] = useState<any[]>([]);
  const [activePlanTab, setActivePlanTab] = useState<"subscriptions" | "passes">("subscriptions");
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [nextVisit, setNextVisit] = useState<DashboardBookingItem | null>(null);
  const [loadingNextVisit, setLoadingNextVisit] = useState<boolean>(true);
  const [contactInfo, setContactInfo] = useState<{
    address?: string;
    phone?: string;
    email?: string;
  } | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialMediaLinksData>(fallbackSocialLinks);

  // Purchase Modal State (Direct checkout for Plans and Session Passes)
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState<{
    type: "subscription" | "session_pass";
    item: any;
  } | null>(null);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPostalCode, setCheckoutPostalCode] = useState("1012 AB");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ideal">("card");
  const [selectedBank, setSelectedBank] = useState("ing");
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [purchaseErrorMessage, setPurchaseErrorMessage] = useState<string | null>(null);
  const [purchaseSuccessData, setPurchaseSuccessData] = useState<any | null>(null);
  const [stripeRefs, setStripeRefs] = useState<{ elements: any; stripe: any } | null>(null);
  const [nativeCardDetails, setNativeCardDetails] = useState<NativeCardDetails>({
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  // User profile state synchronized with Auth Store and backend API
  const [currentUser, setCurrentUser] = useState<any>(useAuthStore.getState().user);
  const [isLoggedIn, setIsLoggedIn] = useState(useAuthStore.getState().isAuthenticated);
  const { unreadCount } = useNotifications();

  // Sync user info from auth store
  useEffect(() => {
    const auth = useAuthStore.getState();
    if (auth.user) {
      setCurrentUser(auth.user);
      setIsLoggedIn(auth.isAuthenticated);
      setCheckoutName(auth.user.name || "");
      setCheckoutEmail(auth.user.email || "");
    }
    return useAuthStore.subscribe(() => {
      const state = useAuthStore.getState();
      setCurrentUser(state.user);
      setIsLoggedIn(state.isAuthenticated);
      if (state.user) {
        setCheckoutName(state.user.name || "");
        setCheckoutEmail(state.user.email || "");
      }
    });
  }, []);

  const openPurchaseModal = (type: "subscription" | "session_pass", item: any) => {
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    setSelectedPurchaseItem({ type, item });
    setPurchaseErrorMessage(null);
    setPurchaseSuccessData(null);
    setPurchaseModalVisible(true);
  };

  const handleExecutePurchase = async () => {
    if (!selectedPurchaseItem) return;
    const auth = useAuthStore.getState();
    if (!auth.accessToken) {
      router.push("/(auth)/login");
      return;
    }

    setPurchaseErrorMessage(null);
    setIsProcessingPurchase(true);

    try {
      const { type, item } = selectedPurchaseItem;
      const payload: any = {
        purchase_type: type,
        name: checkoutName.trim() || auth.user?.name || "Member",
        email: checkoutEmail.trim() || auth.user?.email || "member@heavenwellness.com",
      };

      if (type === "session_pass") {
        payload.pass_id = item.id;
      } else {
        payload.plan_id = item.id;
      }

      // 1. Call purchase creation endpoint
      const res = await fetch(`${API_BASE_URL}/payments/purchase/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        const errorDetail = resData.detail || resData.error || resData.message || "Could not initialize purchase.";
        setPurchaseErrorMessage(errorDetail);
        setIsProcessingPurchase(false);
        return;
      }

      const clientSecret = resData.client_secret;
      const purchaseRecord = resData.purchase;

      // 2. Confirm card payment with Stripe
      if (clientSecret) {
        if (Platform.OS === "web") {
          if (stripeRefs?.stripe && stripeRefs?.elements) {
            const { CardNumberElement } = await import("@stripe/react-stripe-js");
            const cardEl = stripeRefs.elements.getElement(CardNumberElement);

            if (cardEl) {
              const confirmResult = await stripeRefs.stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                  card: cardEl,
                  billing_details: {
                    name: checkoutName || auth.user?.name || "Cardholder",
                    email: checkoutEmail || auth.user?.email,
                    address: {
                      postal_code: checkoutPostalCode,
                    },
                  },
                },
              });

              if (confirmResult.error) {
                setPurchaseErrorMessage(confirmResult.error.message || "Card verification failed.");
                setIsProcessingPurchase(false);
                return;
              }

              if (confirmResult?.paymentIntent && (confirmResult.paymentIntent.status === "succeeded" || confirmResult.paymentIntent.status === "processing")) {
                const purchaseId = purchaseRecord?.purchase_id || resData?.purchase_id || purchaseRecord?.booking_id || resData?.booking_id;
                try {
                  await fetch(`${API_BASE_URL}/payments/confirm-payment/`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${auth.accessToken}`,
                    },
                    body: JSON.stringify({
                      payment_intent_id: confirmResult.paymentIntent.id,
                      ...(purchaseId ? { purchase_id: purchaseId } : {}),
                    }),
                  });
                } catch (confirmErr) {
                  console.warn("Backend confirm payment sync error:", confirmErr);
                }
              }
            }
          }
        } else {
          // Native mobile checkout (Android / iOS)
          const nativeRes = await confirmStripeNativePayment({
            clientSecret,
            cardNumber: nativeCardDetails.cardNumber,
            cardExpiry: nativeCardDetails.cardExpiry,
            cardCvc: nativeCardDetails.cardCvc,
            cardHolder: checkoutName || auth.user?.name || "Cardholder",
            postalCode: checkoutPostalCode,
            email: checkoutEmail || auth.user?.email,
          });

          if (!nativeRes.success) {
            setPurchaseErrorMessage(nativeRes.error || "Card verification failed.");
            setIsProcessingPurchase(false);
            return;
          }

          if (nativeRes.paymentIntent?.id) {
            const purchaseId = purchaseRecord?.purchase_id || resData?.purchase_id || purchaseRecord?.booking_id || resData?.booking_id;
            try {
              await fetch(`${API_BASE_URL}/payments/confirm-payment/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${auth.accessToken}`,
                },
                body: JSON.stringify({
                  payment_intent_id: nativeRes.paymentIntent.id,
                  ...(purchaseId ? { purchase_id: purchaseId } : {}),
                }),
              });
            } catch (confirmErr) {
              console.warn("Backend confirm payment sync error:", confirmErr);
            }
          }
        }
      }

      // Payment success!
      setPurchaseSuccessData(purchaseRecord || resData);
    } catch (e: any) {
      setPurchaseErrorMessage(e.message || "Failed to process purchase. Please verify payment details.");
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/services/`);
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

    const fetchPlansAndPasses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/plans-and-passes/`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            const subPlans = Array.isArray(data.subscription_plans) ? data.subscription_plans : [];
            const sessPasses = Array.isArray(data.session_passes) ? data.session_passes : [];

            if (subPlans.length > 0) setPlans(subPlans);
            if (sessPasses.length > 0) setSessionPasses(sessPasses);

            if (subPlans.length > 0 || sessPasses.length > 0) return;
          }
        }
      } catch {
        // Fallback or fallback to separate endpoints
      }

      // Secondary fallback attempts for individual endpoints
      try {
        const [subRes, passRes] = await Promise.all([
          fetch(`${API_BASE_URL}/payments/subscription-plans/`).catch(() => null),
          fetch(`${API_BASE_URL}/payments/session-passes/`).catch(() => null),
        ]);

        let hasData = false;
        if (subRes && subRes.ok) {
          const subData = await subRes.json();
          if (Array.isArray(subData) && subData.length > 0) {
            if (isMounted) setPlans(subData);
            hasData = true;
          }
        }
        if (passRes && passRes.ok) {
          const passData = await passRes.json();
          if (Array.isArray(passData) && passData.length > 0) {
            if (isMounted) setSessionPasses(passData);
            hasData = true;
          }
        }
        if (hasData) return;
      } catch {
        // Fallback to static defaults
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
        setSessionPasses([
          {
            id: 1,
            name: "10 Session pass",
            price: "200.00",
            entry_limit: 10,
            features: [
              { id: 1, feature: "10-session salt pass (€20 per session)" },
              { id: 2, feature: "Linked directly to customer account" },
              { id: 3, feature: "Valid for 1 full year after purchase" },
            ],
          },
        ]);
      }
    };

    const fetchDashboardData = async () => {
      try {
        const auth = useAuthStore.getState();
        if (auth.accessToken) {
          // Fetch fresh user profile from API
          try {
            const userRes = await fetch(`${API_BASE_URL}/auth/user/`, {
              headers: {
                Authorization: `Bearer ${auth.accessToken}`,
              },
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (isMounted) {
                setCurrentUser(userData);
                useAuthStore.setUser(userData);
              }
            }
          } catch (err) {
            console.warn("Could not fetch user profile:", err);
          }
        }

        const data = await dashboardApi.getUserDashboard();
        if (isMounted && data?.home?.next_visit) {
          setNextVisit(data.home.next_visit);
        }
      } catch (e) {
        console.warn("Could not fetch user dashboard for next visit:", e);
      }
    };

    const fetchContactInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/others/contact-info/`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json?.data) {
            setContactInfo(json.data);
          }
        }
      } catch (e) {
        console.warn("Could not fetch contact info:", e);
      }
    };

    const fetchSocialLinks = async () => {
      try {
        const links = await legalApi.getSocialMediaLinks();
        if (isMounted && links) {
          setSocialLinks(links);
        }
      } catch (e) {
        console.warn("Could not fetch social media links:", e);
      }
    };

    Promise.all([
      fetchServices().finally(() => {
        if (isMounted) setLoadingServices(false);
      }),
      fetchPlansAndPasses().finally(() => {
        if (isMounted) setLoadingPlans(false);
      }),
      fetchDashboardData().finally(() => {
        if (isMounted) setLoadingNextVisit(false);
      }),
      fetchContactInfo(),
      fetchSocialLinks(),
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
      return `${getBaseUrl()}${item.image.startsWith("/") ? "" : "/"}${item.image}`;
    }
    const cleanType = (item.type || "").toLowerCase().trim();
    return DEFAULT_FALLBACK_IMAGES[cleanType] || DEFAULT_FALLBACK_IMAGES.sauna;
  };

  return (
    <Layout title={t("tabs.home")}>
      {/* User Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.userInfo}
          onPress={() => router.push(isLoggedIn ? "/(tabs)/profile/preview" : "/(auth)/login")}
        >
          <Image
            source={
              (currentUser?.image || currentUser?.avatar || currentUser?.profile_picture)
                ? formatImageUrl(currentUser.image || currentUser.avatar || currentUser.profile_picture)
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    currentUser?.name || (isLoggedIn ? "Member" : "Guest User")
                  )}&background=9B7C56&color=fff&size=150`
            }
            style={styles.avatar}
          />
          <View>
            <Text variant="caption" style={styles.welcomeText}>
              {t("home.welcomeBack")}
            </Text>
            <Text style={styles.userName} numberOfLines={1}>
              {currentUser?.name || (isLoggedIn ? "Member" : "Guest User")}
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={styles.notificationButton}
          onPress={() => router.push("/notifications")}
        >
          <Icon name={Bell} size={24} color={primary} />
          {unreadCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                backgroundColor: "#EF4444",
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                paddingHorizontal: 5,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1.5,
                borderColor: "#FFFFFF",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: "800",
                  textAlign: "center",
                  lineHeight: 14,
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
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
      {nextVisit ? (
        <View style={styles.nextVisitCard}>
          <View style={styles.cardHeader}>
            <View style={styles.nextVisitBadge}>
              <Sparkles size={16} color="white" />
              <Text style={styles.nextVisitLabel}>
                {t("home.nextVisit.label")}
              </Text>
            </View>
            <Text style={styles.serviceName}>{nextVisit.service_name || "Wellness Session"}</Text>
          </View>

          <View style={styles.cardDetails}>
            <DetailItem
              icon={Calendar}
              label={t("booking.details.labels.date")}
              value={nextVisit.date}
              iconBg={lightBeige}
            />
            <DetailItem
              icon={Clock}
              label={t("booking.details.labels.time")}
              value={nextVisit.time ? (nextVisit.time.length === 5 ? `${nextVisit.time}` : nextVisit.time) : "Flexible"}
              iconBg={lightBeige}
            />
            <DetailItem
              icon={Users}
              label={t("booking.details.labels.guests")}
              value={`${nextVisit.guests} ${nextVisit.guests > 1 ? "people" : "person"}`}
              iconBg={lightBeige}
            />

            <Button
              style={styles.viewDetailsButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/booking/[id]",
                  params: {
                    id: nextVisit.booking_id,
                    type: nextVisit.service_type,
                    title: nextVisit.service_name,
                    date: nextVisit.date,
                    time: nextVisit.time,
                    guests: String(nextVisit.guests),
                    status: nextVisit.status,
                    paymentStatus: nextVisit.payment_status,
                    total_price: nextVisit.total_price,
                    access_code: nextVisit.access_code,
                  },
                })
              }
            >
              <Text style={styles.viewDetailsText}>
                {t("home.nextVisit.details")}
              </Text>
              <ChevronRight size={18} color={"#6B5D54"} />
            </Button>
          </View>
        </View>
      ) : null}

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

                    if (
                      serviceType === "eventspace" ||
                      serviceType === "event" ||
                      serviceType === "events"
                    ) {
                      router.push("/(bookings)/eventspace");
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

      {/* Memberships, Plans & Passes Section */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={styles.sectionTitle}>
              {"Memberships, Plans & Passes"}
            </Text>
          </View>
        </View>

        {/* Tab Toggle: Subscriptions vs Session Passes */}
        <View style={stylesPlanCard.tabContainer}>
          <Pressable
            style={[
              stylesPlanCard.tabButton,
              activePlanTab === "subscriptions" && stylesPlanCard.tabButtonActive,
            ]}
            onPress={() => setActivePlanTab("subscriptions")}
          >
            <Layers
              size={16}
              color={activePlanTab === "subscriptions" ? "#fff" : brownGold}
            />
            <Text
              style={[
                stylesPlanCard.tabText,
                activePlanTab === "subscriptions" && stylesPlanCard.tabTextActive,
              ]}
            >
              Subscription Plans ({plans.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              stylesPlanCard.tabButton,
              activePlanTab === "passes" && stylesPlanCard.tabButtonActive,
            ]}
            onPress={() => setActivePlanTab("passes")}
          >
            <Boxes
              size={16}
              color={activePlanTab === "passes" ? "#fff" : brownGold}
            />
            <Text
              style={[
                stylesPlanCard.tabText,
                activePlanTab === "passes" && stylesPlanCard.tabTextActive,
              ]}
            >
              Session Passes ({sessionPasses.length})
            </Text>
          </Pressable>
        </View>

        {loadingPlans ? (
          <View style={{ padding: 24, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="small" color={brownGold} />
          </View>
        ) : activePlanTab === "subscriptions" ? (
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
                    onPress={() => openPurchaseModal("subscription", plan)}
                  >
                    <Text
                      style={[
                        stylesPlanCard.actionBtnText,
                        isPopular ? { color: darkBrown } : { color: "#fff" },
                      ]}
                    >
                      Apply Now • Choose Plan
                    </Text>
                    <ChevronRight size={18} color={isPopular ? darkBrown : "#fff"} />
                  </Button>
                </Card>
              );
            })}
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {sessionPasses.map((pass) => {
              const passName = pass[`name_${i18n?.language?.split("-")[0]}`] || pass.name;
              const priceNumber = Number(pass.price) || 0;
              const entryLimit = pass.entry_limit || 10;
              const pricePerSession = entryLimit > 0 ? (priceNumber / entryLimit).toFixed(0) : 20;

              return (
                <Card
                  key={pass.id}
                  style={[
                    stylesPlanCard.card,
                    stylesPlanCard.passCard,
                  ]}
                >
                  <View style={stylesPlanCard.passBadge}>
                    <Boxes size={12} color="#9B7C56" />
                    <Text style={stylesPlanCard.passBadgeText}>SESSION PASS</Text>
                  </View>

                  <View style={{ gap: 6 }}>
                    <Text style={stylesPlanCard.planName}>
                      {passName}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                      <Text style={stylesPlanCard.priceSign}>€</Text>
                      <Text style={stylesPlanCard.priceValue}>{priceNumber}</Text>
                      <Text style={stylesPlanCard.priceCycle}>
                        (€{pricePerSession} per session)
                      </Text>
                    </View>
                    <Text style={stylesPlanCard.reservationLimit}>
                      Includes {entryLimit} sessions • Valid for 1 year
                    </Text>
                  </View>

                  {/* Pass Features */}
                  <View style={stylesPlanCard.featureList}>
                    {pass.features?.map((f: any, fIdx: number) => {
                      const featText = f[`feature_${i18n?.language?.split("-")[0]}`] || f.feature;
                      return (
                        <View key={f.id || fIdx} style={stylesPlanCard.featureRow}>
                          <View
                            style={[
                              stylesPlanCard.checkCircle,
                              { backgroundColor: lightBeige },
                            ]}
                          >
                            <Check size={14} color={brownGold} strokeWidth={2.5} />
                          </View>
                          <Text style={stylesPlanCard.featureText}>
                            {featText}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Choose Pass Button */}
                  <Button
                    style={[
                      stylesPlanCard.actionBtn,
                      { backgroundColor: brownGold },
                    ]}
                    onPress={() => openPurchaseModal("session_pass", pass)}
                  >
                    <Text style={[stylesPlanCard.actionBtnText, { color: "#fff" }]}>
                      Apply Now • Get Session Pass
                    </Text>
                    <ChevronRight size={18} color="#fff" />
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
          {/* Address & Phone & Email */}
          <View style={styles.contactRow}>
            <View style={styles.contactIconBg}>
              <MapPin size={22} color={brownGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactSubTitle}>
                {t("home.contact.addressTitle")}
              </Text>
              <Text style={styles.contactValue}>
                {contactInfo?.address || t("home.contact.address")}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.contactRow}
            onPress={() => {
              const phoneVal = contactInfo?.phone || t("home.contact.phone");
              Linking.openURL(`tel:${phoneVal.replace(/[^0-9+]/g, "")}`);
            }}
          >
            <View style={styles.contactIconBg}>
              <Phone size={22} color={brownGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactSubTitle}>
                {t("home.contact.phoneTitle")}
              </Text>
              <Text style={styles.contactValueHighlight}>
                {contactInfo?.phone || t("home.contact.phone")}
              </Text>
            </View>
          </Pressable>

          {(contactInfo?.email || t("home.contact.emailTitle")) && (
            <Pressable
              style={styles.contactRow}
              onPress={() => {
                const emailVal = contactInfo?.email || "hello@havenwellness.com";
                Linking.openURL(`mailto:${emailVal}`);
              }}
            >
              <View style={styles.contactIconBg}>
                <Mail size={22} color={brownGold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactSubTitle}>
                  {t("home.contact.emailTitle") || "Email"}
                </Text>
                <Text style={styles.contactValueHighlight}>
                  {contactInfo?.email || "hello@havenwellness.com"}
                </Text>
              </View>
            </Pressable>
          )}

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

      {/* Social Media Footer (Facebook, Instagram & Twitter Logos) */}
      <View style={styles.socialFooter}>
        <Pressable
          style={styles.socialButton}
          onPress={() =>
            Linking.openURL(socialLinks.facebook || fallbackSocialLinks.facebook || "https://facebook.com")
          }
        >
          <Facebook size={34} color={brownGold} />
        </Pressable>
        <Pressable
          style={styles.socialButton}
          onPress={() =>
            Linking.openURL(socialLinks.instagram || fallbackSocialLinks.instagram || "https://instagram.com")
          }
        >
          <Instagram size={34} color={brownGold} />
        </Pressable>
        <Pressable
          style={styles.socialButton}
          onPress={() =>
            Linking.openURL(socialLinks.twitter || fallbackSocialLinks.twitter || "https://twitter.com")
          }
        >
          <Twitter size={34} color={brownGold} />
        </Pressable>
      </View>

      {/* Direct Card Purchase Modal for Plans & Passes */}
      <Modal
        visible={purchaseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={stylesModalCheckout.overlay}>
          <View style={stylesModalCheckout.content}>
            {/* Modal Header */}
            <View style={stylesModalCheckout.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={stylesModalCheckout.headerIconCircle}>
                  <CreditCard size={18} color="#9B7C56" />
                </View>
                <View>
                  <Text style={stylesModalCheckout.title}>
                    {purchaseSuccessData ? "Purchase Confirmed" : "Complete Purchase"}
                  </Text>
                  <Text style={stylesModalCheckout.subtitle}>
                    {selectedPurchaseItem?.type === "session_pass" ? "Session Pass Access" : "Recurring Membership"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setPurchaseModalVisible(false)}
                style={stylesModalCheckout.closeBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {purchaseSuccessData ? (
              /* Success View */
              <View style={{ alignItems: "center", paddingVertical: 20, gap: 12 }}>
                <View style={stylesModalCheckout.successIconCircle}>
                  <CheckCircle2 size={40} color="#059669" />
                </View>
                <Text style={stylesModalCheckout.successTitle}>Payment Successful!</Text>
                <Text style={stylesModalCheckout.successSubtitle}>
                  Your {selectedPurchaseItem?.item?.name} has been activated and linked directly to your account.
                </Text>

                <View style={stylesModalCheckout.receiptBox}>
                  <Text style={stylesModalCheckout.receiptText}>
                    Item: <Text style={{ fontWeight: "700", color: "#1d1a17" }}>{selectedPurchaseItem?.item?.name}</Text>
                  </Text>
                  <Text style={stylesModalCheckout.receiptText}>
                    Amount Paid: <Text style={{ fontWeight: "700", color: "#9B7C56" }}>€{selectedPurchaseItem?.item?.price}</Text>
                  </Text>
                  <Text style={stylesModalCheckout.receiptText}>
                    Account: <Text style={{ fontWeight: "700", color: "#1d1a17" }}>{checkoutEmail}</Text>
                  </Text>
                </View>

                <Button
                  style={{ width: "100%", backgroundColor: brownGold, marginTop: 10 }}
                  onPress={() => {
                    setPurchaseModalVisible(false);
                    router.push("/(tabs)/profile");
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>View in Profile</Text>
                </Button>
              </View>
            ) : (
              /* Checkout Form View */
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 14, paddingBottom: 16 }}
              >
                {/* Item Summary Card */}
                <View style={stylesModalCheckout.summaryCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={stylesModalCheckout.summaryName}>
                        {selectedPurchaseItem?.item?.name}
                      </Text>
                      <Text style={stylesModalCheckout.summaryDesc}>
                        {selectedPurchaseItem?.type === "session_pass"
                          ? `${selectedPurchaseItem?.item?.entry_limit || 10} Salt Room sessions included`
                          : "Regular recurring halotherapy wellness"}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={stylesModalCheckout.summaryPrice}>
                        €{selectedPurchaseItem?.item?.price}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#64748B" }}>Total</Text>
                    </View>
                  </View>
                </View>

                {/* Member Details */}
                <View style={{ gap: 8 }}>
                  <Text style={stylesModalCheckout.fieldLabel}>Cardholder Name</Text>
                  <TextInput
                    style={stylesModalCheckout.textInput}
                    placeholder="Full Name"
                    value={checkoutName}
                    onChangeText={setCheckoutName}
                  />

                  <Text style={stylesModalCheckout.fieldLabel}>Email Address</Text>
                  <TextInput
                    style={stylesModalCheckout.textInput}
                    placeholder="email@example.com"
                    value={checkoutEmail}
                    onChangeText={setCheckoutEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Integrated Stripe Official Elements */}
                <StripeElementsCheckout
                  cardHolder={checkoutName}
                  setCardHolder={setCheckoutName}
                  postalCode={checkoutPostalCode}
                  setPostalCode={setCheckoutPostalCode}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  selectedBank={selectedBank}
                  setSelectedBank={setSelectedBank}
                  errorMessage={purchaseErrorMessage}
                  onNativeCardChange={setNativeCardDetails}
                  onElementsReady={(elements, stripe) => {
                    setStripeRefs({ elements, stripe });
                  }}
                />

                {/* Pay & Confirm Button */}
                <Button
                  disabled={isProcessingPurchase}
                  style={stylesModalCheckout.submitBtn}
                  onPress={handleExecutePurchase}
                >
                  {isProcessingPurchase ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Lock size={16} color="#fff" />
                      <Text style={stylesModalCheckout.submitBtnText}>
                        Pay €{selectedPurchaseItem?.item?.price} Securely
                      </Text>
                    </View>
                  )}
                </Button>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EBE4",
    padding: 4,
    borderRadius: 20,
    gap: 6,
    marginTop: 4,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B5D54",
  },
  tabTextActive: {
    color: "#fff",
  },
  passCard: {
    borderWidth: 1.5,
    borderColor: "#E2D3C4",
    backgroundColor: "#FAF7F3",
  },
  passBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#F3DECB",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  passBadgeText: {
    color: "#9B7C56",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
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

const stylesModalCheckout = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  content: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1EBE4",
    paddingBottom: 14,
    marginBottom: 14,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FCF2E9",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1d1a17",
    fontFamily: Fonts.serif,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  summaryName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1d1a17",
  },
  summaryDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#9B7C56",
    fontFamily: Fonts.serif,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#FAF7F2",
  },
  submitBtn: {
    backgroundColor: "#9B7C56",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#065F46",
    fontFamily: Fonts.serif,
  },
  successSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  receiptBox: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
    marginVertical: 6,
  },
  receiptText: {
    fontSize: 13,
    color: "#64748B",
  },
});

