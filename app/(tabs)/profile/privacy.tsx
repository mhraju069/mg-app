import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import React from "react";
import { StyleSheet } from "react-native";

export default function PrivacyPolicyScreen() {
  const textMuted = useColor("textMuted");

  return (
   <>
   <BackHeader />
    <Layout>
      <View style={styles.section}>
        <Header title="Privacy Policy" subtitle="Effective date: Oct 1, 2025" />

        <Text style={styles.subHeading}>1. Information We Collect</Text>
        <Text style={[styles.paragraph, { color: textMuted }]}>
          At Oasis Feels, we value your privacy. We collect basic account
          information such as name, email, and location to provide event
          recommendations.
        </Text>

        <Text style={styles.subHeading}>2. How We Use Data</Text>
        <Text style={[styles.paragraph, { color: textMuted }]}>
          Your data is used solely to enhance your experience. We do not sell
          your personal information to third parties.
        </Text>

        <Text style={styles.subHeading}>3. Child Safety</Text>
        <Text style={[styles.paragraph, { color: textMuted }]}>
          Children's profiles are strictly private and only visible to
          authorized members of your Trusted Circle or event organizers.
        </Text>

        <Text style={styles.subHeading}>4. Security</Text>
        <Text style={[styles.paragraph, { color: textMuted }]}>
          We use industry-standard encryption to protect your data. Payment
          information is handled through secure providers like Stripe.
        </Text>
      </View>
    </Layout>
  </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
    marginBottom: 40,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
  },
  lastUpdated: {
    fontSize: 13,
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
});
