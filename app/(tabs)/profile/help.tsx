import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { useAuthStore } from "@/utils/authStore";
import { openContact } from "@/utils/contact";
import legalApi, {
  ContactInfoData,
  fallbackContactInfo,
} from "@/utils/legalApi";
import {
  CheckCircle2,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";

export default function HelpSupportScreen() {
  const textMuted = useColor("textMuted");
  const cardBg = useColor("card");
  const border = useColor("border");
  const brownGold = "#9B7C56";

  const currentUser = useAuthStore.getState().user;

  // Contact Info State
  const [contactInfo, setContactInfo] =
    useState<ContactInfoData>(fallbackContactInfo);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchContact = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await legalApi.getContactInfo();
      if (data) {
        setContactInfo(data);
      }
    } catch (e) {
      console.warn("Failed to load contact info:", e);
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  // Keep user info in sync if profile loads late
  useEffect(() => {
    return useAuthStore.subscribe(() => {
      const u = useAuthStore.getState().user;
      if (u) {
        setName((prev) => prev || u.name || "");
        setEmail((prev) => prev || u.email || "");
        setPhone((prev) => prev || u.phone || "");
      }
    });
  }, []);

  const handleOpenMap = (address: string) => {
    if (!address) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`,
    });
    Linking.openURL(url as string).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          address
        )}`
      );
    });
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Missing Message", "Please enter your message or question.");
      return;
    }

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setStatusNotice(null);

    try {
      const result = await legalApi.sendMessage({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
      });

      if (result.success) {
        setStatusNotice({
          type: "success",
          text: result.message,
        });
        setMessage("");
        setSubject("");
        Alert.alert("Message Sent", result.message);
      } else {
        setStatusNotice({
          type: "error",
          text: result.message,
        });
        Alert.alert("Submission Notice", result.message);
      }
    } catch (e: any) {
      const errText = "Could not send message. Please try again.";
      setStatusNotice({ type: "error", text: errText });
      Alert.alert("Error", errText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BackHeader />
      <Layout
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchContact(true)}
            colors={[brownGold]}
            tintColor={brownGold}
          />
        }
      >
        <Header
          title="Help & Support"
          subtitle="Get in touch with our concierge team"
        />

        {/* Hero Banner */}
        <Card style={[styles.heroCard, { backgroundColor: brownGold }]}>
          <HelpCircle size={30} color="white" opacity={0.9} />
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroDesc}>
            Have a question about your reservations, membership, or wellness
            treatments? Send us a direct message below.
          </Text>
        </Card>

        {/* Contact Form Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Send Us a Message</Text>
            <Text style={[styles.sectionSubtitle, { color: textMuted }]}>
              Fill out the form below and we'll reply as soon as possible.
            </Text>
          </View>

          <Card style={styles.formCard}>
            {statusNotice && (
              <View
                style={[
                  styles.noticeBanner,
                  statusNotice.type === "success"
                    ? styles.noticeSuccess
                    : styles.noticeError,
                ]}
              >
                {statusNotice.type === "success" && (
                  <CheckCircle2 size={18} color="#15803D" />
                )}
                <Text
                  style={[
                    styles.noticeText,
                    {
                      color:
                        statusNotice.type === "success" ? "#15803D" : "#B91C1C",
                    },
                  ]}
                >
                  {statusNotice.text}
                </Text>
              </View>
            )}

            <Input
              label="Your Name"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="Email Address"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Input
              label="Subject"
              placeholder="e.g. Booking inquiry, Special request"
              value={subject}
              onChangeText={setSubject}
            
            />

            <Input
              label="Message *"
              placeholder="How can we assist you today?"
              type="textarea"
              rows={4}
              value={message}
              onChangeText={setMessage}
            />

            <Button
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              icon={Send}
              style={[styles.submitButton, { backgroundColor: brownGold }]}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? "Sending Message..." : "Send Message"}
              </Text>
            </Button>
          </Card>
        </View>

        {/* Contact Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contact Details</Text>
            <Text style={[styles.sectionSubtitle, { color: textMuted }]}>
              Reach us directly through phone, email, or visit our sanctuary.
            </Text>
          </View>

          <Card style={styles.detailsCard}>
            {/* Email Row */}
            {contactInfo.email ? (
              <Pressable
                onPress={() =>
                  openContact({
                    type: "email",
                    value: contactInfo.email,
                    subject: "Support Inquiry",
                  })
                }
                style={({ pressed }) => [
                  styles.contactRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: "#EFF6FF" }]}
                >
                  <Mail size={20} color="#2563EB" />
                </View>
                <View style={styles.contactRowText}>
                  <Text style={[styles.contactRowLabel, { color: textMuted }]}>
                    Email Address
                  </Text>
                  <Text style={styles.contactRowValue}>{contactInfo.email}</Text>
                </View>
              </Pressable>
            ) : null}

            {contactInfo.email && contactInfo.phone ? (
              <View style={[styles.divider, { backgroundColor: border }]} />
            ) : null}

            {/* Phone Row */}
            {contactInfo.phone ? (
              <Pressable
                onPress={() =>
                  openContact({
                    type: "call",
                    value: contactInfo.phone,
                  })
                }
                style={({ pressed }) => [
                  styles.contactRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: "#F0FDF4" }]}
                >
                  <Phone size={20} color="#16A34A" />
                </View>
                <View style={styles.contactRowText}>
                  <Text style={[styles.contactRowLabel, { color: textMuted }]}>
                    Phone Number
                  </Text>
                  <Text style={styles.contactRowValue}>{contactInfo.phone}</Text>
                </View>
              </Pressable>
            ) : null}

            {(contactInfo.email || contactInfo.phone) && contactInfo.address ? (
              <View style={[styles.divider, { backgroundColor: border }]} />
            ) : null}

            {/* Address Row */}
            {contactInfo.address ? (
              <Pressable
                onPress={() => handleOpenMap(contactInfo.address)}
                style={({ pressed }) => [
                  styles.contactRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[styles.iconContainer, { backgroundColor: "#FEF2F2" }]}
                >
                  <MapPin size={20} color="#DC2626" />
                </View>
                <View style={styles.contactRowText}>
                  <Text style={[styles.contactRowLabel, { color: textMuted }]}>
                    Location & Address
                  </Text>
                  <Text style={styles.contactRowValue}>
                    {contactInfo.address}
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </Card>
        </View>
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 22,
    gap: 8,
    marginBottom: 20,
    borderWidth: 0,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    fontFamily: Fonts.title,
  },
  heroDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 12,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    padding: 18,
    borderRadius: 20,
    gap: 14,
  },
  submitButton: {
    marginTop: 6,
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  noticeSuccess: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  noticeError: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  noticeText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  detailsCard: {
    padding: 16,
    borderRadius: 20,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  contactRowText: {
    flex: 1,
    gap: 2,
  },
  contactRowLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactRowValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
});
