import { StyleSheet, View } from "react-native";
import { Card } from "../ui/card";
import { useColor } from "@/hooks/useColor";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { ArrowRight, Check } from "lucide-react-native";
import { Fonts } from "@/theme/colors";

export default function PlanCard({
  name,
  price,
  features,
}: {
  name: string;
  price: string;
  features: string[];
}) {
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
            From
          </Text>
          <Text style={styles.price}>
            {price}
            <Text variant="caption" style={{ color: textMuted }}>
              {" "}
              / month
            </Text>
          </Text>
        </View>
      </View>

      <Button variant="outline">
        <Text style={styles.applyText}>Apply Now</Text>
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
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B5D54",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    paddingBottom: 18,
    borderBottomColor: "#E4E4E7",
    borderBottomWidth: 1
  },
  price: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: Fonts.title,
  },
  applyButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 30,
    flexDirection: "row",
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
  },
  applyText: {
    fontSize: 14,
    fontWeight: "700",
  },
})
