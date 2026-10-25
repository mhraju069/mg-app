import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/inside-header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Fonts } from "@/theme/colors";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import {
  Flame,
  Sparkles,
  Users,
  Utensils,
  PartyPopper,
  ChevronRight,
  Wind,
} from "lucide-react-native";
import { useBookingStore } from "@/utils/bookingStore";
import { API_BASE_URL, getBaseUrl } from "@/utils/constants";

interface ServiceItemData {
  id: number | string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  title_en?: string;
  title_nl?: string;
  title_de?: string;
  subtitle_en?: string;
  subtitle_nl?: string;
  subtitle_de?: string;
  description_en?: string;
  description_nl?: string;
  description_de?: string;
}

const DEFAULT_FALLBACK_IMAGES: Record<string, string> = {
  sauna: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2070&auto=format&fit=crop",
  saltroom: "https://images.unsplash.com/photo-1544161515-436cefd54cbf?q=80&w=2070&auto=format&fit=crop",
  activity: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2070&auto=format&fit=crop",
  activities: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2070&auto=format&fit=crop",
  lunchroom: "https://images.unsplash.com/photo-1547573854-74d2a71d0826?q=80&w=2070&auto=format&fit=crop",
  package: "https://images.unsplash.com/photo-1576013551627-0cc20b96862c?q=80&w=2070&auto=format&fit=crop",
  packages: "https://images.unsplash.com/photo-1576013551627-0cc20b96862c?q=80&w=2070&auto=format&fit=crop",
  event: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2070&auto=format&fit=crop",
  eventspace: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2070&auto=format&fit=crop",
};

const getServiceIcon = (type: string) => {
  const clean = (type || "").toLowerCase().trim();
  switch (clean) {
    case "sauna":
      return Flame;
    case "saltroom":
      return Wind;
    case "activity":
    case "activities":
      return Users;
    case "lunchroom":
      return Utensils;
    case "package":
    case "packages":
      return Sparkles;
    case "event":
    case "events":
    case "eventspace":
      return PartyPopper;
    default:
      return Sparkles;
  }
};

export default function SelectServicesScreen() {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<ServiceItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const brownGold = "#9B7C56";

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
      } catch (e) {
        console.warn("Could not fetch services from API:", e);
      }

      if (isMounted) {
        // Fallback default services if offline or endpoint unavailable
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

    fetchServices().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleServicePress = (item: ServiceItemData) => {
    const serviceType = (item.type || "").toLowerCase().trim();

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
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.selectServices.title") || "Select Services"}
          subtitle={t("createBooking.selectServices.subtitle") || "Choose your wellness experience"}
        />

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={brownGold} />
            <Text style={{ marginTop: 14, color: "#6B5D54", fontSize: 13, fontWeight: "500" }}>
              Loading available wellness services...
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {services.map((service) => {
              const title = getLocalizedTitle(service);
              const subtitle = getLocalizedSubtitle(service);
              const description = getLocalizedDescription(service);
              const imgUrl = getServiceImage(service);
              const cleanType = (service.type || "").toLowerCase().trim();
              const ServiceIcon = getServiceIcon(cleanType);

              return (
                <Pressable
                  key={service.id}
                  onPress={() => handleServicePress(service)}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
                >
                  <Card style={styles.categoryCard}>
                    {/* Hero Image Container with Overlay */}
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: imgUrl }}
                        style={styles.categoryImage}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={styles.categoryOverlay}>
                        <View style={styles.badgeRow}>
                          <View style={styles.iconCircle}>
                            <ServiceIcon color="#fff" size={20} />
                          </View>
                          <View style={styles.typeTag}>
                            <Text style={styles.typeTagText}>
                              {cleanType.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.overlayContent}>
                          <Text style={styles.categoryTitle}>{title}</Text>
                          {subtitle ? (
                            <Text style={styles.categorySubtitle} numberOfLines={2}>
                              {subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    {/* Description and Reserve Action Footer */}
                    <View style={styles.cardBody}>
                      {description ? (
                        <Text style={styles.descriptionText} numberOfLines={3}>
                          {description}
                        </Text>
                      ) : null}

                      <View style={styles.actionRow}>
                        <Text style={styles.reserveText}>
                          {t("home.bookingFooter.ctaText") || "Reserve Experience"}
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
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 20,
    paddingTop: 0,
    paddingBottom: 30,
  },
  categoryCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 24,
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
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "space-between",
    padding: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  typeTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  overlayContent: {
    gap: 4,
  },
  categoryTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.serif,
  },
  categorySubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontFamily: Fonts.subtitle,
    lineHeight: 18,
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: "#6B5D54",
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#F1EBE4",
  },
  reserveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9B7C56",
  },
});
