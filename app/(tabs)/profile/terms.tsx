import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Card } from "@/components/ui/card";
import { useColor } from "@/hooks/useColor";
import legalApi, {
  TermsAndConditionsData,
  fallbackTerms,
  formatEffectiveDate,
} from "@/utils/legalApi";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";

export default function TermsConditionsScreen() {
  const textMuted = useColor("textMuted");
  const primary = useColor("primary");
  const brownGold = "#9B7C56";

  const [terms, setTerms] = useState<TermsAndConditionsData>(fallbackTerms);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTerms = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await legalApi.getTermsAndConditions();
      if (data) {
        setTerms(data);
      }
    } catch (err) {
      console.warn("Failed to load terms:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const effectiveSubtitle = formatEffectiveDate(terms.effective_date);

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: terms.acceptance_of_terms,
    },
    {
      title: "2. User Conduct & Responsibilities",
      content: terms.user_responsibilities,
    },
    {
      title: "3. Bookings & Ticket Purchases",
      content: terms.ticket_purchase,
    },
    {
      title: "4. Cancellation & Refund Policy",
      content: terms.refund_policy,
    },
    {
      title: "5. Limitation of Liability",
      content: terms.limitation_of_liability,
    },
    {
      title: "6. Changes to Terms",
      content: terms.changes_to_terms,
    },
  ].filter((s) => Boolean(s.content));

  return (
    <>
      <BackHeader />
      <Layout
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTerms(true)}
            colors={[brownGold]}
            tintColor={brownGold}
          />
        }
      >
        <Header title="Terms & Conditions" subtitle={effectiveSubtitle} />

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brownGold} />
            <Text style={[styles.loadingText, { color: textMuted }]}>
              Loading terms & conditions...
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
