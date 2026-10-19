import { FAQAccordion } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { BackHeader } from "@/components/shared/booking-header";
import { Fonts } from "@/theme/colors";
import { openContact } from "@/utils/contact";
import { HelpCircle, Mail, MessageCircle, Phone } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Layout } from "@/components/layout/Layout";
import Header from "@/components/shared/inside-header";
import { FAQ } from "@/utils/constants";

export default function HelpSupportScreen() {
  const brownGold = "#9B7C56";

  return (
    <>
      <BackHeader />
      <Layout>
        <Header title="Help & Support" subtitle="Effective Date: Oct 1, 2025" />

        <Card style={[styles.heroCard, { backgroundColor: brownGold }]}>
          <HelpCircle size={32} color="white" opacity={0.8} />
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroDesc}>
            Our support team is available 24/7 to assist you.
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact us</Text>
          <View style={styles.contactGrid}>
            <ContactMethod
              icon={MessageCircle}
              label="Chat"
              color="#F0EFFF"
              iconColor="#6366F1"
              type="whatsapp"
            />
            <ContactMethod
              icon={Mail}
              label="Email"
              color="#F0FDF4"
              iconColor="#22C55E"
              type="email"
            />
            <ContactMethod
              icon={Phone}
              label="Call"
              color="#FEF2F2"
              iconColor="#EF4444"
              type="call"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular FAQs</Text>
          <FAQAccordion data={FAQ} />
        </View>
      </Layout>
    </>
  );
}

function ContactMethod({ icon: IconComp, label, color, iconColor, type }: any) {
  return (
    <Pressable style={styles.contactItem} onPress={() => openContact(type)}>
      <Card style={styles.contactCard}>
        <View style={[styles.contactIcon, { backgroundColor: color }]}>
          <IconComp size={24} color={iconColor} />
        </View>
        <Text style={styles.contactLabel}>{label}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 24,
    gap: 12,
    marginBottom: 16,
    borderWidth: 0,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    fontFamily: Fonts.title,
  },
  heroDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  contactGrid: {
    flexDirection: "row",
    gap: 16,
  },
  contactItem: {
    flex: 1,
  },
  contactCard: {
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 20,
  },
  contactIcon: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
