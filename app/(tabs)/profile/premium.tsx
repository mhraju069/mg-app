import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import PlanCard from "@/components/shared/plan-card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Fonts } from "@/theme/colors";
import React from "react";
import { StyleSheet } from "react-native";

export default function PremiumMemberScreen() {
  return (
    <>
      <BackHeader />
      <Layout>
        <Header title="Premimum member" subtitle="Apply now premium member" />
        <View style={styles.plans}>
          <PlanCard
            name="Essential"
            price="€89"
            features={[
              "2+ Initial Summary Access",
              "20% off all treatment",
              "Early Close Booking",
            ]}
          />

          <PlanCard
            name="Ethereal"
            price="€149"
            features={[
              "Priority Treatment Booking",
              "Complimentary Wellness Bag",
              "Quarterly Expert Session",
              "Annual VIP Gathering",
            ]}
          />
        </View>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  plans: {
    gap: 24,
    marginBottom: 40,
  },
});
