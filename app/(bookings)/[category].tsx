import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/inside-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { CATEGORY_DATA } from "@/utils/constants";
import { useBookingStore } from "@/utils/bookingStore";
import { useLocalSearchParams, router } from "expo-router";
import {
  Star,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Check,
  CheckCircle2,
  Info,
  Calendar,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, ActivityIndicator, ScrollView } from "react-native";

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const cleanCategory = (category || "sauna").toLowerCase().trim();
  const fallbackData = CATEGORY_DATA[cleanCategory] || CATEGORY_DATA.sauna;

  // General Category State
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  // Dedicated Sauna Configurator State (matching Web f:\CODE\maggy\w\app\booking\sauna\page.tsx)
  const isSaunaCategory = cleanCategory === "sauna";
  const [saunaType, setSaunaType] = useState<"private" | "shared">("private");
  const [durationHours, setDurationHours] = useState<3 | 4>(3);
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [selectedExtras, setSelectedExtras] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [saunaApiData, setSaunaApiData] = useState<any | null>(null);

  const primary = useColor("primary");
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const lightBeige = "#F8F5F2";
  const darkBrown = "#1d1a17";
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchCategoryDetails = async () => {
      try {
        const endpointType = cleanCategory === "arrangements" ? "package" : cleanCategory;
        const res = await fetch(`http://localhost/api/services/details/${endpointType}/`);
        if (res.ok) {
          const resJson = await res.json();
          const apiData = resJson?.data;

          if (isMounted && apiData) {
            if (isSaunaCategory) {
              setSaunaApiData(apiData);
              return;
            }

            let mappedItems: any[] = [];
            if (cleanCategory === "saltroom") {
              const salt = apiData.saltroom?.[0];
              if (salt) {
                mappedItems.push({
                  id: "salt-room",
                  title: salt.title || "Salt Room Halotherapy",
                  subtitle: salt.subtitle || "Halotherapy. Purify. Breathe.",
                  description: salt.description || "Therapeutic micro-climate salt room session.",
                  price: parseFloat(String(salt.price_per_person || 25)),
                  capacity: `Up to ${salt.max_capacity || 2} persons`,
                  duration: "1-hour session",
                  requirement: "Respiratory restoration",
                  rating: 4.9,
                  image: salt.images || "http://localhost/media/services/saltroom-v2.png",
                });
              }
            } else if (cleanCategory === "activity" || cleanCategory === "activities") {
              const acts = Array.isArray(apiData) ? apiData : apiData.activities || [];
              mappedItems = acts.map((act: any) => ({
                id: act.id,
                title: act.title || "Yoga & Movement Session",
                subtitle: act.host ? `Host: ${act.host}` : "Guided movement in our serenity studio",
                description: act.description || "Find your center with guided movement.",
                price: parseFloat(String(act.price || 15)),
                capacity: `Capacity: ${act.capacity || 10} persons`,
                duration: act.open_time && act.close_time ? `${act.open_time.slice(0, 5)} - ${act.close_time.slice(0, 5)}` : "60 mins",
                requirement: act.date || "Scheduled class",
                rating: 4.9,
                image: act.images || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2070&auto=format&fit=crop",
              }));
            } else if (cleanCategory === "package" || cleanCategory === "arrangements") {
              const pkgs = Array.isArray(apiData) ? apiData : apiData.packages || [];
              mappedItems = pkgs.map((pkg: any) => ({
                id: pkg.id,
                title: pkg.title || "Curated Wellness Journey",
                subtitle: "Full-day curated combination",
                description: pkg.description || "Comprehensive restorative experience.",
                price: parseFloat(String(pkg.price || 180)),
                capacity: "2-4 persons",
                duration: "Full-day experience",
                requirement: "Combined package",
                rating: 4.9,
                image: pkg.image || "http://localhost/media/services/WhatsApp_Image_2026-10-01_at_10.07.11_PM.jpeg",
              }));
            } else if (cleanCategory === "lunchroom") {
              const lRoom = Array.isArray(apiData) ? apiData[0] : apiData.lunchroom?.[0];
              mappedItems.push({
                id: "lunchroom-exp",
                title: lRoom?.title || "Lunchroom Table Reservation",
                subtitle: lRoom?.subtitle || "Nourishment for body and soul",
                description: lRoom?.description || "Seasonal, organic cuisine crafted for well-being.",
                price: 0,
                isFree: true,
                capacity: "1-6 people",
                duration: "120 minutes",
                requirement: "Payment at table",
                rating: 4.8,
                image: lRoom?.images || "http://localhost/media/services/pexels-alexy-almond-3758026.jpg",
              });
            }

            if (mappedItems.length > 0) {
              setServicesList(mappedItems);
              setSelectedService(mappedItems[0]);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch service detail, using local fallback:", err);
      }

      if (isMounted) {
        setServicesList(fallbackData.services || []);
        if (fallbackData.services?.length) {
          setSelectedService(fallbackData.services[0]);
        }
      }
    };

    fetchCategoryDetails().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [cleanCategory, isSaunaCategory]);

  // Sauna calculations derived directly from API data (identical to Web logic)
  const privateItem = saunaApiData?.private_sauna?.[0];
  const sharedItem = saunaApiData?.shared_sauna?.[0];

  const price3Hrs = privateItem?.base_price_3hrs ? parseFloat(String(privateItem.base_price_3hrs)) : 90;
  const price4Hrs = privateItem?.base_price_4hrs ? parseFloat(String(privateItem.base_price_4hrs)) : 350;
  const extraPersonFee = privateItem?.extra_person_price ? parseFloat(String(privateItem.extra_person_price)) : 50;
  const sharedPricePerson = sharedItem?.price_per_person ? parseFloat(String(sharedItem.price_per_person)) : 30;

  const rawFeatures: any[] = privateItem?.features || [];
  const apiFeatures = rawFeatures.map((f: any, idx: number) => ({
    id: String(f.id ?? idx),
    name: f.feature || f.feature_en || `Feature ${idx + 1}`,
    price: f.price ? parseFloat(String(f.price)) : 0,
  }));

  const extraGuestsCount = Math.max(0, guestsCount - 2);
  const privateBasePrice = durationHours === 4 ? price4Hrs : price3Hrs;
  const extrasCost = selectedExtras.reduce((sum, ext) => sum + ext.price, 0);

  const saunaTotal =
    saunaType === "private"
      ? privateBasePrice + extraGuestsCount * extraPersonFee + extrasCost
      : parseFloat((guestsCount * sharedPricePerson).toFixed(2));

  const toggleExtra = (extra: { id: string; name: string; price: number }) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      }
      return [...prev, extra];
    });
  };

  const handleContinue = () => {
    if (isSaunaCategory) {
      useBookingStore.setState({
        serviceId: saunaType === "private" ? "private-sauna" : "shared-sauna",
        serviceType: "sauna",
        serviceTitle:
          saunaType === "private"
            ? `Private Sauna (${durationHours} Hours)`
            : "Shared Sauna Experience",
        serviceSubtitle:
          saunaType === "private"
            ? "Exclusive sanctuary for ultimate privacy & relaxation"
            : "Communal tranquility & heat wellness",
        serviceImage:
          saunaType === "private"
            ? "http://localhost/media/services/private-sauna-v2.png"
            : "https://images.unsplash.com/photo-1544161515-436cefd54cbf?q=80&w=2070&auto=format&fit=crop",
        price: saunaTotal,
        isFree: false,
        saunaType,
        isSharedSauna: saunaType === "shared",
        durationHours: saunaType === "private" ? durationHours : 1.5,
        guestsCount,
        basePrice: privateBasePrice,
        extraPersonFee,
        selectedExtras,
      });

      router.push({
        pathname: "/(bookings)/select-date",
        params: {
          serviceId: saunaType === "private" ? "private-sauna" : "shared-sauna",
          category: "sauna",
          saunaType,
          durationHours: String(durationHours),
          guestsCount: String(guestsCount),
          price: String(saunaTotal),
        },
      });
      return;
    }

    if (!selectedService) return;

    useBookingStore.setState({
      serviceId: selectedService.id,
      serviceType: cleanCategory,
      serviceTitle: selectedService.title,
      serviceSubtitle: selectedService.subtitle || "",
      serviceImage: selectedService.image || "",
      price: selectedService.price || 0,
      isFree: selectedService.isFree || false,
      guestsCount: 2,
    });

    if (cleanCategory === "lunchroom") {
      router.push("/(bookings)/information");
    } else {
      router.push({
        pathname: "/(bookings)/select-date",
        params: {
          serviceId: selectedService.id,
          category: cleanCategory,
          serviceTitle: selectedService.title,
          price: selectedService.price,
        },
      });
    }
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={
            isSaunaCategory
              ? "Sauna & Wellness"
              : t(`home.categories.${cleanCategory}.title`) || `${cleanCategory.toUpperCase()} Experiences`
          }
          subtitle={
            isSaunaCategory
              ? "Exclusive private sanctuary or peaceful shared wellness experience."
              : t(`home.categories.${cleanCategory}.subtitle`) || "A carefully curated moment, designed around you."
          }
        />

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={brownGold} />
            <Text style={{ marginTop: 12, color: textMuted }}>Loading experience details...</Text>
          </View>
        ) : isSaunaCategory ? (
          /* ========================================================================= */
          /* DEDICATED SAUNA CONFIGURATOR (MATCHES WEB VERSION EXACTLY)               */
          /* ========================================================================= */
          <View style={{ gap: 20 }}>
            {/* 1. Toggle: Private Sauna vs Shared Sauna */}
            <View style={styles.toggleContainer}>
              <Pressable
                style={[
                  styles.toggleButton,
                  saunaType === "private" && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setSaunaType("private");
                  if (guestsCount < 2) setGuestsCount(2);
                }}
              >
                <Sparkles size={16} color={saunaType === "private" ? "#fff" : "#64748B"} />
                <Text
                  style={[
                    styles.toggleButtonText,
                    saunaType === "private" && styles.toggleButtonTextActive,
                  ]}
                >
                  Private Sauna
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.toggleButton,
                  saunaType === "shared" && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setSaunaType("shared");
                  if (guestsCount > 6) setGuestsCount(6);
                }}
              >
                <Users size={16} color={saunaType === "shared" ? "#fff" : "#64748B"} />
                <Text
                  style={[
                    styles.toggleButtonText,
                    saunaType === "shared" && styles.toggleButtonTextActive,
                  ]}
                >
                  Shared Sauna
                </Text>
              </Pressable>
            </View>

            {/* Banner description */}
            <Card style={styles.bannerCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.bannerIconBox}>
                  {saunaType === "private" ? (
                    <Sparkles size={22} color="#fff" />
                  ) : (
                    <Users size={22} color="#fff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerBadge}>
                    {saunaType === "private" ? "EXCLUSIVE RESERVATION" : "SHARED SESSION ACCESS"}
                  </Text>
                  <Text style={styles.bannerTitle}>
                    {saunaType === "private" ? "Private Sauna Sanctuary" : "Shared Sauna Experience"}
                  </Text>
                  <Text style={styles.bannerDesc}>
                    {saunaType === "private"
                      ? "Booked exclusively by your group (2 to 6 people). Includes sauna, heated pool, relaxation lounge & +30m auto cleaning buffer."
                      : "Different customers book the same 1.5h session. Max 6 people per session + 15m changeover buffer."}
                  </Text>
                </View>
              </View>
            </Card>

            {/* PRIVATE SAUNA CONFIGURATION */}
            {saunaType === "private" ? (
              <View style={{ gap: 20 }}>
                {/* Duration Selector */}
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>1. Select Session Duration</Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {/* 3 Hours */}
                    <Pressable
                      style={[
                        styles.durationCard,
                        durationHours === 3 && styles.durationCardActive,
                      ]}
                      onPress={() => setDurationHours(3)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.durationBadge}>POPULAR CHOICE</Text>
                        <Text style={styles.durationTitle}>3 Hours</Text>
                        <Text style={styles.durationSub}>
                          Base (2 guests): €{price3Hrs}
                        </Text>
                        <Text style={styles.durationExtra}>+€{extraPersonFee}/extra person</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          durationHours === 3 && styles.radioCircleActive,
                        ]}
                      >
                        {durationHours === 3 && <Check size={14} color="#fff" strokeWidth={3} />}
                      </View>
                    </Pressable>

                    {/* 4 Hours */}
                    <Pressable
                      style={[
                        styles.durationCard,
                        durationHours === 4 && styles.durationCardActive,
                      ]}
                      onPress={() => setDurationHours(4)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.durationBadge}>EXTENDED RELAXATION</Text>
                        <Text style={styles.durationTitle}>4 Hours</Text>
                        <Text style={styles.durationSub}>
                          Base (2 guests): €{price4Hrs}
                        </Text>
                        <Text style={styles.durationExtra}>+€{extraPersonFee}/extra person</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          durationHours === 4 && styles.radioCircleActive,
                        ]}
                      >
                        {durationHours === 4 && <Check size={14} color="#fff" strokeWidth={3} />}
                      </View>
                    </Pressable>
                  </View>
                </Card>

                {/* Number of Guests (2 to 6) */}
                <Card style={styles.sectionCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>2. Number of Guests (2–6)</Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: brownGold }}>
                      {guestsCount > 2 ? `2 Base + ${guestsCount - 2} Extra` : "2 Base Guests"}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {[2, 3, 4, 5, 6].map((num) => {
                      const isSel = guestsCount === num;
                      return (
                        <Pressable
                          key={num}
                          style={[
                            styles.guestOption,
                            isSel && styles.guestOptionActive,
                          ]}
                          onPress={() => setGuestsCount(num)}
                        >
                          <Text style={[styles.guestNumber, isSel && styles.guestNumberActive]}>
                            {num}
                          </Text>
                          <Text style={[styles.guestSub, isSel && styles.guestSubActive]}>
                            {num === 2 ? "Base" : `+€${(num - 2) * extraPersonFee}`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>

                {/* Extras & Enhancements */}
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>3. Enhance Your Experience (Optional Extras)</Text>
                  {apiFeatures.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 4 }}>
                      {apiFeatures.map((extra) => {
                        const isSelected = selectedExtras.some((e) => e.id === extra.id);
                        return (
                          <Pressable
                            key={extra.id}
                            style={[
                              styles.extraRow,
                              isSelected && styles.extraRowActive,
                            ]}
                            onPress={() => toggleExtra(extra)}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                              <View
                                style={[
                                  styles.checkbox,
                                  isSelected && styles.checkboxActive,
                                ]}
                              >
                                {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                              </View>
                              <Text style={styles.extraName}>{extra.name}</Text>
                            </View>
                            <Text style={styles.extraPrice}>
                              {extra.price > 0 ? `+€${extra.price}` : "Included"}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: textMuted, fontStyle: "italic" }}>
                      Standard wellness amenities included.
                    </Text>
                  )}
                </Card>
              </View>
            ) : (
              /* SHARED SAUNA CONFIGURATION */
              <View style={{ gap: 20 }}>
                {/* Session overview */}
                <Card style={styles.sectionCard}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={styles.overviewBadgeBox}>
                      <Text style={styles.overviewBadgeLabel}>Session Length</Text>
                      <Text style={styles.overviewBadgeValue}>1.5 Hours</Text>
                    </View>
                    <View style={styles.overviewBadgeBox}>
                      <Text style={styles.overviewBadgeLabel}>Price Per Person</Text>
                      <Text style={[styles.overviewBadgeValue, { color: brownGold }]}>€{sharedPricePerson}</Text>
                    </View>
                    <View style={styles.overviewBadgeBox}>
                      <Text style={styles.overviewBadgeLabel}>Changeover</Text>
                      <Text style={styles.overviewBadgeValue}>15 Mins</Text>
                    </View>
                  </View>
                </Card>

                {/* Number of Places (1 to 6) */}
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Number of Places / Guests (1–6)</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const isSel = guestsCount === num;
                      return (
                        <Pressable
                          key={num}
                          style={[
                            styles.guestOption,
                            isSel && styles.guestOptionActive,
                          ]}
                          onPress={() => setGuestsCount(num)}
                        >
                          <Text style={[styles.guestNumber, isSel && styles.guestNumberActive]}>
                            {num}
                          </Text>
                          <Text style={[styles.guestSub, isSel && styles.guestSubActive]}>
                            {num === 1 ? "1 Person" : `${num} Places`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              </View>
            )}

            {/* Total Price Calculation Card */}
            <Card style={styles.pricingSummaryCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={styles.totalLabel}>Total Calculated Price</Text>
                  <Text style={styles.totalSub}>
                    {saunaType === "private"
                      ? `${durationHours}h private session for ${guestsCount} guests`
                      : `${guestsCount} place(s) @ €${sharedPricePerson}`}
                  </Text>
                </View>
                <Text style={styles.totalAmount}>€{saunaTotal.toFixed(2)}</Text>
              </View>
            </Card>
          </View>
        ) : (
          /* ========================================================================= */
          /* STANDARD CATEGORY SERVICES LIST (SALT ROOM, PACKAGES, LUNCH, ACTIVITIES)  */
          /* ========================================================================= */
          <View style={styles.list}>
            {servicesList.map((service: any) => {
              const isSelected = selectedService?.id === service.id;

              return (
                <Pressable
                  key={service.id}
                  onPress={() => setSelectedService(service)}
                >
                  <Card
                    style={[
                      styles.serviceCard,
                      isSelected && {
                        borderWidth: 2.5,
                        borderColor: brownGold,
                      },
                    ]}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: service.image }}
                        style={styles.serviceImage}
                      />
                      <View style={styles.ratingBadge}>
                        <Star size={12} color="#EAB308" fill="#EAB308" />
                        <Text style={styles.ratingText}>{service.rating || 4.9}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Check size={14} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </View>

                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceTitle}>{service.title}</Text>
                      {service.subtitle ? (
                        <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                      ) : null}
                      <Text
                        style={[styles.serviceDescription, { color: textMuted }]}
                        numberOfLines={3}
                      >
                        {service.description}
                      </Text>

                      <View style={styles.detailsGrid}>
                        {service.capacity ? (
                          <View style={styles.detailItem}>
                            <Users size={16} color={brownGold} />
                            <Text variant="caption" style={styles.detailText}>
                              {service.capacity}
                            </Text>
                          </View>
                        ) : null}
                        {service.duration ? (
                          <View style={styles.detailItem}>
                            <Clock size={16} color={brownGold} />
                            <Text variant="caption" style={styles.detailText}>
                              {service.duration}
                            </Text>
                          </View>
                        ) : null}
                        {service.requirement ? (
                          <View style={styles.detailItem}>
                            <ShieldCheck size={16} color={brownGold} />
                            <Text variant="caption" style={styles.detailText}>
                              {service.requirement}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.priceRow}>
                        <Text style={styles.price}>
                          {service.isFree || service.price === 0
                            ? "Free Reservation"
                            : `€${service.price}`}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={handleContinue}>
          <Text>{t("buttons.continue", { defaultValue: "Continue" })}</Text>
          <ArrowRight size={18} />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 20,
    paddingTop: 0,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 5,
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#9B7C56",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  toggleButtonTextActive: {
    color: "#fff",
  },
  bannerCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#9B7C56",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9B7C56",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1d1a17",
    fontFamily: Fonts.serif,
    marginTop: 2,
  },
  bannerDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 16,
  },
  sectionCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d1a17",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  durationCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FDFBF8",
    borderWidth: 1.5,
    borderColor: "#EBE3DA",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  durationCardActive: {
    backgroundColor: "#FCF2E9",
    borderColor: "#9B7C56",
  },
  durationBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "#9B7C56",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  durationTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  durationSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3D2E24",
    marginTop: 2,
  },
  durationExtra: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  guestOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBE3DA",
    backgroundColor: "#FDFBF8",
    alignItems: "center",
    justifyContent: "center",
  },
  guestOptionActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  guestNumber: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  guestNumberActive: {
    color: "#fff",
  },
  guestSub: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  guestSubActive: {
    color: "rgba(255,255,255,0.9)",
  },
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBE3DA",
    backgroundColor: "#FDFBF8",
  },
  extraRowActive: {
    backgroundColor: "#FCF2E9",
    borderColor: "#9B7C56",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  extraName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d1a17",
  },
  extraPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9B7C56",
  },
  overviewBadgeBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8F5F2",
    alignItems: "center",
  },
  overviewBadgeLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
  },
  overviewBadgeValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d1a17",
    fontFamily: Fonts.serif,
  },
  pricingSummaryCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FBF6F3",
    borderWidth: 1,
    borderColor: "#E8E2DC",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9B7C56",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#9B7C56",
  },
  serviceCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  imageContainer: {
    height: 180,
    position: "relative",
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#9B7C56",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  serviceInfo: {
    padding: 18,
    gap: 8,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  serviceSubtitle: {
    fontSize: 13,
    color: "#9B7C56",
    fontWeight: "600",
  },
  serviceDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.subtitle,
  },
  detailsGrid: {
    gap: 6,
    marginTop: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#6B5D54",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#F1EBE4",
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#3D2E24",
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
});
