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
import { useLocalSearchParams, router } from "expo-router";
import {
  Star,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react-native";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet } from "react-native";

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const data = CATEGORY_DATA[category as string] || CATEGORY_DATA.sauna;

  const [selectedService, setSelectedService] = useState<string | null>(null);

  const primary = useColor("primary");
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const { t } = useTranslation();

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t(`home.categories.${category}.title`)}
          subtitle={t(`home.categories.${category}.subtitle`)}
        />

        <View style={styles.list}>
          {data.services.map((service: any) => (
            <Pressable
              key={service.id}
              onPress={() =>
                setSelectedService(
                  selectedService === service.id ? null : service.id,
                )
              }
            >
              <Card
                style={[
                  styles.serviceCard,
                  selectedService === service.id && {
                    borderWidth: 3,
                    borderColor: primary,
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
                    <Text style={styles.ratingText}>{service.rating}</Text>
                  </View>
                </View>

                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>
                    {t(`home.categories.${category}.services.${service.id}.title`)}
                  </Text>
                  <Text
                    style={[styles.serviceDescription, { color: textMuted }]}
                  >
                    {t(`home.categories.${category}.services.${service.id}.description`)}
                  </Text>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Users size={16} color={brownGold} />
                      <Text variant="caption" style={styles.detailText}>
                        {t(`home.categories.${category}.services.${service.id}.capacity`)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock size={16} color={brownGold} />
                      <Text variant="caption" style={styles.detailText}>
                        {t(`home.categories.${category}.services.${service.id}.duration`)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <ShieldCheck size={16} color={brownGold} />
                      <Text variant="caption" style={styles.detailText}>
                        {t(`home.categories.${category}.services.${service.id}.requirement`)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>
                      {service.isFree
                        ? t("booking.details.amount_free", { defaultValue: "Free Reservation" })
                        : `$${service.price}`}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </Layout>
      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button
          //  style={[!select && { opacity: 0.5 }]}
          onPress={() =>
            selectedService && router.push("/(bookings)/select-date")
          }
          disabled={!selectedService}
        >
          <Text>{t("buttons.continue", { defaultValue: "Continue" })}</Text>
          <ArrowRight size={18} />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    //  padding: 24,
    gap: 24,
    paddingTop: 0,
  },
  serviceCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 24,
  },
  imageContainer: {
    height: 200,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  serviceInfo: {
    padding: 20,
    gap: 12,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.serif,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.subtitle,
  },
  detailsGrid: {
    gap: 8,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 14,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.serif,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  continueButton: {
    backgroundColor: "#9B7C56",
    borderRadius: 30,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
