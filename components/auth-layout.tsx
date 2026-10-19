import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Colors, Fonts } from "@/theme/colors";
import { ImageBackground } from "react-native";
import { StyleSheet, Platform, ScrollView, Dimensions } from "react-native";
import { AvoidKeyboard } from "./ui/avoid-keyboard";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string | React.ReactNode;
  showOverlay?: boolean;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showOverlay = true,
}: AuthLayoutProps) {
  const background = useColor("background");

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/auth-bg.png")}
        style={[styles.bgImage, { height: SCREEN_HEIGHT }]} // Background should fill screen for proper layering
      >
        {/* Only show overlay if requested. Opaque cards hide it anyway, but this is cleaner */}
        {showOverlay && <View style={styles.overlay} />}

        <View style={styles.mainContent}>
          <View style={styles.topContent}>
            <Text style={styles.welcomeTitle}>
              Welcome to the Circle of Stillness.
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Membership unlocks exclusive arrangements, priority reservations,
              and personalized wellness concierge services.
            </Text>
            <View style={styles.separator} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.card, { backgroundColor: background }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{title}</Text>
                {subtitle && (
                  typeof subtitle === 'string' ? (
                    <Text style={styles.cardSubtitle}>{subtitle}</Text>
                  ) : (
                    subtitle
                  )
                )}
              </View>
              {children}
              <AvoidKeyboard />
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImage: {
    width: "100%",
    position: "absolute",
    top: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  mainContent: {
    flex: 1,
  },
  topContent: {
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingHorizontal: 24,
    gap: 26,
  },
  welcomeTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.title,
    maxWidth: "100%",
  },
  welcomeSubtitle: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "86%",
    fontFamily: Fonts.subtitle,
  },
  separator: {
    width: 120,
    height: 1.5,
    backgroundColor: Colors.dark.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 32,
    marginTop: SCREEN_HEIGHT * 0.05,
    // Note: We avoid paddingBottom here to let safer area handling or child margins handle it
  },
  cardHeader: {
    marginBottom: 24,
    gap: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.title,
   },
   cardSubtitle: {
      fontSize: 14,
      color: "#71717a",
      fontFamily: Fonts.subtitle,
  },
});
