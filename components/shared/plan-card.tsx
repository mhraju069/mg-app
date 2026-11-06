import { StyleSheet, View } from "react-native";
import { Card } from "../ui/card";
import { useColor } from "@/hooks/useColor";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { ArrowRight, Check } from "lucide-react-native";
import { Fonts } from "@/theme/colors";
import { useTranslation } from "react-i18next";

export default function PlanCard({
  name,
  price,
  features,
}: {
  name: string;
  price: string;
  features: string[];
}) {
  const { t } = useTranslation();
  const brownGold = "#9B7C56";
  const textMuted = useColor("textMuted");

  return (
    <Card style={styles.planCard}>
      <Text style={styles.planName}>{name}</Text>

      <View style={styles.featuresList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Check size={18} color={brownGold} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text variant="caption" style={{ color: textMuted }}>
            {t("bookingFlow.general.from", { defaultValue: "From" })}
          </Text>
          <Text style={styles.price}>
            {price}
            <Text variant="caption" style={{ color: textMuted }}>
              {" "}
              / {t("bookingFlow.general.month", { defaultValue: "month" })}
            </Text>
          </Text>
        </View>
      </View>

      <Button variant="outline">
        <Text style={styles.applyText}>
          {t("bookingFlow.general.applyNow", { defaultValue: "Apply Now" })}
        </Text>
        <ArrowRight size={16} color={brownGold} />
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  planCard: {
    padding: 32,
    gap: 24,
  },
  planName: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: Fonts.title,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  featureText: {
    fontSize: 16,
    color: "#6B7280",
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    paddingTop: 24,
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    fontFamily: Fonts.title,
  },
  applyText: {
    color: "#9B7C56",
    fontWeight: "700",
    fontSize: 16,
  },
});
