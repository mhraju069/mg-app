import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/inside-header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Fonts } from "@/theme/colors";
import { CATEGORIES } from "@/utils/constants";
import { router } from "expo-router";
import React from "react";
import { ImageBackground, Pressable, StyleSheet } from "react-native";

export default function SelectServicesScreen() {
  const { t } = useTranslation();

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.selectServices.title")}
          subtitle={t("createBooking.selectServices.subtitle")}
        />

        <View style={styles.list}>
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() =>
                router.push({
                  pathname: "/(bookings)/[category]",
                  params: { category: category.id },
                })
              }
            >
              <Card style={styles.categoryCard}>
                <ImageBackground
                  source={category.image}
                  style={styles.categoryImage}
                  imageStyle={styles.categoryImageBorder}
                >
                  <View style={styles.categoryOverlay}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                    >
                      <View
                        style={{
                          padding: 6,
                          backgroundColor: "rgba(255,255,255,0.2)",
                          width: 44,
                          height: 44,
                          borderRadius: 25,
                          justifyContent: "center",
                        alignItems: "center",
                        }}
                      >
                        {category.icon && <category.icon color={"#fff"} size={24} />}
                      </View>
                      <View style={styles.categoryContent}>
                        <Text style={styles.categoryTitle}>
                          {t(`home.categories.${category.id}.title`)}
                        </Text>
                        <Text style={styles.categorySubtitle}>
                          {t(`home.categories.${category.id}.subtitle`)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </Card>
            </Pressable>
          ))}
        </View>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    //  padding: 24,
    gap: 20,
    paddingTop: 0,
  },
  categoryCard: {
    padding: 0,
    height: 180,
    overflow: "hidden",
    borderRadius: 24,
  },
  categoryImage: {
    flex: 1,
  },
  categoryImageBorder: {
    borderRadius: 24,
  },
  categoryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
    padding: 20,
  },
  categoryContent: {
    gap: 4,
  },
  categoryTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.serif,
  },
  categorySubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontFamily: Fonts.subtitle,
  },
});
