import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Card } from "@/components/ui/card";
import { useColor } from "@/hooks/useColor";
import legalApi, {
  PrivacyPolicyData,
  fallbackPrivacy,
  formatEffectiveDate,
} from "@/utils/legalApi";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";

export default function PrivacyPolicyScreen() {
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";

  const [privacy, setPrivacy] = useState<PrivacyPolicyData>(fallbackPrivacy);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrivacy = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await legalApi.getPrivacyPolicy();
      if (data) {
        setPrivacy(data);
      }
    } catch (err) {
      console.warn("Failed to load privacy policy:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrivacy();
  }, [fetchPrivacy]);

  const effectiveSubtitle = formatEffectiveDate(privacy.effective_date);

  const sections = [
    {
      title: "1. Information We Collect",
      content: privacy.info_we_collect,
    },
    {
      title: "2. How We Use Data",
      content: privacy.how_we_use_data,
    },
    {
      title: "3. Child Safety & Age Policy",
      content: privacy.child_safety,
    },
    {
      title: "4. User Rights & Access",
      content: privacy.user_rights,
    },
    {
      title: "5. Security & Encryption",
      content: privacy.security,
    },
  ].filter((s) => Boolean(s.content));

  return (
    <>
      <BackHeader />
      <Layout
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPrivacy(true)}
            colors={[brownGold]}
            tintColor={brownGold}
          />
        }
      >
        <Header title="Privacy Policy" subtitle={effectiveSubtitle} />

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brownGold} />
            <Text style={[styles.loadingText, { color: textMuted }]}>
              Loading privacy policy...
            </Text>
          </View>
        ) : (
          <View style={styles.section}>

            {sections.map((sec, index) => (
              <Card key={index} style={styles.contentCard}>
                <Text style={styles.subHeading}>{sec.title}</Text>
                <Text style={[styles.paragraph, { color: textMuted }]}>
                  {sec.content}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
    marginBottom: 40,
  },
  headingBlock: {
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "700",
  },
  lastUpdated: {
    fontSize: 13,
    marginTop: 4,
  },
  contentCard: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: "700",
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
});
